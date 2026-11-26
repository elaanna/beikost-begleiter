import { useMemo } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';
import { ALL_RECIPES } from '@/data/allRecipes';
import { MONTH_NAMES, SEASON } from '@/data/season';
import { ALLERGEN_LABEL, CATEGORY_LABEL, FOOD_BY_ID } from '@/data/foods';
import { SOURCES, STATEMENTS } from '@/data/guidelines';
import { formatDayLong, todayIso } from '@/domain/dates';
import { blockReason, introDays, MAINTENANCE, planDays } from '@/domain/planner';
import { useChild } from '@/state/AppContext';
import { Button, Card, Hero, Important, P, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { QuickLog } from '@/ui/QuickLog';
import { useToast } from '@/ui/Toast';
import { color, radius, space, type } from '@/ui/theme';
import type { FoodCategory } from '@/domain/types';

const RISK = {
  niedrig: { label: 'Geringes Verschluckrisiko', emoji: '🟢' },
  mittel: { label: 'Mittleres Verschluckrisiko', emoji: '🟡' },
  hoch: { label: 'Hohes Verschluckrisiko', emoji: '🔴' },
} as const;
const REACTION_LABEL = { keine: '', haut: 'Haut', verdauung: 'Bauch', erbrechen: 'Erbrechen', atemwege: 'Atmung/Schwellung' } as const;
const CATEGORY_TONE: Partial<Record<FoodCategory, string>> = {
  gemuese: '#E3F0DC', obst: '#FFF0C2', getreide: '#F6E7CF', fleisch: '#FBE1DA', fisch: '#DDEBF5',
  milch: '#EEF2F8', ei: '#FFF3DA', huelsenfruechte: '#EFE6DA', fett: '#F3F0D7', nuesse_samen: '#F1E4D6',
};
const shortMonth = (m: number) => MONTH_NAMES[m - 1].slice(0, 3);

const LIKING = { '1': '♥ hat geschmeckt', '0': 'gegessen', '-1': 'lieber nicht' } as const;

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeChild: child, logs, addLog, removeLog, saveChild } = useChild();
  const toast = useToast();
  const food = FOOD_BY_ID[id];
  if (!food) return <Screen><P>Lebensmittel nicht gefunden.</P></Screen>;

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
      {reason ? <Important title="Pausiert">{reason}</Important> : null}
      {food.hint ? <Important>{food.hint}</Important> : null}

      {isAllergen ? (
        <Card tone="peach">
          <P bold>🥚 Allergen: {food.allergens.map((a) => ALLERGEN_LABEL[a]).join(', ')}</P>
          <P style={{ marginTop: space.xs }}>
            Wird {introDays(food)} Tage hintereinander eingeführt, ohne ein anderes neues Allergen. Danach
            {maintenance ? ` plant die App es ${maintenance.weekdays.length}× pro Woche ein.` : ' bleibt es regelmäßig im Plan.'}
          </P>
          <Small soft={false} style={{ marginTop: space.sm }}>{keepGiving.text}</Small>
          <View style={{ marginTop: space.xs }}><SourceLink label={SOURCES[keepGiving.source].short} url={SOURCES[keepGiving.source].url} /></View>
        </Card>
      ) : null}

      <PrepSteps foodId={food.id} />

      <Title>Wie war es?</Title>
      <QuickLog
        onLog={async (liking, reaction) => {
          const logId = await addLog({ foodId: food.id, date: todayIso(), liking, reaction, note: '' });
          const verdict = reaction !== 'keine' ? 'Reaktion notiert' : liking === 1 ? 'hat geschmeckt' : 'lieber nicht';
          toast({ emoji: reaction !== 'keine' ? '❗' : liking === 1 ? '♥' : '✓', text: `${food.name}: ${verdict}`, undo: logId ? () => removeLog(logId) : undefined });
        }}
      />

      {disliked ? (
        <Card tone="butter" style={{ marginTop: space.lg }}>
          <P bold>Bisher {offered}× angeboten</P>
          <P style={{ marginTop: space.xs }}>{acceptance.text}</P>
          <View style={{ marginTop: space.xs }}><SourceLink label={SOURCES[acceptance.source].short} url={SOURCES[acceptance.source].url} /></View>
        </Card>
      ) : null}

      {history.length ? (
        <>
          <Title>Verlauf</Title>
          <Card style={{ paddingVertical: space.md }}>
            {history.map((l) => (
              <Row key={l.id} style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
                <View style={{ flex: 1 }}>
                  <P>{formatDayLong(l.date)} · {LIKING[String(l.liking) as keyof typeof LIKING]}</P>
                  {l.reaction !== 'keine' ? <Text style={[type.smallBold, { color: color.red }]}>Reaktion: {REACTION_LABEL[l.reaction]}</Text> : null}
                </View>
                <Button label="Löschen" variant="ghost" onPress={() => removeLog(l.id)} />
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <Card style={{ marginTop: space.lg }}>
        <Row>
          <View style={{ flex: 1 }}>
            <P bold>Nicht mehr einplanen</P>
            <Small>Zum Beispiel bei ärztlich festgestellter Unverträglichkeit.</Small>
          </View>
          <Switch
            accessibilityLabel="Nicht mehr einplanen"
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
  chips.push(food.fromWeek === 0 ? 'Von Anfang an' : `Ab Beikost-Woche ${food.fromWeek + 1}`);
  if (food.allergens.length) chips.push('Allergen');
  if (food.ironRich) chips.push('Eisenreich');
  if (season) chips.push(`Saison ${shortMonth(season.frisch[0])}–${shortMonth(season.frisch[season.frisch.length - 1])}`);

  const status = reason
    ? { title: 'Pausiert', text: reason, bg: color.redSoft, fg: color.redDeep }
    : history.length
      ? { title: liked ? 'Schon probiert ♥' : 'Schon probiert', text: `${history.length}× angeboten${liked ? ' – schmeckt!' : ''}`, bg: color.sageSoft, fg: color.sageDeep }
      : planned
        ? { title: `Im Plan ab ${formatDayLong(planned)}`, text: 'Wird dann ein paar Tage hintereinander eingeführt.', bg: color.butter, fg: color.peachDeep }
        : { title: 'Noch nicht probiert', text: 'Kommt später in den Plan.', bg: color.creme, fg: color.ink };

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
          <Small soft={false}>Bei {child.name}</Small>
          <Text style={[type.title, { color: status.fg, marginTop: 2 }]}>{status.title}</Text>
          <Small soft={false}>{status.text}</Small>
        </View>
      </View>
    </View>
  );
}

/** Nummerierte Zubereitung: passend zur Methode zuerst, dann die andere, dann Rezepte mit dem Lebensmittel. */
function PrepSteps({ foodId }: { foodId: string }) {
  const { activeChild: child } = useChild();
  const food = FOOD_BY_ID[foodId];
  const recipes = ALL_RECIPES.filter((r) => r.foods.includes(food.id)).slice(0, 4);
  const steps: { title: string; text: string; onPress?: () => void }[] = child.approach === 'blw'
    ? [{ title: 'Als Fingerfood', text: food.finger }, { title: 'Als Brei', text: food.brei }]
    : [{ title: 'Als Brei', text: food.brei }, { title: 'Als Fingerfood', text: food.finger }];
  for (const r of recipes) steps.push({ title: `${r.emoji} Im Rezept: ${r.name}`, text: `ab ${r.fromMonth} Monaten · ${r.minutes} Min.`, onPress: () => router.push(`/rezept/${r.id}`) });
  return (
    <Card>
      <Small bold soft={false} style={{ marginBottom: space.sm }}>{food.name.toUpperCase()} ZUBEREITEN</Small>
      {steps.map((st, i) => {
        const body = (
          <Row style={{ alignItems: 'flex-start', paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.smallBold, { color: color.sageDeep }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <P bold>{st.title}</P>
              <Small soft={false} style={{ marginTop: 2 }}>{st.text}</Small>
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
        <Small bold soft={false}>{RISK[food.chokingRisk].label}</Small>
      </Row>
    </Card>
  );
}
