import { Stack, useLocalSearchParams } from 'expo-router';
import { Switch, Text, View } from 'react-native';
import { ALLERGEN_LABEL, CATEGORY_LABEL, FOOD_BY_ID } from '@/data/foods';
import { SOURCES, STATEMENTS } from '@/data/guidelines';
import { formatDayLong, todayIso } from '@/domain/dates';
import { blockReason, introDays, MAINTENANCE } from '@/domain/planner';
import { useChild } from '@/state/AppContext';
import { Button, Card, FoodBadge, Heading, Hero, Important, P, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { QuickLog } from '@/ui/QuickLog';
import { useToast } from '@/ui/Toast';
import { color, space, type } from '@/ui/theme';

const RISK = {
  niedrig: { label: 'Geringes Verschluckrisiko', emoji: '🟢' },
  mittel: { label: 'Mittleres Verschluckrisiko', emoji: '🟡' },
  hoch: { label: 'Hohes Verschluckrisiko', emoji: '🔴' },
} as const;
const REACTION_LABEL = { keine: '', haut: 'Haut', verdauung: 'Bauch', erbrechen: 'Erbrechen', atemwege: 'Atmung/Schwellung' } as const;
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
      <Row style={{ marginBottom: space.lg }}>
        <FoodBadge emoji={food.emoji} size={88} />
        <View style={{ flex: 1 }}>
          <Hero style={{ fontSize: 30, lineHeight: 36 }}>{food.name}</Hero>
          <Small>{CATEGORY_LABEL[food.category]}{food.ironRich ? ' · eisenreich' : ''}</Small>
        </View>
      </Row>

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

      <Card>
        <Heading>🥣 Als Brei</Heading>
        <P style={{ marginTop: space.xs }}>{food.brei}</P>
        <Heading style={{ marginTop: space.lg }}>✋ Als Fingerfood</Heading>
        <P style={{ marginTop: space.xs }}>{food.finger}</P>
        <Row style={{ marginTop: space.lg, gap: space.sm }}>
          <Text style={{ fontSize: 16 }}>{RISK[food.chokingRisk].emoji}</Text>
          <Small bold soft={false}>{RISK[food.chokingRisk].label}</Small>
        </Row>
      </Card>

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
