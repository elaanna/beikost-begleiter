import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CATEGORY_INFO, type RecipeCategory } from '@/data/babyRecipes';
import { FOOD_BY_ID } from '@/data/foods';
import { ageInMonths, todayIso } from '@/domain/dates';
import { recipeFits } from '@/domain/recipes';
import { useChild } from '@/state/AppContext';
import { Card, P, Pill, Row, Segmented, Small } from './components';
import { brand, color, space, type } from './theme';
import { t } from '@/i18n';

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
        <Card tone="yellow" onPress={() => router.push('/rezeptsuche')} accessibilityLabel={t('Was habe ich da? Rezepte nach Zutaten finden')} style={{ marginBottom: 0, padding: space.lg }}>
          <Text style={{ fontSize: 28 }}>🧺</Text>
          <P bold>{t('Was habe ich da?')}</P>
          <Small soft={false}>{t('Rezepte nach Zutaten')}</Small>
        </Card>
        </View>
        <View style={{ flex: 1 }}>
        <Card tone="peach" onPress={() => router.push('/konverter')} accessibilityLabel={t('Familienessen für das Baby umwandeln')} style={{ marginBottom: 0, padding: space.lg }}>
          <Text style={{ fontSize: 28 }}>🔄</Text>
          <P bold>{t('Familienessen')}</P>
          <Small soft={false}>{t('fürs Baby umwandeln')}</Small>
        </Card>
        </View>
      </Row>
      <Card tone="lilac" onPress={() => router.push('/brotdose')} accessibilityLabel={t('Kita-Brotdose planen')} style={{ padding: space.lg, marginBottom: space.md }}>
        <Row>
          <Text style={{ fontSize: 28 }}>🥪</Text>
          <View style={{ flex: 1 }}>
            <P bold>{t('Kita-Brotdose')}</P>
            <Small soft={false}>{t('Ideen für Montag bis Freitag aus dem, was {0} schon kennt', { 0: child.name })}</Small>
          </View>
        </Row>
      </Card>

      <Segmented<AgeFilter>
        options={[
          { id: 'jetzt', label: t('Für {0}', { 0: child.name }) },
          { id: 'a5', label: '5–6 M.' },
          { id: 'a7', label: '7–9 M.' },
          { id: 'a10', label: t('ab 10 M.') },
        ]}
        value={age}
        onChange={setAge}
      />
      {age === 'jetzt' ? <Small style={{ marginBottom: space.sm }}>{t('Rezepte, die allgemein zum Alter von {0} ({1} Monate) passen.', { 0: child.name, 1: months })}</Small> : null}
      {/* Kategorien in einer wischbaren Zeile – nicht untereinander */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.screenX, marginBottom: space.lg }}
        contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.screenX }}>
        <Pill label={t('Alle')} selected={filter === 'alle'} onPress={() => setFilter('alle')} />
        {(Object.keys(CATEGORY_INFO) as RecipeCategory[]).map((c) => (
          <Pill key={c} label={`${CATEGORY_INFO[c].emoji} ${CATEGORY_INFO[c].label}`} selected={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      {fits.length === 0 ? <Card><P>{t('Für diese Auswahl gibt es noch keine Rezepte.')}</P></Card> : null}
      {fits.map(({ recipe, blocked, untried, tooEarly }) => (
        <Card key={recipe.id} onPress={() => router.push(`/rezept/${recipe.id}`)} accessibilityLabel={recipe.name} style={{ paddingVertical: space.lg }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 40 }}>{recipe.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{recipe.name}</P>
              <Small>{t('ab {0} Monaten · {1} · {2} Min.', { 0: recipe.fromMonth, 1: t(CATEGORY_INFO[recipe.category].label), 2: recipe.minutes })}{recipe.storage.freeze ? ' · ❄️' : ''}</Small>
              {blocked ? (
                <Text style={[type.smallBold, { color: color.red, marginTop: space.xs }]}>{t('Passt nicht: {0}', { 0: blocked })}</Text>
              ) : tooEarly ? (
                <Text style={[type.small, { color: color.inkSoft, marginTop: space.xs }]}>{t('Allgemein ab etwa {0} Monaten', { 0: recipe.fromMonth })}</Text>
              ) : untried.length ? (
                <Text style={[type.small, { color: color.peachDeep, marginTop: space.xs }]}>
                  {t('Noch nicht probiert:')}{' '}{untried.map((id) => FOOD_BY_ID[id].name).join(', ')}
                </Text>
              ) : (
                <Text style={[type.smallBold, { color: brand.success, marginTop: space.xs }]}>{t('✓ Alle Zutaten schon probiert')}</Text>
              )}
            </View>
            <Text style={{ fontSize: 22, color: color.inkSoft }}>›</Text>
          </Row>
        </Card>
      ))}
    </>
  );
}
