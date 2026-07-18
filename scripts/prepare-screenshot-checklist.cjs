const fs = require('fs');
const path = require('path');
const out = path.resolve(__dirname, '../artifacts/validation');
fs.mkdirSync(out, { recursive: true });
const report = path.join(out, 'visual-diff-report.md');
if (!fs.existsSync(report)) fs.writeFileSync(report, '# Relatório de comparação visual\n\n- [ ] home claro\n- [ ] home escuro\n- [ ] mapa claro\n- [ ] mapa escuro\n- [ ] passaporte claro\n- [ ] passaporte escuro\n\n## Desvios\n\n');
console.log(report);
