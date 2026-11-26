import AsyncStorage from "@react-native-async-storage/async-storage";
import catalog from "../public/recipes/catalog.json";
import { createCatalogClient } from "./catalogClient";
import { replaceRecipes } from "./recipes";

export const recipeCatalog = createCatalogClient({
  fallback: catalog,
  store: AsyncStorage,
});
recipeCatalog.subscribe((state) => replaceRecipes(state.catalog));
