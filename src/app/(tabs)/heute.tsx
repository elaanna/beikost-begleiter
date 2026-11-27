import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { FOOD_BY_ID } from '@/data/foods';
import { addDays, ageInMonths, diffDays, formatDayLong, todayIso } from '@/domain/dates';
import { dailyLine, greetingTitle } from '@/domain/greeting';
import { effectiveStartDate, introDays, planDays, preparationFor, SLOT_LABEL } from '@/domain/planner';
import { matchingFrozen } from '@/domain/stock';
import { morningInfo } from '@/domain/morning';
import { usePlanDays } from '@/state/usePlan';
import { SwapSheet } from '@/ui/SwapSheet';
import { MainMenu } from '@/ui/MainMenu';
import { Wordmark } from '@/ui/Wordmark';
import { CalendarHeart, ChevronRight, Sandwich, Baby, ChefHat, Milk, RefreshCw, Scale, Search, Users } from 'lucide-react-native';
import { TipOfDayCard } from '@/ui/DailyCards';
import { ToolRow, type Tool } from '@/ui/ToolRow';
import { portionFor } from '@/domain/portions';
import { planDayTasks, type ShiftEntry } from '@/domain/shifts';
import type { Liking, PlannedMeal, Reaction } from '@/domain/types';
import { getMeta, listAppointments, listShifts, setMeta } from '@/db/repo';
import { calendarHint, kindInfo, type Appointment } from '@/domain/calendar';
import { allergenKeepUp } from '@/domain/allergenStatus';
import { isTablePhase, suggestTable } from '@/domain/toddler';
import { TableSwitchCard, TableToday } from '@/ui/TableToday';
import { useChild } from '@/state/AppContext';
import { Button, Card, DayDots, FoodBadge, Glyph, Heading, Hero, IconLabel, Important, LockedNotice, P, Pill, PillRow, ProgressBar, Row, Screen, Small } from '@/ui/components';
import { QuickLog } from '@/ui/QuickLog';
import { useToast } from '@/ui/Toast';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';
import { t } from '@/i18n';


export default function Heute() {
  const { activeChild: child, children, logs, addLog, removeLog, selectChild, parentName, saveChild, isPro } = useChild();
  const db = useSQLiteContext();
  const [tableLater, setTableLater] = useState<string | null>(null);
  useEffect(() => { getMeta(db, `table_later:${child.id}`).then(setTableLater); }, [db, child.id]);
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
    const verdict = reaction !== 'keine' ? t('Reaktion notiert') : liking === 1 ? t('hat geschmeckt') : liking === -1 ? t('lieber nicht') : t('gegessen');
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

      <Small>{t('{0} · {1} Monate · {2}', { 0: child.name, 1: ageInMonths(child.birthDate, today), 2: formatDayLong(today) })}</Small>
      <Hero style={{ marginTop: 2 }}>{greetingTitle(new Date().getHours(), parentName)}</Hero>
      <DailyGreeting child={child} logs={logs} today={today} startDate={start} meal={isTablePhase(child) ? undefined : day.meals.find((m) => m.newFoodId)} />

      {/* Die häufigste Frage zuerst */}
      <Pressable
        onPress={() => router.push('/suche')}
        accessibilityRole="search"
        accessibilityLabel={t('Darf {0} schon … ? Suchen', { 0: child.name })}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, borderRadius: radius.pill,
          backgroundColor: color.surface, paddingHorizontal: space.xl, marginBottom: space.xl,
          borderWidth: 1.5, borderColor: pressed ? color.sage : color.line,
        })}
      >
        <Search size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />
        <Text style={[type.body, { color: color.inkSoft }]}>{t('Darf {0} schon …?', { 0: child.name })}</Text>
      </Pressable>

      <QuickBar />

      {suggestTable(child, today) && (!tableLater || diffDays(tableLater, today) >= 30) ? (
        <TableSwitchCard
          onYes={() => saveChild({ ...child, tableSince: today })}
          onLater={async () => { await setMeta(db, `table_later:${child.id}`, today); setTableLater(today); }}
        />
      ) : null}

      {isTablePhase(child) ? (isPro ? <TableToday /> : (
        <LockedNotice text={t('Der Familientisch ab 1 Jahr – Tagesplan mit 5 Mahlzeiten, Kleinkind-Rezepte und Kita-Brotdose – gehört zum Beikost-Paket. Unter Kind bearbeiten könnt ihr zurück zum Breiplan.')} onUnlock={() => router.push('/paywall')} />
      )) : null}

      {!isTablePhase(child) && daysToStart > 0 ? <ReadinessCard /> : null}

      {isTablePhase(child) ? null : daysToStart > 0 ? (
        <Card tone="peach">
          <Text style={{ fontSize: 44 }}>🥄</Text>
          <Heading style={{ marginTop: space.sm }}>{t('Noch {0}', { 0: daysToStart })}{' '}{daysToStart === 1 ? t('Tag') : t('Tage')} {' '}{t('bis zum ersten Löffel')}</Heading>
          <P soft style={{ marginTop: space.xs }}>{t('Geplant für {0}. Bis dahin kannst du die Reifezeichen beobachten.', { 0: formatDayLong(start) })}</P>
          <Button label={t('Reifezeichen-Checkliste')} style={{ marginTop: space.lg }} onPress={() => router.push('/reifecheck')} />
        </Card>
      ) : day.meals.length > 0 ? (
        <>
          <Row style={{ gap: space.sm, marginBottom: space.md }}>
            <View style={{ flex: 1 }}><ProgressBar value={doneCount} max={day.meals.length} /></View>
            <Small bold soft={false}>{t('{0}/{1} Mahlzeiten', { 0: doneCount, 1: day.meals.length })}</Small>
          </Row>
          {current ? (
            <MealFocus meal={current} dayIndex={diffDays(start, today)} onLog={(l, r) => logMeal(current, l, r)} />
          ) : (
            <Card tone="sage" style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 48 }}>🎉</Text>
              <Heading style={{ marginTop: space.sm, textAlign: 'center' }}>{t('Alles notiert für heute')}</Heading>
              <P soft style={{ textAlign: 'center' }}>{t('Was morgen kommt, siehst du unter „Plan“.')}</P>
            </Card>
          )}
          {later.length ? (
            <Small style={{ marginBottom: space.lg, textAlign: 'center' }}>
              {t('Später:')}{' '}{later.map((m) => `${SLOT_LABEL[m.slot]} (${m.title})`).join(' · ')}
            </Small>
          ) : null}
          <MorningCard />
        </>
      ) : null}

      <CalendarCard />
      {daysToStart <= 0 ? <KeepUpCard plannedToday={isTablePhase(child) ? [] : day.meals.flatMap((m) => m.foodIds)} /> : null}

      <TipOfDayCard />
    </Screen>
  );
}

