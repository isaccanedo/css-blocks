import * as debugGenerator from "debug";
import { postcss } from "opticss";

import { Block } from "../BlockTree";
import { Options, ResolvedConfiguration, resolveConfiguration } from "../configuration";
import { CssBlockError } from "../errors";
import { FileIdentifier } from "../importing";

import { builders } from "./ast";
import { addPresetSelectors } from "./features/add-preset-selectors";
import { assertForeignGlobalAttribute } from "./features/assert-foreign-global-attribute";
import { composeBlock } from "./features/composes-block";
import { constructBlock } from "./features/construct-block";
import { disallowDefinitionRules } from "./features/disallow-dfn-rules";
import { disallowImportant } from "./features/disallow-important";
import { discoverGuid } from "./features/discover-guid";
import { discoverName } from "./features/discover-name";
import { exportBlocks, exportBlocksSync } from "./features/export-blocks";
import { extendBlock } from "./features/extend-block";
import { globalAttributes } from "./features/global-attributes";
import { implementBlock } from "./features/implement-block";
import { importBlocks, importBlocksSync } from "./features/import-blocks";
import { processDebugStatements } from "./features/process-debug-statements";
import { BlockFactory } from "./index";
import { BlockFactorySync } from "./index";
import { Syntax } from "./preprocessing";
import { gen_guid } from "./utils/genGuid";

const debug = debugGenerator("css-blocks:BlockParser");

export interface ParsedSource {
  identifier: FileIdentifier;
  defaultName: string;
  originalSource: string;
  originalSyntax: Syntax;
  parseResult: postcss.Root;
  dependencies: string[];
}

/**
 * Parser that, given a PostCSS AST will return a `Block` object. Main public
 * interface is `BlockParser.parse`.
 */
export class BlockParser {
  private config: ResolvedConfiguration;
  private factory: BlockFactory | BlockFactorySync;

  constructor(opts: Options, factory: BlockFactory | BlockFactorySync) {
    this.config = resolveConfiguration(opts);
    this.factory = factory;
  }

  public async parseSource(source: ParsedSource): Promise<Block> {
    let root = source.parseResult;
    let block = await this.parse(root, source.identifier, source.defaultName);
    for (let dependency of source.dependencies) {
      block.addDependency(dependency);
    }
    return block;
  }

  public parseSourceSync(source: ParsedSource): Block {
    let root = source.parseResult;
    let block = this.parseSync(root, source.identifier, source.defaultName);
    for (let dependency of source.dependencies) {
      block.addDependency(dependency);
    }
    return block;
  }

  public async parseDefinitionSource(root: postcss.Root, identifier: string, expectedId: string, defaultName: string): Promise<Block> {
    return await this.parse(root, identifier, defaultName, true, expectedId);
  }

  public parseDefinitionSourceSync(root: postcss.Root, identifier: string, expectedId: string, defaultName: string): Block {
    return this.parseSync(root, identifier, defaultName, true, expectedId);
  }

  /**
   * Main public interface of `BlockParser`. Given a PostCSS AST, returns a promise
   * for the new `Block` object.
   * @param root - PostCSS AST
   * @param sourceFile - Source file name
   * @param name - Name of block
   * @param isDfnFile - Whether the block being parsed is a definition file. Definition files are incomplete blocks
   *                    that will need to merge in rules from its Compiled CSS later. They are also expected to declare
   *                    additional properties that regular Blocks don't, such as `block-id`.
   * @param expectedGuid - If a GUID is defined in the file, it's expected to match this value. This argument is only
   *                       relevant to definition files, where the definition file is linked to Compiled CSS and
   *                       both files may declare a GUID.
   */
  public async parse(root: postcss.Root, identifier: string, name: string, isDfnFile = false, expectedGuid?: string): Promise<Block> {
    let importer = this.config.importer;
    let debugIdent = importer.debugIdentifier(identifier, this.config);
    let sourceFile = importer.filesystemPath(identifier, this.config) || debugIdent;
    let configuration = this.factory.configuration;
    debug(`Begin parse: "${debugIdent}" which ${isDfnFile ? "is" : "is not"} a definition file.`);

    // Discover the block's preferred name.
    let nameDiscoveryError: CssBlockError | undefined;
    try {
      name = discoverName(configuration, root, sourceFile, isDfnFile, name);
    } catch (e) {
      nameDiscoveryError = e;
    }

    // Discover, or generate, the block's GUID.
    let guid: string;
    let guidDiscoveryError: CssBlockError | undefined;
    try {
      guid = discoverGuid(configuration, root, sourceFile, isDfnFile, expectedGuid) || gen_guid(identifier, configuration.guidAutogenCharacters);
    } catch (e) {
      guidDiscoveryError = e;
      guid = gen_guid(identifier, configuration.guidAutogenCharacters);
    }

    // Create our new Block object and save reference to the raw AST.
    let block = new Block(name, identifier, guid, root);
    block.blockAST = builders.root();

    // Add any errors that surfaced during name and GUID discovery.
    if (nameDiscoveryError) {
      block.addError(nameDiscoveryError);
    }
    if (guidDiscoveryError) {
      block.addError(guidDiscoveryError);
    }

    if (!isDfnFile) {
      // If not a definition file, it shouldn't have rules that can
      // only be in definition files.
      debug(" - Disallow Definition-Only Declarations");
      disallowDefinitionRules(block, configuration, root, sourceFile);
    }
    // Throw if we encounter any `!important` decls.
    disallowImportant(configuration, root, block, sourceFile);
    // Discover and parse all block references included by this block.
    await importBlocks(block, this.factory, sourceFile);
    // Export all exported block references from this block.
    await exportBlocks(block, this.factory, sourceFile);
    // Handle any global attributes defined by this block.
    globalAttributes(configuration, root, block, sourceFile);
    // Parse all block styles and build block tree.
    constructBlock(configuration, root, block, debugIdent);
    // Verify that external blocks referenced have been imported, have defined the attribute being selected, and have marked it as a global state.
    assertForeignGlobalAttribute(configuration, root, block, debugIdent);
    // Construct block extensions and validate.
    extendBlock(configuration, root, block, debugIdent);
    // Validate that all required Styles are implemented.
    implementBlock(configuration, root, block, debugIdent);
    // Register all block compositions.
    composeBlock(configuration, root, block, debugIdent);
    // Log any debug statements discovered.
    processDebugStatements(root, block, debugIdent, this.config);

    // These rules are only relevant to definition files. We run these after we're
    // basically done reconstituting the block.
    if (isDfnFile) {
      // Find any block-class rules and override the class name of the block with its value.
      debug(" - Process Preset Block Classes");
      addPresetSelectors(configuration, root, block, debugIdent);
      // TODO: Process inherited-styles?
    }

    // Return our fully constructed block.
    debug(` - Complete`);

    return block;
  }

