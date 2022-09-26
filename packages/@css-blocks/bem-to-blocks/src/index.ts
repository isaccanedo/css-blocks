import * as fs from "fs-extra";
import * as path from "path";
import * as postcss from "postcss";
import * as selectorParser from "postcss-selector-parser";
import * as vars from "postcss-simple-vars";

import { BemSelector, BlockClassSelector, SelectorBemObject } from "./interface";
import { getBemNamesFromUser } from "./userInput";
import { findLcsMap } from "./utils";
export declare type PostcssAny = unknown;

type BemSelectorMap = Map<string, BemSelector>;
type ElementToBemSelectorMap = Map<string, BemSelector[]>;
type BlockToBemSelectorMap  = Map<string, ElementToBemSelectorMap>;
type BemToBlockClassMap  = WeakMap<BemSelector, BlockClassSelector>;

const EMPTY_ELEMENT_PLACEHOLDER = "EMPTY-ELEMENT-PLACEHOLDER";

export async function convertBemToBlocks(files: Array<string>): Promise<void> {
  for (let file of files) {
    let fileName = path.relative(process.cwd(), file);
    let css = fs.readFileSync(file, "utf-8");
    let result = await processBEMContents(fileName, css);
    const parsedFilePath = path.parse(file);
    const blockFilePath = Object.assign(parsedFilePath, {ext: `.block${parsedFilePath.ext}`, base: undefined} );
    await fs.writeFile(path.format(blockFilePath), result);
  }
}

export async function processBEMContents(fileName: string, css: string): Promise<string> {
    let processor = postcss([
      // Using postcss-simple-vars to pass the fileName to the plugin
      vars({
        variables: () => { return { fileName }; },
      }),
      bemToBlocksPlugin,
    ]);
    let result = await processor.process(css, { from: fileName});
    return result.toString();
}

/**
 * Iterates through a cache of bemSelectors and returns a map of bemSelector to
 * the blockClassName. This function optimises the states and subStates from the
 * name of the modifier present in the BEM selector
 * @param bemSelectorCache weakmap - BemSelectorMap
    BemSelector {
      block: 'jobs-hero',
      element: 'image-container',
      modifier: undefined }
    =>
    BlockClassName {
      class: // name of the element if present. If this is not present, then it is on the :scope
      state: // name of the modifiers HCF
      subState: // null if HCF is null
    }, // written to a file with blockname.block.css
 */
export function constructBlocksMap(bemSelectorCache: BemSelectorMap): BemToBlockClassMap {
  let blockListMap: BlockToBemSelectorMap = new Map();
  let resultMap: BemToBlockClassMap = new WeakMap();

  // create the resultMap and the blockListMap
  for (let bemSelector of bemSelectorCache.values()) {
    // create the new blockClass instance
    let blockClass: BlockClassSelector = new BlockClassSelector();
    if (bemSelector.element) {
      blockClass.class = bemSelector.element;
    }
    if (bemSelector.modifier) {
      blockClass.state = bemSelector.modifier;
      if (blockClass.state.match(/^is-/)) {
        blockClass.state = blockClass.state.substring(3);
      }
    }
    // add this blockClass to the resultMap
    resultMap.set(bemSelector, blockClass);

    // add this selector to the blockList based on the block, and then the
    // element value
    let block = blockListMap.get(bemSelector.block);
    if (block) {
      if (bemSelector.element) {
        if (block.has(bemSelector.element)) {
          (block.get(bemSelector.element) as BemSelector[]).push(bemSelector);
        } else {
          block.set(bemSelector.element, new Array(bemSelector));
        }
      } else {
        // the modifier is on the block itself
        if (block.has(EMPTY_ELEMENT_PLACEHOLDER)) {
          (block.get(EMPTY_ELEMENT_PLACEHOLDER) as BemSelector[]).push(bemSelector);
        } else {
          block.set(EMPTY_ELEMENT_PLACEHOLDER, new Array(bemSelector));
        }
      }
    } else {
      // if there is no existing block, create the elementMap and the add it to
      // the blockMap
      let elementListMap = new Map();
      if (bemSelector.element) {
        elementListMap.set(bemSelector.element, new Array(bemSelector));
      } else {
        elementListMap.set(EMPTY_ELEMENT_PLACEHOLDER, new Array(bemSelector));
      }
      blockListMap.set(bemSelector.block, elementListMap);
    }
  }

  // optimize the blocks for sub-states, iterate through the blocks
  for (let elementListMap of blockListMap.values()) {
    // iterate through the elements
    for (let selList of elementListMap.values()) {
      let lcsMap: {[key: string]: string};
      // find the longest common substring(LCS) in the list of selectors
      let modifiers = selList.length && selList.filter(sel => sel.modifier !== undefined);
      if (modifiers) {
        if (modifiers.length > 1) {
          lcsMap = findLcsMap(modifiers.map(sel => sel.modifier as string));

          // update the states and substates with the LCS
          modifiers.forEach(sel => {
            let blockClass = resultMap.get(sel);
            let lcs = blockClass && blockClass.state && lcsMap[blockClass.state];
            if (blockClass && blockClass.state && lcs) {
              blockClass.subState = blockClass.state.replace(`${lcs}-`, "");
              blockClass.state = lcs.replace(/-$/, "");
            }
          });
        }
      }
    }
  }
  // TODO: detect if there is a scope node, if not create a new empty scope node
  return resultMap;
}

