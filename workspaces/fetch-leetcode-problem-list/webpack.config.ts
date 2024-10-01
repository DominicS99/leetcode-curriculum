import { chmod } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";

import {
  BannerPlugin,
  type Compiler,
  type Configuration,
  type ExternalItemFunctionData,
} from "webpack";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

import { stripPrefix } from "@code-chronicles/util/stripPrefix";
import { stripPrefixOrThrow } from "@code-chronicles/util/stripPrefixOrThrow";

import packageJson from "./package.json" with { type: "json" };

class WebpackMakeOutputExecutablePlugin {
  // eslint-disable-next-line class-methods-use-this -- This is the interface expected by webpack.
  apply(compiler: Compiler): void {
    compiler.hooks.afterEmit.tapPromise(
      "WebpackMakeOutputExecutablePlugin",
      async (compilation) => {
        const promises: Promise<void>[] = [];

        for (const chunk of compilation.chunks) {
          if (!chunk.canBeInitial()) {
            continue;
          }

          for (const file of chunk.files) {
            promises.push(
              chmod(
                path.join(compilation.outputOptions.path ?? ".", file),
                0o755,
              ),
            );
          }
        }

        await Promise.all(promises);
      },
    );
  }
}

const config: Configuration = {
  target: "node",
  entry: path.resolve(__dirname, packageJson.exports),
  output: {
    filename:
      stripPrefixOrThrow(packageJson.name, "@code-chronicles/") + ".cjs",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: /\bnode_modules\b/,
      },
    ],
  },

  resolve: {
    conditionNames: ["import"],
  },

  externalsType: "commonjs",
  externals: ({ request }: ExternalItemFunctionData) =>
    Promise.resolve(
      request != null &&
        (builtinModules.includes(request) ||
          builtinModules.includes(stripPrefix(request, "node:")))
        ? request
        : undefined,
    ),

  plugins: [
    new BannerPlugin({
      banner: "#!/usr/bin/env node\n",
      raw: true,
      entryOnly: true,
    }),

    new WebpackMakeOutputExecutablePlugin(),

    new ForkTsCheckerWebpackPlugin(),
  ],
};

export default config;
