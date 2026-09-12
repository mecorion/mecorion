import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as sass from 'sass';
import postcss from 'postcss';

const src = fileURLToPath(new URL('../src/', import.meta.url));
const list = (dir, prefix = '') => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry =>
  entry.isDirectory() ? list(path.join(dir, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`]);
const sorted = values => [...new Set(values)].sort();
const results = [];

for (const version of ['v1', 'v2']) {
  const dir = path.join(src, 'styles', version);
  const files = list(dir);
  for (const file of files) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    if (file !== 'mcrn-media.scss') assert(!/@media\b/.test(text), `Media query outside mcrn-media.scss: ${version}/${file}`);
    for (const [, imported] of text.matchAll(/@(?:use|forward)\s+['"]([^'"]+)/g)) {
      assert(!imported.startsWith('..') && !imported.includes('styles-v'), `Cross-library import: ${file} -> ${imported}`);
    }
  }
  const css = postcss.parse(sass.compile(path.join(dir, 'main.scss'), {logger: sass.Logger.silent}).css);
  const selectors = [], properties = [], used = [];
  css.walkRules(rule => selectors.push(rule.selector));
  css.walkDecls(decl => {
    if (decl.prop.startsWith('--')) properties.push(decl.prop);
    for (const [, name] of decl.value.matchAll(/var\((--[\w-]+)/g)) used.push(name);
  });
  // Element Plus owns its remaining --el-* defaults; profile progress is runtime data.
  const missing = sorted(used).filter(name => !properties.includes(name) && !name.startsWith('--el-') && name !== '--profile-progress');
  assert.deepEqual(missing, [], `${version}: unresolved CSS variables`);
  const themeProperties = theme => {
    const names = [];
    postcss.parse(fs.readFileSync(path.join(dir, `mcrn-${theme}-theme.scss`), 'utf8'))
      .walkDecls(decl => { if (decl.prop.startsWith('--')) names.push(decl.prop); });
    return sorted(names);
  };
  assert.deepEqual(themeProperties('light'), themeProperties('dark'), `${version}: incomplete theme palette`);
  results.push({files, selectors: sorted(selectors), properties: sorted(properties)});
  console.log(`${version}: ${files.length} files, ${sorted(selectors).length} selectors, ${sorted(properties).length} public variables; standalone Sass compilation passed`);
}
assert.deepEqual(results[0], results[1], 'The public contracts of v1 and v2 differ');
console.log('UI library structure, themes, selectors, variables and import isolation match.');
