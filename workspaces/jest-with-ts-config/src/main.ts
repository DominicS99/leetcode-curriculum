import path from "node:path";
import process from 'node:process'

import invariant from "invariant";

import { isStringEmptyOrWhitespaceOnly } from "@code-chronicles/util/isStringEmptyOrWhitespaceOnly";
import { spawnWithSafeStdio } from "@code-chronicles/util/spawnWithSafeStdio";

async function main(): Promise<void> {
  const workingDir = process.env.JEST_WITH_TS_CONFIG_WD;
  invariant(
    workingDir != null && !isStringEmptyOrWhitespaceOnly(workingDir),
    "Expected a working directory to be specified through the JEST_WITH_TS_CONFIG_WD environment variable.",
  );

  // TODO: nicer error when this file doesn't exist
  const { default: jestConfig } = await import(path.join(workingDir, "jest.config.ts"));

  await spawnWithSafeStdio(
    "jest",
    ["--color", "-c", JSON.stringify(jestConfig), ...process.argv.slice(2)],
    {
      stdio: "inherit",
      cwd: workingDir,
    },
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