/** Nächster Termin oder eine anstehende U-Untersuchung – führt in den Familienkalender. */
function CalendarCard() {
  const db = useSQLiteContext();
  const { activeChild: child } = useChild();
  const [items, setItems] = useState<Appointment[]>([]);
  useFocusEffect(useCallback(() => { listAppointments(db).then(setItems).catch(() => undefined); }, [db]));
  const hint = calendarHint(child, items, todayIso());
  if (!hint) return null;
  if (hint.type === 'termin') {
    const a = hint.appointment;
    const k = kindInfo(a.kind);
    const when = hint.inDays === 0 ? t('Heute') : hint.inDays === 1 ? t('Morgen') : t('In {0} Tagen', { 0: hint.inDays });
    return (
      <Card onPress={() => router.push('/termine')} accessibilityLabel={t('Familienkalender öffnen')}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Glyph icon={k.emoji} />
          <View style={{ flex: 1 }}>
            <Small>{a.time ? t('{0}, {1} Uhr', { 0: when, 1: a.time }) : when}</Small>
            <Text style={[type.bodyBold, { color: brand.blue }]}>{a.title || k.label}</Text>
          </View>
        </Row>
      </Card>
    );
  }
  const w = hint.window;
  return (
    <Card onPress={() => router.push({ pathname: '/termine', params: { u: w.id } })} accessibilityLabel={t('Termin für die {0} eintragen', { 0: w.id })}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Glyph icon={CalendarHeart} />
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyBold, { color: brand.blue }]}>{w.state === 'jetzt' ? t('Zeitraum für die {0} läuft', { 0: w.id }) : t('Bald steht die {0} an', { 0: w.id })}</Text>
          <Small soft={false} style={{ marginTop: space.xs }}>{t('{0} – schon einen Termin bei der Kinderarztpraxis? Hier eintragen, dann erinnert dich die App.', { 0: w.label })}</Small>
        </View>
      </Row>
    </Card>
  );
}

