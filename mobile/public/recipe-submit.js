import {
  LIMITS,
  normalizeDraft,
  validPhoto as supportedPhoto,
  listRecipes,
  loadRecipe,
  saveRecipe,
  deleteRecipe,
} from "./recipe-drafts.js";
const HOST = "https://drevos-smoker-control.thankfulchick1.chatgpt.site";
const copy = {
  de: {
    eyebrow: "DEIN REZEPT FÜR DIE COMMUNITY",
    title: "Rezept einreichen",
    intro:
      "Zeig uns dein Räucherrezept mit Produktfoto und Ofeneinstellungen. Thomas prüft den Vorschlag und kann ihn anschließend in die Integration und die Apps aufnehmen.",
    recipe: "Rezept und Produktfoto",
    name: "Rezeptname *",
    source: "Woher stammt das Rezept? *",
    own: "Eigenes Rezept",
    display: "Vom Drevos-Ofendisplay übernommen",
    other: "Andere Quelle – bitte in den Hinweisen nennen",
    sourceHint:
      "Eigene Einsendungen werden als Community-Rezepte gekennzeichnet. Die Bezeichnung „Drevos-Originalrezept“ vergeben wir nach Prüfung der Herkunft.",
    photo: "Produktfoto * (bis 8 MB)",
    photoHint:
      "Wähle ein Foto des fertigen Produkts. JPG, PNG, WebP und iPhone-Fotos im HEIC-/HEIF-Format sind möglich.",
    photoFallback:
      "Das Foto ist ausgewählt. Dieses Bildformat kann hier nicht als Vorschau angezeigt werden.",
    ingredients: "Zutaten und Mengen *",
    method: "Vorbereitung und Zubereitung *",
    settings: "Ofeneinstellungen je Phase",
    phaseHint:
      "Mindestens eine Phase ausfüllen. Nicht benötigte Phasen leer lassen. Werte so eintragen, wie sie am Ofen eingestellt werden.",
    details: "Hinweise und Rückfragen",
    notes: "Hinweise, Ofenmodell und gegebenenfalls Quelle",
    author: "Dein Name oder Spitzname (optional)",
    authorHint:
      "Nur ausfüllen, wenn dieser Name beim veröffentlichten Rezept genannt werden darf.",
    email: "E-Mail für Rückfragen (optional, wird nicht veröffentlicht)",
    consent:
      "Ich erlaube die Veröffentlichung meines Rezepts und Fotos nach Prüfung in den Drevos-Projekten. Ich darf das eingereichte Material dafür weitergeben.",
    delivery: "Dein Vorschlag und Foto werden über FormSubmit an",
    deliveryEnd:
      "gesendet. Es werden keine Kopplungscodes oder Ofen-Zugangsschlüssel benötigt.",
    privacy: "Datenschutz des Versanddienstes",
    submit: "Rezept zur Prüfung senden",
    sentTitle: "Vorschlag übermittelt",
    sentText:
      "Vielen Dank! Thomas prüft dein Rezept vor einer möglichen Veröffentlichung. Es wird nicht automatisch in die Rezeptsammlung aufgenommen.",
    another: "Weiteres Rezept einreichen",
    phase: "Phase",
    phaseName: "Bezeichnung (optional)",
    durationMinutes: "Dauer (Minuten)",
    chamberC: "Kammer (°C)",
    coreC: "Kernziel (°C)",
    smokePercent: "Rauch (%)",
    convection: "Konvektion",
    fan: "Lüfter",
    unknown: "Nicht angegeben",
    on: "Ein",
    off: "Aus",
    photoError:
      "Bitte ein Produktfoto im unterstützten Bildformat auswählen (höchstens 8 MB).",
    prefillError:
      "Die Vorbelegung konnte nicht übernommen werden. Bitte die Felder selbst ausfüllen.",
    phaseError:
      "Bitte für jede verwendete Phase alle vier Zahlenwerte innerhalb der angezeigten Grenzen eintragen.",
  },
  en: {
    eyebrow: "YOUR RECIPE FOR THE COMMUNITY",
    title: "Submit a recipe",
    intro:
      "Share your smoking recipe, product photo and oven settings. Thomas reviews the suggestion before it may be included in the integration and apps.",
    recipe: "Recipe and product photo",
    name: "Recipe name *",
    source: "Where does the recipe come from? *",
    own: "My own recipe",
    display: "Copied from a Drevos oven display",
    other: "Another source – please name it in the notes",
    sourceHint:
      "User submissions are labelled as community recipes. We assign “Drevos original recipe” only after reviewing its source.",
    photo: "Product photo * (up to 8 MB)",
    photoHint:
      "Choose a photo of the finished product. JPG, PNG, WebP and iPhone HEIC/HEIF photos are supported.",
    photoFallback:
      "The photo is selected. This image format cannot be previewed here.",
    ingredients: "Ingredients and quantities *",
    method: "Preparation and instructions *",
    settings: "Oven settings for each phase",
    phaseHint:
      "Complete at least one phase. Leave unused phases blank. Enter the settings as used on the oven.",
    details: "Notes and questions",
    notes: "Notes, oven model and any source reference",
    author: "Your name or nickname (optional)",
    authorHint:
      "Fill this in only if this name may be shown with the published recipe.",
    email: "Email for questions (optional, not published)",
    consent:
      "I allow my recipe and photo to be published in the Drevos projects after review. I am allowed to share the submitted material for this purpose.",
    delivery: "Your suggestion and photo are sent through FormSubmit to",
    deliveryEnd: ". No pairing codes or oven access tokens are needed.",
    privacy: "Delivery service privacy policy",
    submit: "Send recipe for review",
    sentTitle: "Suggestion submitted",
    sentText:
      "Thank you! Thomas reviews your recipe before any possible publication. It is not added to the recipe collection automatically.",
    another: "Submit another recipe",
    phase: "Phase",
    phaseName: "Name (optional)",
    durationMinutes: "Duration (minutes)",
    chamberC: "Chamber (°C)",
    coreC: "Core target (°C)",
    smokePercent: "Smoke (%)",
    convection: "Convection",
    fan: "Fan",
    unknown: "Not specified",
    on: "On",
    off: "Off",
    photoError:
      "Select a product photo in a supported image format (up to 8 MB).",
    prefillError:
      "The recipe could not be prefilled. Please fill in the fields yourself.",
    phaseError:
      "Complete all four numeric settings within the shown limits for each phase you use.",
  },
};
Object.assign(copy.de, {
  savedTitle: "Meine Rezepte",
  savedHint:
    "Entwürfe mit Foto bleiben nur in diesem Browser auf diesem Gerät. Sie werden nicht automatisch gesendet oder zwischen Geräten synchronisiert. Gelöschte Browserdaten entfernen auch die Rezepte.",
  savedChoose: "Gespeichertes Rezept auswählen",
  savedEmpty: "Noch keine gespeicherten Rezepte",
  load: "Öffnen",
  new: "Neues Rezept",
  delete: "Löschen",
  save: "Rezept und Foto auf diesem Gerät speichern",
  saved: "Auf diesem Gerät gespeichert. Noch nicht eingereicht.",
  loaded:
    "Entwurf geöffnet. Zum Einreichen die Freigabe erneut selbst bestätigen.",
  storage:
    "Rezepte konnten in diesem Browser nicht gespeichert oder geladen werden. Deine aktuellen Eingaben bleiben stehen.",
  nameError: "Bitte zuerst einen Rezeptnamen eintragen.",
  rangeError:
    "Bitte die Zahlenwerte innerhalb der angezeigten Grenzen eintragen. Unfertige Felder dürfen beim Speichern leer bleiben.",
  limit:
    "Der lokale Speicher ist voll (höchstens 25 Rezepte und insgesamt 50 MB Fotos). Bitte ein nicht mehr benötigtes Rezept löschen.",
  conflict:
    "Dieses Rezept wurde in einem anderen Fenster geändert. Bitte neu öffnen; deine aktuellen Eingaben bleiben stehen.",
  discard: "Ungespeicherte Eingaben verwerfen?",
  remove: "Dieses gespeicherte Rezept auf diesem Gerät löschen?",
  removed: "Rezept auf diesem Gerät gelöscht.",
  choose: "Bitte ein gespeichertes Rezept auswählen.",
  reselect:
    "Der Entwurf ist geöffnet. Bitte das Produktfoto zum Versenden erneut auswählen; die gespeicherte Kopie bleibt erhalten.",
});
Object.assign(copy.en, {
  savedTitle: "My recipes",
  savedHint:
    "Drafts and photos stay only in this browser on this device. They are not sent or synced automatically. Clearing browser data also removes the recipes.",
  savedChoose: "Choose a saved recipe",
  savedEmpty: "No saved recipes yet",
  load: "Open",
  new: "New recipe",
  delete: "Delete",
  save: "Save recipe and photo on this device",
  saved: "Saved on this device. Not submitted yet.",
  loaded:
    "Draft opened. Confirm publication permission yourself again before submitting.",
  storage:
    "Recipes could not be saved or loaded in this browser. Your current input is preserved.",
  nameError: "Enter a recipe name first.",
  rangeError:
    "Enter numbers within the shown limits. Incomplete fields may be left blank when saving.",
  limit:
    "Local storage is full (up to 25 recipes and 50 MB of photos in total). Delete an unneeded saved recipe.",
  conflict:
    "This recipe was changed in another window. Open it again; your current input is preserved.",
  discard: "Discard unsaved changes?",
  remove: "Delete this saved recipe from this device?",
  removed: "Recipe deleted from this device.",
  choose: "Choose a saved recipe first.",
  reselect:
    "Draft opened. Select the product photo again before sending; the saved copy is preserved.",
});
const params = new URLSearchParams(location.search);
let language = params.get("lang") === "en" ? "en" : "de";
const form = document.querySelector("form"),
  phases = document.getElementById("phases");
