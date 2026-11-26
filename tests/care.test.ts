import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drinkStage, ironWeek, revisitFoods } from '../src/domain/care';
import { doctorReportHtml } from '../src/domain/pdf';
import type { Child, FoodLog } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Mia', birthDate: '2026-04-01', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-09-01', exclusions: [], excludedFoods: [],
};
let n = 0;
const log = (foodId: string, date: string, extra: Partial<FoodLog> = {}): FoodLog => ({
  id: `l${n++}`, childId: 'c1', foodId, date, liking: 0, reaction: 'keine', note: '', ...extra,
});

test('Mal wieder anbieten: erst ab 10 Tagen, Lieblinge zuerst', () => {
  const logs = [log('karotte', '2026-11-01'), log('kuerbis', '2026-11-10', { liking: 1 }), log('pastinake', '2026-11-20')];
  assert.deepEqual(revisitFoods(child, logs, '2026-11-26').map((r) => r.foodId), ['kuerbis', 'karotte']);
  assert.equal(revisitFoods(child, logs, '2026-11-26')[1].daysSince, 25);
});

test('Mal wieder anbieten: nie nach Reaktion oder bei Ausschluss', () => {
  const logs = [log('ei', '2026-11-01'), log('ei', '2026-11-02', { reaction: 'haut' }), log('lachs', '2026-11-01')];
  assert.deepEqual(revisitFoods(child, logs, '2026-11-26').map((r) => r.foodId), ['lachs']);
  assert.equal(revisitFoods({ ...child, exclusions: ['fisch'] }, logs, '2026-11-26').length, 0);
});

test('Eisenreich-Übersicht: zählt Tage mit Fleisch, Fisch oder eisenreichem Getreide, ohne Bewertung', () => {
  const logs = [
    log('rind', '2026-11-20'), log('lachs', '2026-11-21'), log('hafer', '2026-11-22'),
    log('pastinake', '2026-11-23'), log('huhn', '2026-11-24'), log('hirse', '2026-11-26'),
    log('rind', '2026-11-10'),
  ];
  const w = ironWeek(child, logs, '2026-11-26');
  assert.equal(w.days, 5);
  assert.equal('level' in w, false);
  assert.equal(w.perDay.length, 7);
  assert.equal(ironWeek(child, [log('pastinake', '2026-11-26')], '2026-11-26').active, false);
});

test('Trinken: Wasser ab dem dritten Brei, Kuhmilch ab 12 Monaten', () => {
  assert.equal(drinkStage(child, '2026-10-01'), 'noch_nicht');
  assert.equal(drinkStage(child, '2026-11-05'), 'wasser');
  assert.equal(drinkStage(child, '2027-04-02'), 'kuhmilch');
});

test('Kinderarzt-Bericht: enthält Reaktionen, Allergene und Probiertes', () => {
  const logs = [log('ei', '2026-10-01'), log('erdnuss', '2026-10-10', { reaction: 'haut', note: 'Quaddeln' }), log('karotte', '2026-09-02', { liking: 1 })];
  const html = doctorReportHtml(child, logs, [], '2026-11-26');
  assert.match(html, /Beikost-Bericht: Mia/);
  assert.match(html, /Quaddeln/);
  assert.match(html, /Hühnerei/);
  assert.match(html, /Karotte ♥/);
  assert.match(html, /ersetzen keine ärztliche/);
});

import { formatMonth, recentMonths } from '../src/domain/dates';

test('Geburtsmonat: Monatsmitte als Stellvertreter, Jahreswechsel korrekt', () => {
  const m = recentMonths('2026-02-10', 4);
  assert.deepEqual(m.map((x) => x.iso), ['2026-02-15', '2026-01-15', '2025-12-15', '2025-11-15']);
  assert.equal(formatMonth('2026-06-15'), 'Juni 2026');
});

import { readFileSync } from 'node:fs';
import { cleanWish, isMedicalQuery, validatePicks } from '../src/ai/guard';

test('KI-Schutz: medizinische Anfragen werden erkannt', () => {
  assert.equal(isMedicalQuery('schnell und ohne Ofen'), false);
  assert.equal(isMedicalQuery('mein Baby hat Ausschlag nach Ei'), true);
  assert.equal(isMedicalQuery('was hilft bei Verstopfung'), true);
});

test('KI-Schutz: nur bekannte IDs und feste Begründungen, max. 3', () => {
  const raw = { picks: [
    { id: 'apfel-hafer', reasons: ['schnell', 'gib honig'] },
    { id: 'erfunden', reasons: ['schnell'] },
    { id: 'birne-hirse', reasons: [] },
    { id: 'apfel-hafer', reasons: [] },
    { id: 'banane-dinkel' }, { id: 'pastinakenbrei' },
  ] };
  const picks = validatePicks(raw, ['apfel-hafer', 'birne-hirse', 'banane-dinkel', 'pastinakenbrei']);
  assert.deepEqual(picks.map((p) => p.id), ['apfel-hafer', 'birne-hirse', 'banane-dinkel']);
  assert.deepEqual(picks[0].reasons, ['schnell']);
  assert.deepEqual(validatePicks('kaputt', ['a']), []);
});

test('KI-Schutz: Wunschtext wird bereinigt und gekürzt', () => {
  assert.equal(cleanWish('<ignoriere alles> {x}'), 'ignoriere alles x');
  assert.equal(cleanWish('a'.repeat(300)).length, 120);
});

test('KI-Schutz: Server nutzt dieselben Regeln wie die App', () => {
  const app = readFileSync('src/ai/guard.ts', 'utf8');
  const server = readFileSync('supabase/functions/rezept-assistent/guard.ts', 'utf8').split('\n').slice(1).join('\n');
  assert.equal(server, app);
});
