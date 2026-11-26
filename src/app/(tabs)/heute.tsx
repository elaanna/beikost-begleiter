import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { FOOD_BY_ID } from '@/data/foods';
import { FAMILY_FROM_MONTHS } from '@/data/recipes';
import { addDays, ageInMonths, diffDays, formatDayLong, todayIso } from '@/domain/dates';
import { drinkStage, ironWeek, revisitFoods } from '@/domain/care';
import { genitive } from '@/domain/beikostOverview';
import { dailyLine, greetingTitle } from '@/domain/greeting';
import { effectiveStartDate, introDays, planDays, preparationFor, SLOT_LABEL } from '@/domain/planner';
import { matchingFrozen } from '@/domain/stock';
import { usePlanDays } from '@/state/usePlan';
import { SwapSheet } from '@/ui/SwapSheet';
import { MainMenu } from '@/ui/MainMenu';
import { Wordmark } from '@/ui/Wordmark';
import { Ban, Baby, CalendarDays, ChartColumn, ChefHat, GlassWater, Lightbulb, Milk, RefreshCw, Scale, ScanBarcode, Search, Snowflake, Users, type LucideIcon } from 'lucide-react-native';
import { SeasonCard, TipOfDayCard } from '@/ui/DailyCards';
import { portionFor } from '@/domain/portions';
import { recipeFits } from '@/domain/recipes';
import { planDayTasks, type ShiftEntry } from '@/domain/shifts';
import type { Liking, PlannedMeal, Reaction } from '@/domain/types';
import { listShifts } from '@/db/repo';
import { useChild } from '@/state/AppContext';
import { Button, Card, DayDots, FoodBadge, Glyph, Heading, Hero, IconLabel, type IconLike, Important, P, Pill, PillRow, ProgressBar, Row, Screen, Small } from '@/ui/components';
import { QuickLog } from '@/ui/QuickLog';
import { useToast } from '@/ui/Toast';
import { openWissen } from '@/ui/nav';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';


