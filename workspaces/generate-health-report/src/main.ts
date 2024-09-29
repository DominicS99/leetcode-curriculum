import { writeFile } from "node:fs/promises";
import process from "node:process";

import nullthrows from "nullthrows";

import { assertIsRunningInCI } from "@code-chronicles/util/assertIsRunningInCI";
import { runWithLogGroupAsync } from "@code-chronicles/util/runWithLogGroupAsync";
import { getCurrentGitRepositoryRoot } from "@code-chronicles/util/getCurrentGitRepositoryRoot";
import { maybeThrow } from "@code-chronicles/util/maybeThrow";
import { spawnWithSafeStdio } from "@code-chronicles/util/spawnWithSafeStdio";

const COMMANDS = [
  "yarn workspace @code-chronicles/adventure-pack build-app",
  "yarn workspace @code-chronicles/adventure-pack build-chrome-extension",
  "yarn workspace @code-chronicles/fetch-leetcode-problem-list build",
  "yarn workspace @code-chronicles/fetch-recent-accepted-leetcode-submissions build",
  "yarn workspace @code-chronicles/leetcode-zen-mode build",
  "yarn workspace @code-chronicles/post-leetcode-potd-to-discord build",
];

async function main(): Promise<void> {
  assertIsRunningInCI();

  const outputPath = nullthrows(
    process.env.GITHUB_STEP_SUMMARY,
    "Missing the GITHUB_STEP_SUMMARY environment variable!",
  );

  process.chdir(await getCurrentGitRepositoryRoot());

  // TODO: prevent stray annotations from being generated by command output

  const summary = ["# PR Health Report\n\n"];
  const errors: unknown[] = [];

  for (const command of COMMANDS) {
    // eslint-disable-next-line no-await-in-loop
    await spawnWithSafeStdio("git", ["reset", "--hard", "HEAD"]);
    // eslint-disable-next-line no-await-in-loop
    await spawnWithSafeStdio("git", ["clean", "-fd"]);

    // eslint-disable-next-line no-await-in-loop
    await runWithLogGroupAsync(`Running: ${command}`, async () => {
      try {
        await spawnWithSafeStdio("bash", ["-c", command + " 1>&2"]);
        summary.push(` * \`${command}\`: ✅\n`);
      } catch (err) {
        console.error(err);
        errors.push(err);
        summary.push(` * \`${command}\`: ❌\n`);
      }
    });
  }

  await writeFile(outputPath, summary.join(""), { encoding: "utf8" });

  maybeThrow(errors);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
