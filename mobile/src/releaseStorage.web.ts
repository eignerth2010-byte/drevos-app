// Browser-local public UI preferences only. Pairing remains in its encrypted vault.
export const releaseStorage = {
  async get(key: string) {
    return localStorage.getItem(`drevos.release.${key}`);
  },
  async set(key: string, value: string) {
    localStorage.setItem(`drevos.release.${key}`, value);
  },
};