export default function Heute() {
  const { activeChild: child, children, logs, addLog, removeLog, selectChild, parentName } = useChild();
  const toast = useToast();
  const today = todayIso();
  const start = effectiveStartDate(child);
  const daysToStart = diffDays(today, start);
  const day = usePlanDays(today, 1)[0];
  const loggedToday = new Set(logs.filter((l) => l.date === today).map((l) => l.foodId));
  const isDone = (m: PlannedMeal) => m.foodIds.every((id) => loggedToday.has(id));
  const doneCount = day.meals.filter(isDone).length;
  const current = day.meals.find((m) => !isDone(m));
  const later = day.meals.filter((m) => m !== current && !isDone(m));
  const logMeal = async (meal: PlannedMeal, liking: Liking, reaction: Reaction) => {
    const ids: string[] = [];
    for (const id of meal.foodIds) {
      if (loggedToday.has(id)) continue;
      const isNew = id === meal.newFoodId || !meal.newFoodId;
      const logId = await addLog({ foodId: id, date: today, liking: isNew ? liking : 0, reaction: isNew ? reaction : 'keine', note: '' });
      if (logId) ids.push(logId);
    }
    const main = meal.newFoodId ? FOOD_BY_ID[meal.newFoodId] : null;
    const what = main ? main.name : meal.title;
    const verdict = reaction !== 'keine' ? 'Reaktion notiert' : liking === 1 ? 'hat geschmeckt' : liking === -1 ? 'lieber nicht' : 'gegessen';
    toast({
      emoji: reaction !== 'keine' ? '❗' : liking === 1 ? '♥' : '✓',
      text: `${what}: ${verdict}`,
      undo: async () => {
        for (const id of ids) await removeLog(id);
      },
    });
  };

  return (
    <Screen>
      {/* Header: Wortmarke + Menü (Referenzscreen nach NIMOU Brand Guidelines) */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
        <Wordmark size={30} />
        <MainMenu />
      </Row>
      {children.length > 1 ? (
        <PillRow>
          {children.map((c) => <Pill key={c.id} label={c.name} selected={c.id === child.id} onPress={() => selectChild(c.id)} />)}
        </PillRow>
      ) : null}

      <Small>{child.name} · {ageInMonths(child.birthDate, today)} Monate · {formatDayLong(today)}</Small>
      <Hero style={{ marginTop: 2 }}>{greetingTitle(new Date().getHours(), parentName)}</Hero>
      <DailyGreeting child={child} logs={logs} today={today} startDate={start} meal={day.meals.find((m) => m.newFoodId)} />

      {/* Die häufigste Frage zuerst */}
      <Pressable
        onPress={() => router.push('/suche')}
        accessibilityRole="search"
        accessibilityLabel={`Darf ${child.name} schon … ? Suchen`}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, borderRadius: radius.pill,
          backgroundColor: color.surface, paddingHorizontal: space.xl, marginBottom: space.xl,
          borderWidth: 1.5, borderColor: pressed ? color.sage : color.line,
        })}
      >
        <Search size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />
        <Text style={[type.body, { color: color.inkSoft }]}>Darf {child.name} schon …?</Text>
      </Pressable>

      {daysToStart > 0 ? <ReadinessCard /> : null}

      {daysToStart > 0 ? (
        <Card tone="peach">
          <Text style={{ fontSize: 44 }}>🥄</Text>
          <Heading style={{ marginTop: space.sm }}>Noch {daysToStart} {daysToStart === 1 ? 'Tag' : 'Tage'} bis zum ersten Löffel</Heading>
          <P soft style={{ marginTop: space.xs }}>Geplant für {formatDayLong(start)}. Bis dahin kannst du die Reifezeichen beobachten.</P>
          <Button label="Reifezeichen-Checkliste" style={{ marginTop: space.lg }} onPress={() => router.push('/reifecheck')} />
        </Card>
      ) : day.meals.length > 0 ? (
        <>
          <Row style={{ gap: space.sm, marginBottom: space.md }}>
            <View style={{ flex: 1 }}><ProgressBar value={doneCount} max={day.meals.length} /></View>
            <Small bold soft={false}>{doneCount}/{day.meals.length} Mahlzeiten</Small>
          </Row>
          {current ? (
            <MealFocus meal={current} dayIndex={diffDays(start, today)} onLog={(l, r) => logMeal(current, l, r)} />
          ) : (
            <Card tone="sage" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48 }}>🎉</Text>
              <Heading style={{ marginTop: space.sm, textAlign: 'center' }}>Alles notiert für heute</Heading>
              <P soft style={{ textAlign: 'center' }}>Was morgen kommt, siehst du unter „Woche“.</P>
            </Card>
          )}
          {later.length ? (
            <Small style={{ marginBottom: space.lg, textAlign: 'center' }}>
              Später: {later.map((m) => `${SLOT_LABEL[m.slot]} (${m.title})`).join(' · ')}
            </Small>
          ) : null}
        </>
      ) : null}

      <BrandTiles />

      {daysToStart <= 0 ? <Revisit /> : null}
      <TipOfDayCard />
      <SeasonCard />

      <Heading style={{ marginBottom: space.md }}>Heute auch</Heading>
      <Tiles />
    </Screen>
  );
}

/** Vor dem Start: Checkliste zum Beobachten der Reifezeichen (ohne Bewertung durch die App). */
function ReadinessCard() {
  const { activeChild: child } = useChild();
  return (
    <Card tone="sage" onPress={() => router.push('/reifecheck')} accessibilityLabel="Reifezeichen-Checkliste öffnen">
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 40 }}>🌱</Text>
        <View style={{ flex: 1 }}>
          <Heading>Reifezeichen beobachten</Heading>
          <Small soft={false} style={{ marginTop: space.xs }}>
            Vier Zeichen, auf die du bei {child.name} achten kannst – als Checkliste zum Abhaken.
          </Small>
          <IconLabel label="Checkliste öffnen" chevron small={false} style={{ marginTop: space.sm }} />
        </View>
      </Row>
    </Card>
  );
}

