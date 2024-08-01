import type { SourceFile as TSSourceFile } from "ts-morph";

import { getCodeAt } from "./getCodeAt";
import { getLeadingTriviaRange } from "./getLeadingTriviaRange";
import { getTrailingTriviaRange } from "./getTrailingTriviaRange";

export function getTrivia(sourceFile: TSSourceFile): [number, number][] {
  const set = new Set<string>();

  sourceFile.forEachDescendant((node) => {
    for (const range of [
      getLeadingTriviaRange(node),
      getTrailingTriviaRange(node),
    ]) {
      const key = range.join(" ");
      if (set.has(key)) {
        continue;
      }

      const text = getCodeAt(sourceFile, range).trim();
      if (text.length > 0) {
        set.add(key);
      }
    }
  });

  return [...set].map((key) => key.split(" ").map(Number) as [number, number]);
}
