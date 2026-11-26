import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Snowflake } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { RECIPE_BY_ID } from '@/data/allRecipes';
import { CATEGORY_INFO, MEAL_PREP_RULES, STORAGE_SOURCES } from '@/data/babyRecipes';
import { ALLERGEN_LABEL, FOOD_BY_ID } from '@/data/foods';
import { todayIso } from '@/domain/dates';
import { recipeAllergens, recipeFits } from '@/domain/recipes';
import { useChild } from '@/state/AppContext';
import { Button, Card, Heading, Hero, Important, P, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { color, space, type } from '@/ui/theme';
import { t } from '@/i18n';

export default function Rezept() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeChild: child, logs } = useChild();
  const recipe = RECIPE_BY_ID[id ?? ''];
  if (!recipe) return <Screen><P>{t('Rezept nicht gefunden.')}</P></Screen>;
  const fit = recipeFits(child, logs, { today: todayIso() }).find((f) => f.recipe.id === recipe.id)!;
  const allergens = recipeAllergens(recipe);
  const cat = CATEGORY_INFO[recipe.category];

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: recipe.name }} />
      <Text style={{ fontSize: 64 }}>{recipe.emoji}</Text>
      <Small>{cat.emoji} {t(cat.label)}</Small>
      <Hero style={{ marginTop: space.xs }}>{recipe.name}</Hero>
      <Small style={{ marginBottom: space.lg }}>
        {t('{0} Minuten · allgemein ab etwa {1} Monaten · {2}', { 0: recipe.minutes, 1: recipe.fromMonth, 2: recipe.consistency })}</Small>

      {allergens.length ? (
        <Card tone="butter">
          <P><Text style={type.bodyBold}>{t('Enthält:')}{' '}</Text>{allergens.map((a) => ALLERGEN_LABEL[a]).join(', ')}</P>
        </Card>
      ) : null}
      {fit.blocked ? <Important title={t('Passt nicht für dein Kind')}>{fit.blocked}</Important> : null}
      {!fit.blocked && fit.untried.length ? (
        <Card tone="peach">
          <P>{t('Noch nicht probiert:')}{' '}{fit.untried.map((fid) => FOOD_BY_ID[fid].name).join(', ')}{t('. Neues einzeln einführen, bevor es im Rezept vorkommt.')}</P>
        </Card>
      ) : null}
      {recipe.safety ? <Important title={t('Sicherheit')}>{recipe.safety}</Important> : null}

      {recipe.baby ? (
        <Card tone="sage">
          <Heading>{t('👶 Für das Baby')}</Heading>
          <P style={{ marginTop: space.xs }}>{recipe.baby}</P>
          <Button label={t('Im Familienessen-Konverter öffnen')} variant="ghost" onPress={() => router.push({ pathname: '/konverter', params: { recipe: recipe.id } })} />
        </Card>
      ) : null}

      <Title>{t('Zutaten')}</Title>
      <Card>
        {recipe.ingredients.map((x) => <P key={x} style={{ marginBottom: space.xs }}>• {x}</P>)}
        <Small style={{ marginTop: space.sm }}>{t('Mengen für die Zubereitung – dein Kind bestimmt, wie viel es isst.')}</Small>
      </Card>

      <Title>{t('So geht’s')}</Title>
      {recipe.steps.map((step, i) => (
        <Row key={i} style={{ alignItems: 'flex-start', marginBottom: space.md }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[type.bodyBold, { color: '#fff' }]}>{i + 1}</Text>
          </View>
          <P style={{ flex: 1 }}>{step}</P>
        </Row>
      ))}

      <Title>{t('Aufbewahren & Einfrieren')}</Title>
      <Card>
        <P><Text style={type.bodyBold}>{t('Kühlschrank:')}{' '}</Text>{recipe.storage.fridge}</P>
        <P style={{ marginTop: space.sm }}>
          <Text style={type.bodyBold}>{t('Einfrieren:')}{' '}</Text>{recipe.storage.freeze ?? t('Nicht zum Einfrieren geeignet.')}
        </P>
        {recipe.storage.thaw ? <P style={{ marginTop: space.sm }}><Text style={type.bodyBold}>{t('Auftauen:')}{' '}</Text>{recipe.storage.thaw}</P> : null}
        {recipe.storage.freeze ? (
          <Button label={t('Portionen ins Gefrierfach eintragen')} icon={Snowflake} variant="soft" style={{ marginTop: space.md }}
            onPress={() => router.push({ pathname: '/vorrat', params: { add: recipe.id } })} />
        ) : null}
      </Card>
      <Card tone="butter">
        <P bold>{t('Allgemeine Regeln fürs Vorkochen')}</P>
        {MEAL_PREP_RULES.map((r) => <P key={r} style={{ marginTop: space.xs }}>• {r}</P>)}
        <Small style={{ marginTop: space.sm }}>{t('Allgemeine Hinweise ohne Gewähr für die Haltbarkeit im Einzelfall.')}</Small>
        {STORAGE_SOURCES.map((s) => <View key={s.url} style={{ marginTop: space.xs }}><SourceLink label={s.label} url={s.url} /></View>)}
      </Card>
    </Screen>
  );
}
