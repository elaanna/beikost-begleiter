import { CATEGORY_LABEL, FOOD_BY_ID } from '@/data/foods';
import { allergenStatuses } from './allergenStatus';
import { ironWeek } from './care';
import { addDays, ageInMonths, formatMonth } from './dates';
import { STOOL_LABEL, type DigestionLog, type StoolKind } from './digestion';
import { effectiveStartDate } from './planner';
import { AVOID_FIRST_YEAR, EMERGENCY_SIGNS } from '@/data/guidelines';
import { formatDay, formatDayLong } from './dates';
import { preparationFor, SLOT_LABEL } from './planner';
import type { Food } from './types';
import type { Child, FoodLog, PlanDay } from './types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STYLE = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #20213D; margin: 32px; font-size: 12pt; }
  h1 { font-size: 22pt; margin: 0 0 4px; color: #313D8E; }
  h2 { font-size: 14pt; margin: 24px 0 8px; color: #313D8E; }
  .meta { color: #66677A; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 8px; border-bottom: 1px solid #E6E2DA; }
  th { font-size: 11pt; color: #66677A; }
  .new { color: #A0452A; font-weight: 600; }
  .warn { border: 2px solid #B93838; padding: 12px; border-radius: 8px; }
  .small { font-size: 10pt; color: #66677A; }
`;

/** Wochenplan zum Ausdrucken, z. B. für Großeltern oder die Kita. */
export function planHtml(child: Child, days: PlanDay[]): string {
  const rows = days
    .map((d) => {
      const meals = d.meals.length
        ? d.meals
            .map((m) => {
              const foods = m.foodIds
                .map((id) => (id === m.newFoodId ? `<span class="new">${esc(FOOD_BY_ID[id].name)} (neu, Tag ${m.newFoodDay})</span>` : esc(FOOD_BY_ID[id].name)))
                .join(', ');
              return `<b>${SLOT_LABEL[m.slot]}:</b> ${esc(m.title)} – ${foods}`;
            })
            .join('<br/>')
        : '<span class="small">Noch keine Beikost</span>';
      return `<tr><td>${formatDay(d.date)}</td><td>${meals}</td></tr>`;
    })
    .join('');

  const newFoods = Array.from(new Set(days.flatMap((d) => d.meals.map((m) => m.newFoodId).filter(Boolean) as string[])));
  const prep = newFoods
    .map((id) => `<p><b>${esc(FOOD_BY_ID[id].name)}:</b> ${esc(preparationFor(FOOD_BY_ID[id], child)).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const allergies = child.exclusions.length ? child.exclusions.join(', ') : 'keine bekannt';

  return `<html><head><meta charset="utf-8"/><style>${STYLE}</style></head><body>
    <h1>Wochenplan für ${esc(child.name)}</h1>
    <div class="meta">${formatDayLong(days[0].date)} bis ${formatDayLong(days[days.length - 1].date)} · Bekannte Allergien: ${esc(allergies)}</div>
    <table><tr><th>Tag</th><th>Mahlzeiten</th></tr>${rows}</table>
    ${prep ? `<h2>Zubereitung neuer Lebensmittel</h2>${prep}` : ''}
    <h2>Bitte nicht geben</h2>
    <p class="small">${AVOID_FIRST_YEAR.map((a) => esc(a.name)).join(' · ')}</p>
    <p class="small">Erstellt mit nimou. Ersetzt keine ärztliche Beratung.</p>
  </body></html>`;
}

/** Notfallblatt für Betreuungspersonen. */
export function emergencyHtml(child: Child, logs: FoodLog[], contact: { parent: string; doctor: string }): string {
  const reactions = logs.filter((l) => l.reaction !== 'keine');
  const reactionList = reactions.length
    ? reactions.map((l) => `<li>${formatDayLong(l.date)}: ${esc(FOOD_BY_ID[l.foodId]?.name ?? l.foodId)} – ${esc(l.reaction)}</li>`).join('')
    : '<li>Keine Reaktionen notiert</li>';
  return `<html><head><meta charset="utf-8"/><style>${STYLE}</style></head><body>
    <h1>Notfallblatt: ${esc(child.name)}</h1>
    <div class="meta">Geboren im ${formatMonth(child.birthDate)}</div>
    <div class="warn">
      <b>Sofort Notruf 112 wählen bei:</b>
      <ul>${EMERGENCY_SIGNS.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
    <h2>Bekannte Allergien</h2>
    <p>${child.exclusions.length ? esc(child.exclusions.join(', ')) : 'Keine bekannt'}</p>
    <h2>Bisher beobachtete Reaktionen</h2>
    <ul>${reactionList}</ul>
    <h2>Kontakte</h2>
    <p>Eltern: ${esc(contact.parent || '________________')}<br/>Kinderarztpraxis: ${esc(contact.doctor || '________________')}</p>
    <h2>Beim Essen</h2>
    <p class="small">Aufrecht sitzend füttern, nie unbeaufsichtigt essen lassen. Würgen ist ein normaler Schutzreflex; stilles Verschlucken ohne Husten ist ein Notfall.</p>
  </body></html>`;
}

const REACTION_TEXT = { keine: '', haut: 'Haut', verdauung: 'Bauch', erbrechen: 'Erbrechen', atemwege: 'Atmung/Schwellung' } as const;
const MILK_TEXT = { stillen: 'Gestillt', flasche: 'Fläschchen', beides: 'Stillen und Fläschchen' } as const;
const APPROACH_TEXT = { brei: 'Brei', blw: 'Fingerfood (BLW)', gemischt: 'Brei und Fingerfood' } as const;

/** Übersicht für die Kinderarztpraxis, z. B. zur U5 oder U6. */
export function doctorReportHtml(child: Child, logs: FoodLog[], digestion: DigestionLog[], today: string): string {
  const own = logs.filter((l) => l.childId === child.id).sort((a, b) => a.date.localeCompare(b.date));
  const start = effectiveStartDate(child);
  const statuses = allergenStatuses(child, own);
  const firstDate = (pred: (f: Food) => boolean) => own.find((l) => FOOD_BY_ID[l.foodId] && pred(FOOD_BY_ID[l.foodId]))?.date;

  const allergenRows = statuses.map((s) => {
    const withIt = own.filter((l) => FOOD_BY_ID[l.foodId]?.allergens.includes(s.guide.id));
    const first = withIt[0]?.date;
    const last = withIt[withIt.length - 1]?.date;
    const cls = s.state === 'reaktion' || s.state === 'ausgeschlossen' || s.state === 'abklaeren' ? ' class="red"' : '';
    return `<tr><td>${esc(s.guide.name)}</td><td${cls}>${esc(s.label)}${s.plannedDate ? ` (ab ${formatDay(s.plannedDate, false)})` : ''}</td>
      <td>${first ? formatDay(first, false) : '–'}</td><td>${last ? formatDay(last, false) : '–'}</td><td>${withIt.length}</td></tr>`;
  }).join('');

  const reactions = own.filter((l) => l.reaction !== 'keine');
  const reactionRows = reactions.length
    ? reactions.map((l) => `<tr><td>${formatDay(l.date, false)}</td><td>${esc(FOOD_BY_ID[l.foodId]?.name ?? l.foodId)}</td><td class="red">${REACTION_TEXT[l.reaction]}</td><td>${esc(l.note)}</td></tr>`).join('')
    : '<tr><td colspan="4">Keine Reaktionen notiert</td></tr>';

  const tried = new Map<string, { liked: boolean; disliked: boolean }>();
  for (const l of own) {
    const t = tried.get(l.foodId) ?? { liked: false, disliked: false };
    if (l.liking === 1) t.liked = true;
    if (l.liking === -1) t.disliked = true;
    tried.set(l.foodId, t);
  }
  const byCat = new Map<string, string[]>();
  for (const [id, t] of tried) {
    const f = FOOD_BY_ID[id];
    if (!f) continue;
    const list = byCat.get(f.category) ?? [];
    list.push(`${esc(f.name)}${t.liked ? ' ♥' : t.disliked ? ' (mag nicht)' : ''}`);
    byCat.set(f.category, list);
  }
  const triedRows = [...byCat.entries()].map(([cat, list]) => `<tr><td>${esc(CATEGORY_LABEL[cat as Food['category']] ?? cat)}</td><td>${list.join(', ')}</td></tr>`).join('');

  const since = addDays(today, -13);
  const recent = digestion.filter((d) => d.childId === child.id && d.date >= since);
  const stoolCounts = (Object.keys(STOOL_LABEL) as StoolKind[])
    .map((k) => ({ k, n: recent.filter((d) => d.kind === k).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${STOOL_LABEL[x.k].label}: ${x.n}×`)
    .join(' · ');
  const iron = ironWeek(child, own, today);

  return `<html><head><meta charset="utf-8"/><style>${STYLE} .red { color: #B93838; font-weight: 600; }</style></head><body>
    <h1>Beikost-Bericht: ${esc(child.name)}</h1>
    <div class="meta">Stand ${formatDayLong(today)} · geboren im ${formatMonth(child.birthDate)} (${ageInMonths(child.birthDate, today)} Monate)</div>
    <table>
      <tr><th>Beikoststart</th><td>${formatDayLong(start)}</td></tr>
      <tr><th>Milch</th><td>${MILK_TEXT[child.milk]}</td></tr>
      <tr><th>Form</th><td>${APPROACH_TEXT[child.approach]}</td></tr>
      <tr><th>Neurodermitis</th><td>${child.atopicDermatitis ? `ja${child.peanutCleared ? ', Erdnuss ärztlich abgeklärt' : ''}` : 'nein'}</td></tr>
      <tr><th>Bekannte Allergien</th><td>${child.exclusions.length ? esc(child.exclusions.join(', ')) : 'keine'}</td></tr>
      <tr><th>Erstes Fleisch / Fisch</th><td>${(() => { const d = firstDate((f) => f.category === 'fleisch'); return d ? formatDay(d, false) : '–'; })()} / ${(() => { const d = firstDate((f) => f.category === 'fisch'); return d ? formatDay(d, false) : '–'; })()}</td></tr>
      <tr><th>Eisenreich (letzte 7 Tage)</th><td>${iron.active ? `${iron.days} von 7 Tagen` : 'noch nicht eingeführt'}</td></tr>
    </table>

    <h2>Allergene</h2>
    <table><tr><th>Gruppe</th><th>Status</th><th>Zuerst</th><th>Zuletzt</th><th>Anzahl</th></tr>${allergenRows}</table>

    <h2>Beobachtete Reaktionen</h2>
    <table><tr><th>Datum</th><th>Lebensmittel</th><th>Art</th><th>Notiz</th></tr>${reactionRows}</table>

    <h2>Probiert (${tried.size} Lebensmittel)</h2>
    <table>${triedRows || '<tr><td>Noch nichts eingetragen</td></tr>'}</table>

    <h2>Verdauung (letzte 14 Tage)</h2>
    <p>${stoolCounts || 'Nichts notiert'}</p>

    <p class="small" style="margin-top:32px">Elternprotokoll aus nimou. Die Angaben wurden von den Eltern eingetragen und ersetzen keine ärztliche Untersuchung oder Diagnose.</p>
  </body></html>`;
}
