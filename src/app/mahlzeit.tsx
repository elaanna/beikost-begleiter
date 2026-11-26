import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { RECIPE_BY_ID } from '@/data/allRecipes';
import { ALLERGEN_LABEL, FOOD_BY_ID } from '@/data/foods';
import { diffDays, formatDayLong, todayIso } from '@/domain/dates';
import { effectiveStartDate, introDays, preparationFor, SLOT_LABEL } from '@/domain/planner';
import { portionFor } from '@/domain/portions';
import { matchingFrozen } from '@/domain/stock';
import type { MealSlot } from '@/domain/types';
import { useChild } from '@/state/AppContext';
import { usePlanDays } from '@/state/usePlan';
import { Button, Card, DayDots, Heading, Hero, Important, P, Row, Screen, Small, Title } from '@/ui/components';
import { SwapSheet } from '@/ui/SwapSheet';
import { color, radius, space, type } from '@/ui/theme';

/** Details zu einer geplanten Mahlzeit: Mengen, Zubereitung je Lebensmittel, Hinweise. */
export default function Mahlzeit() {
  const params = useLocalSearchParams<{ date?: string; slot?: MealSlot }>();
  const date = params.date ?? todayIso();
  const { activeChild: child, stock } = useChild();
  const day = usePlanDays(date, 1)[0];
  const meal = day?.meals.find((m) => m.slot === params.slot);
  const [swapOpen, setSwapOpen] = useState(false);

  if (!meal) {
    return (
      <Screen edges={['left', 'right']}>
        <P>Für diesen Tag ist diese Mahlzeit nicht geplant.</P>
      </Screen>
    );
  }

  const today = todayIso();
  const dayIndex = diffDays(effectiveStartDate(child), date);
  const portion = portionFor(meal.slot, dayIndex, meal.foodIds);
  const foods = meal.foodIds.map((id) => FOOD_BY_ID[id]).filter(Boolean);
  const newFood = meal.newFoodId ? FOOD_BY_ID[meal.newFoodId] : undefined;
  const recipe = meal.recipeId ? RECIPE_BY_ID[meal.recipeId] : undefined;
  const allergens = Array.from(new Set(foods.flatMap((f) => f.allergens)));
  const frozen = matchingFrozen(meal, stock)[0];
  // Lebensmittel mit Sicherheitshinweis zuerst
  const ordered = [...foods].sort((a, b) => Number(!!b.hint) - Number(!!a.hint));

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: SLOT_LABEL[meal.slot] }} />
      <Small>{formatDayLong(date)} · {SLOT_LABEL[meal.slot]}</Small>
      <Hero style={{ marginTop: space.xs, marginBottom: space.lg }}>{meal.title}</Hero>

      {newFood ? (
        <Card tone="peach">
          <Row>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 36 }}>{newFood.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.smallBold, { color: color.peachDeep }]}>Neu</Text>
              <Heading>{newFood.name}</Heading>
              <Row style={{ marginTop: space.xs }}>
                <DayDots day={meal.newFoodDay ?? 1} total={introDays(newFood)} />
                <Small>Tag {meal.newFoodDay} von {introDays(newFood)}</Small>
              </Row>
            </View>
          </Row>
          <P style={{ marginTop: space.md }}>
            Das neue Lebensmittel ein paar Tage hintereinander geben und dazu nur Bekanntes – so kannst du gut beobachten, wie es vertragen wird.
          </P>
        </Card>
      ) : null}

      {ordered.filter((f) => f.hint).map((f) => (
        <Important key={f.id} title={`${f.emoji} ${f.name}`}>{f.hint}</Important>
      ))}

      <Title>⚖️ Wie viel?</Title>
      <Card>
        {portion.lines.map((l) => (
          <Row key={l.label} style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
            <P style={{ flex: 1 }}>{l.label}</P>
            <P bold>{l.amount}</P>
          </Row>
        ))}
        <Small style={{ marginTop: space.sm }}>{portion.note}</Small>
      </Card>

      {frozen ? (
        <Card tone="sage">
          <P bold>❄️ Im Gefrierfach: {frozen.portions} {frozen.portions === 1 ? 'Portion' : 'Portionen'} {frozen.name}</P>
          <Small soft={false}>Am Vorabend in den Kühlschrank legen, dann gut erwärmen. Öl erst danach zugeben.</Small>
        </Card>
      ) : null}

      <Title>👩‍🍳 So bereitest du es zu</Title>
      {recipe ? (
        <Card>
          <P bold>{recipe.emoji} Rezept: {recipe.name}</P>
          {recipe.steps.map((s, i) => <P key={s} style={{ marginTop: space.xs }}>{i + 1}. {s}</P>)}
          <Pressable onPress={() => router.push(`/rezept/${recipe.id}`)} accessibilityRole="link">
            <Text style={[type.bodyBold, { color: color.sageDeep, marginTop: space.md }]}>Ganzes Rezept mit Zutaten & Einfrieren ›</Text>
          </Pressable>
        </Card>
      ) : null}
      {ordered.map((f) => (
        <Pressable
          key={f.id}
          onPress={() => router.push(`/food/${f.id}`)}
          accessibilityRole="link"
          accessibilityLabel={`${f.name}: mehr Infos`}
          style={({ pressed }) => ({
            backgroundColor: pressed ? color.sageSoft : color.surface, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md,
          })}
        >
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 30 }}>{f.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{f.name}{f.id === meal.newFoodId ? ' · neu' : ''}</P>
              <P style={{ marginTop: space.xs }}>{preparationFor(f, child)}</P>
            </View>
            <Text style={{ fontSize: 20, color: color.inkSoft }}>›</Text>
          </Row>
        </Pressable>
      ))}

      {allergens.length ? (
        <Card tone="butter">
          <P><Text style={type.bodyBold}>Enthält: </Text>{allergens.map((a) => ALLERGEN_LABEL[a]).join(', ')}</P>
        </Card>
      ) : null}

      <Small style={{ marginBottom: space.lg }}>
        Immer im Sitzen und unter Aufsicht essen lassen. Lauwarm anbieten – Temperatur vorher prüfen.
      </Small>

      {!meal.newFoodId && date >= today ? (
        <Button label="Diese Mahlzeit tauschen" icon="🔄" variant="soft" onPress={() => setSwapOpen(true)} />
      ) : null}
      <SwapSheet date={date} meal={swapOpen ? meal : null} onClose={() => setSwapOpen(false)} />
    </Screen>
  );
}
