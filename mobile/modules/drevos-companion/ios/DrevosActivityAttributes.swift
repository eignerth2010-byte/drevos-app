import ActivityKit
import Foundation

public struct DrevosActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var name: String
        public var online: Bool
        public var observedAt: Double
        public var chamber: Double?
        public var core: Double?
        public var smoke: Double?
        public var remaining: String
        public var unit: String
    }
    public var source: String = "Drevos"
}
