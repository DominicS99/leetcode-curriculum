import { isModuleTheReactPackage } from "@code-chronicles/util/browser-extensions/isModuleTheReactPackage";
import { isModuleWebCellDomRenderer } from "@code-chronicles/util/browser-extensions/isModuleWebCellDomRenderer";

import { patchJsxFactory } from "./patchJsxFactory.ts";

const jsxs = new WeakSet();

export function patchLeetCodeModule(moduleExports: unknown): unknown {
  // LeetCode uses React for its website.
  if (isModuleTheReactPackage(moduleExports) && !jsxs.has(moduleExports)) {
    jsxs.add(moduleExports);
    moduleExports.createElement = patchJsxFactory(
      // TODO: remove the any
      moduleExports.createElement as any,
    );
  }

  // LeetCode also uses a package which exposes `jsx` and `jsxs` methods,
  // seemingly https://github.com/EasyWebApp/DOM-Renderer
  if (isModuleWebCellDomRenderer(moduleExports) && !jsxs.has(moduleExports)) {
    jsxs.add(moduleExports);
    moduleExports.jsx =
      moduleExports.jsxs =
      moduleExports.jsxDEV =
        patchJsxFactory(
          // TODO: remove the any
          moduleExports.jsx as any,
        );
  }

  return moduleExports;
}
