import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { recipes, recipePhase, RECIPE_FORM } from "./recipes";
import { recipeImages } from "./recipeImages";

export function RecipeBook({
  language,
  onSelect,
  busy,
  canPrepare,
  initialBrowse,
  onBrowse,
}: {
  language: "de" | "en";
  onSelect: (id: string, index: number) => void;
  busy: boolean;
  canPrepare: boolean;
  initialBrowse?: { selected: string | null; search: string };
  onBrowse?: (context: { selected: string | null; search: string }) => void;
}) {
  const de = language === "de",
    [selected, setSelected] = useState<string | null>(
      initialBrowse?.selected ?? null,
    ),
    [search, setSearch] = useState(initialBrowse?.search ?? ""),
    [error, setError] = useState("");
  useEffect(
    () => onBrowse?.({ selected, search }),
    [selected, search, onBrowse],
  );
  const recipe = recipes.find((r) => r.id === selected);
  const button = (label: string, action: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={busy || disabled}
      onPress={action}
      style={[s.button, (busy || disabled) && s.disabled]}
    >
      <Text style={s.buttonText}>{label}</Text>
    </Pressable>
  );
  async function own() {
    try {
      await Linking.openURL(`${RECIPE_FORM}?lang=${language}`);
    } catch {
      setError(
        de
          ? "Das Rezeptformular konnte nicht geöffnet werden."
          : "Could not open the recipe form.",
      );
    }
  }
  return (
    <View style={s.stack}>
      <Text accessibilityRole="header" style={s.title}>
        {de ? "Rezepte" : "Recipes"}
      </Text>
      <Text style={s.muted}>
        {de
          ? "40 Drevos-Originalrezepte, vom Ofendisplay übertragen. Die Herkunftskennzeichnung ist keine Prüfung der Lebensmittelsicherheit."
          : "40 Drevos original recipes transcribed from the oven display. Source attribution does not mean food safety approval."}
      </Text>
      {button(
        de
          ? "Eigenes Rezept speichern / einreichen"
          : "Save / submit my own recipe",
        () => void own(),
      )}
      <Text style={s.muted}>
        {de
          ? "Öffnet das Formular im Browser. Eigene Entwürfe mit Foto bleiben dort auf diesem Gerät. Einsendungen gehen an Thomas zur Prüfung."
          : "Opens the browser form. Personal drafts and photos stay in that browser on this device. Submissions go to Thomas for review."}
      </Text>
      {error && (
        <Text accessibilityRole="alert" style={s.warning}>
          {error}
        </Text>
      )}
      {recipe ? (
        <>
          {button(de ? "Zur Rezeptsammlung" : "Back to recipes", () =>
            setSelected(null),
          )}
          <View style={s.hero}>
            <Image
              source={recipeImages[recipe.image]}
              accessibilityLabel={recipe.name}
              style={s.picture}
              resizeMode="cover"
            />
          </View>
          <Text style={s.muted}>
            {de
              ? "Produktbild aus dem Displayfoto mit KI aufbereitet."
              : "Product image restored from the display photo using AI."}
          </Text>
          <Text accessibilityRole="header" style={s.title}>
            {recipe.name}
          </Text>
          <Text style={s.badge}>
            {de ? "Drevos-Originalrezept" : "Drevos original recipe"}
          </Text>
          <Text style={s.heading}>{de ? "Zutaten" : "Ingredients"}</Text>
          <Text selectable style={s.body}>
            {recipe.ingredients}
          </Text>
          <Text style={s.heading}>
            {de ? "Zubereitung – Displaytext" : "Preparation – display text"}
          </Text>
          <Text style={s.muted}>
            {de
              ? "Text und Zahlen aus der Vorlage; fehlende oder widersprüchliche Angaben sind gekennzeichnet."
              : "Original German display text. Missing or conflicting data is marked."}
          </Text>
          <Text selectable style={s.body}>
            {recipe.method}
          </Text>
          {!!recipe.notes && <Text style={s.warning}>{recipe.notes}</Text>}
          <Text style={s.heading}>
            {de ? "Phase auswählen" : "Choose a phase"}
          </Text>
          <Text style={s.muted}>
            {de
              ? "Eine Phase lädt die Werte vor. Übertragen und Starten bestätigst du selbst. Pausen bleiben erhalten; es gibt keinen automatischen Wechsel. Lüfter werden separat bedient."
              : "Selecting a phase prepares its values. You confirm transfer and start yourself. Pauses are preserved; phases never advance automatically. Fans are controlled separately."}
          </Text>
          {recipe.phases.map((phase, index) => {
            let blocked = false;
            try {
              recipePhase(recipe.id, index);
            } catch {
              blocked = true;
            }
            return (
              <View style={s.panel} key={index}>
                <Text style={s.heading}>
                  {de
                    ? phase.name
                    : ["Drying", "Smoking 1", "Smoking 2"][index]}
                </Text>
                <Text style={s.body}>
                  {phase.durationMinutes} min · {phase.chamberC} °C{" "}
                  {de ? "Kammer" : "chamber"} · {phase.coreC} °C{" "}
                  {de ? "Kernziel" : "core target"} · {phase.smokePercent} %{" "}
                  {de ? "Rauch" : "smoke"}
                </Text>
                {phase.smokeFromProgram && (
                  <Text style={s.muted}>
                    {de
                      ? "Rauch 0 % folgt dem Trocknungsschritt der SPS; kein Rauchfeld auf der Displayseite."
                      : "Smoke 0% follows the PLC drying step; the display has no drying smoke field."}
                  </Text>
                )}
                {phase.durationMinutes === 0 && (
                  <Text style={s.muted}>
                    {de
                      ? "Original-Zeitwert 0: kein Zeittimer wird übernommen oder gestartet."
                      : "Original time value 0: no timed countdown is transferred or started."}
                  </Text>
                )}
                {button(
                  blocked
                    ? de
                      ? "Nicht zur Übernahme freigegeben"
                      : "Not available for transfer"
                    : !canPrepare
                      ? de
                        ? "Zum Übernehmen zuerst Ofen verbinden"
                        : "Connect an oven to prepare values"
                      : de
                        ? "Diese Phase vorbereiten"
                        : "Prepare this phase",
                  () => onSelect(recipe.id, index),
                  blocked || !canPrepare,
                )}
              </View>
            );
          })}
        </>
      ) : (
        <>
          <TextInput
            accessibilityLabel={de ? "Rezept suchen" : "Search recipes"}
            placeholder={de ? "Rezept suchen …" : "Search recipes …"}
            placeholderTextColor="#a9b4b9"
            value={search}
            onChangeText={setSearch}
            style={s.search}
          />
          <View style={s.grid}>
            {recipes
              .filter((r) =>
                `${r.name} ${r.ingredients}`
                  .toLocaleLowerCase()
                  .includes(search.trim().toLocaleLowerCase()),
              )
              .map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  accessibilityLabel={
                    de ? `${r.name} öffnen` : `Open ${r.name}`
                  }
                  disabled={busy}
                  onPress={() => setSelected(r.id)}
                  style={s.tile}
                >
                  <View style={s.thumb}>
                    <Image
                      source={recipeImages[r.image]}
                      style={s.picture}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={s.name}>{r.name}</Text>
                  <Text style={s.badge}>
                    {de ? "Drevos-Original" : "Drevos original"}
                  </Text>
                </Pressable>
              ))}
          </View>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  stack: { gap: 16 },
  title: { color: "#f5f1ea", fontSize: 26, fontWeight: "600" },
  heading: { color: "#f5f1ea", fontSize: 20, fontWeight: "600" },
  body: { color: "#f5f1ea", fontSize: 17, lineHeight: 26 },
  muted: { color: "#a9b4b9", fontSize: 14, lineHeight: 21 },
  warning: { color: "#ffca96", fontSize: 16, lineHeight: 24 },
  badge: { color: "#ffad62", fontSize: 14 },
  button: {
    backgroundColor: "#ffad62",
    padding: 14,
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#172026",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: { opacity: 0.45 },
  search: {
    backgroundColor: "#1c2226",
    color: "#f5f1ea",
    borderWidth: 1,
    borderColor: "#69757e",
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    borderColor: "#343f45",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1c2226",
    paddingBottom: 12,
    gap: 8,
  },
  thumb: { width: "100%", aspectRatio: 4 / 3 },
  hero: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: "hidden",
  },
  picture: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  name: {
    color: "#f5f1ea",
    fontSize: 17,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  panel: {
    backgroundColor: "#1c2226",
    borderWidth: 1,
    borderColor: "#343f45",
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
});
