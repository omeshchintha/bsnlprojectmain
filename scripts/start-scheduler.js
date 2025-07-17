import { register } from "node:module";
import { pathToFileURL } from "url";

await register("ts-node/esm", pathToFileURL("./"));

// Load the .mts scheduler
await import(pathToFileURL("./scripts/autoProcessScheduler.mts").href);