/** Allergene dranhalten: eingeführte Allergene, die seit einer Woche nicht mehr dabei waren (S3-Leitlinie). */
function KeepUpCard({ plannedToday }: { plannedToday: string[] }) {
  const db = useSQLiteContext();
  const { activeChild: child, logs } = useChild();
  const today = todayIso();
  const key = `keepup_hide:${child.id}`;
  const [hidden, setHidden] = useState<string | null>(null);
  useEffect(() => { getMeta(db, key).then(setHidden); }, [db, key]);
  const items = allergenKeepUp(child, logs, today, plannedToday).slice(0, 3);
  if (!items.length || hidden === today) return null;
  return (
    <Card tone="lilac">
      <Text style={[type.bodyBold, { color: brand.blue }]}>{t('Allergene dranhalten')}</Text>
      <Small soft={false} style={{ marginTop: space.xs, marginBottom: space.sm }}>
        {t('Eingeführte Allergene am besten etwa zweimal pro Woche weitergeben – regelmäßig zu essen schützt eher, als sie wieder wegzulassen.')}</Small>
      {items.map((k) => (
        <Pressable key={k.guide.id} onPress={() => router.push(`/food/${k.foodId}`)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingVertical: space.xs }}>
          <Text style={{ fontSize: 22 }}>{k.guide.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodyBold, { color: color.ink }]}>{t('{0}: zuletzt vor {1} Tagen', { 0: k.guide.name, 1: k.days })}</Text>
            <Small soft={false} style={{ color: brand.blue }}>{t('Zum Beispiel: {0}', { 0: FOOD_BY_ID[k.foodId]?.name ?? '' })}</Small>
          </View>
          <ChevronRight size={20} strokeWidth={ICON.stroke} color={color.inkSoft} />
        </Pressable>
      ))}
      <Pressable onPress={async () => { await setMeta(db, key, today); setHidden(today); }} accessibilityRole="button" hitSlop={8} style={{ marginTop: space.sm }}>
        <Text style={[type.smallBold, { color: brand.blue }]}>{t('Heute ausblenden')}</Text>
      </Pressable>
    </Card>
  );
}

/** Frühstück im Breiplan: morgens Milch, ab etwa 10 Monaten Übergang zum Familienfrühstück. */
function MorningCard() {
  const { activeChild: child } = useChild();
  const info = morningInfo(child, todayIso());
  return (
    <Card tone={info.stage === 'uebergang' ? 'yellow' : undefined}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Glyph icon={info.stage === 'uebergang' ? Sandwich : Milk} />
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyBold, { color: brand.blue }]}>{info.title}</Text>
          <Small soft={false} style={{ marginTop: space.xs }}>{info.text}</Small>
        </View>
      </Row>
    </Card>
  );
}

