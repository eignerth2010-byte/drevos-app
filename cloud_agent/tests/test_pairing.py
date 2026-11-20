import http.client
import json
from pathlib import Path
import socket
import tempfile
import threading
import time
import unittest
from drevos_cloud.pairing import serve_pairing


class PairingTests(unittest.TestCase):
    def test_private_pairing_page_copy_qr_and_dns_rebinding_protection(self):
        with tempfile.TemporaryDirectory() as directory:
            pair={'type':'drevos-cloud','version':1,'relay':'https://relay.example','room':'01'*16,'key':'02'*32,'auth':'03'*32,'gatewayId':'fixture-123'}
            path=Path(directory)/'pairing.json';path.write_text(json.dumps(pair))
            with socket.socket() as probe:
                probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
            thread=threading.Thread(target=serve_pairing,args=(str(path),'127.0.0.1','drevos-pi.local',port),daemon=True);thread.start()
            def request(method,path,headers=None):
                connection=http.client.HTTPConnection('127.0.0.1',port,timeout=2);connection.request(method,path,headers=headers or {});response=connection.getresponse();result=(response.status,dict(response.getheaders()),response.read());connection.close();return result
            for _ in range(30):
                try:response=request('GET','/');break
                except OSError:time.sleep(.02)
            else:self.fail('Pairing page did not start')
            try:
                self.assertEqual(response[0],200);self.assertEqual(response[1]['Cache-Control'],'no-store');self.assertIn(b'Code kopieren',response[2]);self.assertEqual(request('GET','/qr.svg')[0],200)
                self.assertEqual(request('GET','/',{'Host':'evil.example'})[0],403)
                self.assertEqual(request('GET','/',{'Origin':'https://evil.example'})[0],403)
                self.assertEqual(request('POST','/finish')[0],200)
            finally:
                thread.join(2)
            self.assertFalse(thread.is_alive())
