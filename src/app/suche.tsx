import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ask } from '@/domain/askFood';
import { todayIso } from '@/domain/dates';
import { preparationFor } from '@/domain/planner';
import { useChild } from '@/state/AppContext';
import { Card, FoodBadge, Heading, Important, P, Pill, PillRow, Row, Screen, Small } from '@/ui/components';
import { color, radius, space, TOUCH, type } from '@/ui/theme';

const POPULAR = ['Honig', 'Ei', 'Erdnuss', 'Kuhmilch', 'Erdbeere', 'Nüsse', 'Fisch', 'Salz'];

/** „Darf mein Baby …?“ – Antwort in einem Blick. */
export default function Suche() {
  const { activeChild: child, logs } = useChild();
  const [q, setQ] = useState('');
  const answers = useMemo(() => ask(q, child, logs, todayIso()), [q, child, logs]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
        <Heading>Darf {child.name} schon …?</Heading>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
          <Text style={[type.bodyBold, { color: color.sageDeep }]}>Fertig</Text>
        </Pressable>
      </Row>
      <TextInput
        autoFocus
        accessibilityLabel="Lebensmittel eingeben"
        value={q}
        onChangeText={setQ}
        placeholder="z. B. Honig, Ei, Erdbeere"
        placeholderTextColor={color.inkSoft}
        returnKeyType="search"
        style={{
          minHeight: TOUCH + 4, borderRadius: radius.pill, paddingHorizontal: space.xl, backgroundColor: color.surface,
          fontSize: 18, color: color.ink, fontFamily: type.body.fontFamily, borderWidth: 2, borderColor: color.sage, marginBottom: space.lg,
        }}
      />

      {q.trim().length < 2 ? (
        <>
          <Small style={{ marginBottom: space.sm }}>Häufig gefragt</Small>
          <PillRow>{POPULAR.map((p) => <Pill key={p} label={p} onPress={() => setQ(p)} />)}</PillRow>
        </>
      ) : answers.length === 0 ? (
        <Card><P>Dazu haben wir noch keinen Eintrag. Frag im Zweifel in der Kinderarztpraxis nach.</P></Card>
      ) : (
        answers.map((a, i) => {
          if (a.kind === 'avoid') {
            return (
              <Important key={`avoid-${i}`} title={`${a.emoji} ${a.name}: ${a.headline}`}>{a.detail}</Important>
            );
          }
          const tone = a.tone;
          if (tone === 'pausiert') {
            return (
              <Pressable key={a.food.id} onPress={() => router.push(`/food/${a.food.id}`)} accessibilityRole="button">
                <Important title={`${a.food.emoji} ${a.food.name}: ${a.headline}`}>{a.detail}</Important>
              </Pressable>
            );
          }
          return (
            <Card key={a.food.id} tone={tone === 'ja' ? 'sage' : 'butter'} onPress={() => router.push(`/food/${a.food.id}`)} accessibilityLabel={a.food.name}>
              <Row style={{ alignItems: 'flex-start' }}>
                <FoodBadge emoji={a.food.emoji} size={56} tone="white" />
                <View style={{ flex: 1 }}>
                  <Text style={[type.smallBold, { color: tone === 'ja' ? color.sageDeep : color.peachDeep }]}>
                    {tone === 'ja' ? '✓ ' : '⏳ '}{a.headline}
                  </Text>
                  <Text style={[type.title, { color: color.ink, fontSize: 22 }]}>{a.food.name}</Text>
                  <Small soft={false}>{a.detail}</Small>
                </View>
              </Row>
              {i === 0 ? <P style={{ marginTop: space.md }}>{preparationFor(a.food, child)}</P> : null}
              {i === 0 && a.food.hint ? <View style={{ marginTop: space.md }}><Important>{a.food.hint}</Important></View> : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}
