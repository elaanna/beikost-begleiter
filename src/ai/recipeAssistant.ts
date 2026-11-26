import { ensureSession, isSyncConfigured, supabase } from '@/sync/supabase';
import { cleanWish, isMedicalQuery, MAX_CANDIDATES, validatePicks, type AiCandidate, type AiPick } from './guard';

/** Die KI-Rezeptsuche ist verfügbar, wenn Supabase eingerichtet und die Funktion freigeschaltet ist. */
export const isAiConfigured = isSyncConfigured && process.env.EXPO_PUBLIC_AI_ENABLED === '1';

export type AiResult =
  | { kind: 'ok'; picks: AiPick[] }
  | { kind: 'medizinisch' }
  | { kind: 'kontingent' }
  | { kind: 'fehler' };

export async function askRecipeAssistant(foods: string[], wish: string, candidates: AiCandidate[]): Promise<AiResult> {
  const cleaned = cleanWish(wish);
  if (isMedicalQuery(cleaned)) return { kind: 'medizinisch' };
  if (!supabase || !isAiConfigured) return { kind: 'fehler' };
  try {
    await ensureSession();
    const list = candidates.slice(0, MAX_CANDIDATES);
    const { data, error } = await supabase.functions.invoke('rezept-assistent', { body: { foods, wish: cleaned, candidates: list } });
    if (error) return { kind: 'fehler' };
    if (data?.blocked === 'medizinisch') return { kind: 'medizinisch' };
    if (data?.blocked === 'kontingent') return { kind: 'kontingent' };
    // Auch in der App noch einmal prüfen: nur bekannte Rezepte, nur feste Begründungen
    return { kind: 'ok', picks: validatePicks(data, list.map((c) => c.id)) };
  } catch {
    return { kind: 'fehler' };
  }
}
