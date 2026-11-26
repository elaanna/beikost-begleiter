/**
 * Mehrsprachigkeit: Deutsch ist die Ausgangssprache und zugleich der Schlüssel.
 * `t('Darf {name} schon …?', { name })` sucht die Übersetzung; fehlt sie, bleibt der deutsche Text stehen
 * (nie eine leere Stelle). Ein Test prüft, dass jede Textstelle eine englische Übersetzung hat.
 */
import { EN } from './en';

export type Lang = 'de' | 'en';
export const LANGS: Lang[] = ['de', 'en'];
export const LANG_LABEL: Record<Lang, string> = { de: 'Deutsch', en: 'English' };

let current: Lang = 'de';

export function setLang(lang: Lang): void {
  current = lang;
}

export function getLang(): Lang {
  return current;
}

export function t(de: string | null | undefined, params?: Record<string, string | number | null | undefined>): string {
  if (de === null || de === undefined) return '';
  let s = current === 'en' ? EN[de] ?? de : de;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(v === null || v === undefined ? "" : String(v));
  return s;
}

/** Sprache des Handys: Englisch, wenn die erste bevorzugte Sprache Englisch ist, sonst Deutsch. */
export function langFromLocale(code: string | null | undefined): Lang {
  return code?.toLowerCase().startsWith('en') ? 'en' : 'de';
}

const proxies = new WeakMap<object, object>();

/**
 * Bezeichnungs-Tabellen (z. B. Mahlzeiten, Kategorien) beim Lesen übersetzen.
 * So bleiben die Tabellen deutsch im Code und liefern trotzdem immer die aktuelle Sprache.
 */
/** Nur einfache Objekte und Listen übersetzen – keine RegExp, Datumswerte oder React-Elemente. */
function isPlain(v: object): boolean {
  if (Array.isArray(v)) return true;
  if ('$$typeof' in v) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function tr<T extends object>(obj: T): T {
  const cached = proxies.get(obj);
  if (cached) return cached as T;
  const p = new Proxy(obj, {
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      if (typeof v === 'string') return t(v);
      if (v && typeof v === 'object' && isPlain(v)) return tr(v as object);
      return v;
    },
  });
  proxies.set(obj, p);
  return p;
}
