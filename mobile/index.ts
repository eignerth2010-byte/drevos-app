import { registerRootComponent } from "expo";
import App from "./App";
import WatchApp from "./src/WatchApp";
import { isWatch } from "./src/wearableBridge";
registerRootComponent(isWatch ? WatchApp : App);
