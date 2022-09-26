import { BroccoliConcatOptions, CSSBlocksEmberOptions, getConfig } from "@css-blocks/ember-utils";
import broccoliConcat = require("broccoli-concat");
import BroccoliDebug = require("broccoli-debug");
import funnel = require("broccoli-funnel");
import mergeTrees = require("broccoli-merge-trees");
import EmberApp from "ember-cli/lib/broccoli/ember-app";
import type Addon from "ember-cli/lib/models/addon";
import type { AddonImplementation, ThisAddon } from "ember-cli/lib/models/addon";
import Project from "ember-cli/lib/models/project";

import { CSSBlocksApplicationPlugin, CSSBlocksStylesPostprocessorPlugin, CSSBlocksStylesPreprocessorPlugin } from "./broccoli-plugin";
import { appStylesPostprocessFilename, cssBlocksPostprocessFilename, optimizedStylesPostprocessFilepath } from "./utils/filepaths";
import { AddonEnvironment, CSSBlocksApplicationAddon } from "./utils/interfaces";

/**
 * An ember-cli addon for Ember applications using CSS Blocks in its
 * application code. This addon should be a dependency in Ember applications.
 *
 * This addon is responsible for bundling together all CSS Blocks content
 * from the application, concatenating it into a final artifact, and
 * optimizing its content using OptiCSS. Additionally, this addon generates a
 * JSON bundle that contains runtime data that templates need to resolve
 * what classes to add to each CSS Blocks-powered component. And, finally,
 * this addon provides a runtime helper to actually write out those classes.
 *
 * This addon expects that all intermediary blocks have already been compiled
 * into their respective Compiled CSS and Definition Files using the
 * @css-blocks/ember addon. Your app should also include this as a dependency,
 * or else this addon won't generate any CSS output!
 *
 * A friendly refresher for those that might've missed this tidbit from
 * @css-blocks/ember... CSS Blocks actually compiles its CSS as part of the
 * Template tree, not the styles tree! This is because CSS Blocks is unique
 * in how it reasons about both your templates and styles together. So, in order
 * to actually reason about both, and, in turn, rewrite your templates for you,
 * both have to be processed when building templates.
 *
 * You can read more about CSS Blocks at...
 * css-blocks.com
 *
 * And you can read up on the Ember build pipeline for CSS Blocks at...
 * <LINK_TBD>
 *
 * @todo: Provide a link for Ember build pipeline readme.
 */