  /**
   * Main public interface of `BlockParser`. Given a PostCSS AST, returns a
   * new `Block` object if the block hasn't yet been parsed, or the existing block if it has.
   *
   * @param root - PostCSS AST
   * @param sourceFile - Source file name
   * @param name - Name of block
   * @param isDfnFile - Whether the block being parsed is a definition file. Definition files are incomplete blocks
   *                    that will need to merge in rules from its Compiled CSS later. They are also expected to declare
   *                    additional properties that regular Blocks don't, such as `block-id`.
   * @param expectedGuid - If a GUID is defined in the file, it's expected to match this value. This argument is only
   *                       relevant to definition files, where the definition file is linked to Compiled CSS and
   *                       both files may declare a GUID.
   */
  public parseSync(root: postcss.Root, identifier: string, name: string, isDfnFile = false, expectedGuid?: string): Block {
    let importer = this.config.importer;
    let debugIdent = importer.debugIdentifier(identifier, this.config);
    let sourceFile = importer.filesystemPath(identifier, this.config) || debugIdent;
    let configuration = this.factory.configuration;
    if (!this.factory.isSync) {
      throw new CssBlockError("Configuration Error: an async factory was provided for a synchronous method call.");
    }
    debug(`Begin parse: "${debugIdent}" which ${isDfnFile ? "is" : "is not"} a definition file.`);

    // Discover the block's preferred name.
    let nameDiscoveryError: CssBlockError | undefined;
    try {
      name = discoverName(configuration, root, sourceFile, isDfnFile, name);
    } catch (e) {
      nameDiscoveryError = e;
    }

    // Discover, or generate, the block's GUID.
    let guid: string;
    let guidDiscoveryError: CssBlockError | undefined;
    try {
      guid = discoverGuid(configuration, root, sourceFile, isDfnFile, expectedGuid) || gen_guid(identifier, configuration.guidAutogenCharacters);
    } catch (e) {
      guidDiscoveryError = e;
      guid = gen_guid(identifier, configuration.guidAutogenCharacters);
    }

    // Create our new Block object and save reference to the raw AST.
    let block = new Block(name, identifier, guid, root);
    block.blockAST = builders.root();

    // Add any errors that surfaced during name and GUID discovery.
    if (nameDiscoveryError) {
      block.addError(nameDiscoveryError);
    }
    if (guidDiscoveryError) {
      block.addError(guidDiscoveryError);
    }

    if (!isDfnFile) {
      // If not a definition file, it shouldn't have rules that can
      // only be in definition files.
      disallowDefinitionRules(block, configuration, root, sourceFile);
    }
    // Throw if we encounter any `!important` decls.
    disallowImportant(configuration, root, block, sourceFile);
    // Discover and parse all block references included by this block.
    importBlocksSync(block, this.factory, sourceFile);
    // Export all exported block references from this block.
    exportBlocksSync(block, this.factory, sourceFile);
    // Handle any global attributes defined by this block.
    globalAttributes(configuration, root, block, sourceFile);
    // Parse all block styles and build block tree.
    constructBlock(configuration, root, block, debugIdent);
    // Verify that external blocks referenced have been imported, have defined the attribute being selected, and have marked it as a global state.
    assertForeignGlobalAttribute(configuration, root, block, debugIdent);
    // Construct block extensions and validate.
    extendBlock(configuration, root, block, debugIdent);
    // Validate that all required Styles are implemented.
    implementBlock(configuration, root, block, debugIdent);
    // Register all block compositions.
    composeBlock(configuration, root, block, debugIdent);
    // Log any debug statements discovered.
    processDebugStatements(root, block, debugIdent, this.config);

    // These rules are only relevant to definition files. We run these after we're
    // basically done reconstituting the block.
    if (isDfnFile) {
      // Find any block-class rules and override the class name of the block with its value.
      addPresetSelectors(configuration, root, block, debugIdent);
      // TODO: Process inherited-styles?
    }

    return block;
  }
}
