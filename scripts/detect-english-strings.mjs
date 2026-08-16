#!/usr/bin/env node
/**
 * §15.5 — Detecta cadenas en inglés residuales en templates y componentes.
 *
 * La app es 100% en español; cualquier literal en inglés visible al usuario
 * es un bug de traducción. Este script busca patrones comunes:
 *   - Placeholder o labels en inglés
 *   - Mensajes de estado ("Loading...", "No results", "Search...")
 *   - Botones típicos ("Save", "Cancel", "Submit", "Delete")
 *
 * Ignora imports, tipos TypeScript y CSS class names.
 *
 * Uso:
 *   node scripts/detect-english-strings.mjs
 *
 * Exit code 0 si limpio, 1 si encuentra ocurrencias.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

/**
 * Patrones que casi siempre son bug de traducción cuando aparecen entre
 * comillas o dentro de templates HTML. Sensible al contexto: solo activa
 * cuando la cadena parece dirigida al usuario.
 */
const ENGLISH_LITERALS = [
  'Loading...', 'Loading…',
  'No results', 'No results found',
  'Search...', 'Search…',
  'Save', 'Cancel', 'Submit', 'Delete', 'Edit', 'Create', 'Update',
  'Next', 'Previous', 'Back',
  'Yes', 'No',
  'Please wait',
  'An error occurred',
  'Not found',
  'Confirm', 'Confirmation',
  'Show more', 'Show less',
];

const ALLOWED_CONTEXTS = [
  /\/\/.*(?:english|inglés|hard-code|TODO|FIXME)/i,      // Comentario indica intención
  /import\s/,                                              // Línea de import
  /:\s*['"](?:english|en-US|en)['"]/,                     // Locale
];

/** Recursivamente lista .ts y .html bajo src/ ignorando spec y node_modules. */
function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.angular') continue;
      results.push(...collectFiles(p));
    } else if (entry.isFile()
      && (p.endsWith('.ts') || p.endsWith('.html'))
      && !p.endsWith('.spec.ts')) {
      results.push(p);
    }
  }
  return results;
}

function relativePath(abs) {
  return path.relative(projectRoot, abs).replace(/\\/g, '/');
}

const findings = [];

for (const file of collectFiles(srcRoot)) {
  const rel = relativePath(file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOWED_CONTEXTS.some((re) => re.test(line))) continue;

    for (const literal of ENGLISH_LITERALS) {
      const patterns = [
        new RegExp(`['"\`]${literal}['"\`]`),                            // 'Save'
        new RegExp(`>\\s*${literal}\\s*<`),                              // >Save<
        new RegExp(`placeholder=['"]${literal}['"]`, 'i'),               // placeholder="Search"
        new RegExp(`(?:matLabel|matPlaceholder)="${literal}"`, 'i'),
      ];
      if (patterns.some((re) => re.test(line))) {
        findings.push({ file: rel, line: i + 1, text: line.trim(), match: literal });
        break;
      }
    }
  }
}

if (findings.length === 0) {
  console.log('OK — Sin cadenas en inglés detectadas.');
  process.exit(0);
}

console.log(`Encontradas ${findings.length} cadenas en inglés:\n`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}`);
  console.log(`    [${f.match}] ${f.text.substring(0, 100)}`);
  console.log();
}
process.exit(1);
