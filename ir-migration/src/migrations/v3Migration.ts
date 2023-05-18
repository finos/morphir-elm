import { Json } from "../../src/main";

export function Migration(iRJSON: Json): Json {
  console.log("Migrating From v3 to v4");

  // migration logic

  let finalIRJSON = {
    formatVersion: iRJSON["formatVersion"] + 1,
    distribution: [],
  };

  return finalIRJSON;
}