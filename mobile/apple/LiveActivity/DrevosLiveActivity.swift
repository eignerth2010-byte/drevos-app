import WidgetKit
import SwiftUI
import ActivityKit

@main struct DrevosLiveActivity: Widget {
    var body:some WidgetConfiguration {
        ActivityConfiguration(for:DrevosActivityAttributes.self){context in
            StatusView(state:context.state,stale:context.isStale)
                .padding().activityBackgroundTint(Color(red:0.06,green:0.075,blue:0.08))
                .activitySystemActionForegroundColor(.orange)
        } dynamicIsland:{context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center){StatusView(state:context.state,stale:context.isStale)}
            } compactLeading:{Text("D")}
              compactTrailing:{Text(context.isStale ? "—" : degrees(context.state.chamber))}
              minimal:{Text(context.isStale ? "—" : "D")}
        }
        .supplementalActivityFamilies([.small,.medium])
    }
}
private func degrees(_ value:Double?)->String {value.map{String(format:"%.1f°",$0)} ?? "—"}
private struct StatusView:View {
    let state:DrevosActivityAttributes.ContentState
    let stale:Bool
    var body:some View {
        VStack(alignment:.leading,spacing:5){
            Text("Drevos").font(.headline).foregroundColor(.orange)
            if !state.online || stale {Text("Letzter Stand / Last reading").font(.caption)}
            HStack{
                VStack(alignment:.leading){Text("Kammer / Chamber").font(.caption2);Text(degrees(state.chamber)).font(.title3)}
                Spacer()
                VStack(alignment:.trailing){Text("Kern / Core").font(.caption2);Text(degrees(state.core)).font(.title3)}
            }
            Text("Timer: \(state.remaining)").font(.caption)
            Text(Date(timeIntervalSince1970:state.observedAt/1000),style:.time).font(.caption2).foregroundColor(.secondary)
        }.foregroundColor(.white)
    }
}
