import ExpoModulesCore
import WatchConnectivity
import ActivityKit
import Foundation

private func validCloudSession(_ text: String) throws -> String {
    guard text.utf8.count <= 4096, let data=text.data(using:.utf8),
          let s=try JSONSerialization.jsonObject(with:data) as? [String:Any],
          let url=s["url"] as? String, let parts=URLComponents(string:url),
          parts.scheme=="https", parts.host != nil, parts.user==nil, parts.password==nil,
          parts.query==nil, parts.fragment==nil, ["","/"].contains(parts.path),
          let token=s["token"] as? String, token.range(of:"^[a-f0-9]{64}$",options:.regularExpression) != nil,
          let id=s["gatewayId"] as? String, id.range(of:"^[-\\w]{8,64}$",options:.regularExpression) != nil,
          let language=s["language"] as? String,["de","en"].contains(language),
          let cloud=s["cloud"] as? [String:String],
          let room=cloud["room"],room.range(of:"^[a-f0-9]{32}$",options:.regularExpression) != nil,
          let key=cloud["key"],key.range(of:"^[a-f0-9]{64}$",options:.regularExpression) != nil
    else { throw NSError(domain:"DrevosPairing",code:1) }
    let safe:[String:Any] = ["url":url,"token":token,"gatewayId":id,"language":language,"cloud":["room":room,"key":key]]
    return String(data:try JSONSerialization.data(withJSONObject:safe),encoding:.utf8)!
}

private final class WatchLink:NSObject,WCSessionDelegate {
    static let shared=WatchLink()
    override init(){super.init();if WCSession.isSupported(){WCSession.default.delegate=self;WCSession.default.activate()}}
    func peers()->[[String:String]] {
        guard WCSession.isSupported(),WCSession.default.activationState == .activated,
              WCSession.default.isPaired,WCSession.default.isWatchAppInstalled else{return []}
        return [["id":"apple-watch","name":"Apple Watch"]]
    }
    func send(_ id:String,_ text:String,_ promise:Promise) {
        guard id=="apple-watch",WCSession.default.activationState == .activated,WCSession.default.isReachable,
              let safe=try? validCloudSession(text) else {promise.reject("watch-unavailable","Open the paired watch app first");return}
        WCSession.default.sendMessage(["session":safe],replyHandler:{ reply in
            if reply["saved"] as? Bool == true {promise.resolve(true)}
            else{promise.reject("watch-pairing","Watch did not save pairing")}
        },errorHandler:{ _ in promise.reject("watch-unavailable","Pairing not delivered") })
    }
    func session(_ session:WCSession,activationDidCompleteWith state:WCSessionActivationState,error:Error?){}
    func sessionDidBecomeInactive(_ session:WCSession){}
    func sessionDidDeactivate(_ session:WCSession){session.activate()}
}

@MainActor private final class LiveDisplay {
    static let shared=LiveDisplay()
    var latest:DrevosActivityAttributes.ContentState?
    func publish(_ text:String) async {
        guard text.utf8.count<2048,let data=text.data(using:.utf8),let state=try? JSONDecoder().decode(DrevosActivityAttributes.ContentState.self,from:data) else{return}
        var display=state
        if !state.online,let previous=latest,previous.observedAt==state.observedAt,previous.name==state.name {
            display.chamber=previous.chamber;display.core=previous.core;display.smoke=previous.smoke;display.remaining=previous.remaining
        }
        latest=display
        if #available(iOS 16.2,*) {
            let expiry=Date(timeIntervalSince1970:state.observedAt/1000+20)
            for activity in Activity<DrevosActivityAttributes>.activities {
                await activity.update(ActivityContent(state:display,staleDate:expiry))
            }
        }
    }
    func start() throws -> Bool {
        guard #available(iOS 16.2,*),ActivityAuthorizationInfo().areActivitiesEnabled,
              let state=latest,state.online,Date().timeIntervalSince1970*1000-state.observedAt<15000 else{return false}
        if !Activity<DrevosActivityAttributes>.activities.isEmpty{return true}
        _ = try Activity.request(attributes:DrevosActivityAttributes(),content:ActivityContent(state:state,staleDate:Date(timeIntervalSince1970:state.observedAt/1000+20)),pushType:nil)
        return true
    }
    func stop() async {
        if #available(iOS 16.2,*) { for a in Activity<DrevosActivityAttributes>.activities {await a.end(nil,dismissalPolicy:.immediate)} }
    }
}

public final class DrevosCompanionModule:Module {
    public func definition()->ModuleDefinition {
        Name("DrevosCompanion")
        OnCreate {_ = WatchLink.shared}
        Function("isWatch"){false}
        AsyncFunction("getPeers"){WatchLink.shared.peers()}
        AsyncFunction("sendSession"){(id:String,text:String,promise:Promise) in WatchLink.shared.send(id,text,promise)}
        AsyncFunction("loadWatchSession"){()->String? in nil}
        AsyncFunction("clearWatchSession"){}
        AsyncFunction("publishSnapshot"){(json:String) async in await LiveDisplay.shared.publish(json)}
        AsyncFunction("startLiveActivity"){() async throws -> Bool in try await LiveDisplay.shared.start()}
        AsyncFunction("stopLiveActivity"){() async in await LiveDisplay.shared.stop()}
        AsyncFunction("configureCarAccess"){(_:String) in}
        AsyncFunction("clearCarAccess"){}
    }
}