/** Vor dem Start: Checkliste zum Beobachten der Reifezeichen (ohne Bewertung durch die App). */
function ReadinessCard() {
  const { activeChild: child } = useChild();
  return (
    <Card tone="sage" onPress={() => router.push('/reifecheck')} accessibilityLabel={t('Reifezeichen-Checkliste öffnen')}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 40 }}>🌱</Text>
        <View style={{ flex: 1 }}>
          <Heading>{t('Reifezeichen beobachten')}</Heading>
          <Small soft={false} style={{ marginTop: space.xs }}>
            {t('Vier Zeichen, auf die du bei {0} achten kannst – als Checkliste zum Abhaken.', { 0: child.name })}</Small>
          <IconLabel label={t('Checkliste öffnen')} chevron small={false} style={{ marginTop: space.sm }} />
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
      <Small bold soft={false}>{t('Jetzt dran · {0}', { 0: SLOT_LABEL[meal.slot] })}</Small>
      {newFood ? (
        <>
          <Row style={{ marginTop: space.md, alignItems: 'flex-start' }}>
            <FoodBadge emoji={newFood.emoji} size={84} tone="white" />
            <View style={{ flex: 1 }}>
              <Text style={[type.smallBold, { color: color.peachDeep }]}>{t('Neu')}{newFood.allergens.length ? t(' · Allergen') : ''}</Text>
              <Text style={[type.title, { color: color.ink }]}>{newFood.name}</Text>
              <Row style={{ gap: space.sm, marginTop: space.xs }}>
                <DayDots day={meal.newFoodDay ?? 1} total={introDays(newFood)} />
                <Small soft={false}>{t('Tag {0} von {1}', { 0: meal.newFoodDay, 1: introDays(newFood) })}</Small>
              </Row>
            </View>
          </Row>
          <P style={{ marginTop: space.lg }}>{preparationFor(newFood, child)}</P>
          {newFood.hint ? <View style={{ marginTop: space.md }}><Important>{t(newFood.hint)}</Important></View> : null}
          {others.length ? <Small soft={false} style={{ marginBottom: space.sm }}>{t('Dazu:')}{' '}{others.map((f) => f.name).join(', ')}</Small> : null}
        </>
      ) : (
        <>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: space.sm }}>
            <Text style={[type.title, { color: color.ink, flex: 1 }]}>{t(meal.title)}</Text>
            <Pressable onPress={() => setSwapOpen(true)} accessibilityRole="button" accessibilityLabel={t('Mahlzeit tauschen')} hitSlop={8} style={{ paddingTop: 6 }}>
              <IconLabel icon={RefreshCw} label={t('Tauschen')} />
            </Pressable>
          </Row>
          {meal.recipeId ? (
            <Pressable onPress={() => router.push(`/rezept/${meal.recipeId}`)} accessibilityRole="link">
              <IconLabel icon={ChefHat} label={t('Zum Rezept')} chevron style={{ marginTop: space.xs }} />
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
        <IconLabel icon={Scale} label={showAmount ? t('Menge ausblenden') : t('Wie viel?')} />
      </Pressable>
      {showAmount ? (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.sm, padding: space.md, marginBottom: space.md }}>
          {portion.lines.map((l) => (
            <Row key={l.label} style={{ justifyContent: 'space-between', paddingVertical: 3 }}>
              <Small soft={false} style={{ flex: 1 }}>{t(l.label)}</Small>
              <Small bold soft={false}>{l.amount}</Small>
            </Row>
          ))}
          <Small soft={false} style={{ marginTop: space.xs }}>{portion.note}</Small>
        </View>
      ) : null}

      {frozen ? (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.sm, padding: space.md, marginBottom: space.md }}>
          <Small bold soft={false}>{t('Im Gefrierfach: {0}', { 0: frozen.portions })}{' '}{frozen.portions === 1 ? t('Portion') : t('Portionen')} {frozen.name}</Small>
          <Pressable
            onPress={async () => {
              await saveStock({ ...frozen, portions: frozen.portions - 1 });
              toast({ emoji: '❄️', text: t('1 Portion aus dem Gefrierfach genommen'), undo: () => saveStock(frozen) });
            }}
            accessibilityRole="button"
          >
            <Text style={[type.smallBold, { color: color.sageDeep, marginTop: space.xs }]}>{t('1 Portion nehmen')}</Text>
          </Pressable>
        </View>
      ) : null}
      <QuickLog onLog={onLog} />
      <SwapSheet date={todayIso()} meal={swapOpen ? meal : null} onClose={() => setSwapOpen(false)} />
      {newFood ? <Button label={t('Mehr zu diesem Lebensmittel')} variant="ghost" onPress={() => router.push(`/food/${newFood.id}`)} /> : null}
    </Card>
  );
}

/** Abwechslung: schon Angebotenes, das länger nicht dabei war – reine Organisationshilfe. */

/** Schnellleiste: Windel eintragen und wer gerade dran ist (ohne Dienstplan: Einstieg zum Anlegen). */
function QuickBar() {
  const db = useSQLiteContext();
  const { activeChild: child, logs, digestion, caregivers, familySettings, shiftsVersion } = useChild();
  const today = todayIso();
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  useEffect(() => {
    listShifts(db, addDays(today, -1), today).then(setShifts);
  }, [db, today, shiftsVersion]);

  const meals = planDays(child, logs, today, 1)[0].meals.map((m) => m.slot);
  const tasks = caregivers.length ? planDayTasks({ date: today, caregivers, shifts, settings: familySettings, meals }) : [];
  const gaps = tasks.filter((tx) => !tx.caregiverId).length;
  const now = new Date();
  const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nextTask = tasks.find((tx) => tx.time >= nowHm) ?? tasks[0];
  const nextWho = nextTask ? caregivers.find((c) => c.id === nextTask.caregiverId) : undefined;
  const stoolToday = digestion.filter((d) => d.date === today).length;

  const tools: Tool[] = [
    { icon: Baby, label: t('Windel'), sub: stoolToday ? t('{0}× notiert', { 0: stoolToday }) : t('Eintragen'), onPress: () => router.push('/verdauung') },
  ];
  tools.push({
    icon: Users,
    label: t('Wer ist dran?'),
    sub: !caregivers.length ? t('Dienste planen') : nextTask ? `${nextTask.time} ${nextTask.label}: ${nextWho ? nextWho.name : '–'}` : t('Heute nichts'),
    alert: gaps ? (gaps === 1 ? t('1 Lücke') : t('{0} Lücken', { 0: gaps })) : undefined,
    onPress: () => router.push('/dienste'),
  });
  return <ToolRow tools={tools} />;
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
      <P style={{ flex: 1 }}>{t(line.text)}</P>
    </Row>
  );
}

