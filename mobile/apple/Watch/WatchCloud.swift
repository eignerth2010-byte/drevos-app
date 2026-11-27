import Foundation
import CryptoKit
import CoreFoundation

enum WatchFailure:Error {case invalid,offline,locked,uncertain}
struct WatchSession:Codable {
    struct Cloud:Codable {let room:String;let key:String}
    let url:String;let token:String;let gatewayId:String;let language:String;let cloud:Cloud
    static func parse(_ data:Data)throws->WatchSession {
        guard data.count<=4096 else{throw WatchFailure.invalid}
        let s=try JSONDecoder().decode(Self.self,from:data)
        guard let p=URLComponents(string:s.url),p.scheme=="https",p.host != nil,p.user==nil,p.password==nil,p.query==nil,p.fragment==nil,["","/"].contains(p.path),
              s.token.matches("^[a-f0-9]{64}$"),s.gatewayId.matches("^[-\\w]{8,64}$"),["de","en"].contains(s.language),
              s.cloud.room.matches("^[a-f0-9]{32}$"),s.cloud.key.matches("^[a-f0-9]{64}$") else{throw WatchFailure.invalid}
        return s
    }
}
extension String {func matches(_ pattern:String)->Bool{range(of:pattern,options:.regularExpression) != nil}}
enum WatchCrypto {
    static func key(_ hex:String)throws->SymmetricKey {
        guard hex.matches("^[a-f0-9]{64}$") else{throw WatchFailure.invalid}
        let chars=Array(hex);let bytes=stride(from:0,to:chars.count,by:2).map{UInt8(String(chars[$0...$0+1]),radix:16)!}
        return SymmetricKey(data:bytes)
    }
    static func seal(_ session:WatchSession,_ message:[String:Any],nonce:Data?=nil)throws->String {
        let aad=Data("drevos-cloud:1:\(session.cloud.room):app-to-pi".utf8)
        let n=try nonce.map{try AES.GCM.Nonce(data:$0)} ?? AES.GCM.Nonce()
        let box=try AES.GCM.seal(JSONSerialization.data(withJSONObject:message,options:.sortedKeys),using:key(session.cloud.key),nonce:n,authenticating:aad)
        let envelope:[String:Any]=["v":1,"n":Data(n).base64EncodedString(),"c":(box.ciphertext+box.tag).base64EncodedString()]
        return String(data:try JSONSerialization.data(withJSONObject:envelope),encoding:.utf8)!
    }
    static func open(_ session:WatchSession,_ packet:String)throws->[String:Any] {
        guard packet.utf8.count<=30000,let data=packet.data(using:.utf8),let p=try JSONSerialization.jsonObject(with:data) as? [String:Any],
              p["v"] as? Int == 1,let ns=p["n"] as? String,let cs=p["c"] as? String,let n=Data(base64Encoded:ns),n.count==12,let c=Data(base64Encoded:cs),c.count>=16,c.count<=18000 else{throw WatchFailure.invalid}
        let box=try AES.GCM.SealedBox(nonce:AES.GCM.Nonce(data:n),ciphertext:c.dropLast(16),tag:c.suffix(16))
        let plain=try AES.GCM.open(box,using:key(session.cloud.key),authenticating:Data("drevos-cloud:1:\(session.cloud.room):pi-to-app".utf8))
        guard let value=try JSONSerialization.jsonObject(with:plain) as? [String:Any] else{throw WatchFailure.invalid}
        return value
    }
}
struct WatchCommand:Identifiable {
    let id=UUID();let key:String;let value:String;let label:String
    static let ranges:[String:ClosedRange<Int>]=["kammertemperatur_soll":0...120,"kerntemperatur_ziel":0...115,"rauch_soll":0...100,"timer_dauer":1...9999]
    static let switches=["heizelement","rauchbetrieb","konvektion","luefter","timer_lauf"]
    func validate(_ reading:WatchReading)throws {
        guard reading.online else{throw WatchFailure.offline}
        guard reading.controls else{throw WatchFailure.locked}
        if let range=Self.ranges[key] {
            guard value.matches("^[0-9]+$"),let n=Int(value),range.contains(n) else{throw WatchFailure.invalid}
        }else if Self.switches.contains(key) {
            guard ["ON","OFF"].contains(value) else{throw WatchFailure.invalid}
            if value=="ON" && key=="heizelement" && (reading.numbers["kammertemperatur_soll"] ?? 0)<=0 {throw WatchFailure.locked}
            if value=="ON" && key=="rauchbetrieb" && (reading.numbers["rauch_soll"] ?? 0)<=0 {throw WatchFailure.locked}
            if key=="timer_lauf" && value=="OFF" && (reading.switches["heizelement"]==true || reading.switches["rauchbetrieb"]==true){throw WatchFailure.locked}
        }else if key=="timer_reset" {
            guard value=="RESET",reading.switches["heizelement"]==false,reading.switches["rauchbetrieb"]==false,reading.switches["timer_lauf"]==false else{throw WatchFailure.locked}
        }else{throw WatchFailure.invalid}
    }
}
struct WatchReading {
    let online:Bool;let controls:Bool;let numbers:[String:Double];let switches:[String:Bool];let remaining:String;let unit:String
    static func parse(_ state:[String:Any],controlsEnabled:Bool)throws->WatchReading {
        func bool(_ name:String)throws->Bool {guard let n=state[name] as? NSNumber,CFGetTypeID(n)==CFBooleanGetTypeID() else{throw WatchFailure.invalid};return n.boolValue}
        let online=try bool("available"),control=try bool("controls_available")
        if !online{return WatchReading(online:false,controls:false,numbers:[:],switches:[:],remaining:"—",unit:"°C")}
        let automatic=try bool("automatik"),fahrenheit=try bool("fahrenheit")
        var switches:[String:Bool]=[:]
        for (key,source) in ["heizelement":"heizung_freigabe","rauchbetrieb":"rauch_freigabe","konvektion":"konvektion","luefter":"luefter","timer_lauf":"timer_laeuft"] {switches[key]=try bool(source)}
        var numbers:[String:Double]=[:]
        for key in ["kammertemperatur","kerntemperatur","raucheinstellung"]+Array(WatchCommand.ranges.keys) {
            guard let n=state[key] as? NSNumber,CFGetTypeID(n) != CFBooleanGetTypeID(),n.doubleValue.isFinite else{throw WatchFailure.invalid};numbers[key]=n.doubleValue
        }
        guard let remaining=state["timer_restzeit"] as? String,remaining.matches("^[0-9]+:[0-5][0-9]:[0-5][0-9]$"),
              let elapsed=state["timer_laufzeit"] as? String,elapsed.matches("^[0-9]+:[0-5][0-9]:[0-5][0-9]$") else{throw WatchFailure.invalid}
        return WatchReading(online:online,controls:control&&controlsEnabled && !automatic && !fahrenheit,numbers:numbers,switches:switches,remaining:remaining,unit:fahrenheit ? "°F":"°C")
    }
}
actor WatchCloud {
    private var socket:URLSessionWebSocketTask?
    func cancel(){socket?.cancel(with:.goingAway,reason:nil);socket=nil}
    func fetch(_ session:WatchSession,command:WatchCommand?=nil) async throws -> WatchReading {
        guard socket==nil else{throw WatchFailure.locked}
        let url=URL(string:session.url.replacingOccurrences(of:"https://",with:"wss://")+"/v1/rooms/"+session.cloud.room+"/socket")!
        let ws=URLSession.shared.webSocketTask(with:url);socket=ws;ws.maximumMessageSize=32768;ws.resume()
        let timeout=Task{try? await Task.sleep(nanoseconds:15_000_000_000);if !Task.isCancelled{ws.cancel(with:.goingAway,reason:nil)}}
        defer{timeout.cancel();ws.cancel(with:.normalClosure,reason:nil);socket=nil}
        func send(_ body:[String:Any]) async throws {try Task.checkCancellation();let text=String(data:try JSONSerialization.data(withJSONObject:body),encoding:.utf8)!;try await ws.send(.string(text))}
        func frame() async throws -> [String:Any] {
            try Task.checkCancellation();let message=try await ws.receive();let data:Data
            switch message{case .string(let s):data=Data(s.utf8);case .data(let d):data=d;@unknown default:throw WatchFailure.invalid}
            guard data.count<=32768,let o=try JSONSerialization.jsonObject(with:data) as? [String:Any] else{throw WatchFailure.invalid};return o
        }
        try await send(["type":"hello","role":"app","auth":session.token])
        var ready=false
        for _ in 0..<32 {let f=try await frame();if f["type"] as? String=="ready"{guard f["deviceOnline"] as? Bool==true else{throw WatchFailure.offline};ready=true;break}}
        guard ready else{throw WatchFailure.offline}
        let client=UUID().uuidString.replacingOccurrences(of:"-",with:"").lowercased();var boot:String?
        func rpc(_ payload:[String:Any]) async throws->[String:Any] {
            let id=UUID().uuidString.replacingOccurrences(of:"-",with:"").lowercased();var body=payload;body["id"]=id;body["client"]=client;if let boot{body["boot"]=boot}
            try await send(["type":"data","payload":WatchCrypto.seal(session,body)])
            for _ in 0..<128 {
                let f=try await frame();if f["type"] as? String=="offline"{throw WatchFailure.offline}
                guard f["type"] as? String=="data",let packet=f["payload"] as? String,let reply=try? WatchCrypto.open(session,packet),reply["id"] as? String==id,reply["client"] as? String==client else{continue}
                guard reply["ok"] as? Bool==true,let result=reply["result"] as? [String:Any] else{throw WatchFailure.locked}
                guard let receivedBoot=reply["boot"] as? String,receivedBoot.matches("^[a-f0-9]{32}$") else{throw WatchFailure.invalid}
                boot=receivedBoot;return result
            }
            throw WatchFailure.invalid
        }
        let info=try await rpc(["type":"read","resource":"info"])
        guard info["id"] as? String==session.gatewayId,info["api_version"] as? Int==1,info["profile"] as? String=="drevos_fx3u_v1",let enabled=info["controls_enabled"] as? Bool else{throw WatchFailure.invalid}
        var state=try WatchReading.parse(await rpc(["type":"read","resource":"state"]),controlsEnabled:enabled)
        if let command {
            try command.validate(state);let payload=["name":command.key,"value":command.value]
            let prepared=try await rpc(["type":"prepare","command":payload])
            guard let ticket=prepared["ticket"] as? String,ticket.matches("^[a-f0-9]{32}$") else{throw WatchFailure.invalid}
            try Task.checkCancellation()
            // One execute only. A timeout is indeterminate; never retry this write.
            state=try WatchReading.parse(await rpc(["type":"execute","ticket":ticket,"command":payload]),controlsEnabled:enabled)
        }
        return state
    }
}
