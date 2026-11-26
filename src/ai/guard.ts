/**
 * Sicherheitsregeln der KI-Rezeptsuche – gemeinsam für App und Server (Konzept Kap. 8).
 * Die KI wählt nur aus geprüften Rezepten aus und gibt keinen freien Text an Nutzer zurück.
 */

/** Medizinische oder sicherheitskritische Anfragen werden nicht an die KI gegeben. */
const MEDICAL = /(allerg|ausschlag|quaddel|fieber|durchfall|erbrech|spuck|verstopf|blut|krank|symptom|arzt|ärzt|medikament|dosis|dosier|vitamin\s*d|jod|eisenmangel|mangel|gewicht|wachst|zunehm|abnehm|reaktion|atemnot|notfall|schwell|husten|bauchweh|kolik|neurodermitis|ekzem|zöliakie|unverträglich)/i;

export function isMedicalQuery(text: string): boolean {
  return MEDICAL.test(text);
}

export const AI_REASONS = {
  nutzt_zutaten: 'Nutzt viele deiner Zutaten',
  schnell: 'Schnell gemacht',
  einfrierbar: 'Lässt sich gut vorkochen',
  wunsch_passt: 'Passt zu deinem Wunsch',
  abwechslung: 'Bringt Abwechslung',
} as const;

export type AiReason = keyof typeof AI_REASONS;

export const MAX_WISH = 120;
export const MAX_CANDIDATES = 12;
export const ID_PATTERN = /^[a-z0-9_-]{2,40}$/;

export interface AiCandidate {
  id: string;
  name: string;
  minutes: number;
  foods: string[];
  freeze: boolean;
}

export interface AiPick {
  id: string;
  reasons: AiReason[];
}

/** Antwort der KI prüfen: nur bekannte Rezept-IDs, nur erlaubte Begründungen, höchstens drei. */
export function validatePicks(raw: unknown, candidateIds: string[]): AiPick[] {
  const picks = (raw as { picks?: unknown })?.picks;
  if (!Array.isArray(picks)) return [];
  const allowed = new Set(candidateIds);
  const out: AiPick[] = [];
  for (const p of picks) {
    const id = (p as { id?: unknown })?.id;
    if (typeof id !== 'string' || !allowed.has(id) || out.some((o) => o.id === id)) continue;
    const reasons = Array.isArray((p as { reasons?: unknown }).reasons) ? (p as { reasons: unknown[] }).reasons : [];
    out.push({ id, reasons: reasons.filter((r): r is AiReason => typeof r === 'string' && r in AI_REASONS).slice(0, 3) });
    if (out.length === 3) break;
  }
  return out;
}

/** Wunschtext bereinigen: kürzen, Steuerzeichen und spitze Klammern entfernen. */
export function cleanWish(text: string): string {
  return text.replace(/[\u0000-\u001f<>{}]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_WISH);
}
