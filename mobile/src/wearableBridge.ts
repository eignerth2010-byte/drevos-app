import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
export type WatchPeer = { id: string; name: string };
type Bridge = {
  isWatch(): boolean;
  getPeers(): Promise<WatchPeer[]>;
  sendSession(id: string, json: string): Promise<boolean>;
  loadWatchSession(): Promise<string | null>;
  clearWatchSession(): Promise<void>;
  publishSnapshot(json: string): Promise<void>;
  startLiveActivity(): Promise<boolean>;
  stopLiveActivity(): Promise<void>;
  configureCarAccess(json: string): Promise<void>;
  clearCarAccess(): Promise<void>;
};
export const wearableBridge =
  Platform.OS === "web"
    ? null
    : requireOptionalNativeModule<Bridge>("DrevosCompanion");
export const isWatch = wearableBridge?.isWatch() ?? false;
