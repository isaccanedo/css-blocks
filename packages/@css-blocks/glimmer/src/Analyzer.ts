
import {
  Analysis,
  AnalysisOptions,
  Analyzer,
  Block,
  BlockClass,
  BlockFactory,
} from "@css-blocks/core";
import { ResolverConfiguration } from "@glimmer/resolver";
import { AST, preprocess, traverse } from "@glimmer/syntax";
import { TemplateIntegrationOptions } from "@opticss/template-api";
import * as debugGenerator from "debug";
import * as fs from "fs";

import { ElementAnalyzer, isAnalyzedHelper, isStyleOfHelper } from "./ElementAnalyzer";
import { Resolver } from "./Resolver";
import { TEMPLATE_TYPE } from "./Template";
import { pathString } from "./utils";

export type AttributeContainer = Block | BlockClass;
export type GlimmerAnalysis = Analysis<TEMPLATE_TYPE>;

export class GlimmerAnalyzer extends Analyzer<TEMPLATE_TYPE> {
  blockFactory: BlockFactory;
  resolver: Resolver;
  debug: debugGenerator.IDebugger;
  private moduleConfig: ResolverConfiguration | undefined;

  constructor(
    blockFactory: BlockFactory,
    analysisOpts: AnalysisOptions,
    moduleConfig?: ResolverConfiguration | undefined,
  ) {
    super(blockFactory, analysisOpts);
    this.blockFactory = blockFactory;
    this.moduleConfig = moduleConfig;
    this.resolver = new Resolver(blockFactory.configuration, moduleConfig);
    this.debug = debugGenerator("css-blocks:glimmer:analyzer");
  }

  reset() {
    this.resolver = new Resolver(this.blockFactory.configuration, this.moduleConfig);
    super.reset();
    this.blockFactory.reset();
  }

  get optimizationOptions(): TemplateIntegrationOptions {
    return {
      rewriteIdents: {
        id: false,
        class: true,
        omitIdents: {
          id: [],
          class: [],
        },
      },
      analyzedAttributes: ["class"],
      analyzedTagnames: true,
    };
  }

  async analyze(dir: string, componentNames: string[]): Promise<GlimmerAnalyzer> {
    let components = new Set<string>(componentNames);
    this.debug(`Analyzing all templates starting with: ${componentNames}`);
    for (let component of components) {
      components.add(component);
      let deps = this.resolver.recursiveDependenciesForTemplate(dir, component);
      deps.forEach(c => components.add(c));
    }

    this.debug(`Analyzing all components: ${[...components].join(", ")}`);
    for (let component of components) {
      await this.analyzeTemplate(dir, component);
    }

    return this;
  }

  private async resolveBlock(dir: string, componentName: string): Promise<Block | undefined> {
    let blockFile = await this.resolver.stylesheetFor(dir, componentName);
    if (!blockFile) {
      this.debug(`Analyzing ${componentName}. No block for component. Returning empty analysis.`);
      return undefined;
    }
    if (fs.existsSync(blockFile.path)) {
      return this.blockFactory.getBlockFromPath(blockFile.path);
    } else {
      this.debug(`Analyzing ${componentName}. No block for component. Returning empty analysis.`);
      return undefined;
    }
  }

  protected async analyzeTemplate(dir: string, componentName: string): Promise<GlimmerAnalysis> {
    this.debug("Analyzing template: ", componentName);
    let template = await this.resolver.templateFor(dir, componentName);
    if (!template) {
      throw new Error(`Unable to resolve template for component ${componentName}`);
    }
    let analysis = this.newAnalysis(template);
    let ast = preprocess(template.string);
    let elementCount = 0;
    let self = this;

    // Fetch the block associated with this template. If no block file for this
    // component exists, does not exist, stop.
    this.debug("Analyzing template... resolving block ", dir, componentName);
    let block: Block | undefined = await this.resolveBlock(dir, componentName);
    if (!block) { return analysis; }

    self.debug(`Analyzing ${componentName}. Got block for component.`);

    // Add all transitive block dependencies
    let localBlockNames: string[] = [];
    block.eachBlockExport((name, refBlock) => {
      analysis.addBlock(name, refBlock);
      localBlockNames.push(name);
    });
    self.debug(`Analyzing ${componentName}. ${localBlockNames.length} blocks in scope: ${localBlockNames.join(", ")}.`);

    let elementAnalyzer = new ElementAnalyzer(analysis, this.cssBlocksOptions);
    traverse(ast, {
      MustacheStatement(node: AST.MustacheStatement) {
        if (!isAnalyzedHelper(node)) { return; }
        elementCount++;
        const forbidNonBlockAttributes = isStyleOfHelper(node);
        const atRootElement = (elementCount === 1);
        const element = elementAnalyzer.analyze(node, atRootElement, forbidNonBlockAttributes);
        if (self.debug.enabled) self.debug(`MustacheStatement {{${pathString(node)}}} analyzed:`, element.class.forOptimizer(self.cssBlocksOptions).toString());
      },

      SubExpression(node: AST.SubExpression) {
        if (!isStyleOfHelper(node)) { return; }
        elementCount++;
        const forbidNonBlockAttributes = true;
        const atRootElement = (elementCount === 1);
        const element = elementAnalyzer.analyze(node, atRootElement, forbidNonBlockAttributes);
        if (self.debug.enabled) self.debug(`SubExpression (${pathString(node)}) analyzed:`, element.class.forOptimizer(self.cssBlocksOptions).toString());
      },

      BlockStatement(node: AST.BlockStatement) {
        if (!isAnalyzedHelper(node)) { return; }
        elementCount++;
        const atRootElement = (elementCount === 1);
        const element = elementAnalyzer.analyze(node, atRootElement);
        if (self.debug.enabled) self.debug(`BlockStatement {{#${pathString(node)}}} analyzed:`, element.class.forOptimizer(self.cssBlocksOptions).toString());
      },

      ElementNode(node) {
        elementCount++;
        let atRootElement = (elementCount === 1);
        let element = elementAnalyzer.analyze(node, atRootElement);
        if (self.debug.enabled) self.debug("Element/Component analyzed:", element.class.forOptimizer(self.cssBlocksOptions).toString());
      },
    });
    return analysis;
  }
}
