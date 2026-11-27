import SwiftUI
import WatchConnectivity
import Security

private enum Vault {
    static let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"at.eignerth.drevos.watch",kSecAttrAccount as String:"cloud-v1"]
    static func save(_ data:Data)throws {
        _ = try WatchSession.parse(data)
        var update=query;update[kSecValueData as String]=data;update[kSecAttrAccessible as String]=kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let status=SecItemUpdate(query as CFDictionary,[kSecValueData as String:data] as CFDictionary)
        if status==errSecItemNotFound {guard SecItemAdd(update as CFDictionary,nil)==errSecSuccess else{throw WatchFailure.invalid}}
        else if status != errSecSuccess {throw WatchFailure.invalid}
    }
    static func load()->WatchSession? {var q=query;q[kSecReturnData as String]=true;q[kSecMatchLimit as String]=kSecMatchLimitOne;var result:CFTypeRef?;guard SecItemCopyMatching(q as CFDictionary,&result)==errSecSuccess,let data=result as? Data else{return nil};return try? WatchSession.parse(data)}
    static func clear(){SecItemDelete(query as CFDictionary)}
}
private final class PairingReceiver:NSObject,WCSessionDelegate {
    static let shared=PairingReceiver()
    override init(){super.init();if WCSession.isSupported(){WCSession.default.delegate=self;WCSession.default.activate()}}
    func session(_ session:WCSession,activationDidCompleteWith state:WCSessionActivationState,error:Error?){}
    func session(_ session:WCSession,didReceiveMessage message:[String:Any],replyHandler:@escaping([String:Any])->Void){
        guard let text=message["session"] as? String,let data=text.data(using:.utf8) else{replyHandler(["saved":false]);return}
        do{try Vault.save(data);replyHandler(["saved":true])}catch{replyHandler(["saved":false])}
    }
}
@MainActor private final class WatchModel:ObservableObject {
    @Published var session:WatchSession?
    @Published var reading:WatchReading?
    @Published var observedAt=Date.distantPast
    @Published var connected=false
    @Published var busy=false
    @Published var error=""
    let cloud=WatchCloud()
    var work:Task<Void,Never>?
    init(){_ = PairingReceiver.shared;session=Vault.load()}
    var german:Bool{session?.language != "en"}
    func fresh(_ now:Date=Date())->Bool{connected && now.timeIntervalSince(observedAt)>=0 && now.timeIntervalSince(observedAt)<=15 && reading?.online==true}
    func refresh(_ command:WatchCommand?=nil){
        guard !busy else{return}
        let latest=Vault.load();if latest?.gatewayId != session?.gatewayId {reading=nil;connected=false};session=latest
        guard let session else{return}
        if command != nil && !fresh(){error=german ? "Keine aktuellen Werte":"No current readings";return}
        busy=true
        work=Task {
            defer{busy=false}
            do{let state=try await cloud.fetch(session,command:command);try Task.checkCancellation();reading=state;observedAt=Date();connected=true;error=""}
            catch{connected=false;if command != nil{self.error=german ? "Befehl nicht bestätigt. Zustand prüfen; nicht blind wiederholen.":"Command not confirmed. Check state; do not retry blindly."}}
        }
    }
    func suspend(){work?.cancel();connected=false;Task{await cloud.cancel()}}
    func unlink(){suspend();Vault.clear();session=nil;reading=nil}
}
@main struct DrevosWatchApp:App {
    @StateObject private var model=WatchModel()
    var body:some Scene {WindowGroup{WatchScreen(model:model)}}
}
private struct WatchScreen:View {
    @ObservedObject var model:WatchModel
    @Environment(\.scenePhase) var phase
    @State private var drafts:[String:String]=[:]
    @State private var pending:WatchCommand?
    @State private var unpair=false
    private let timer=Timer.publish(every:5,on:.main,in:.common).autoconnect()
    private var de:Bool{model.german}
    private let numberKeys=["kammertemperatur_soll","kerntemperatur_ziel","rauch_soll","timer_dauer"]
    private func label(_ key:String)->String {
        let labels=["kammertemperatur_soll":de ? "Kammer °C":"Chamber °C","kerntemperatur_ziel":de ? "Kern °C":"Core °C","rauch_soll":de ? "Rauch %":"Smoke %","timer_dauer":de ? "Timer min":"Timer min","heizelement":de ? "Heizung":"Heating","rauchbetrieb":de ? "Rauch/Zündung":"Smoke/ignition","konvektion":de ? "Konvektion":"Convection","luefter":de ? "Lüfter":"Fan","timer_lauf":"Timer"]
        return labels[key] ?? key
    }
    private func value(_ key:String,_ fresh:Bool)->String {guard fresh,let n=model.reading?.numbers[key] else{return "—"};return String(format:"%.1f",n)}
    var body:some View {
        TimelineView(.periodic(from:Date(),by:1)){context in
            let fresh=model.fresh(context.date);let controls=fresh && model.reading?.controls==true && !model.busy
            ScrollView {
                VStack(spacing:12){
                    Text("Drevos").font(.title3).foregroundColor(.orange)
                    if model.session==nil {
                        Text(de ? "Am iPhone: Drevos → Info → Uhr & Autoanzeige. Diese App geöffnet lassen und die Apple Watch dort koppeln.":"On iPhone: Drevos → Info → Watch & car display. Keep this app open and pair your Apple Watch there.").font(.footnote)
                    }else{
                        Text(fresh ? (de ? "Verbunden":"Connected"):(de ? "Nicht verfügbar":"Unavailable")).font(.caption)
                        Text("\(de ? "Kammer":"Chamber"): \(value("kammertemperatur",fresh)) \(model.reading?.unit ?? "°C")")
                        Text("\(de ? "Kern":"Core"): \(value("kerntemperatur",fresh)) \(model.reading?.unit ?? "°C")")
                        Text("\(de ? "Rauch":"Smoke"): \(value("raucheinstellung",fresh)) %")
                        Text("Timer: \(fresh ? model.reading?.remaining ?? "—":"—")")
                        Button(de ? "Aktualisieren":"Refresh"){model.refresh()}.disabled(model.busy)
                        ForEach(numberKeys,id:\.self){key in
                            VStack{
                                Text(label(key)).font(.caption)
                                TextField("\(WatchCommand.ranges[key]!.lowerBound)–\(WatchCommand.ranges[key]!.upperBound)",text:Binding(get:{drafts[key] ?? ""},set:{drafts[key]=$0})).disabled(!controls)
                                Button(de ? "Übernehmen":"Apply"){
                                    guard let text=drafts[key],text.matches("^[0-9]+$"),let n=Int(text),WatchCommand.ranges[key]!.contains(n) else{model.error=de ? "Wert außerhalb des Bereichs":"Value out of range";return}
                                    pending=WatchCommand(key:key,value:String(n),label:"\(label(key)): \(n)")
                                }.disabled(!controls)
                            }
                        }
                        ForEach(WatchCommand.switches,id:\.self){key in
                            let on=model.reading?.switches[key]==true
                            Button("\(label(key)): \(on ? (de ? "EIN":"ON"):(de ? "AUS":"OFF"))"){
                                pending=WatchCommand(key:key,value:on ? "OFF":"ON",label:"\(label(key)) \(on ? (de ? "ausschalten":"off"):(de ? "einschalten":"on"))")
                            }.disabled(!controls)
                        }
                        Button(de ? "Timer zurücksetzen":"Reset timer"){pending=WatchCommand(key:"timer_reset",value:"RESET",label:de ? "Timer zurücksetzen":"Reset timer")}.disabled(!controls)
                        Button(de ? "Kopplung löschen":"Remove pairing"){unpair=true}.disabled(model.busy)
                    }
                    if !model.error.isEmpty{Text(model.error).font(.caption).foregroundColor(.red)}
                    if model.busy{ProgressView()}
                }.padding(.horizontal,10).padding(.vertical,20)
            }
        }
        .confirmationDialog(pending?.label ?? "",isPresented:Binding(get:{pending != nil},set:{if !$0{pending=nil}}),titleVisibility:.visible){
            Button(de ? "Befehl bestätigen":"Confirm command"){if let command=pending{pending=nil;model.refresh(command)}}
            Button(de ? "Abbrechen":"Cancel",role:.cancel){pending=nil}
        }
        .confirmationDialog(de ? "Kopplung auf dieser Uhr löschen?":"Remove this watch's pairing?",isPresented:$unpair,titleVisibility:.visible){Button(de ? "Löschen":"Remove",role:.destructive){model.unlink()}}
        .onReceive(timer){_ in if phase == .active{model.refresh()}}
        .onAppear{model.refresh()}
        .onChange(of:phase){next in if next == .active{model.refresh()}else{pending=nil;model.suspend()}}
    }
}
