const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const globalRoot = cp.execSync('npm root -g').toString().trim();
const ts = require(path.join(globalRoot, 'typescript/lib/typescript.js'));
const root = path.resolve(__dirname, '../apps/mobile');
let failures = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      const source = fs.readFileSync(file, 'utf8');
      let out;
      try { out = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true, fileName: file }); } catch (error) { failures += 1; console.error('TRANSPILE FAILURE', file, error.message); continue; }
      for (const diagnostic of out.diagnostics || []) { failures += 1; console.error(file, ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')); }
    }
  }
}
walk(root);
if (failures) process.exit(1);
console.log('TypeScript/TSX syntax OK');