const EMBER_ADDON: AddonImplementation<CSSBlocksApplicationAddon> = {
  /**
   * The name of this addon. Generally matches the package name in package.json.
   */
  name: "@css-blocks/ember-app",

  env: undefined,

  /**
   * The instance of the CSSBlocksApplicationPlugin. This instance is
   * generated during the JS tree and is needed for the CSS tree.
   */
  broccoliAppPluginInstance: undefined,

  /**
   * Initalizes this addon instance for use.
   * @param parent - The project or addon that directly depends on this addon.
   * @param project - The current project (deprecated).
   */
  init(parent, project) {
    // We must call this._super or weird stuff happens. The Ember CLI docs
    // recommend guarding this call, so we're gonna ask TSLint to chill.
    // tslint:disable-next-line: no-unused-expression
    this._super.init && this._super.init.call(this, parent, project);
    this.treePaths.app = "../runtime/app";
    this.treePaths.addon = "../runtime/addon";
  },

  _modulePrefix(): string {
    /// @ts-ignore
    const parent = this.parent;
    const config = typeof parent.config === "function" ? parent.config() || {} : {};
    const name = typeof parent.name === "function" ? parent.name() : parent.name;
    const moduleName = typeof parent.moduleName === "function" ? parent.moduleName() : parent.moduleName;
    return moduleName || parent.modulePrefix || config.modulePrefix || name || "";
  },

  getEnv(this: ThisAddon<CSSBlocksApplicationAddon>, parent: Addon | EmberApp): AddonEnvironment {
    // Fetch a reference to the parent app
    let current: Addon | Project = this;
    let app: EmberApp | undefined;
    do { app = (<Addon>current).app || app; }
    while ((<Addon>(<Addon>current).parent).parent && (current = (<Addon>current).parent));

    let isApp = parent === app;

    // The absolute path to the root of our app (aka: the directory that contains "src").
    // Needed because app root !== project root in addons – its located at `tests/dummy`.
    // TODO: Is there a better way to get this for Ember?
    let rootDir = (<Addon>parent).root || (<EmberApp>parent).project.root;

    let modulePrefix = this._modulePrefix();

    let appOptions = app!.options;
    if (!appOptions["css-blocks"]) {
      appOptions["css-blocks"] = {};
    }
    // Get CSS Blocks options provided by the application, if present.
    let config = getConfig(rootDir, app!.isProduction, <CSSBlocksEmberOptions>appOptions["css-blocks"]);

    return {
      parent,
      app: app!,
      rootDir,
      isApp,
      modulePrefix,
      config,
    };
  },

  /**
   * This method is called when the addon is included in a build. You would typically
   * use this hook to perform additional imports.
   * @param parent - The parent addon or application this addon is currently working on.
   */
  included(parent) {
    // We must call this._super or weird stuff happens.
    this._super.included.apply(this, [parent]);
    this.env = this.getEnv(parent);
  },

  /**
   * Pre-process a tree. Used for adding/removing files from the build.
   * @param type - What kind of tree.
   * @param tree - The tree that's to be processed.
   * @returns - A tree that's ready to process.
   */
  preprocessTree(type, tree) {
    let env = this.env!;

    if (type === "js") {
      if (env.isApp) {
        // we iterate over all the addons that are lazy engines and find all
        // of those that have CSS Blocks in their build and then capture their
        // template output into a special subdirectory for lazy addons so that
        // our application build can include the lazy engine's template analysis
        // and css output in the application build.
        // tslint:disable-next-line:prefer-unknown-to-any
        let lazyAddons = this.project.addons.filter((a: any) => a.lazyLoading && a.lazyLoading.enabled === true);
        let jsOutputTrees = lazyAddons.map((a) => {
          // This won't work with embroider in (at least) the case of
          // precompiled ember engines. We need the intermediate build structure
          // of the addon to include the files I output from template
          // compilation.
          let addon = a.addons.find((child) => child.name === "@css-blocks/ember");
          // tslint:disable-next-line:prefer-unknown-to-any
          return addon && (<any>addon).templateCompiler;
        }).filter(Boolean);
        let lazyOutput = funnel(mergeTrees(jsOutputTrees), {destDir: "lazy-tree-output"});
        this.broccoliAppPluginInstance = new CSSBlocksApplicationPlugin(env.modulePrefix, env.app.isProduction, [env.app.addonTree(), tree, lazyOutput], env.config);
        let debugTree = new BroccoliDebug(this.broccoliAppPluginInstance, `css-blocks:optimized`);
        return funnel(debugTree, {srcDir: env.modulePrefix, destDir: env.modulePrefix});
      } else {
        return tree;
      }
    } else if (type === "css") {
      // TODO: We shouldn't need to use a custom plugin here anymore.
      //       Refactor this to use simple broccoli filters and merges.
      //       (This means the prev. plugin becomes reponsible for putting
      //       the css file in the right directory.)
      if (!env.isApp) {
        return tree;
      }
      if (!this.broccoliAppPluginInstance) {
        // We can't do much if we don't have the result from
        // CSSBlocksApplicationPlugin. This should never happen because the JS
        // tree is processed before the CSS tree, but just in case....
        throw new Error("[css-blocks/ember-app] The CSS tree ran before the JS tree, so the CSS tree doesn't have the contents for CSS Blocks files. This shouldn't ever happen, but if it does, please file an issue with us!");
      }
      // Copy over the CSS Blocks compiled output from the template tree to the CSS tree.
      const cssBlocksContentsTree = new CSSBlocksStylesPreprocessorPlugin(env.modulePrefix, env.config, [this.broccoliAppPluginInstance, tree]);
      return new BroccoliDebug(mergeTrees([tree, cssBlocksContentsTree], { overwrite: true }), "css-blocks:css-preprocess");
    } else {
      return tree;
    }
  },

  /**
   * Post-process the tree.
   * @param type - The type of tree.
   * @param tree - The tree to process.
   * @returns - A broccoli tree.
   */
  postprocessTree(type, tree) {
    let env = this.env!;

    if (type === "css") {
      if (!env.isApp || env.config.broccoliConcat === false) {
        return tree;
      }

      // Verify there are no selector conflicts...
      // (Only for builds with optimization enabled.)
      let scannerTree;
      if (env.config.optimization.enabled) {
        scannerTree = new BroccoliDebug(
          new CSSBlocksStylesPostprocessorPlugin(env, [tree]),
          "css-blocks:css-postprocess-preconcat",
        );
      } else {
        scannerTree = tree;
      }

      // Create the concatenated file...
      const concatTree = broccoliConcat(
        scannerTree,
        buildBroccoliConcatOptions(env),
      );

      // Then overwrite the original file with our final build artifact.
      const mergedTree = funnel(mergeTrees([tree, concatTree], { overwrite: true }), {
        exclude: [
          cssBlocksPostprocessFilename(env.config),
          optimizedStylesPostprocessFilepath,
        ],
      });
      return new BroccoliDebug(mergedTree, "css-blocks:css-postprocess");
    }

    return tree;
  },
};

/**
 * Merge together default and user-provided config options to build the
 * configuration for broccoli-concat.
 * @param env - The current addon environment. Includes override configs.
 * @returns - Merged broccoli concat settings.
 */
function buildBroccoliConcatOptions(env: AddonEnvironment): BroccoliConcatOptions {
  const overrides = env.config.broccoliConcat || {};
  // The sourcemap config requires special handling because
  // things break if extensions or mapCommentType is incorrect.
  // We force these to use specific values, but defer to the
  // provided options for all other properties.
  let sourceMapConfig;
  sourceMapConfig = Object.assign(
    {},
    {
      enabled: true,
    },
    overrides.sourceMapConfig,
    {
      extensions: ["css"],
      mapCommentType: "block",
    },
  );
  // Merge, preferring the user provided options, except for
  // the sourceMapConfig, which we merged above.
  return Object.assign(
    {},
    buildDefaultBroccoliConcatOptions(env),
    env.config.broccoliConcat,
    {
      sourceMapConfig,
    },
  );
}

/**
 * Build a default broccoli-concat config, using given enviroment settings.
 * @param env - The addon environment.
 * @returns - Default broccoli-concat options, accounting for current env settings.
 */
function buildDefaultBroccoliConcatOptions(env: AddonEnvironment): BroccoliConcatOptions {
  const appCssPath = appStylesPostprocessFilename(env);
  const blocksCssPath = cssBlocksPostprocessFilename(env.config);
  return {
    inputFiles: [blocksCssPath, appCssPath],
    outputFile: appCssPath,
    sourceMapConfig: {
      enabled: true,
      extensions: ["css"],
      mapCommentType: "block",
    },
  };
}

type MaybeCSSBlocksTree = MaybeCSSBlocksTreePlugin | string;
interface MaybeCSSBlocksTreePlugin {
  _inputNodes: Array<MaybeCSSBlocksTree> | undefined;
  isCssBlocksTemplateCompiler: boolean | undefined;
}

module.exports = EMBER_ADDON;
