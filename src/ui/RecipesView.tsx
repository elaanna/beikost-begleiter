import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORY_INFO, type RecipeCategory } from '@/data/babyRecipes';
import { FOOD_BY_ID } from '@/data/foods';
import { ageInMonths, todayIso } from '@/domain/dates';
import { recipeFits } from '@/domain/recipes';
import { useChild } from '@/state/AppContext';
import { Card, P, Pill, Row, Segmented, Small } from './components';
import { color, space, type } from './theme';

type Filter = RecipeCategory | 'alle';
type AgeFilter = 'jetzt' | 'a5' | 'a7' | 'a10';

const AGE_RANGES: Record<Exclude<AgeFilter, 'jetzt'>, [number, number]> = { a5: [0, 6], a7: [7, 9], a10: [10, 99] };

/** Rezeptbibliothek mit Kategorien, Zutaten-Suche und Familienessen-Konverter. */
export function RecipesView() {
  const { activeChild: child, logs } = useChild();
  const [filter, setFilter] = useState<Filter>('alle');
  const [age, setAge] = useState<AgeFilter>('jetzt');
  const months = ageInMonths(child.birthDate, todayIso());
  const fits = recipeFits(child, logs, { category: filter === 'alle' ? undefined : filter, today: todayIso() }).filter(({ recipe }) => {
    if (age === 'jetzt') return recipe.fromMonth <= months;
    const [from, to] = AGE_RANGES[age];
    return recipe.fromMonth >= from && recipe.fromMonth <= to;
  });

  return (
    <>
      <Row style={{ gap: space.md, marginBottom: space.md }}>
        <View style={{ flex: 1 }}>
        <Card tone="sage" onPress={() => router.push('/rezeptsuche')} accessibilityLabel="Was habe ich da? Rezepte nach Zutaten finden" style={{ marginBottom: 0, padding: space.lg }}>
          <Text style={{ fontSize: 28 }}>🧺</Text>
          <P bold>Was habe ich da?</P>
          <Small soft={false}>Rezepte nach Zutaten</Small>
        </Card>
        </View>
        <View style={{ flex: 1 }}>
        <Card tone="peach" onPress={() => router.push('/konverter')} accessibilityLabel="Familienessen für das Baby umwandeln" style={{ marginBottom: 0, padding: space.lg }}>
          <Text style={{ fontSize: 28 }}>🔄</Text>
          <P bold>Familienessen</P>
          <Small soft={false}>fürs Baby umwandeln</Small>
        </Card>
        </View>
      </Row>

      <Segmented<AgeFilter>
        options={[
          { id: 'jetzt', label: `Für ${child.name}` },
          { id: 'a5', label: '5–6 M.' },
          { id: 'a7', label: '7–9 M.' },
          { id: 'a10', label: 'ab 10 M.' },
        ]}
        value={age}
        onChange={setAge}
      />
      {age === 'jetzt' ? <Small style={{ marginBottom: space.sm }}>Rezepte, die allgemein zum Alter von {child.name} ({months} Monate) passen.</Small> : null}
      {/* Kategorien in einer wischbaren Zeile – nicht untereinander */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl, marginBottom: space.lg }}
        contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
        <Pill label="Alle" selected={filter === 'alle'} onPress={() => setFilter('alle')} />
        {(Object.keys(CATEGORY_INFO) as RecipeCategory[]).map((c) => (
          <Pill key={c} label={`${CATEGORY_INFO[c].emoji} ${CATEGORY_INFO[c].label}`} selected={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      {fits.length === 0 ? <Card><P>Für diese Auswahl gibt es noch keine Rezepte.</P></Card> : null}
      {fits.map(({ recipe, blocked, untried, tooEarly }) => (
        <Card key={recipe.id} onPress={() => router.push(`/rezept/${recipe.id}`)} accessibilityLabel={recipe.name} style={{ paddingVertical: space.lg }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 40 }}>{recipe.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{recipe.name}</P>
              <Small>ab {recipe.fromMonth} Monaten · {CATEGORY_INFO[recipe.category].label} · {recipe.minutes} Min.{recipe.storage.freeze ? ' · ❄️' : ''}</Small>
              {blocked ? (
                <Text style={[type.smallBold, { color: color.red, marginTop: space.xs }]}>Passt nicht: {blocked}</Text>
              ) : tooEarly ? (
                <Text style={[type.small, { color: color.inkSoft, marginTop: space.xs }]}>Allgemein ab etwa {recipe.fromMonth} Monaten</Text>
              ) : untried.length ? (
                <Text style={[type.small, { color: color.peachDeep, marginTop: space.xs }]}>
                  Noch nicht probiert: {untried.map((id) => FOOD_BY_ID[id].name).join(', ')}
                </Text>
              ) : (
                <Text style={[type.smallBold, { color: color.sageDeep, marginTop: space.xs }]}>✓ Alle Zutaten schon probiert</Text>
              )}
            </View>
            <Text style={{ fontSize: 22, color: color.inkSoft }}>›</Text>
          </Row>
        </Card>
      ))}
    </>
  );
}
