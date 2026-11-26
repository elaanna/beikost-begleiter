import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { Button, Card, FoodBadge, Heading, Hero, LockedNotice, P, Row, Screen, Segmented, Small, Title } from '@/ui/components';
import { shareHtmlAsPdf } from '@/ui/exportPdf';
import { RecipesView } from '@/ui/RecipesView';
import { color, radius, space, type } from '@/ui/theme';

type View_ = 'woche' | 'einkauf' | 'rezepte';

export default function Plan() {
  const db = useSQLiteContext();
  const { activeChild: child, isPro, stock } = useChild();
  const inPantry = useMemo(() => pantryFoodIds(stock), [stock]);
  const today = todayIso();
  const [mode, setMode] = useState<View_>('woche');
  const [offset, setOffset] = useState(0);
  const from = addDays(weekStart(today), offset * 7);
  const days = usePlanDays(from, 7);
  const [swapping, setSwapping] = useState<{ date: string; meal: PlannedMeal } | null>(null);
  const items = useMemo(() => shoppingList(days), [days]);
  const tasks = useMemo(() => prepTasks(days), [days]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const locked = !isPro && mode !== 'rezepte' && (offset !== 0 || mode === 'einkauf');

  const load = useCallback(async () => setChecked(await listChecks(db, from)), [db, from]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <Hero style={{ marginBottom: space.lg }}>Woche</Hero>
      <Segmented<View_>
        options={[
          { id: 'woche', label: '🗓️ Plan' },
          { id: 'einkauf', label: '🛒 Einkauf' },
          { id: 'rezepte', label: '🍲 Rezepte' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'rezepte' ? <RecipesView /> : null}
      <SwapSheet date={swapping?.date ?? today} meal={swapping?.meal ?? null} onClose={() => setSwapping(null)} />

      {/* Wochenwahl */}
      {mode !== 'rezepte' ? <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
        <WeekArrow label="‹" a11y="Vorherige Woche" onPress={() => setOffset((o) => o - 1)} />
        <View style={{ alignItems: 'center' }}>
          <Heading>{offset === 0 ? 'Diese Woche' : offset === 1 ? 'Nächste Woche' : offset === -1 ? 'Letzte Woche' : `${formatDay(from, false)}`}</Heading>
          <Small>{formatDay(from, false)} – {formatDay(addDays(from, 6), false)}</Small>
        </View>
        <WeekArrow label="›" a11y="Nächste Woche" onPress={() => setOffset((o) => o + 1)} />
      </Row> : null}

      {mode === 'rezepte' ? null : locked ? (
        <LockedNotice
          text={mode === 'einkauf'
            ? 'Mit dem Beikost-Paket entsteht aus dem Plan automatisch eine Einkaufs- und Vorkochliste.'
            : 'Die kostenlose Version zeigt die aktuelle Woche. Mit dem Beikost-Paket planst du beliebig weit voraus.'}
          onUnlock={() => router.push('/paywall')}
        />
      ) : mode === 'woche' ? (
        <>
          {days.map((d) => {
            const isToday = d.date === today;
            return (
              <Card key={d.date} style={isToday ? { borderWidth: 2.5, borderColor: color.sage } : { paddingVertical: space.lg }}>
                <Row style={{ justifyContent: 'space-between', marginBottom: d.meals.length ? space.md : 0 }}>
                  <Heading>{formatDay(d.date)}</Heading>
                  {isToday ? <Small bold style={{ color: color.sageDeep }}>Heute</Small> : null}
                </Row>
                {d.meals.length === 0 ? <Small>Noch keine Beikost</Small> : null}
                {d.meals.map((m) => (
                  <View key={m.slot} style={{ marginBottom: space.md }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Pressable
                        style={{ flex: 1 }}
                        onPress={() => router.push({ pathname: '/mahlzeit', params: { date: d.date, slot: m.slot } })}
                        accessibilityRole="button"
                        accessibilityLabel={`${SLOT_LABEL[m.slot]} am ${formatDay(d.date)}: Mengen und Zubereitung`}
                        hitSlop={6}
                      >
                        <Text style={[type.smallBold, { color: color.ink }]}>{SLOT_LABEL[m.slot]} · {m.title} <Text style={{ color: color.sageDeep }}>›</Text></Text>
                      </Pressable>
                      {!m.newFoodId && d.date >= today ? (
                        <Pressable onPress={() => setSwapping({ date: d.date, meal: m })} accessibilityRole="button" accessibilityLabel={`${SLOT_LABEL[m.slot]} am ${formatDay(d.date)} tauschen`} hitSlop={8}>
                          <Text style={[type.smallBold, { color: color.sageDeep }]}>🔄 Tauschen</Text>
                        </Pressable>
                      ) : null}
                    </Row>
                    <Row style={{ flexWrap: 'wrap', gap: space.sm, marginTop: space.xs }}>
                      {m.foodIds.map((id) => {
                        const f = FOOD_BY_ID[id];
                        const isNew = id === m.newFoodId;
                        return (
                          <Pressable
                            key={id}
                            onPress={() => router.push(`/food/${id}`)}
                            accessibilityRole="link"
                            style={{
                              flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10,
                              borderRadius: radius.pill, backgroundColor: isNew ? color.peachSoft : color.creme,
                            }}
                          >
                            <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                            <Text style={[type.smallBold, { color: isNew ? color.peachDeep : color.ink }]}>
                              {f.name}{isNew ? ` · neu (${m.newFoodDay})` : ''}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </Row>
                  </View>
                ))}
              </Card>
            );
          })}
          {isPro ? (
            <Button label="Wochenplan als PDF teilen" icon="📄" variant="soft" onPress={() => shareHtmlAsPdf(planHtml(child, days), 'Wochenplan')} />
          ) : null}
        </>
      ) : (
        <>
          {items.length === 0 ? <P soft>In dieser Woche ist noch keine Beikost geplant.</P> : null}
          <Row style={{ gap: space.sm, marginBottom: space.md }}>
            <Button label="Vorrat" icon="🧺" variant="soft" style={{ flex: 1 }} onPress={() => router.push('/vorrat')} />
            <Button label="Scannen" icon="📷" variant="soft" style={{ flex: 1 }} onPress={() => router.push('/scanner')} />
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
                      <Small>{inPantry.has(food.id) ? '🧺 vorrätig' : `${food.shopUnit} · für ${servings} ${servings === 1 ? 'Mahlzeit' : 'Mahlzeiten'}`}</Small>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          ))}
          {tasks.length ? (
            <>
              <Title>Vorkochen</Title>
              {tasks.map((t) => (
                <Card key={t.title} tone="sage">
                  <P bold>🧊 {t.title}</P>
                  <Small soft={false} style={{ marginTop: space.xs }}>{t.detail}</Small>
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
      <Text style={{ fontSize: 30, color: color.sageDeep, marginTop: -3 }}>{label}</Text>
    </Pressable>
  );
}

function groupByCategory<T extends { food: { category: string } }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const i of items) map.set(i.food.category, [...(map.get(i.food.category) ?? []), i]);
  return Array.from(map.entries());
}
