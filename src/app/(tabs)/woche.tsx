import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CATEGORY_LABEL, FOOD_BY_ID } from '@/data/foods';
import { addDays, formatDay, todayIso, weekStart } from '@/domain/dates';
import { SLOT_LABEL } from '@/domain/planner';
import type { PlannedMeal } from '@/domain/types';
import { usePlanDays } from '@/state/usePlan';
import { SwapSheet } from '@/ui/SwapSheet';
import { planHtml } from '@/domain/pdf';
import { prepTasks, shoppingList } from '@/domain/shopping';
import { pantryFoodIds } from '@/domain/stock';
import { listChecks, toggleCheck } from '@/db/repo';
import { useChild } from '@/state/AppContext';
import { Button, Card, FoodBadge, Heading, Hero, IconLabel, LockedNotice, P, Row, Screen, Segmented, Small, Title } from '@/ui/components';
import { ChevronLeft, ChevronRight, CookingPot, FileText, RefreshCw, Sandwich, Scale, ScanBarcode, Share2, ShoppingBasket } from 'lucide-react-native';
import { shoppingText } from '@/domain/shareText';
import { isTablePhase, tableDays, type TableDay } from '@/domain/toddler';
import { TABLE_SLOT_INFO } from '@/data/toddler';
import { shareHtmlAsPdf } from '@/ui/exportPdf';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';
import { t } from '@/i18n';

type View_ = 'woche' | 'einkauf';

