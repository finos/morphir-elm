import { Json } from "../../src/main";

export function Migration(iRJSON: Json): Json {
  console.log("Migrating From v2 to v3");

  // migration logic

  let finalIRJSON = {
    formatVersion: iRJSON["formatVersion"] + 1,
    distribution: [],
  };

  return finalIRJSON;
}