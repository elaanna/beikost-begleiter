import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { RECIPE_BY_ID } from '@/data/allRecipes';
import { CATEGORY_INFO } from '@/data/babyRecipes';
import { FOOD_BY_ID, FOODS } from '@/data/foods';
import { AI_REASONS, type AiPick } from '@/ai/guard';
import { askRecipeAssistant, isAiConfigured } from '@/ai/recipeAssistant';
import { todayIso } from '@/domain/dates';
import { matchByIngredients } from '@/domain/recipes';
import { pantryFoodIds } from '@/domain/stock';
import { useChild } from '@/state/AppContext';
import { Button, Card, Heading, Important, P, Pill, Row, Screen, Small, Title } from '@/ui/components';
import { color, radius, space, type } from '@/ui/theme';
import { t } from '@/i18n';

/**
 * „Was habe ich da?“ – Rezepte nach vorhandenen Zutaten (Konzept F04).
 * Die Suche selbst ist regelbasiert. Optional ordnet eine KI die passenden geprüften Rezepte –
 * sie wählt nur aus der Bibliothek aus und schreibt keine eigenen Texte.
 */
export default function Rezeptsuche() {
  const { activeChild: child, logs, stock } = useChild();
  const [selected, setSelected] = useState<string[]>(() => Array.from(pantryFoodIds(stock)).slice(0, 10));
  const [query, setQuery] = useState('');
  const [wish, setWish] = useState('');
  const [ai, setAi] = useState<{ state: 'idle' | 'laeuft' | 'fertig'; picks: AiPick[]; message?: string }>({ state: 'idle', picks: [] });
  const today = todayIso();

  const matches = useMemo(() => matchByIngredients(child, logs, selected, today), [child, logs, selected, today]);
  const results = query.trim().length >= 2
    ? FOODS.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()) && !selected.includes(f.id)).slice(0, 6)
    : [];
  const toggle = (id: string) => {
    setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id].slice(0, 15)));
    setAi({ state: 'idle', picks: [] });
  };

  const runAi = async () => {
    setAi({ state: 'laeuft', picks: [] });
    const candidates = matches.slice(0, 12).map((m) => ({
      id: m.recipe.id, name: m.recipe.name, minutes: m.recipe.minutes, foods: m.recipe.foods, freeze: !!m.recipe.storage.freeze,
    }));
    const r = await askRecipeAssistant(selected, wish, candidates);
    if (r.kind === 'ok') setAi({ state: 'fertig', picks: r.picks, message: r.picks.length ? undefined : t('Keine Auswahl möglich – nimm einfach die Liste unten.') });
    else if (r.kind === 'medizinisch') setAi({ state: 'fertig', picks: [], message: 'medizinisch' });
    else if (r.kind === 'kontingent') setAi({ state: 'fertig', picks: [], message: t('Für heute sind die KI-Vorschläge aufgebraucht. Die Liste unten funktioniert weiter.') });
    else setAi({ state: 'fertig', picks: [], message: t('Die KI ist gerade nicht erreichbar. Die Liste unten funktioniert weiter.') });
  };

  return (
    <Screen edges={['left', 'right']}>
      <P soft style={{ marginBottom: space.md }}>{t('Wähle, was im Kühlschrank oder Vorrat ist. Es erscheinen nur geprüfte Rezepte, die zu {0} passen.', { 0: child.name })}</P>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('Zutat suchen, z. B. Kürbis')}
        placeholderTextColor={color.inkSoft}
        accessibilityLabel={t('Zutat suchen')}
        maxLength={40}
        style={[type.body, { backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: space.lg, minHeight: 52, borderWidth: 2, borderColor: color.line, color: color.ink, marginBottom: space.sm }]}
      />
      {results.map((f) => (
        <Pressable key={f.id} onPress={() => { toggle(f.id); setQuery(''); }} accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: color.surface, borderRadius: radius.md, marginBottom: space.xs }}>
          <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
          <P style={{ flex: 1 }}>{f.name}</P>
          <Text style={[type.bodyBold, { color: color.sageDeep }]}>+</Text>
        </Pressable>
      ))}
      <Row style={{ flexWrap: 'wrap', gap: space.sm, marginVertical: space.md }}>
        {selected.length === 0 ? <Small>{t('Noch keine Zutaten gewählt.')}</Small> : null}
        {selected.map((id) => <Pill key={id} label={`${FOOD_BY_ID[id]?.emoji ?? ''} ${FOOD_BY_ID[id]?.name ?? id} ✕`} selected onPress={() => toggle(id)} />)}
      </Row>

      {isAiConfigured && matches.length > 1 ? (
        <Card tone="sage">
          <Row>
            <Text style={{ fontSize: 26 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <Heading>{t('KI-Vorschlag')}</Heading>
              <Small soft={false}>{t('Eine KI wählt bis zu drei der passenden geprüften Rezepte aus.')}</Small>
            </View>
          </Row>
          <TextInput
            value={wish}
            onChangeText={setWish}
            placeholder={t('Wunsch, z. B. schnell, ohne Ofen (optional)')}
            placeholderTextColor={color.inkSoft}
            accessibilityLabel={t('Wunsch an die KI')}
            maxLength={120}
            style={[type.body, { backgroundColor: color.surface, borderRadius: radius.sm, paddingHorizontal: space.md, minHeight: 48, color: color.ink, marginVertical: space.md }]}
          />
          <Button label={ai.state === 'laeuft' ? t('Einen Moment …') : t('Vorschlag holen')} disabled={ai.state === 'laeuft'} onPress={runAi} />
          <Small style={{ marginTop: space.sm }}>
            {t('Gesendet werden nur Zutaten und dein Wunsch – keine Angaben zu deinem Kind. Bitte keine Gesundheitsfragen eingeben.')}</Small>
          {ai.message === 'medizinisch' ? (
            <View style={{ marginTop: space.md }}>
              <Important title={t('Dafür ist die KI nicht da')}>
                {t('Bei Fragen zu Gesundheit, Allergien oder Beschwerden hilft eure Kinderarztpraxis. Im Notfall 112.')}</Important>
            </View>
          ) : ai.message ? <P style={{ marginTop: space.md }}>{ai.message}</P> : null}
          {ai.picks.map((p) => {
            const r = RECIPE_BY_ID[p.id];
            return (
              <Pressable key={p.id} onPress={() => router.push(`/rezept/${p.id}`)} accessibilityRole="link"
                style={{ backgroundColor: color.surface, borderRadius: radius.md, padding: space.md, marginTop: space.sm }}>
                <P bold>{r.emoji} {r.name}</P>
                {p.reasons.map((reason) => <Small key={reason} soft={false}>✓ {AI_REASONS[reason]}</Small>)}
                <Small style={{ marginTop: 2 }}>{t('KI-Auswahl aus geprüften Rezepten')}</Small>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <Title>{t('Passende Rezepte ({0})', { 0: matches.length })}</Title>
      {selected.length > 0 && matches.length === 0 ? <Card><P>{t('Dazu gibt es noch kein passendes Rezept. Probier andere Zutaten.')}</P></Card> : null}
      {matches.map((m) => (
        <Card key={m.recipe.id} onPress={() => router.push(`/rezept/${m.recipe.id}`)} accessibilityLabel={m.recipe.name}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 34 }}>{m.recipe.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{m.recipe.name}</P>
              <Small>{t('{0} · {1} Min.', { 0: t(CATEGORY_INFO[m.recipe.category].label), 1: m.recipe.minutes })}</Small>
              <Text style={[type.small, { color: color.sageDeep, marginTop: 2 }]}>{t('Da:')}{' '}{m.have.map((id) => FOOD_BY_ID[id].name).join(', ')}</Text>
              {m.missing.length ? <Text style={[type.small, { color: color.inkSoft }]}>{t('Fehlt:')}{' '}{m.missing.map((id) => FOOD_BY_ID[id].name).join(', ')}</Text> : null}
              {m.untried.length ? <Text style={[type.small, { color: color.peachDeep }]}>{t('Noch nicht probiert:')}{' '}{m.untried.map((id) => FOOD_BY_ID[id].name).join(', ')}</Text> : null}
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