const ranges = LIMITS;
for (let index = 0; index < 3; index++) {
  const section = document.createElement("section");
  section.className = "phase";
  section.dataset.phase = String(index);
  const heading = document.createElement("h3");
  heading.dataset.phaseTitle = String(index);
  section.append(heading);
  const nameLabel = document.createElement("label");
  nameLabel.dataset.i18n = "phaseName";
  nameLabel.htmlFor = `phase-${index}-name`;
  section.append(nameLabel);
  const name = document.createElement("input");
  name.id = nameLabel.htmlFor;
  name.name = `Phase ${index + 1} – Bezeichnung`;
  name.maxLength = 60;
  name.dataset.key = "name";
  name.className = "phase-name";
  section.append(name);
  const grid = document.createElement("div");
  grid.className = "phase-grid";
  section.append(grid);
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const label = document.createElement("label"),
      text = document.createElement("span");
    text.dataset.i18n = key;
    label.append(text);
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "numeric";
    input.min = String(min);
    input.max = String(max);
    input.step = "1";
    input.dataset.key = key;
    input.name = `Phase ${index + 1} – ${key}`;
    if (index === 0) input.required = true;
    label.append(input);
    grid.append(label);
  }
  for (const key of ["convection", "fan"]) {
    const label = document.createElement("label"),
      text = document.createElement("span");
    text.dataset.i18n = key;
    label.append(text);
    const select = document.createElement("select");
    select.dataset.key = key;
    select.name = `Phase ${index + 1} – ${key}`;
    for (const [value, keyText] of [
      ["unknown", "unknown"],
      ["true", "on"],
      ["false", "off"],
    ]) {
      const option = document.createElement("option");
      option.value = value;
      option.dataset.i18n = keyText;
      select.append(option);
    }
    label.append(select);
    grid.append(label);
  }
  phases.append(section);
}
function translate() {
  document.documentElement.lang = language;
  document.title = `Drevos – ${copy[language].title}`;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = copy[language][el.dataset.i18n];
  });
  document.querySelectorAll("[data-phase-title]").forEach((el) => {
    el.textContent = `${copy[language].phase} ${Number(el.dataset.phaseTitle) + 1}`;
  });
  document.getElementById("language").textContent =
    language === "de" ? "English" : "Deutsch";
  document.getElementById("photo-preview").alt =
    language === "de"
      ? "Vorschau des ausgewählten Produktfotos"
      : "Selected product photo preview";
  const placeholder = document.querySelector('#saved-recipes option[value=""]');
  if (placeholder)
    placeholder.textContent =
      copy[language][
        placeholder.parentElement.options.length > 1 ? "choose" : "savedEmpty"
      ];
  const savedStatus = document.getElementById("saved-status");
  if (savedStatus.dataset.message)
    savedStatus.textContent = copy[language][savedStatus.dataset.message];
}
translate();
document.getElementById("language").addEventListener("click", () => {
  language = language === "de" ? "en" : "de";
  translate();
});
if (params.get("submitted") === "1") {
  document.getElementById("entry").hidden = true;
  document.getElementById("success").hidden = false;
}
const error = document.getElementById("error");
function showError(message) {
  error.textContent = message;
  error.hidden = false;
  error.scrollIntoView({ block: "nearest" });
}
function prefill() {
  if (!location.hash) return;
  try {
    if (location.hash.length > 60000) throw Error("too large");
    const data = JSON.parse(decodeURIComponent(location.hash.slice(1)));
    if (
      data.schemaVersion !== 1 ||
      !data.recipe ||
      typeof data.recipe.name !== "string" ||
      !Array.isArray(data.recipe.phases) ||
      data.recipe.phases.length > 3
    )
      throw Error("invalid");
    const candidate = Object.fromEntries(
      ["name", "ingredients", "method", "notes"].map((key) => [
        key,
        data.recipe[key] ?? "",
      ]),
    );
    candidate.phases = data.recipe.phases.map((phase) => {
      if (!phase || typeof phase !== "object") throw Error("invalid");
      const clean = { name: phase.name ?? "" };
      for (const key of Object.keys(ranges)) {
        const value = phase[key];
        if (
          value !== undefined &&
          (!Number.isInteger(value) ||
            value < ranges[key][0] ||
            value > ranges[key][1])
        )
          throw Error("invalid");
        clean[key] = value === undefined ? "" : String(value);
      }
      for (const key of ["convection", "fan"]) {
        const value = phase[key];
        if (value !== undefined && value !== null && typeof value !== "boolean")
          throw Error("invalid");
        clean[key] = typeof value === "boolean" ? String(value) : "unknown";
      }
      return clean;
    });
    // Validate the complete import before changing even the first input.
    fill(normalizeDraft(candidate));
    // A source badge, contact details and publication consent are never imported.
    history.replaceState(null, "", location.pathname + location.search);
  } catch {
    showError(copy[language].prefillError);
  }
}
prefill();
let photoURL;
const photo = document.getElementById("photo"),
  preview = document.getElementById("photo-preview"),
  fallback = document.getElementById("photo-fallback");
