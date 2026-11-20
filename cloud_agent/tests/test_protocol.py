import asyncio
import json
import unittest
from drevos_cloud.protocol import Tickets, open_packet, seal, validate_command
from drevos_cloud.agent import Agent


class ProtocolTests(unittest.TestCase):
    def test_encryption_rejects_wrong_room_direction_key_and_tampering(self):
        key, room = '01' * 32, '02' * 16
        packet = seal(key, room, 'app-to-pi', {'value': 42}, b'\x03' * 12)
        self.assertEqual(open_packet(key, room, 'app-to-pi', packet), {'value': 42})
        for other_key, other_room, direction in [('04'*32,room,'app-to-pi'), (key,'04'*16,'app-to-pi'), (key,room,'pi-to-app')]:
            with self.assertRaises(Exception):
                open_packet(other_key, other_room, direction, packet)

    def test_tickets_are_single_use_bound_to_client_command_and_boot(self):
        clock=[100.0]; tickets=Tickets(lambda:clock[0])
        message={'client':'01'*16,'id':'02'*16,'boot':tickets.boot,'command':{'name':'luefter','value':'ON'}}
        ticket=tickets.prepare(message)['ticket']
        self.assertEqual(tickets.consume({**message,'ticket':ticket}),message['command'])
        with self.assertRaises(PermissionError):tickets.consume({**message,'ticket':ticket})
        ticket=tickets.prepare(message)['ticket']
        with self.assertRaises(PermissionError):tickets.consume({**message,'ticket':ticket,'command':{'name':'heizelement','value':'ON'}})
        ticket=tickets.prepare(message)['ticket'];clock[0]=109
        with self.assertRaises(PermissionError):tickets.consume({**message,'ticket':ticket})
        with self.assertRaises(PermissionError):tickets.prepare({**message,'boot':'old-boot'})

    def test_request_replays_and_raw_output_commands_are_rejected(self):
        tickets=Tickets();message={'client':'01'*16,'id':'02'*16};tickets.check_request(message)
        with self.assertRaises(ValueError):tickets.check_request(message)
        for command in [{'name':'Y0','value':'ON'},{'name':'rauch_soll','value':'101'},{'name':'timer_dauer','value':'0'},{'name':'heizelement','value':True}]:
            with self.assertRaises(ValueError):validate_command(command)


class AgentTests(unittest.IsolatedAsyncioTestCase):
    async def test_socket_dispatch_rejects_writes_arriving_during_a_read(self):
        import time
        class Gateway:
            def __init__(self):self.calls=[]
            def request(self,resource,payload=None):self.calls.append(resource);time.sleep(.05);return {'available':True}
        gateway=Gateway();config={'gateway_id':'test-gateway','key':'01'*32,'room':'02'*16};agent=Agent(config,gateway)
        base={'client':'01'*16,'boot':agent.tickets.boot,'command':{'name':'luefter','value':'ON'}}
        ticket=agent.tickets.prepare(base)['ticket']
        messages=[{**base,'id':'02'*16,'type':'read','resource':'state'},{**base,'id':'03'*16,'type':'execute','ticket':ticket}]
        class Socket:
            def __init__(self):self.responses=[];self.frames=iter(json.dumps({'type':'data','payload':seal(config['key'],config['room'],'app-to-pi',m)}) for m in messages)
            def __aiter__(self):return self
            async def __anext__(self):
                try:return next(self.frames)
                except StopIteration:raise StopAsyncIteration
            async def send(self,frame):self.responses.append(open_packet(config['key'],config['room'],'pi-to-app',json.loads(frame)['payload']))
        socket=Socket();await agent.serve_socket(socket)
        self.assertEqual(gateway.calls,['state'])
        outcomes={r['id']:r['ok'] for r in socket.responses}
        self.assertTrue(outcomes['02'*16]);self.assertFalse(outcomes['03'*16])

    async def test_only_one_authorized_execution_reaches_gateway(self):
        class Gateway:
            def __init__(self):self.calls=[]
            def request(self,name,payload=None):self.calls.append((name,payload));return {'available':True}
        gateway=Gateway();agent=Agent({'gateway_id':'test-gateway'},gateway)
        base={'client':'01'*16,'boot':agent.tickets.boot,'command':{'name':'luefter','value':'ON'}}
        prepared=await agent.handle({**base,'id':'02'*16,'type':'prepare'})
        self.assertTrue(prepared['ok']);self.assertEqual(gateway.calls,[])
        execution={**base,'id':'03'*16,'type':'execute','ticket':prepared['result']['ticket']}
        self.assertTrue((await agent.handle(execution))['ok'])
        self.assertFalse((await agent.handle(execution))['ok'])
        self.assertFalse((await agent.handle({**execution,'id':'04'*16}))['ok'])
        self.assertEqual(gateway.calls,[('command',base['command'])])

    async def test_busy_gateway_does_not_queue_a_write(self):
        class Gateway:
            def request(self,*args):raise AssertionError('Must not dispatch')
        agent=Agent({'gateway_id':'test-gateway'},Gateway())
        base={'client':'01'*16,'boot':agent.tickets.boot,'command':{'name':'luefter','value':'ON'}}
        prepared=await agent.handle({**base,'id':'02'*16,'type':'prepare'})
        await agent.lock.acquire()
        try:self.assertFalse((await agent.handle({**base,'id':'03'*16,'type':'execute','ticket':prepared['result']['ticket']}))['ok'])
        finally:agent.lock.release()


if __name__=='__main__':unittest.main()