function MealFocus({ meal, dayIndex, onLog }: { meal: PlannedMeal; dayIndex: number; onLog: (l: Liking, r: Reaction) => void }) {
  const { activeChild: child, stock, saveStock } = useChild();
  const toast = useToast();
  const [showAmount, setShowAmount] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const frozen = matchingFrozen(meal, stock)[0];
  const newFood = meal.newFoodId ? FOOD_BY_ID[meal.newFoodId] : undefined;
  const others = meal.foodIds.filter((id) => id !== meal.newFoodId).map((id) => FOOD_BY_ID[id]);
  const portion = portionFor(meal.slot, dayIndex, meal.foodIds);

  return (
    <Card tone="yellow" hero>
      <Small bold soft={false}>Jetzt dran · {SLOT_LABEL[meal.slot]}</Small>
      {newFood ? (
        <>
          <Row style={{ marginTop: space.md, alignItems: 'flex-start' }}>
            <FoodBadge emoji={newFood.emoji} size={84} tone="white" />
            <View style={{ flex: 1 }}>
              <Text style={[type.smallBold, { color: color.peachDeep }]}>Neu{newFood.allergens.length ? ' · Allergen' : ''}</Text>
              <Text style={[type.title, { color: color.ink }]}>{newFood.name}</Text>
              <Row style={{ gap: space.sm, marginTop: space.xs }}>
                <DayDots day={meal.newFoodDay ?? 1} total={introDays(newFood)} />
                <Small soft={false}>Tag {meal.newFoodDay} von {introDays(newFood)}</Small>
              </Row>
            </View>
          </Row>
          <P style={{ marginTop: space.lg }}>{preparationFor(newFood, child)}</P>
          {newFood.hint ? <View style={{ marginTop: space.md }}><Important>{newFood.hint}</Important></View> : null}
          {others.length ? <Small soft={false} style={{ marginBottom: space.sm }}>Dazu: {others.map((f) => f.name).join(', ')}</Small> : null}
        </>
      ) : (
        <>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: space.sm }}>
            <Text style={[type.title, { color: color.ink, flex: 1 }]}>{meal.title}</Text>
            <Pressable onPress={() => setSwapOpen(true)} accessibilityRole="button" accessibilityLabel="Mahlzeit tauschen" hitSlop={8} style={{ paddingTop: 6 }}>
              <IconLabel icon={RefreshCw} label="Tauschen" />
            </Pressable>
          </Row>
          {meal.recipeId ? (
            <Pressable onPress={() => router.push(`/rezept/${meal.recipeId}`)} accessibilityRole="link">
              <IconLabel icon={ChefHat} label="Zum Rezept" chevron style={{ marginTop: space.xs }} />
            </Pressable>
          ) : null}
          <Row style={{ flexWrap: 'wrap', gap: space.sm, marginVertical: space.md }}>
            {others.map((f) => (
              <Pressable key={f.id} onPress={() => router.push(`/food/${f.id}`)} accessibilityRole="link">
                <View style={{ alignItems: 'center', width: 76 }}>
                  <FoodBadge emoji={f.emoji} size={56} tone="sage" />
                  <Small soft={false} style={{ textAlign: 'center' }}>{f.name}</Small>
                </View>
              </Pressable>
            ))}
          </Row>
        </>
      )}

      <Pressable onPress={() => setShowAmount((v) => !v)} accessibilityRole="button" style={{ paddingVertical: space.sm, marginBottom: space.sm }}>
        <IconLabel icon={Scale} label={showAmount ? 'Menge ausblenden' : 'Wie viel?'} />
      </Pressable>
      {showAmount ? (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.sm, padding: space.md, marginBottom: space.md }}>
          {portion.lines.map((l) => (
            <Row key={l.label} style={{ justifyContent: 'space-between', paddingVertical: 3 }}>
              <Small soft={false} style={{ flex: 1 }}>{l.label}</Small>
              <Small bold soft={false}>{l.amount}</Small>
            </Row>
          ))}
          <Small soft={false} style={{ marginTop: space.xs }}>{portion.note}</Small>
        </View>
      ) : null}

      {frozen ? (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.sm, padding: space.md, marginBottom: space.md }}>
          <Small bold soft={false}>Im Gefrierfach: {frozen.portions} {frozen.portions === 1 ? 'Portion' : 'Portionen'} {frozen.name}</Small>
          <Pressable
            onPress={async () => {
              await saveStock({ ...frozen, portions: frozen.portions - 1 });
              toast({ emoji: '❄️', text: '1 Portion aus dem Gefrierfach genommen', undo: () => saveStock(frozen) });
            }}
            accessibilityRole="button"
          >
            <Text style={[type.smallBold, { color: color.sageDeep, marginTop: space.xs }]}>1 Portion nehmen</Text>
          </Pressable>
        </View>
      ) : null}
      <QuickLog onLog={onLog} />
      <SwapSheet date={todayIso()} meal={swapOpen ? meal : null} onClose={() => setSwapOpen(false)} />
      {newFood ? <Button label="Mehr zu diesem Lebensmittel" variant="ghost" onPress={() => router.push(`/food/${newFood.id}`)} /> : null}
    </Card>
  );
}

