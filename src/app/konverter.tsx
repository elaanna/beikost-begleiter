import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RECIPE_BY_ID } from '@/data/allRecipes';
import {
  CONVERTER_SOURCES, DISH_TYPES, INGREDIENT_RULES, RECIPE_PRESETS, STAGE_INFO, suggestedStage, type Stage,
} from '@/data/familyConverter';
import { convertDish } from '@/domain/converter';
import { ageInMonths, todayIso } from '@/domain/dates';
import { useChild } from '@/state/AppContext';
import { Card, Heading, Hero, Important, P, Pill, PillRow, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { color, radius, space, type } from '@/ui/theme';

/** Familienessen-Konverter: Familiengericht wählen → Babyvariante nach festen Regeln (Konzept F09). */
export default function Konverter() {
  const params = useLocalSearchParams<{ recipe?: string }>();
  const { activeChild: child } = useChild();
  const preset = params.recipe ? RECIPE_PRESETS[params.recipe] : undefined;
  const recipe = params.recipe ? RECIPE_BY_ID[params.recipe] : undefined;
  const age = ageInMonths(child.birthDate, todayIso());
  const [dish, setDish] = useState<string | null>(preset?.dish ?? null);
  const [stage, setStage] = useState<Stage>(suggestedStage(age, child.approach));
  const [rules, setRules] = useState<string[]>(preset?.rules ?? ['salz']);
  const result = useMemo(() => (dish ? convertDish(dish, stage, rules) : null), [dish, stage, rules]);
  const toggle = (id: string) => setRules((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.xs }}>Einmal kochen, alle essen mit</Hero>
      <P soft style={{ marginBottom: space.lg }}>
        {recipe ? `Für „${recipe.name}“: ` : ''}Wähle, was es gibt – die App zeigt, wie die Babyportion gelingt. Feste Regeln, keine KI.
      </P>

      <Title>1. Was gibt es?</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {DISH_TYPES.map((d) => {
          const on = dish === d.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => setDish(d.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{
                width: '48%', padding: space.md, borderRadius: radius.md, borderWidth: 2,
                borderColor: on ? color.sageDeep : 'transparent', backgroundColor: on ? color.sageSoft : color.surface,
              }}
            >
              <Text style={{ fontSize: 26 }}>{d.emoji}</Text>
              <P bold>{d.name}</P>
              <Small>{d.examples}</Small>
            </Pressable>
          );
        })}
      </View>

      <Title>2. Wie isst {child.name} gerade?</Title>
      <PillRow>
        {(Object.keys(STAGE_INFO) as Stage[]).map((s) => (
          <Pill key={s} label={`${STAGE_INFO[s].emoji} ${STAGE_INFO[s].label}`} selected={stage === s} onPress={() => setStage(s)} />
        ))}
      </PillRow>
      <Small style={{ marginBottom: space.md }}>Vorauswahl nach Alter und gewählter Methode – du kannst jederzeit umstellen.</Small>

      <Title>3. Was ist im Familienessen drin?</Title>
      <PillRow>
        {INGREDIENT_RULES.map((r) => (
          <Pill key={r.id} label={`${r.emoji} ${r.name}`} selected={rules.includes(r.id)} onPress={() => toggle(r.id)} />
        ))}
      </PillRow>

      {result ? (
        <>
          <Title>So geht die Babyportion</Title>
          {result.never.map((r) => <Important key={r.id} title={`${r.emoji} ${r.name}`}>{r.action}</Important>)}
          <Card tone="sage">
            {result.steps.map((s, i) => (
              <Row key={s} style={{ alignItems: 'flex-start', marginBottom: space.sm }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color.sageDeep, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[type.smallBold, { color: '#fff' }]}>{i + 1}</Text>
                </View>
                <P style={{ flex: 1 }}>{s}</P>
              </Row>
            ))}
          </Card>
          {result.adapt.length ? (
            <Card tone="butter">
              <Heading style={{ marginBottom: space.sm }}>Anpassen</Heading>
              {result.adapt.map((r) => <P key={r.id} style={{ marginBottom: space.xs }}>{r.emoji} <Text style={type.bodyBold}>{r.name}:</Text> {r.action}</P>)}
            </Card>
          ) : null}
          {result.notes.map((r) => <Card key={r.id}><P>{r.emoji} {r.action}</P></Card>)}
          <Small style={{ marginBottom: space.md }}>
            Allgemeine Hinweise für gesunde Babys. Neue Lebensmittel einzeln einführen; bei bekannten Allergien gilt immer die ärztliche Empfehlung.
          </Small>
          <Pressable onPress={() => router.push('/vorrat')} accessibilityRole="link">
            <Text style={[type.bodyBold, { color: color.sageDeep, marginBottom: space.md }]}>❄️ Babyportionen einfrieren ›</Text>
          </Pressable>
        </>
      ) : (
        <Card tone="butter"><P>Wähle oben ein Gericht.</P></Card>
      )}

      <Title>Quelle</Title>
      {CONVERTER_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
    </Screen>
  );
}
