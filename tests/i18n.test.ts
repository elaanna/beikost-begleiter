/**
 * Englisch (Etappe 1): Jeder feste UI-Text t('…') und jeder Text in tr()-Tabellen braucht eine Übersetzung,
 * Platzhalter {0} müssen erhalten bleiben. Gesundheits- und Sicherheitshinweise dürfen nicht stillschweigend deutsch bleiben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { EN } from '../src/i18n/en';
import { getLang, langFromLocale, setLang, t, tr } from '../src/i18n';

function files(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) files(p, out);
    else if (/\.tsx?$/.test(p) && !p.includes(`${path.sep}i18n${path.sep}`)) out.push(p);
  }
  return out;
}

function collect(): { statics: Set<string>; tables: Set<string> } {
  const statics = new Set<string>();
  const tables = new Set<string>();
  for (const file of files('src')) {
    const src = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const inTr = (n: ts.Node) => {
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n)) {
        if (/[A-Za-zÄÖÜäöüß]{2}/.test(n.text) && !/^[a-z0-9_-]+$/.test(n.text) && !n.text.startsWith('http')) tables.add(n.text);
        return;
      }
      ts.forEachChild(n, inTr);
    };
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        const a = n.arguments[0];
        if (n.expression.text === 't' && a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) statics.add(a.text);
        if (n.expression.text === 'tr') { n.arguments.forEach(inTr); return; }
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
  }
  return { statics, tables };
}

test('every static t() text has an English translation', () => {
  const { statics } = collect();
  assert.ok(statics.size > 800);
  const missing = [...statics].filter((k) => EN[k] === undefined);
  assert.deepEqual(missing, []);
});

test('every text in tr() tables has an English translation', () => {
  const missing = [...collect().tables].filter((k) => EN[k] === undefined);
  assert.deepEqual(missing, []);
});

test('placeholders survive translation', () => {
  const ph = (s: string) => (s.match(/\{\d\}/g) ?? []).sort().join();
  const broken = Object.entries(EN).filter(([de, en]) => ph(de) !== ph(en)).map(([de]) => de);
  assert.deepEqual(broken, []);
});

test('t() switches language and fills placeholders', () => {
  setLang('en');
  try {
    assert.equal(getLang(), 'en');
    assert.equal(t('Darf {0} schon …?', { 0: 'Mia' }), 'Can Mia have …?');
    assert.equal(t('Text ohne Übersetzung'), 'Text ohne Übersetzung');
    const table = tr({ a: { label: 'Gemüse', id: 'gemuese' }, list: ['Obst'] });
    assert.equal(table.a.label, 'Vegetables');
    assert.equal(table.a.id, 'gemuese');
    assert.equal(table.list[0], 'Fruit');
  } finally {
    setLang('de');
  }
  assert.equal(t('Darf {0} schon …?', { 0: 'Mia' }), 'Darf Mia schon …?');
});

test('device language: English only for English locales, otherwise German', () => {
  assert.equal(langFromLocale('en'), 'en');
  assert.equal(langFromLocale('en-GB'), 'en');
  assert.equal(langFromLocale('de-DE'), 'de');
  assert.equal(langFromLocale('fr'), 'de');
  assert.equal(langFromLocale(null), 'de');
});