/** Abwechslung: schon Angebotenes, das länger nicht dabei war – reine Organisationshilfe. */
function Revisit() {
  const { activeChild: child, logs, addLog, removeLog } = useChild();
  const toast = useToast();
  const today = todayIso();
  const items = useMemo(() => revisitFoods(child, logs, today).slice(0, 3), [child, logs, today]);
  if (!items.length) return null;
  return (
    <Card tone="butter">
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 30 }}>🔁</Text>
        <View style={{ flex: 1 }}>
          <P bold>Mal wieder anbieten?</P>
          <Small soft={false}>Schon probiert, aber länger nicht dabei.</Small>
        </View>
      </Row>
      {items.map((r) => {
        const food = FOOD_BY_ID[r.foodId];
        return (
          <Row key={r.foodId} style={{ marginTop: space.md, justifyContent: 'space-between' }}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/food/${food.id}`)} accessibilityRole="link">
              <P bold>{food.emoji} {food.name}{r.liked ? ' ♥' : ''}</P>
              <Small>zuletzt vor {r.daysSince} Tagen</Small>
            </Pressable>
            <Pill
              label="Heute gegeben"
              onPress={async () => {
                const id = await addLog({ foodId: food.id, date: today, liking: 0, reaction: 'keine', note: '' });
                toast({ emoji: '✓', text: `${food.name} notiert`, undo: id ? () => removeLog(id) : undefined });
              }}
            />
          </Row>
        );
      })}
    </Card>
  );
}

/** Kompakte Kacheln statt langer Karten. */
function Tiles() {
  const db = useSQLiteContext();
  const { activeChild: child, logs, digestion, caregivers, familySettings, shiftsVersion, stock } = useChild();
  const today = todayIso();
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  useEffect(() => {
    listShifts(db, addDays(today, -1), today).then(setShifts);
  }, [db, today, shiftsVersion]);

  const meals = planDays(child, logs, today, 1)[0].meals.map((m) => m.slot);
  const tasks = caregivers.length ? planDayTasks({ date: today, caregivers, shifts, settings: familySettings, meals }) : [];
  const gaps = tasks.filter((t) => !t.caregiverId).length;
  const now = new Date();
  const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextTask = tasks.find((t) => t.time >= nowHm) ?? tasks[0];
  const nextWho = nextTask ? caregivers.find((c) => c.id === nextTask.caregiverId) : undefined;

  const stoolToday = digestion.filter((d) => d.date === today).length;
  const age = ageInMonths(child.birthDate, today);
  const recipe = age >= FAMILY_FROM_MONTHS ? recipeFits(child, logs, { category: 'familie' }).find((f) => !f.blocked) : undefined;
  const iron = ironWeek(child, logs, today);
  const frozenCount = stock.filter((x) => x.kind === 'gefroren').reduce((n, x) => n + x.portions, 0);
  const drink = drinkStage(child, today);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
      <Tile
        emoji={Baby}
        title="Windel"
        sub={stoolToday ? `${stoolToday}× notiert` : 'Noch nichts notiert'}
        onPress={() => router.push('/verdauung')}
      />
      <Tile
        emoji={Users}
        title="Wer ist dran?"
        sub={!caregivers.length ? 'Dienste planen' : nextTask ? `${nextTask.time} ${nextTask.label}: ${nextWho ? nextWho.name : '–'}` : 'Heute nichts'}
        alert={gaps ? `${gaps} ${gaps === 1 ? 'Lücke' : 'Lücken'}` : undefined}
        onPress={() => router.push('/dienste')}
      />
      {recipe ? (
        <Tile emoji={recipe.recipe.emoji} title="Familienessen" sub={recipe.recipe.name} onPress={() => router.push(`/rezept/${recipe.recipe.id}`)} />
      ) : (
        <Tile emoji={Scale} title="Mengen" sub="Wie viel Brei?" onPress={() => openWissen('portionen', 'brei')} />
      )}
      <Tile emoji={ScanBarcode} title="Im Regal scannen" sub="Was steckt drin?" onPress={() => router.push('/scanner')} />
      <Tile
        emoji={Snowflake}
        title="Gefrierfach"
        sub={frozenCount ? `${frozenCount} ${frozenCount === 1 ? 'Portion' : 'Portionen'} vorgekocht` : 'Vorkochen & Vorrat'}
        onPress={() => router.push('/vorrat')}
      />
      <Tile emoji={Ban} title="Tabu im 1. Jahr" sub="Honig, Nüsse, Salz …" red onPress={() => openWissen('sicherheit')} />
      {logs.some((l) => l.childId === child.id) ? (
        <Tile
          emoji={ChartColumn}
          title={`${genitive(child.name)} Beikost`}
          sub="Heute & Woche im Überblick"
          onPress={() => router.push('/uebersicht')}
        />
      ) : null}
      {drink !== 'noch_nicht' ? (
        <Tile
          emoji={drink === 'kuhmilch' ? Milk : GlassWater}
          title="Trinken"
          sub={drink === 'kuhmilch' ? 'Milch aus dem Becher' : 'Wasser zu jedem Brei'}
          onPress={() => openWissen('portionen', 'trinken')}
        />
      ) : null}
    </View>
  );
}

function Tile({ emoji, title, sub, alert, red, onPress }: {
  emoji: IconLike; title: string; sub: string; alert?: string; red?: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${alert ?? sub}`}
      style={({ pressed }) => ({
        width: '47.5%', minHeight: 116, borderRadius: radius.lg, padding: space.lg,
        backgroundColor: red ? color.redSoft : color.surface,
        borderWidth: alert ? 2 : 0, borderColor: color.red,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Glyph icon={emoji} size={28} color={red ? color.redDeep : brand.blue} />
      <Text style={[type.bodyBold, { color: red ? color.redDeep : color.ink, marginTop: space.xs }]}>{title}</Text>
      {alert ? (
        <Text style={[type.smallBold, { color: color.red }]} numberOfLines={2}>! {alert}</Text>
      ) : (
        <Text style={[type.small, { color: red ? color.redDeep : color.inkSoft }]} numberOfLines={2}>{sub}</Text>
      )}
    </Pressable>
  );
}

function DailyGreeting({ child, logs, today, startDate, meal }: {
  child: Parameters<typeof dailyLine>[0]['child']; logs: Parameters<typeof dailyLine>[0]['logs']; today: string; startDate: string; meal?: PlannedMeal;
}) {
  const newFood = meal?.newFoodId ? FOOD_BY_ID[meal.newFoodId] : undefined;
  const line = dailyLine({
    child, logs, today, startDate,
    newFoodId: meal?.newFoodId, newFoodDay: meal?.newFoodDay, newFoodTotal: newFood ? introDays(newFood) : undefined,
  });
  return (
    <Row style={{ backgroundColor: color.sageSoft, borderRadius: radius.lg, padding: space.md, marginTop: space.md, marginBottom: space.lg, alignItems: 'center' }}>
      <Text style={{ fontSize: 26 }}>{line.emoji}</Text>
      <P style={{ flex: 1 }}>{line.text}</P>
    </Row>
  );
}

/** Drei Einstiege wie im Mockup – Farben nach Rolle: Gelb = Planung, Peach = Rezepte, Lilac = Wissen. */
function BrandTiles() {
  const tiles: { label: string; Icon: LucideIcon; bg: string; href: '/woche' | '/rezepte' | '/wissen' }[] = [
    { label: 'Wochenplan', Icon: CalendarDays, bg: brand.yellowSoft, href: '/woche' },
    { label: 'Rezepte', Icon: ChefHat, bg: brand.peachSoft, href: '/rezepte' },
    { label: 'Wissen', Icon: Lightbulb, bg: brand.lilacSoft, href: '/wissen' },
  ];
  return (
    <Row style={{ gap: space.md, marginBottom: space.xl }}>
      {tiles.map(({ label, Icon, bg, href }) => (
        <Pressable key={label} onPress={() => router.navigate(href)} accessibilityRole="button" accessibilityLabel={label}
          style={({ pressed }) => ({ flex: 1, backgroundColor: bg, borderRadius: radius.lg, paddingVertical: space.lg, alignItems: 'center', gap: space.sm, opacity: pressed ? 0.8 : 1 })}>
          <Icon size={ICON.size + 4} strokeWidth={ICON.stroke} color={brand.blue} />
          <Text style={[type.smallBold, { color: brand.text }]}>{label}</Text>
        </Pressable>
      ))}
    </Row>
  );
}