export default function Plan() {
  const db = useSQLiteContext();
  const { activeChild: child, isPro, stock, logs } = useChild();
  const table = isTablePhase(child);
  const inPantry = useMemo(() => pantryFoodIds(stock), [stock]);
  const today = todayIso();
  const [mode, setMode] = useState<View_>('woche');
  const [offset, setOffset] = useState(0);
  const from = addDays(weekStart(today), offset * 7);
  const days = usePlanDays(from, 7);
  const [swapping, setSwapping] = useState<{ date: string; meal: PlannedMeal } | null>(null);
  const tDays = useMemo(() => (table ? tableDays(child, logs, from, 7) : []), [table, child, logs, from]);
  // Einkauf: im Familientisch-Modus aus dem Familien-Wochenplan
  const items = useMemo(
    () => (table ? shoppingList(tDays.map((d) => ({ date: d.date, meals: d.meals.map((m) => ({ slot: 'mittag' as const, title: m.title, foodIds: m.foods })) }))) : shoppingList(days)),
    [table, tDays, days],
  );
  const tasks = useMemo(() => (table ? [] : prepTasks(days)), [table, days]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const locked = !isPro && (offset !== 0 || mode === 'einkauf');

  const load = useCallback(async () => setChecked(await listChecks(db, from)), [db, from]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <Hero style={{ marginBottom: space.lg }}>{t('Woche')}</Hero>
      <Segmented<View_>
        options={[
          { id: 'woche', label: t('Plan') },
          { id: 'einkauf', label: t('Einkauf') },
        ]}
        value={mode}
        onChange={setMode}
      />

      <SwapSheet date={swapping?.date ?? today} meal={swapping?.meal ?? null} onClose={() => setSwapping(null)} />

      {/* Wochenwahl */}
      <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
        <WeekArrow label="‹" a11y={t('Vorherige Woche')} onPress={() => setOffset((o) => o - 1)} />
        <View style={{ alignItems: 'center' }}>
          <Heading>{offset === 0 ? t('Diese Woche') : offset === 1 ? t('Nächste Woche') : offset === -1 ? t('Letzte Woche') : `${formatDay(from, false)}`}</Heading>
          <Small>{formatDay(from, false)} – {formatDay(addDays(from, 6), false)}</Small>
        </View>
        <WeekArrow label="›" a11y={t('Nächste Woche')} onPress={() => setOffset((o) => o + 1)} />
      </Row>

      {locked ? (
        <LockedNotice
          text={mode === 'einkauf'
            ? t('Mit dem Beikost-Paket entsteht aus dem Plan automatisch eine Einkaufs- und Vorkochliste.')
            : t('Die kostenlose Version zeigt die aktuelle Woche. Mit dem Beikost-Paket planst du beliebig weit voraus.')}
          onUnlock={() => router.push('/paywall')}
        />
      ) : mode === 'woche' && table ? (
        isPro ? <TableWeek days={tDays} today={today} /> : <LockedNotice text={t('Der Familien-Wochenplan ab 1 Jahr gehört zum Beikost-Paket.')} onUnlock={() => router.push('/paywall')} />
      ) : mode === 'woche' ? (
        <>
          {days.map((d) => {
            const isToday = d.date === today;
            return (
              <Card key={d.date} style={isToday ? { borderWidth: 2.5, borderColor: color.sage } : { paddingVertical: space.lg }}>
                <Pressable
                  disabled={d.meals.length === 0}
                  onPress={() => router.push({ pathname: '/mahlzeit', params: { date: d.date } })}
                  accessibilityRole="button"
                  accessibilityLabel={t('{0}: alle Mahlzeiten mit Mengen und Zubereitung', { 0: formatDay(d.date) })}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: d.meals.length ? space.md : 0 }}
                >
                  <Heading>{formatDay(d.date)}</Heading>
                  {isToday ? <Small bold style={{ color: color.sageDeep }}>{t('Heute')}</Small> : null}
                </Pressable>
                {d.meals.length === 0 ? <Small>{t('Noch keine Beikost')}</Small> : null}
                {d.meals.map((m) => {
                  const canSwap = !m.newFoodId && d.date >= today;
                  return (
                    <Pressable
                      key={m.slot}
                      onPress={() => router.push({ pathname: '/mahlzeit', params: { date: d.date, slot: m.slot } })}
                      accessibilityRole="button"
                      accessibilityLabel={t('{0} am {1}: {2}. Mengen und Zubereitung öffnen', { 0: SLOT_LABEL[m.slot], 1: formatDay(d.date), 2: m.title })}
                      style={({ pressed }) => ({
                        backgroundColor: m.newFoodId ? brand.yellowSoft : color.creme,
                        borderRadius: radius.md,
                        padding: space.md,
                        marginBottom: space.sm,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[type.small, { color: color.inkSoft }]}>{SLOT_LABEL[m.slot]}</Text>
                          <Text style={[type.bodyBold, { color: color.ink }]}>{t(m.title)}</Text>
                        </View>
                        {canSwap ? (
                          <Pressable
                            onPress={() => setSwapping({ date: d.date, meal: m })}
                            accessibilityRole="button"
                            accessibilityLabel={t('{0} am {1} tauschen', { 0: SLOT_LABEL[m.slot], 1: formatDay(d.date) })}
                            hitSlop={10}
                            style={{ backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}
                          >
                            <IconLabel icon={RefreshCw} label={t('Tauschen')} />
                          </Pressable>
                        ) : null}
                      </Row>
                      <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: space.sm }}>
                        {m.foodIds.map((id) => {
                          const f = FOOD_BY_ID[id];
                          const isNew = id === m.newFoodId;
                          return (
                            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: color.surface }}>
                              <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                              <Text style={[type.small, { color: isNew ? color.peachDeep : color.ink }]}>
                                {f.name}{isNew ? t(' · neu ({0})', { 0: m.newFoodDay }) : ''}
                              </Text>
                            </View>
                          );
                        })}
                      </Row>
                      <IconLabel icon={Scale} label={t('Mengen & Zubereitung')} chevron style={{ marginTop: space.sm }} />
                    </Pressable>
                  );
                })}
              </Card>
            );
          })}
          {isPro ? (
            <Button label={t('Wochenplan als PDF teilen')} icon={FileText} variant="soft" onPress={() => shareHtmlAsPdf(planHtml(child, days), 'Wochenplan')} />
          ) : null}
        </>
      ) : (
        <>
          {items.length === 0 ? <P soft>{t('In dieser Woche ist noch keine Beikost geplant.')}</P> : null}
          {table ? (
            <Button label={t('Kita-Brotdose planen')} icon={Sandwich} variant="soft" style={{ marginBottom: space.md }} onPress={() => router.push('/brotdose')} />
          ) : null}
          {items.length ? (
            <Button label={t('Liste teilen')} icon={Share2} variant="soft" style={{ marginBottom: space.sm }} onPress={() => Share.share({
              message: shoppingText(t('Einkauf {0} – {1}', { 0: formatDay(from, false), 1: formatDay(addDays(from, 6), false) }),
                items.filter(({ food }) => !checked.has(food.id) && !inPantry.has(food.id)).map(({ food }) => ({ name: food.name, detail: food.shopUnit }))),
            })} />
          ) : null}
          <Row style={{ gap: space.sm, marginBottom: space.md }}>
            <Button label={t('Vorrat')} icon={ShoppingBasket} variant="soft" style={{ flex: 1 }} onPress={() => router.push('/vorrat')} />
            <Button label={t('Scannen')} icon={ScanBarcode} variant="soft" style={{ flex: 1 }} onPress={() => router.push('/scanner')} />
          </Row>
          {groupByCategory(items).map(([cat, list]) => (
            <Card key={cat} style={{ paddingVertical: space.lg }}>
              <Heading style={{ marginBottom: space.sm }}>{CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}</Heading>
              {list.map(({ food, servings }) => {
                const isChecked = checked.has(food.id) || inPantry.has(food.id);
                return (
                  <Pressable
                    key={food.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                    onPress={async () => {
                      await toggleCheck(db, from, food.id, !isChecked);
                      await load();
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52 }}
                  >
                    <View style={{
                      width: 28, height: 28, borderRadius: 9, borderWidth: 2.5, borderColor: color.sage,
                      backgroundColor: isChecked ? color.sage : 'transparent', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isChecked ? <Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text> : null}
                    </View>
                    <FoodBadge emoji={food.emoji} size={36} tone="peach" />
                    <View style={{ flex: 1 }}>
                      <P bold style={isChecked ? { textDecorationLine: 'line-through', color: color.inkSoft } : undefined}>{food.name}</P>
                      <Small>{inPantry.has(food.id) ? t('🧺 vorrätig') : t('{0} · für {1} {2}', { 0: food.shopUnit, 1: servings, 2: servings === 1 ? 'Mahlzeit' : 'Mahlzeiten' })}</Small>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          ))}
          {tasks.length ? (
            <>
              <Title>{t('Vorkochen')}</Title>
              <Button label={t('Vorkoch-Sonntag starten')} icon={CookingPot} style={{ marginBottom: space.md }} onPress={() => router.push('/vorkochen')} />
              {tasks.map((tx) => (
                <Card key={tx.title} tone="sage">
                  <P bold>🧊 {t(tx.title)}</P>
                  <Small soft={false} style={{ marginTop: space.xs }}>{t(tx.detail)}</Small>
                </Card>
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function WeekArrow({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}
    >
      {label === '‹' ? <ChevronLeft size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} /> : <ChevronRight size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />}
    </Pressable>
  );
}

function groupByCategory<T extends { food: { category: string } }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const i of items) map.set(i.food.category, [...(map.get(i.food.category) ?? []), i]);
  return Array.from(map.entries());
}

/** Familien-Wochenplan (Kleinkind-Phase): pro Tag 5 Mahlzeiten, Mittagessen mit Rezept. */
function TableWeek({ days, today }: { days: TableDay[]; today: string }) {
  return (
    <>
      {days.map((d) => (
        <Card key={d.date} style={d.date === today ? { borderWidth: 2.5, borderColor: color.sage } : { paddingVertical: space.lg }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
            <Heading>{formatDay(d.date)}</Heading>
            {d.date === today ? <Small bold style={{ color: color.sageDeep }}>{t('Heute')}</Small> : null}
          </Row>
          {d.meals.map((m) => (
            <Pressable key={m.slot} disabled={!m.recipeId} onPress={() => m.recipeId && router.push(`/rezept/${m.recipeId}`)}
              accessibilityRole={m.recipeId ? 'link' : undefined}
              style={({ pressed }) => ({
                flexDirection: 'row', gap: space.md, paddingVertical: 6, paddingHorizontal: m.recipeId ? space.sm : 0,
                borderRadius: radius.md, backgroundColor: m.recipeId ? brand.yellowSoft : 'transparent', marginVertical: m.recipeId ? 4 : 0,
                opacity: pressed ? 0.75 : 1,
              })}>
              <Small style={{ width: 104 }}>{t(TABLE_SLOT_INFO[m.slot].label)}</Small>
              <Text style={[m.recipeId ? type.smallBold : type.small, { flex: 1, color: color.ink }]}>{t(m.title)}</Text>
              {m.recipeId ? <ChevronRight size={16} color={brand.blue} /> : null}
            </Pressable>
          ))}
        </Card>
      ))}
      <Small style={{ marginBottom: space.lg }}>{t('Orientierung nach Gesund ins Leben: Fisch 1–2× pro Woche, Fleisch nicht jeden Tag. Tauscht gern nach Lust und Saison.')}</Small>
    </>
  );
}