/**
 * PostCSS plugin for transforming BEM to CSS blocks
 */
export const bemToBlocksPlugin: postcss.Plugin<PostcssAny> = postcss.plugin("bem-to-blocks-plugin", (options) => {
  options = options || {};

  return async (root, result) => {
    let fileNameObject = result.messages.find(varObj => {return varObj.name === "fileName"; });
    let fileName = fileNameObject ? fileNameObject.value : undefined;

    const bemSelectorCache: BemSelectorMap = new Map();

    const buildCache: selectorParser.ProcessorFn = async (selectors) => {
      let promises: Promise<SelectorBemObject>[] = [];

      selectors.walk((selector) => {
        // only iterate through classes
        if (selectorParser.isClassName(selector)) {
          try {
            let bemSelector = new BemSelector(selector.value);
            if (bemSelector.block) {
              // add it to the cache so it's available for the next pass
              bemSelectorCache.set(selector.value, bemSelector);
            }
          } catch (e) {
            // if the selector does not have a block value, get it from the user
            promises.push(getBemNamesFromUser(selector.value, fileName));
            // if (selector.parent) {
            //   selector.parent.insertBefore(selector, parser.comment({value: `ERROR: ${e.message}`, spaces: {before: "/* ", after: " */\n"}}));
            // }
          }
        }
      });

      // wait for all the user input
      let answers = await Promise.all(promises);

      // add all the user defined blocks to the cache
      for (let userBem of answers) {
        let selector = userBem.selector;
        bemSelectorCache.set(selector, new BemSelector(selector, userBem.bemObj));
      }
    };

    const rewriteSelectors: selectorParser.ProcessorFn = (selectors) => {

      selectors.walk((selector) => {
        // we only need to modify class names. We can ignore everything else,
        // like existing attributes, pseudo selectors, comments, imports,
        // exports, etc
        if (selectorParser.isClassName(selector)) {

          let bemSelector = bemSelectorCache.get(selector.value);
          // get the block class from the bemSelector
          let blockClassName = bemSelector && bemToBlockClassMap.get(bemSelector);

          // if the selector was previously cached
          if (blockClassName) {
            let stripSelector = false;

            if (blockClassName.class) {
              selector.value =  blockClassName.class;
            } else {
              //prepend a :scope node before this and remove this node later
              let newScopeNode = selectorParser.pseudo({
                value: ":scope",
              });
              selector.parent!.insertBefore(selector, newScopeNode);
              stripSelector = true;
            }

            if (blockClassName.state) {
              let newAttrNode = selectorParser.attribute({
                attribute: blockClassName.state,
                quoteMark: blockClassName.subState ? '"' : undefined,
                operator: blockClassName.subState ? "=" : undefined,
                value: blockClassName.subState,
                // the API for postcss-selector-parser mentions raws to be
                // deprecated when used with quoteMark but that didn't work as
                // expected. Keeping quoteMark and raws until it is fixed.
                raws: {value: blockClassName.subState ? `"${blockClassName.subState}"` : undefined},
              });

              // insert this new node after the current node
              selector.parent!.insertAfter(selector, newAttrNode);
            }

            // strip the selector in the end if we replaced it with a pseudoclass
            if (stripSelector) {
              selector.remove();
            }
          }
        }
      });
      return selectors.toString();
    };

    // in this pass, we collect all the selectors
    let bemToBlockClassMap: BemToBlockClassMap;

    let buildCachePromises: unknown[] = [];
    root.walkRules(async (rule) => {
      buildCachePromises.push(selectorParser(buildCache).process(rule));
    });
    await Promise.all(buildCachePromises);

    // convert selectors to block selectors
    bemToBlockClassMap = constructBlocksMap(bemSelectorCache);

    // rewrite into a CSS block
    root.walkRules(rule => {
      rule.selector = selectorParser(rewriteSelectors).processSync(rule.selector);
    });

    result.root = root;
  };
});
