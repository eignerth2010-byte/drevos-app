import * as SecureStore from "expo-secure-store";
import { SessionStore, StoredSession, normalizeUrl } from "./gateway";
const KEY = "drevos.direct.v2";
export const secureStore: SessionStore = {
  async load() {
    const text = await SecureStore.getItemAsync(KEY);
    if (!text) return null;
    try {
      const value = JSON.parse(text) as StoredSession;
      if (
        typeof value.token !== "string" ||
        !value.token ||
        !["de", "en"].includes(value.language)
      )
        throw new Error("invalid");
      value.url = normalizeUrl(value.url);
      if (
        value.cloud &&
        (!/^[a-f0-9]{32}$/.test(value.cloud.room) ||
          !/^[a-f0-9]{64}$/.test(value.cloud.key) ||
          !value.url.startsWith("https:"))
      )
        throw new Error("invalid");
      if (typeof value.gatewayId !== "string" || !value.gatewayId)
        throw new Error("invalid");
      return value;
    } catch {
      await SecureStore.deleteItemAsync(KEY);
      return null;
    }
  },
  save(value) {
    return SecureStore.setItemAsync(KEY, JSON.stringify(value), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  clear() {
    return SecureStore.deleteItemAsync(KEY);
  },
};
