// This database only contains personal recipes, never oven pairing credentials.
export const LIMITS = Object.freeze({
  durationMinutes: [0, 9999],
  chamberC: [0, 120],
  coreC: [0, 115],
  smokePercent: [0, 100],
});
export const MAX_PHOTO = 8 * 1024 * 1024;
const DB = "drevos-recipes-v1",
  STORE = "recipes";
export function normalizeDraft(input) {
  if (
    !input ||
    typeof input !== "object" ||
    !Array.isArray(input.phases) ||
    input.phases.length < 1 ||
    input.phases.length > 3
  )
    throw Error("invalid");
  const draft = { schemaVersion: 1 };
  for (const [key, max] of Object.entries({
    name: 80,
    ingredients: 12000,
    method: 12000,
    notes: 5000,
  })) {
    if (typeof input[key] !== "string" || input[key].length > max)
      throw Error("invalid");
    draft[key] = input[key];
  }
  if (!draft.name.trim()) throw Error("name");
  draft.phases = input.phases.map((phase) => {
    if (
      !phase ||
      typeof phase !== "object" ||
      typeof phase.name !== "string" ||
      phase.name.length > 60
    )
      throw Error("invalid");
    const result = { name: phase.name };
    for (const [key, [min, max]] of Object.entries(LIMITS)) {
      const value = phase[key];
      if (
        value !== "" &&
        (typeof value !== "string" ||
          !/^\d{1,4}$/.test(value) ||
          Number(value) < min ||
          Number(value) > max)
      )
        throw Error("range");
      result[key] = value;
    }
    for (const key of ["convection", "fan"]) {
      if (!["unknown", "true", "false"].includes(phase[key]))
        throw Error("invalid");
      result[key] = phase[key];
    }
    return result;
  });
  // Contact data, source badges and publication consent are never copied.
  return draft;
}
export function validPhoto(file) {
  return (
    file instanceof Blob &&
    file.size > 0 &&
    file.size <= MAX_PHOTO &&
    typeof file.name === "string" &&
    /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
  );
}
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => reject(Error("storage"));
  });
}
async function transaction(mode, operation) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode),
        store = tx.objectStore(STORE);
      let result, error;
      const done = (value) => {
          result = value;
        },
        fail = (message) => {
          error = Error(message);
          tx.abort();
        };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(error || Error("storage"));
      try {
        operation(store, done, fail);
      } catch {
        fail("storage");
      }
    });
  } finally {
    db.close();
  }
}
export async function listRecipes() {
  return transaction("readonly", (store, done) => {
    const request = store.getAll();
    request.onsuccess = () =>
      done(
        request.result
          .map(({ id, revision, recipe, updated }) => ({
            id,
            revision,
            name: recipe.name,
            updated,
          }))
          .sort((a, b) => b.updated - a.updated),
      );
  });
}
export async function loadRecipe(id) {
  return transaction("readonly", (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => done(request.result || null);
  });
}
export async function saveRecipe(recipe, photo, current = null) {
  const clean = normalizeDraft(recipe);
  if (photo !== null && !validPhoto(photo)) throw Error("photo");
  const id = current?.id || crypto.randomUUID();
  return transaction("readwrite", (store, done, fail) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = request.result,
        old = rows.find((row) => row.id === id);
      if (
        (current && (!old || old.revision !== current.revision)) ||
        (!current && old)
      )
        return fail("conflict");
      if (!old && rows.length >= 25) return fail("limit");
      if (
        rows
          .filter((row) => row.id !== id)
          .reduce(
            (total, row) => total + (row.photo?.size || 0),
            photo?.size || 0,
          ) >
        50 * 1024 * 1024
      )
        return fail("limit");
      const row = {
        id,
        revision: (old?.revision || 0) + 1,
        updated: Date.now(),
        recipe: clean,
        photo,
      };
      store.put(row);
      done({ id: row.id, revision: row.revision });
    };
  });
}
export async function deleteRecipe(current) {
  return transaction("readwrite", (store, done, fail) => {
    const request = store.get(current.id);
    request.onsuccess = () => {
      if (!request.result || request.result.revision !== current.revision)
        return fail("conflict");
      store.delete(current.id);
      done(true);
    };
  });
}
