import {
  TemplateAnalysis as OptimizationAnalysis,
  TemplateIntegrationOptions,
  TemplateTypes,
 } from "@opticss/template-api";
import { MultiMap } from "@opticss/util";
import * as debugGenerator from "debug";

import { BlockFactory } from "../BlockParser";
import { Block, Style } from "../BlockTree";
import { ResolvedConfiguration } from "../configuration";

import { Analysis, SerializedAnalysis } from "./Analysis";
import { TemplateValidatorOptions } from "./validations";

const debug = debugGenerator("css-blocks:analyzer");

export interface AnalysisOptions {
  validations?: TemplateValidatorOptions;
  features?: TemplateIntegrationOptions;
}

export interface SerializedAnalyzer<K extends keyof TemplateTypes> {
  analyses: SerializedAnalysis<K>[];
}

export abstract class Analyzer<K extends keyof TemplateTypes> {
  public readonly blockFactory: BlockFactory;

  public readonly validatorOptions: TemplateValidatorOptions;
  public readonly cssBlocksOptions: ResolvedConfiguration;

  protected analysisMap: Map<string, Analysis<K>>;
  protected staticStyles: MultiMap<Style, Analysis<K>>;
  protected dynamicStyles: MultiMap<Style, Analysis<K>>;
  public stylesFound: Set<Style>;

  constructor (
    blockFactory: BlockFactory,
    analysisOpts?: AnalysisOptions,
  ) {

    // TODO: Remove April 2019 when Node.js 6 is EOL'd
    if (parseInt(process.versions.node) <= 6) {
      throw new Error("CSS Blocks does not support Node.js <= 6");
    }
    this.blockFactory = blockFactory;
    this.cssBlocksOptions = blockFactory.configuration;
    this.validatorOptions = analysisOpts && analysisOpts.validations || {};
    this.analysisMap = new Map();
    this.staticStyles = new MultiMap();
    this.dynamicStyles = new MultiMap();
    this.stylesFound = new Set();
}

  abstract analyze(dir: string, entryPoints: string[]): Promise<Analyzer<K>>;
  abstract get optimizationOptions(): TemplateIntegrationOptions;

  // TODO: We don't really want to burn the world here.
  // We need more targeted Analysis / BlockFactory invalidation.
  public reset(): void {
    debug(`Resetting Analyzer.`);
    this.analysisMap = new Map();
    this.staticStyles = new MultiMap();
    this.dynamicStyles = new MultiMap();
    this.stylesFound = new Set();
    this.blockFactory.reset();
  }

  newAnalysis(info: TemplateTypes[K]): Analysis<K> {
    let analysis = new Analysis<K>(info, this.validatorOptions, (element) => {
      for (let s of element.stylesFound()) {
        this.stylesFound.add(s);
      }
      for (let s of [...element.classesFound(false), ...element.attributesFound(false)]) {
        this.staticStyles.set(s, analysis);
      }
      for (let s of [...element.classesFound(true), ...element.attributesFound(true)]) {
        this.dynamicStyles.set(s, analysis);
      }
    });
    this.analysisMap.set(info.identifier, analysis);
    return analysis;
  }

  getAnalysis(idx: number): Analysis<K> { return this.analyses()[idx]; }

  analysisCount(): number { return this.analysisMap.size; }

  eachAnalysis(cb: (v: Analysis<K>) => unknown) { this.analysisMap.forEach(cb); }

  analyses(): Analysis<K>[] {
    let analyses: Analysis<K>[] = [];
    this.eachAnalysis(a => analyses.push(a));
    return analyses;
  }

  staticCount(): number { return this.staticStyles.size; }

  dynamicCount(): number { return this.dynamicStyles.size; }

  isDynamic(style: Style): boolean { return this.dynamicStyles.has(style); }

  blockDependencies(): Set<Block> {
    let allBlocks = new Set<Block>();
    this.analysisMap.forEach(analysis => {
      allBlocks = new Set([...allBlocks, ...analysis.referencedBlocks()]);
    });
    return allBlocks;
  }

  transitiveBlockDependencies(): Set<Block> {
    let allBlocks = new Set<Block>();
    this.analysisMap.forEach(analysis => {
      allBlocks = new Set<Block>([...allBlocks, ...analysis.transitiveBlockDependencies()]);
    });
    return allBlocks;
  }

  /**
   * Iterates through all the analyses objects for all the templates and
   * creates a set of reservedClassNames here. These are used by the block
   * compiler to ensure the classnames that are output don't collide with user
   * specified style aliases.
   */
  reservedClassNames(): Set<string> {
    let allReservedClassNames = new Set<string>();
    this.analysisMap.forEach(analysis => {
      allReservedClassNames = new Set<string>([...allReservedClassNames, ...analysis.reservedClassNames()]);
    });
    return allReservedClassNames;
  }

  serialize(): SerializedAnalyzer<K> {
    let analyses: SerializedAnalysis<K>[] = [];
    this.eachAnalysis(a => {
      analyses.push(a.serialize());
    });
    return { analyses };
  }

  forOptimizer(config: ResolvedConfiguration): OptimizationAnalysis<K>[] {
    let analyses = new Array<OptimizationAnalysis<K>>();
    this.eachAnalysis(a => {
      analyses.push(a.forOptimizer(config));
    });
    return analyses;
  }

}
