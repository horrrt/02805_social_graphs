#!/bin/sh
# Prepare the wrapper package for the design-sync converter: the site's
# stylesheets for a new post, in the order its layout loads them (minus
# @font-face, which ships through extraFonts), one doc per component from
# src/kit/README.md, the design and writing rules as guidelines, and the
# kit's type declarations. All outputs are
# gitignored; rerun before a sync.
set -e
cd "$(dirname "$0")"
mkdir -p gen
cat ../../src/styles/type.css ../../src/styles/corridor.css ../../src/styles/post.css \
  | perl -0pe 's/\@font-face\s*\{[^}]*\}\s*//g' > gen/site.css
# Cold Read's sheets: Driver.js (its tutorial), KaTeX (its debrief formulas,
# fonts from the live site) and the game's own, all scoped to body.cold-read
# or their own classes, so they leave the corridor components alone.
cat ../../public/assets/vendor/driver.js-1.9.0.min.css >> gen/site.css
sed 's#url(fonts/#url(https://horrrt.github.io/02805_social_graphs/assets/vendor/katex-0.19.0/fonts/#g' \
  ../../public/assets/vendor/katex-0.19.0/katex.min.css >> gen/site.css
perl -0pe 's/\@font-face\s*\{[^}]*\}\s*//g' ../../src/styles/cold-read.css >> gen/site.css
node split-readme.mjs
rm -rf gen/guidelines && mkdir -p gen/guidelines
cp ../../DESIGN.md gen/guidelines/design.md
cp ../../project/POST_GUIDE.md gen/guidelines/post-guide.md
cp ../../.github/instructions/site.instructions.md gen/guidelines/site-code.md
cp ../../.github/instructions/writing.instructions.md gen/guidelines/writing.md
rm -rf types
../../node_modules/.bin/tsc -p tsconfig.json || true
test -f types/.design-sync/pkg/entry.d.ts
