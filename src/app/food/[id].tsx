import { useMemo } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';
import { ALL_RECIPES } from '@/data/allRecipes';
import { MONTH_NAMES, SEASON } from '@/data/season';
import { ALLERGEN_LABEL, CATEGORY_LABEL, FOOD_BY_ID } from '@/data/foods';
import { SOURCES, STATEMENTS } from '@/data/guidelines';
import { addDays, formatDayLong, todayIso } from '@/domain/dates';
import { blockReason, effectiveStartDate, introDays, MAINTENANCE, planDays } from '@/domain/planner';
import { useChild } from '@/state/AppContext';
import { Button, Card, Hero, Important, P, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { QuickLog } from '@/ui/QuickLog';
import { useToast } from '@/ui/Toast';
import { brand, color, radius, space, type } from '@/ui/theme';
import type { FoodCategory } from '@/domain/types';
import { t, tr } from '@/i18n';

const RISK = tr({
  niedrig: { label: 'Geringes Verschluckrisiko', emoji: '🟢' },
  mittel: { label: 'Mittleres Verschluckrisiko', emoji: '🟡' },
  hoch: { label: 'Hohes Verschluckrisiko', emoji: '🔴' },
} as const);
const REACTION_LABEL = tr({ keine: '', haut: 'Haut', verdauung: 'Bauch', erbrechen: 'Erbrechen', atemwege: 'Atmung/Schwellung' } as const);
const CATEGORY_TONE: Partial<Record<FoodCategory, string>> = {
  gemuese: '#E3F0DC', obst: '#FFF0C2', getreide: '#F6E7CF', fleisch: '#FBE1DA', fisch: '#DDEBF5',
  milch: '#EEF2F8', ei: '#FFF3DA', huelsenfruechte: '#EFE6DA', fett: '#F3F0D7', nuesse_samen: '#F1E4D6',
};
const shortMonth = (m: number) => MONTH_NAMES[m - 1].slice(0, 3);

const LIKING = tr({ '1': '♥ hat geschmeckt', '0': 'gegessen', '-1': 'lieber nicht' } as const);

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeChild: child, logs, addLog, removeLog, saveChild } = useChild();
  const toast = useToast();
  const food = FOOD_BY_ID[id];
  if (!food) return <Screen><P>{t('Lebensmittel nicht gefunden.')}</P></Screen>;

  const reason = blockReason(food, child, logs);
  const history = logs.filter((l) => l.foodId === food.id);
  const offered = history.length;
  const disliked = history.some((l) => l.liking === -1);
  const excluded = child.excludedFoods.includes(food.id);
  const isAllergen = food.allergens.length > 0;
  const maintenance = MAINTENANCE[food.id];
  const acceptance = STATEMENTS.find((s) => s.id === 'neu-akzeptanz')!;
  const keepGiving = STATEMENTS.find((s) => s.id === 'allergen-erhalten')!;

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: food.name }} />
      <FoodHero foodId={food.id} />
      <WhenRow foodId={food.id} />
      {reason ? <Important title={t('Pausiert')}>{reason}</Important> : null}
      {food.hint ? <Important>{t(food.hint)}</Important> : null}

      {isAllergen ? (
        <Card tone="peach">
          <P bold>{t('🥚 Allergen:')}{' '}{food.allergens.map((a) => ALLERGEN_LABEL[a]).join(', ')}</P>
          <P style={{ marginTop: space.xs }}>
            {t('Wird {0} Tage hintereinander eingeführt, ohne ein anderes neues Allergen. Danach', { 0: introDays(food) })}{maintenance ? t(' plant die App es {0}× pro Woche ein.', { 0: maintenance.weekdays.length }) : t(' bleibt es regelmäßig im Plan.')}
          </P>
          <Small soft={false} style={{ marginTop: space.sm }}>{t(keepGiving.text)}</Small>
          <View style={{ marginTop: space.xs }}><SourceLink label={SOURCES[keepGiving.source].short} url={SOURCES[keepGiving.source].url} /></View>
        </Card>
      ) : null}

      <PrepSteps foodId={food.id} />

      <Title>{t('Wie war es?')}</Title>
      <QuickLog
        onLog={async (liking, reaction) => {
          const logId = await addLog({ foodId: food.id, date: todayIso(), liking, reaction, note: '' });
          const verdict = reaction !== 'keine' ? t('Reaktion notiert') : liking === 1 ? t('hat geschmeckt') : t('lieber nicht');
          toast({ emoji: reaction !== 'keine' ? '❗' : liking === 1 ? '♥' : '✓', text: `${food.name}: ${verdict}`, undo: logId ? () => removeLog(logId) : undefined });
        }}
      />

      {disliked ? (
        <Card tone="butter" style={{ marginTop: space.lg }}>
          <P bold>{t('Bisher {0}× angeboten', { 0: offered })}</P>
          <P style={{ marginTop: space.xs }}>{t(acceptance.text)}</P>
          <View style={{ marginTop: space.xs }}><SourceLink label={SOURCES[acceptance.source].short} url={SOURCES[acceptance.source].url} /></View>
        </Card>
      ) : null}

      {history.length ? (
        <>
          <Title>{t('Verlauf')}</Title>
          <Card style={{ paddingVertical: space.md }}>
            {history.map((l) => (
              <Row key={l.id} style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
                <View style={{ flex: 1 }}>
                  <P>{formatDayLong(l.date)} · {LIKING[String(l.liking) as keyof typeof LIKING]}</P>
                  {l.reaction !== 'keine' ? <Text style={[type.smallBold, { color: color.red }]}>{t('Reaktion: {0}', { 0: REACTION_LABEL[l.reaction] })}</Text> : null}
                </View>
                <Button label={t('Löschen')} variant="ghost" onPress={() => removeLog(l.id)} />
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <Card style={{ marginTop: space.lg }}>
        <Row>
          <View style={{ flex: 1 }}>
            <P bold>{t('Nicht mehr einplanen')}</P>
            <Small>{t('Zum Beispiel bei ärztlich festgestellter Unverträglichkeit.')}</Small>
          </View>
          <Switch
            accessibilityLabel={t('Nicht mehr einplanen')}
            value={excluded}
            trackColor={{ true: color.sage, false: color.line }}
            onValueChange={(v) =>
              saveChild({ ...child, excludedFoods: v ? [...child.excludedFoods, food.id] : child.excludedFoods.filter((x) => x !== food.id) })
            }
          />
        </Row>
      </Card>
    </Screen>
  );
}

/** Kopfbereich wie eine Steckbrief-Karte: großes Bild, Kategorie, Merkmale, Status beim Kind. */
function FoodHero({ foodId }: { foodId: string }) {
  const { activeChild: child, logs } = useChild();
  const food = FOOD_BY_ID[foodId];
  const today = todayIso();
  const history = logs.filter((l) => l.foodId === food.id);
  const reason = blockReason(food, child, logs);
  const planned = useMemo(() => {
    if (history.length || reason) return null;
    const day = planDays(child, logs, today, 120).find((d) => d.meals.some((m) => m.newFoodId === food.id));
    return day?.date ?? null;
  }, [child, logs, today, food.id, history.length, reason]);
  const season = SEASON[food.id];
  const liked = history.some((l) => l.liking === 1);

  const chips: string[] = [];
  chips.push(food.fromWeek === 0 ? t('Von Anfang an') : t('Ab Beikost-Woche {0}', { 0: food.fromWeek + 1 }));
  if (food.allergens.length) chips.push('Allergen');
  if (food.ironRich) chips.push('Eisenreich');
  if (season) chips.push(t('Saison {0}–{1}', { 0: shortMonth(season.frisch[0]), 1: shortMonth(season.frisch[season.frisch.length - 1]) }));

  const status = reason
    ? { title: t('Pausiert'), text: reason, bg: color.redSoft, fg: color.redDeep }
    : history.length
      ? { title: liked ? t('Schon probiert ♥') : t('Schon probiert'), text: t('{0}× angeboten{1}', { 0: history.length, 1: liked ? ' – schmeckt!' : '' }), bg: brand.successBg, fg: brand.success }
      : planned
        ? { title: t('Im Plan ab {0}', { 0: formatDayLong(planned) }), text: t('Wird dann ein paar Tage hintereinander eingeführt.'), bg: color.butter, fg: color.peachDeep }
        : { title: t('Noch nicht probiert'), text: t('Kommt später in den Plan.'), bg: color.creme, fg: color.ink };

  return (
    <View style={{ backgroundColor: color.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: space.lg }}>
      <View style={{ backgroundColor: CATEGORY_TONE[food.category] ?? color.creme, alignItems: 'center', paddingVertical: space.xl }}>
        <Text style={{ fontSize: 96 }}>{food.emoji}</Text>
      </View>
      <View style={{ padding: space.lg }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: CATEGORY_TONE[food.category] ?? color.creme, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={[type.smallBold, { color: color.ink }]}>{CATEGORY_LABEL[food.category]}</Text>
        </View>
        <Hero style={{ marginTop: space.sm }}>{food.name}</Hero>
        <Row style={{ flexWrap: 'wrap', gap: space.sm, marginTop: space.sm }}>
          {chips.map((c) => (
            <View key={c} style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={[type.smallBold, { color: c === 'Allergen' ? color.redDeep : color.ink }]}>{c}</Text>
            </View>
          ))}
        </Row>
        <View style={{ backgroundColor: status.bg, borderRadius: radius.md, padding: space.lg, marginTop: space.lg }}>
          <Small soft={false}>{t('Bei {0}', { 0: child.name })}</Small>
          <Text style={[type.title, { color: status.fg, marginTop: 2 }]}>{t(status.title)}</Text>
          <Small soft={false}>{t(status.text)}</Small>
        </View>
      </View>
    </View>
  );
}

/** „Ab wann?“ – allgemein und beim eigenen Kind (relativ zum Beikost-Start, nicht zu einem festen Monat). */
function WhenRow({ foodId }: { foodId: string }) {
  const { activeChild: child, logs } = useChild();
  const food = FOOD_BY_ID[foodId];
  const today = todayIso();
  const general = food.fromWeek === 0
    ? t('Ab dem Beikost-Start – also frühestens ab Beginn des 5. und spätestens ab Beginn des 7. Monats.')
    : food.fromWeek === 1
      ? t('Etwa 1 Woche nach dem Beikost-Start, wenn die ersten Breie gut klappen.')
      : t('Etwa {0} Wochen nach dem Beikost-Start, wenn die ersten Breie gut klappen.', { 0: food.fromWeek });
  const first = logs.filter((l) => l.childId === child.id && l.foodId === food.id).map((l) => l.date).sort()[0];
  const earliest = addDays(effectiveStartDate(child), food.fromWeek * 7);
  const mine = first
    ? t('Seit {0} dabei.', { 0: formatDayLong(first) })
    : earliest <= today ? t('Jetzt schon möglich.') : t('Frühestens ab {0}.', { 0: formatDayLong(earliest) });
  return (
    <Card>
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 26 }}>⏳</Text>
        <View style={{ flex: 1 }}>
          <P bold>{t('Ab wann?')}</P>
          <Small soft={false} style={{ marginTop: 2 }}>{general}</Small>
          <Small bold soft={false} style={{ marginTop: space.sm, color: color.sageDeep }}>{t('Bei {0}: {1}', { 0: child.name, 1: mine })}</Small>
        </View>
      </Row>
    </Card>
  );
}

/** Nummerierte Zubereitung: passend zur Methode zuerst, dann die andere, dann Rezepte mit dem Lebensmittel. */
function PrepSteps({ foodId }: { foodId: string }) {
  const { activeChild: child } = useChild();
  const food = FOOD_BY_ID[foodId];
  const recipes = ALL_RECIPES.filter((r) => r.foods.includes(food.id)).slice(0, 4);
  const steps: { title: string; text: string; onPress?: () => void }[] = child.approach === 'blw'
    ? [{ title: t('Als Fingerfood'), text: food.finger }, { title: t('Als Brei'), text: food.brei }]
    : [{ title: t('Als Brei'), text: food.brei }, { title: t('Als Fingerfood'), text: food.finger }];
  for (const r of recipes) steps.push({ title: t('{0} Im Rezept: {1}', { 0: r.emoji, 1: r.name }), text: t('ab {0} Monaten · {1} Min.', { 0: r.fromMonth, 1: r.minutes }), onPress: () => router.push(`/rezept/${r.id}`) });
  return (
    <Card>
      <Small bold soft={false} style={{ marginBottom: space.sm }}>{t('{0} ZUBEREITEN', { 0: food.name.toUpperCase() })}</Small>
      {steps.map((st, i) => {
        const body = (
          <Row style={{ alignItems: 'flex-start', paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.smallBold, { color: color.sageDeep }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <P bold>{t(st.title)}</P>
              <Small soft={false} style={{ marginTop: 2 }}>{t(st.text)}</Small>
            </View>
            {st.onPress ? <Text style={{ fontSize: 20, color: color.inkSoft }}>›</Text> : null}
          </Row>
        );
        return st.onPress
          ? <Pressable key={st.title} onPress={st.onPress} accessibilityRole="link">{body}</Pressable>
          : <View key={st.title}>{body}</View>;
      })}
      <Row style={{ marginTop: space.sm, gap: space.sm }}>
        <Text style={{ fontSize: 16 }}>{RISK[food.chokingRisk].emoji}</Text>
        <Small bold soft={false}>{t(RISK[food.chokingRisk].label)}</Small>
      </Row>
    </Card>
  );
}
