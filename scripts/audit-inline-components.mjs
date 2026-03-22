import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'app');
const threshold = Number.parseInt(process.env.INLINE_THRESHOLD ?? '10', 10);
const strictMode = process.argv.includes('--strict');

const componentFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.endsWith('.component.ts')) {
      componentFiles.push(fullPath);
    }
  }
}

function countDeclarationLines(source, key) {
  const blockRegex = new RegExp(`${key}\\s*:\\s*` + '`([\\s\\S]*?)`', 'g');
  let match;
  let maxLines = 0;

  while ((match = blockRegex.exec(source)) !== null) {
    const lines = match[1].split(/\r?\n/).length;
    if (lines > maxLines) {
      maxLines = lines;
    }
  }

  return maxLines;
}

walk(ROOT);

let templateInlineCount = 0;
let stylesInlineCount = 0;
const overThreshold = [];

for (const file of componentFiles) {
  const content = readFileSync(file, 'utf8');
  const templateLines = countDeclarationLines(content, 'template');
  const stylesLines = countDeclarationLines(content, 'styles');

  if (templateLines > 0) templateInlineCount += 1;
  if (stylesLines > 0) stylesInlineCount += 1;

  if (templateLines > threshold || stylesLines > threshold) {
    overThreshold.push({
      file: relative(process.cwd(), file).replaceAll('\\\\', '/'),
      templateLines,
      stylesLines,
    });
  }
}

console.log(`Componentes detectados: ${componentFiles.length}`);
console.log(`Con template inline: ${templateInlineCount}`);
console.log(`Con styles inline: ${stylesInlineCount}`);
console.log(`Umbral de auditoria: ${threshold} lineas`);

if (overThreshold.length) {
  console.log('\nComponentes sobre umbral:');

  for (const item of overThreshold) {
    console.log(`- ${item.file} (template: ${item.templateLines}, styles: ${item.stylesLines})`);
  }
}

if (strictMode && overThreshold.length) {
  process.exitCode = 1;
}
