#!/usr/bin/env node
/**
 * §13.7 — Detecta diccionarios de estados (mapeos status → label/icon/color)
 * definidos fuera del registry central (src/app/core/status/status-registry.ts).
 *
 * La duplicación es la regresión más común tras cada feature: alguien copia
 * un `const LABELS = { pending: 'Pendiente', ... }` en un componente y el
 * cambio de literal en el registry no se propaga.
 *
 * Uso:
 *   node scripts/detect-status-duplication.mjs
 *
 * Exit code 0 si limpio, 1 si encuentra duplicados. La lista blanca
 * (ALLOWED_FILES) contiene el registry y sus tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');

const ALLOWED_FILES = new Set([
  'src/app/core/status/status-registry.ts',
  'src/app/core/notifications/notification-registry.ts',
]);

/**
 * Statuses reales del sistema. Si un diccionario contiene 3+ de estas claves,
 * es casi seguro un mapeo status → label duplicado.
 */
const KNOWN_STATUS_KEYS = [
  'pending', 'under_review', 'shortlisted', 'interview', 'accepted', 'rejected',
  'withdrawn', 'in_progress', 'completed', 'cancelled',
  'pending_acceptance', 'accepted', 'active', 'declined', 'disconnected',
  'waiting_anteproyecto', 'waiting_documents', 'waiting_agreement',
  'waiting_final_docs', 'waiting_sustentation', 'finalizing',
  'pending_submission', 'submitted', 'revised', 'approved', 'needs_revision',
  'draft', 'published', 'pending_approval', 'needs_changes',
];

const SUSPICIOUS_LITERALS = [
  'Pendiente', 'En revisión', 'Aceptado', 'Rechazado', 'Aprobado',
  'Cancelado', 'Completado', 'En progreso', 'Retirado',
];

/** Recorre `src/` recursivamente devolviendo rutas de .ts (no spec). */
function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.angular') continue;
      results.push(...collectFiles(p));
    } else if (entry.isFile() && p.endsWith('.ts') && !p.endsWith('.spec.ts')) {
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
  if (ALLOWED_FILES.has(rel)) continue;

  const content = fs.readFileSync(file, 'utf8');

  // Busca literales objeto con múltiples claves conocidas
  const objectPattern = /\{([^{}]{40,600})\}/g;
  let match;
  while ((match = objectPattern.exec(content)) !== null) {
    const body = match[1];
    let hits = 0;
    for (const key of KNOWN_STATUS_KEYS) {
      const re = new RegExp(`['"\`]${key}['"\`]\\s*:`);
      if (re.test(body)) hits++;
      if (hits >= 3) break;
    }
    if (hits >= 3) {
      // Contexto: nombre de la variable/constante que precede
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const line = content.slice(lineStart, match.index + 40).trim();
      findings.push({ file: rel, line, hits });
    }
  }

  // También detecta if/switch encadenados con literales sospechosos
  let literalHits = 0;
  for (const lit of SUSPICIOUS_LITERALS) {
    if (content.includes(`'${lit}'`) || content.includes(`"${lit}"`)) literalHits++;
  }
  if (literalHits >= 4) {
    findings.push({
      file: rel,
      line: `(${literalHits} literales de estado hardcodeados)`,
      hits: literalHits,
    });
  }
}

if (findings.length === 0) {
  console.log('OK — Sin diccionarios de estado fuera del registry.');
  process.exit(0);
}

console.log(`Encontrados ${findings.length} posibles duplicados de estados:\n`);
for (const f of findings) {
  console.log(`  ${f.file}`);
  console.log(`    ${f.line}`);
  console.log(`    (${f.hits} claves/literales coincidentes)\n`);
}
process.exit(1);
