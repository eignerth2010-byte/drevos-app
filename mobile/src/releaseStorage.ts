import * as SecureStore from "expo-secure-store";

// Independent from oven pairing; no pairing credential is read or changed here.
export const releaseStorage = {
  get: (key: string) => SecureStore.getItemAsync(`drevos.release.${key}`),
  set: (key: string, value: string) =>
    SecureStore.setItemAsync(`drevos.release.${key}`, value),
};
