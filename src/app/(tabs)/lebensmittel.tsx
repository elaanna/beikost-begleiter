import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORY_LABEL, FOODS } from '@/data/foods';
import { milestones } from '@/domain/pass';
import { blockReason } from '@/domain/planner';
import type { FoodCategory } from '@/domain/types';
import { useChild } from '@/state/AppContext';
import { Card, Heading, Hero, Pill, PillRow, ProgressBar, Row, Screen, Small } from '@/ui/components';
import { color, radius, space, TOUCH, type } from '@/ui/theme';

type Filter = 'alle' | 'probiert' | 'offen';

/** Probier-Pass: alle Lebensmittel als Sticker – bunt, sobald probiert. */
export default function ProbierPass() {
  const { activeChild: child, logs } = useChild();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('alle');
  const [category, setCategory] = useState<FoodCategory | null>(null);

  const liked = useMemo(() => new Set(logs.filter((l) => l.liking === 1).map((l) => l.foodId)), [logs]);
  const tried = useMemo(() => new Set(logs.map((l) => l.foodId)), [logs]);
  const ms = milestones(logs, child.id);
  const triedCount = FOODS.filter((f) => tried.has(f.id)).length;

  const list = FOODS.filter((f) => {
    if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (category && f.category !== category) return false;
    if (filter === 'probiert') return tried.has(f.id);
    if (filter === 'offen') return !tried.has(f.id);
    return true;
  });
  const groups = (Object.keys(CATEGORY_LABEL) as FoodCategory[])
    .map((c) => [c, list.filter((f) => f.category === c)] as const)
    .filter(([, items]) => items.length > 0);

  return (
    <Screen>
      <Hero>Lebensmittel</Hero>
      <Small style={{ marginBottom: space.lg }}>{child.name} hat {triedCount} von {FOODS.length} Lebensmitteln probiert</Small>

      <Card tone="peach" style={{ paddingVertical: space.lg }}>
        <ProgressBar value={triedCount} max={FOODS.length} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.lg, marginHorizontal: -space.sm }}>
          {ms.map((m) => (
            <View key={m.id} style={{ width: 88, alignItems: 'center', marginHorizontal: space.xs }} accessibilityLabel={`${m.title}: ${m.reached ? 'erreicht' : m.progress}`}>
              <View style={{
                width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
                backgroundColor: m.reached ? color.surface : 'rgba(255,255,255,0.5)',
                borderWidth: m.reached ? 3 : 0, borderColor: color.peach,
              }}>
                <Text style={{ fontSize: 28, opacity: m.reached ? 1 : 0.3 }}>{m.emoji}</Text>
              </View>
              <Text style={[type.small, { fontSize: 11, textAlign: 'center', color: color.ink, marginTop: 4 }]} numberOfLines={2}>{m.title}</Text>
              {!m.reached ? <Text style={[type.small, { fontSize: 11, color: color.inkSoft }]}>{m.progress}</Text> : null}
            </View>
          ))}
        </ScrollView>
      </Card>

      <TextInput
        accessibilityLabel="Lebensmittel suchen"
        value={query}
        onChangeText={setQuery}
        placeholder="🔍  Lebensmittel suchen"
        placeholderTextColor={color.inkSoft}
        style={{
          minHeight: TOUCH, borderRadius: radius.pill, paddingHorizontal: space.xl, backgroundColor: color.surface,
          fontSize: 17, marginBottom: space.md, color: color.ink, fontFamily: type.body.fontFamily,
        }}
      />
      <PillRow>
        {(['alle', 'offen', 'probiert'] as Filter[]).map((f) => (
          <Pill key={f} label={{ alle: 'Alle', offen: 'Noch offen', probiert: 'Probiert' }[f]} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </PillRow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: -space.sm, marginBottom: space.xl, marginHorizontal: -space.screenX }}
        contentContainerStyle={{ paddingHorizontal: space.screenX }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(Object.keys(CATEGORY_LABEL) as FoodCategory[]).map((c) => (
            <Pill key={c} label={CATEGORY_LABEL[c]} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </View>
      </ScrollView>

      {groups.length === 0 ? <Small>Nichts gefunden.</Small> : null}
      {groups.map(([cat, items], gi) => (
        <View key={cat} style={{ marginBottom: space.xxl, paddingTop: gi ? space.xl : 0, borderTopWidth: gi ? 1 : 0, borderTopColor: color.line }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md }}>
            <Heading>{CATEGORY_LABEL[cat]}</Heading>
            <Small>{items.filter((f) => tried.has(f.id)).length} von {items.length} probiert</Small>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {items.map((f) => {
              const isTried = tried.has(f.id);
              const blocked = blockReason(f, child, logs) !== null;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => router.push(`/food/${f.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${f.name}${isTried ? ', probiert' : ''}${blocked ? ', pausiert' : ''}`}
                  style={({ pressed }) => ({
                    width: '23%', aspectRatio: 0.82, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isTried ? color.surface : 'rgba(255,255,255,0.45)',
                    borderWidth: blocked ? 2 : isTried ? 0 : 1.5, borderColor: blocked ? color.red : color.line,
                    borderStyle: isTried || blocked ? 'solid' : 'dashed',
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  })}
                >
                  <Text style={{ fontSize: 34, opacity: isTried ? 1 : 0.28 }}>{f.emoji}</Text>
                  <Text
                    style={[type.small, { fontSize: 11, textAlign: 'center', color: isTried ? color.ink : color.inkSoft, paddingHorizontal: 2 }]}
                    numberOfLines={2}
                  >
                    {f.name}
                  </Text>
                  {liked.has(f.id) ? <Text style={{ position: 'absolute', top: 4, right: 6, fontSize: 12 }}>♥</Text> : null}
                  {blocked ? <Text style={{ position: 'absolute', top: 2, right: 6, fontSize: 13, color: color.red, fontWeight: '800' }}>!</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
