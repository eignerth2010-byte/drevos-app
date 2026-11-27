// swift-tools-version: 5.9
import PackageDescription
let package = Package(name:"DrevosWatchCore",platforms:[.macOS(.v13)],products:[.library(name:"DrevosWatchCore",targets:["DrevosWatchCore"])],targets:[.target(name:"DrevosWatchCore",path:"Watch",exclude:["DrevosWatchApp.swift"],sources:["WatchCloud.swift"]),.testTarget(name:"DrevosWatchCoreTests",dependencies:["DrevosWatchCore"],path:"Tests",resources:[.process("Fixtures")])])
