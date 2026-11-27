import XCTest
@testable import DrevosWatchCore
final class WatchCoreTests:XCTestCase {
    let session=WatchSession(url:"https://example.invalid",token:String(repeating:"a",count:64),gatewayId:"test-gateway",language:"de",cloud:.init(room:String(repeating:"b",count:32),key:String(repeating:"c",count:64)))
    func state()->[String:Any]{["available":true,"controls_available":true,"automatik":false,"fahrenheit":false,"konvektion":false,"luefter":false,"heizung_freigabe":false,"rauch_freigabe":false,"timer_laeuft":false,"kammertemperatur":20.5,"kerntemperatur":18.2,"raucheinstellung":0,"kammertemperatur_soll":5,"kerntemperatur_ziel":0,"rauch_soll":0,"timer_dauer":10,"timer_restzeit":"000:10:00","timer_laufzeit":"000:00:00"]}
    func testSessionRejectsInsecureOrMalformedCredentials()throws {
        var s=try JSONSerialization.jsonObject(with:JSONEncoder().encode(session)) as! [String:Any]
        s["url"]="http://example.invalid"
        XCTAssertThrowsError(try WatchSession.parse(JSONSerialization.data(withJSONObject:s)))
        s["url"]="https://example.invalid";s["token"]="bad"
        XCTAssertThrowsError(try WatchSession.parse(JSONSerialization.data(withJSONObject:s)))
    }
    func testNumericBoundsAndSmokeHeatingGuards()throws {
        let r=try WatchReading.parse(state(),controlsEnabled:true)
        for (key,range) in WatchCommand.ranges {
            XCTAssertNoThrow(try WatchCommand(key:key,value:String(range.upperBound),label:"").validate(r))
            XCTAssertThrowsError(try WatchCommand(key:key,value:String(range.upperBound+1),label:"").validate(r))
            XCTAssertThrowsError(try WatchCommand(key:key,value:"1.5",label:"").validate(r))
        }
        XCTAssertThrowsError(try WatchCommand(key:"rauchbetrieb",value:"ON",label:"").validate(r))
        XCTAssertNoThrow(try WatchCommand(key:"heizelement",value:"ON",label:"").validate(r))
        XCTAssertThrowsError(try WatchCommand(key:"unknown",value:"ON",label:"").validate(r))
    }
    func testLockedOfflineAndFahrenheitRefuseWrites()throws {
        for (field,value) in [("automatik",true),("fahrenheit",true),("controls_available",false),("available",false)] {
            var s=state();s[field]=value;let r=try WatchReading.parse(s,controlsEnabled:true)
            XCTAssertThrowsError(try WatchCommand(key:"konvektion",value:"ON",label:"").validate(r))
        }
    }
    func testTimerCannotStopOrResetDuringHeatSmoke()throws {
        var s=state();s["heizung_freigabe"]=true
        let r=try WatchReading.parse(s,controlsEnabled:true)
        XCTAssertThrowsError(try WatchCommand(key:"timer_lauf",value:"OFF",label:"").validate(r))
        XCTAssertThrowsError(try WatchCommand(key:"timer_reset",value:"RESET",label:"").validate(r))
    }
    func testWrongStateTypesRejected()throws {
        var s=state();s["kammertemperatur"]=true
        XCTAssertThrowsError(try WatchReading.parse(s,controlsEnabled:true))
        s=state();s["timer_restzeit"]="999:99:99"
        XCTAssertThrowsError(try WatchReading.parse(s,controlsEnabled:true))
    }
    func testPhoneProtocolCompatibilityAndAuthentication()throws {
        let url=Bundle.module.url(forResource:"protocol",withExtension:"json")!
        let fixture=try JSONSerialization.jsonObject(with:Data(contentsOf:url)) as! [String:Any]
        let packet=fixture["responsePacket"] as! String
        let response=try WatchCrypto.open(session,packet)
        XCTAssertEqual(response["ok"] as? Bool,true)
        let request=try WatchCrypto.seal(session,fixture["request"] as! [String:Any],nonce:Data(base64Encoded:fixture["nonce"] as! String)!)
        let envelope=try JSONSerialization.jsonObject(with:Data(request.utf8)) as! [String:Any]
        XCTAssertEqual(envelope["c"] as? String,fixture["requestCiphertext"] as? String)
        var tampered=try JSONSerialization.jsonObject(with:Data(packet.utf8)) as! [String:Any]
        let c=tampered["c"] as! String;tampered["c"]=(c.first=="A" ? "B":"A")+String(c.dropFirst())
        XCTAssertThrowsError(try WatchCrypto.open(session,String(data:JSONSerialization.data(withJSONObject:tampered),encoding:.utf8)!))
    }
}
