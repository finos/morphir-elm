#!/usr/bin/env bun
//MISE description="Check out the pinned finos/morphir-moonbit modules into moonbit/.deps"

import { $, join, log, rm, existsSync } from "../_lib.ts";
import { MOONBIT_DIR } from "./_moon.ts";
import pinFile from "../../../moonbit/deps.toml";
import { parsePin, planDepsFetch, type Checkout } from "../../../moonbit/tooling/deps.ts";

const pin = parsePin(pinFile["morphir-moonbit"]);
const checkout = join(MOONBIT_DIR, ".deps", "morphir-moonbit");

async function current(): Promise<Checkout | null> {
  if (!existsSync(join(checkout, ".git"))) return null;
  try {
    const commit = (await $`git -C ${checkout} rev-parse HEAD`.quiet().text()).trim();
    const paths = (await $`git -C ${checkout} sparse-checkout list`.quiet().text())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return { commit, paths };
  } catch {
    return null;
  }
}

if (planDepsFetch(await current(), pin) === "skip") {
  log("moonbit:deps", `Checkout is current at ${pin.commit}`);
} else {
  log("moonbit:deps", `Fetching ${pin.repository} at ${pin.commit}`);
  await rm(checkout, { recursive: true, force: true });
  await $`git init -q ${checkout}`;
  await $`git -C ${checkout} remote add origin ${pin.repository}`;
  await $`git -C ${checkout} sparse-checkout set --cone ${pin.paths}`;
  await $`git -C ${checkout} fetch -q --depth 1 --no-tags origin ${pin.commit}`;
  await $`git -C ${checkout} -c advice.detachedHead=false checkout -q --detach FETCH_HEAD`;
  const fetched = (await $`git -C ${checkout} rev-parse HEAD`.quiet().text()).trim();
  if (fetched !== pin.commit) {
    throw new Error(`moonbit:deps: checked out ${fetched}, expected ${pin.commit}`);
  }
  log("moonbit:deps", `Checked out ${pin.paths.length} paths`);
}
