import { postcss } from "opticss";

import { Block } from "../../BlockTree";
import { Configuration } from "../../configuration";
import * as errors from "../../errors";
import { sourceRange } from "../../SourceLocation";

export function disallowImportant(configuration: Configuration, root: postcss.Root, block: Block, file: string): postcss.Root {
  root.walkDecls((decl) => {

    // `!important` is not allowed in Blocks. If contains `!important` declaration, throw.
    if (decl.important) {
      block.addError(new errors.InvalidBlockSyntax(
        `!important is not allowed for \`${decl.prop}\` in \`${(<postcss.Rule>decl.parent).selector}\``,
        sourceRange(configuration, root, file, decl),
      ));
    }

  });

  return root;
}