preview.onload = () => {
  preview.hidden = false;
  fallback.hidden = true;
};
preview.onerror = () => {
  preview.hidden = true;
  fallback.hidden = false;
};
function validPhoto() {
  return supportedPhoto(photo.files?.[0]);
}
photo.addEventListener("change", () => {
  if (photoURL) URL.revokeObjectURL(photoURL);
  preview.hidden = true;
  fallback.hidden = true;
  photo.setCustomValidity("");
  if (!validPhoto()) {
    photo.setCustomValidity(copy[language].photoError);
    return;
  }
  photoURL = URL.createObjectURL(photo.files[0]);
  preview.onload = () => {
    preview.hidden = false;
  };
  preview.onerror = () => {
    preview.hidden = true;
    fallback.hidden = false;
  };
  preview.src = photoURL;
});
for (const section of phases.children)
  section.addEventListener("input", () => {
    const inputs = [...section.querySelectorAll("input[type=number]")],
      used =
        section.dataset.phase === "0" ||
        inputs.some((input) => input.value !== "") ||
        section.querySelector("[data-key=name]").value !== "" ||
        [...section.querySelectorAll("select")].some(
          (input) => input.value !== "unknown",
        );
    for (const input of inputs) input.required = used;
  });
form.addEventListener("submit", (event) => {
  error.hidden = true;
  if (!validPhoto()) {
    event.preventDefault();
    showError(copy[language].photoError);
    return;
  }
  for (const section of phases.children) {
    const numbers = [...section.querySelectorAll("input[type=number]")],
      used =
        section.dataset.phase === "0" ||
        numbers.some((input) => input.value !== "") ||
        section.querySelector("[data-key=name]").value !== "" ||
        [...section.querySelectorAll("select")].some(
          (input) => input.value !== "unknown",
        );
    if (
      used &&
      numbers.some(
        (input) =>
          !input.value ||
          !Number.isInteger(input.valueAsNumber) ||
          !input.checkValidity(),
      )
    ) {
      event.preventDefault();
      showError(copy[language].phaseError);
      return;
    }
  }
  form.querySelector("[name=_next]").value =
    `${HOST}/recipe-submit.html?submitted=1&lang=${language}`;
});

