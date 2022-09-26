import * as config from "@css-blocks/config";
import { AnalysisOptions, NodeJsImporter, Options as ParserOptions, OutputMode } from "@css-blocks/core";
import type { ObjectDictionary } from "@opticss/util";
import type { OptiCSSOptions } from "opticss";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Sourcemap options provided by fast-sourcemap-concat, which is used
 * by broccoli-concat to build sourcemaps. This is *not* an exhaustive
 * list, so a catch-all is provided for undocumented props if needed.
 */
export interface BroccoliConcatSourcemapOptions {
  enabled?: boolean;
  extensions?: string[];
  inline?: boolean;
  mapCommentType?: "block" | "line";
  [propName: string]: unknown;
}

/**
 * Options provided by broccoli-concat, which the ember-app plugin uses
 * to combine CSS files together during the post-process step. You can
 * use these options to control the order in which files are concatenated,
 * or other options related to concatenation.
 */
export interface BroccoliConcatOptions {
  outputFile?: string;
  header?: string;
  headerFiles?: string[];
  /**
   * The files to contatenate together during the postprocess step. Do keep
   * in mind this you'll have access only to the files in the CSS postprocess
   * tree for ember-app. You can use globs if preferred.
   *
   * Any top-level files that are processed by Ember CLI will likely be stored
   * at "assets/<name-of-file>.css". You can use a plugin such as broccoli-debug
   * to determine the structure of your styles after processing.
   *
   * Your CSS Blocks file will be available by default
   * at "assets/css-blocks.css", but will vary if the "output" property is set
   * in your CSS Blocks options.
   */
  inputFiles?: string[];
  footerFiles?: string[];
  footer?: string;
  sourceMapConfig?: BroccoliConcatSourcemapOptions;
  allowNone?: boolean;
}

export interface CSSBlocksEmberOptions {
  /**
   * The name of the CSS file generated that contains the compiled
   * result of CSS Blocks. By default, this is css-blocks.css.
   */
  output?: string;
  aliases?: ObjectDictionary<string>;
  analysisOpts?: AnalysisOptions;
  parserOpts?: Writeable<ParserOptions>;
  /**
   * Options that control the behavior of OptiCSS, which is used to
   * rewrite and optimize compiled CSS Blocks output. By default,
   * optimization is enabled for production builds only.
   *
   * To disable optimization, set optimization.enabled to false.
   */
  optimization?: Partial<OptiCSSOptions>;
  /**
   * Options that control the behavior of broccoli-concat, which is used
   * to concatenate CSS files together by ember-app during postprocess.
   *
   * If this is set to false, broccoli-concat will *not* run.
   * You'll need to add additional processing to add the CSS Blocks
   * compiled content to your final CSS build artifact.
   */
  broccoliConcat?: BroccoliConcatOptions | false;
  /**
   * List of classes that are used by application CSS and might conflict
   * with the optimizer. You should add any short class names (~5 characters)
   * to this list so the optimizer doesn't use these when building the
   * CSS Blocks compiled output.
   *
   * This is a convenience alias for
   * optimization.rewriteIdents.omitIdents.class[]. It has no effect if
   * optimization is disabled.
   */
  appClasses?: string[];
}

export interface ResolvedCSSBlocksEmberOptions {
  output: string;
  aliases: ObjectDictionary<string>;
  analysisOpts: AnalysisOptions;
  parserOpts: ParserOptions;
  optimization: Partial<OptiCSSOptions>;
  broccoliConcat: BroccoliConcatOptions | false;
  appClasses: string[];
}

export function getConfig(root: string, isProduction: boolean, options: CSSBlocksEmberOptions): ResolvedCSSBlocksEmberOptions {
  if (!options.aliases) options.aliases = {};
  if (!options.analysisOpts) options.analysisOpts = {};
  if (!options.optimization) options.optimization = {};
  if (!options.broccoliConcat) options.broccoliConcat = {};
  if (!options.appClasses) options.appClasses = [];

  if (!options.parserOpts) {
    options.parserOpts = config.searchSync(root) || {};
  }

  // Use the node importer by default.
  options.parserOpts.importer = options.parserOpts.importer || new NodeJsImporter(options.aliases);

  if (typeof options.optimization.enabled === "undefined") {
    options.optimization.enabled = isProduction;
  }

  // Update parserOpts to include the absolute path to our application code directory.
  if (!options.parserOpts.rootDir) {
    options.parserOpts.rootDir = root;
  }
  options.parserOpts.outputMode = OutputMode.BEM_UNIQUE;

  if (options.output !== undefined && typeof options.output !== "string") {
    throw new Error(`Invalid css-blocks options in 'ember-cli-build.js': Output must be a string. Instead received ${options.output}.`);
  }
  options.output = options.output || "css-blocks.css";

  return <ResolvedCSSBlocksEmberOptions>options;
}
