import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORY_INFO, type RecipeCategory } from '@/data/babyRecipes';
import { FOOD_BY_ID } from '@/data/foods';
import { todayIso } from '@/domain/dates';
import { recipeFits } from '@/domain/recipes';
import { useChild } from '@/state/AppContext';
import { Card, P, Pill, PillRow, Row, Small } from './components';
import { color, space, type } from './theme';

type Filter = RecipeCategory | 'alle';

/** Rezeptbibliothek mit Kategorien, Zutaten-Suche und Familienessen-Konverter. */
export function RecipesView() {
  const { activeChild: child, logs } = useChild();
  const [filter, setFilter] = useState<Filter>('alle');
  const fits = recipeFits(child, logs, { category: filter === 'alle' ? undefined : filter, today: todayIso() });

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

      <PillRow>
        <Pill label="Alle" selected={filter === 'alle'} onPress={() => setFilter('alle')} />
        {(Object.keys(CATEGORY_INFO) as RecipeCategory[]).map((c) => (
          <Pill key={c} label={`${CATEGORY_INFO[c].emoji} ${CATEGORY_INFO[c].label}`} selected={filter === c} onPress={() => setFilter(c)} />
        ))}
      </PillRow>

      {fits.length === 0 ? <Card><P>In dieser Kategorie gibt es noch keine Rezepte.</P></Card> : null}
      {fits.map(({ recipe, blocked, untried, tooEarly }) => (
        <Card key={recipe.id} onPress={() => router.push(`/rezept/${recipe.id}`)} accessibilityLabel={recipe.name} style={{ paddingVertical: space.lg }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 40 }}>{recipe.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{recipe.name}</P>
              <Small>{CATEGORY_INFO[recipe.category].label} · {recipe.minutes} Min.{recipe.storage.freeze ? ' · ❄️ einfrierbar' : ''}</Small>
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