const savedSelect = document.getElementById("saved-recipes"),
  status = document.getElementById("saved-status");
function setStatus(key) {
  status.dataset.message = key;
  status.textContent = key ? copy[language][key] : "";
}
let current = null,
  draftPhoto = null,
  dirty = false,
  storageBusy = false;
form.addEventListener("input", () => {
  dirty = true;
});
photo.addEventListener("change", () => {
  draftPhoto = photo.files?.[0] || null;
});
function controls() {
  for (const id of ["save", "load", "new", "delete"])
    document.getElementById(id).disabled =
      storageBusy || (["load", "delete"].includes(id) && !savedSelect.value);
}
function storageError(error) {
  const key =
    {
      name: "nameError",
      range: "rangeError",
      photo: "photoError",
      limit: "limit",
      conflict: "conflict",
    }[error?.message] || "storage";
  showError(copy[language][key]);
}
function values() {
  return {
    name: document.getElementById("recipe-name").value,
    ingredients: document.getElementById("ingredients").value,
    method: document.getElementById("method").value,
    notes: document.getElementById("notes").value,
    phases: [...phases.children].map((section) =>
      Object.fromEntries(
        [...section.querySelectorAll("[data-key]")].map((input) => [
          input.dataset.key,
          input.value,
        ]),
      ),
    ),
  };
}
function fill(recipe) {
  for (const key of ["name", "ingredients", "method", "notes"])
    document.getElementById(key === "name" ? "recipe-name" : key).value =
      recipe[key];
  for (const [index, phase] of recipe.phases.entries())
    for (const input of phases.children[index].querySelectorAll("[data-key]"))
      input.value = phase[input.dataset.key];
  for (const section of phases.children)
    section.dispatchEvent(new Event("input"));
}
async function refreshSaved(selected = current?.id) {
  const rows = await listRecipes();
  savedSelect.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = rows.length
    ? copy[language].choose
    : copy[language].savedEmpty;
  savedSelect.append(empty);
  for (const row of rows) {
    const option = document.createElement("option");
    option.value = row.id;
    option.textContent = row.name;
    savedSelect.append(option);
  }
  savedSelect.value = selected || "";
  controls();
}
savedSelect.addEventListener("change", controls);
document.getElementById("save").addEventListener("click", async () => {
  if (storageBusy) return;
  storageBusy = true;
  controls();
  error.hidden = true;
  try {
    const chosen = photo.files?.[0] || draftPhoto;
    current = await saveRecipe(values(), chosen, current);
    dirty = false;
    await refreshSaved();
    setStatus("saved");
  } catch (error) {
    storageError(error);
  } finally {
    storageBusy = false;
    controls();
  }
});
document.getElementById("load").addEventListener("click", async () => {
  if (
    storageBusy ||
    !savedSelect.value ||
    (dirty && !confirm(copy[language].discard))
  )
    return;
  storageBusy = true;
  controls();
  error.hidden = true;
  try {
    const row = await loadRecipe(savedSelect.value);
    if (!row) throw Error("conflict");
    form.reset();
    fill(row.recipe);
    current = { id: row.id, revision: row.revision };
    draftPhoto = row.photo;
    dirty = false;
    if (photoURL) URL.revokeObjectURL(photoURL);
    preview.hidden = true;
    fallback.hidden = true;
    photo.setCustomValidity("");
    if (row.photo) {
      photoURL = URL.createObjectURL(row.photo);
      preview.src = photoURL;
      try {
        const transfer = new DataTransfer();
        transfer.items.add(row.photo);
        photo.files = transfer.files;
      } catch {}
    }
    setStatus(row.photo && !photo.files.length ? "reselect" : "loaded");
  } catch (error) {
    storageError(error);
  } finally {
    storageBusy = false;
    controls();
  }
});
document.getElementById("new").addEventListener("click", () => {
  if (storageBusy || (dirty && !confirm(copy[language].discard))) return;
  form.reset();
  current = null;
  draftPhoto = null;
  dirty = false;
  error.hidden = true;
  setStatus("");
  savedSelect.value = "";
  if (photoURL) URL.revokeObjectURL(photoURL);
  preview.hidden = true;
  fallback.hidden = true;
  photo.setCustomValidity("");
  for (const section of phases.children)
    section.dispatchEvent(new Event("input"));
  controls();
});
document.getElementById("delete").addEventListener("click", async () => {
  if (storageBusy || !savedSelect.value || !confirm(copy[language].remove))
    return;
  storageBusy = true;
  controls();
  error.hidden = true;
  try {
    const row = await loadRecipe(savedSelect.value);
    if (!row) throw Error("conflict");
    await deleteRecipe({ id: row.id, revision: row.revision });
    if (current?.id === row.id) current = null;
    await refreshSaved();
    setStatus("removed");
  } catch (error) {
    storageError(error);
  } finally {
    storageBusy = false;
    controls();
  }
});
refreshSaved().catch(storageError);
