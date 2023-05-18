import { Json } from "../../src/main";

export function Migration(iRJSON: Json): Json {
  console.log("Migrating From v1 to v2");

  // migration logic

  let finalIRJSON = {
    formatVersion: iRJSON["formatVersion"] + 1,
    distribution: [],
  };

  return finalIRJSON;
}
