import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { FOOD_BY_ID } from '@/data/foods';
import { formatDay, todayIso } from '@/domain/dates';
import {
  estimateDay, estimateWeekAverage, genitive, GROUP_INFO, mealComponents, weekGroups, type NutrientEstimate,
} from '@/domain/beikostOverview';
import { SLOT_LABEL } from '@/domain/planner';
import { useChild } from '@/state/AppContext';
import { usePlanDays } from '@/state/usePlan';
import { Card, Heading, Hero, P, Row, Screen, Segmented, Small, SourceLink } from '@/ui/components';
import { color, radius, space, type } from '@/ui/theme';
import { t } from '@/i18n';

type Tab = 'heute' | 'woche';

/** Beikost-Übersicht für das Kind: Plan-Bausteine, Lebensmittelgruppen, geschätzte Nährwerte (ohne Milch). */
export default function Uebersicht() {
  const { activeChild: child, logs } = useChild();
  const today = todayIso();
  const [tab, setTab] = useState<Tab>('heute');
  const [showNutrients, setShowNutrients] = useState(false);
  const day = usePlanDays(today, 1)[0];
  const week = weekGroups(child, logs, today);
  const todayEst = estimateDay(child, logs, today);
  const weekEst = estimateWeekAverage(child, logs, today);
  const title = `${genitive(child.name)} Beikost`;

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title }} />
      <Hero style={{ marginBottom: space.xs }}>{title}</Hero>
      <P soft style={{ marginBottom: space.lg }}>{t('Nur Beikost – Milch und Stillen sind nicht eingerechnet.')}</P>
      <Segmented<Tab> options={[{ id: 'heute', label: t('Heute') }, { id: 'woche', label: t('Letzte 7 Tage') }]} value={tab} onChange={setTab} />

      {tab === 'heute' ? (
        <>
          {!day || day.meals.length === 0 ? (
            <Card tone="butter"><P>{t('Heute ist noch keine Beikost geplant.')}</P></Card>
          ) : day.meals.map((meal) => {
            const comps = mealComponents(meal, child, logs, today);
            const done = comps.filter((c) => c.done).length;
            return (
              <Card key={meal.slot}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Heading>{SLOT_LABEL[meal.slot]}</Heading>
                  <Small bold soft={false} style={{ color: done === comps.length ? color.sageDeep : color.inkSoft }}>
                    {t('{0} von {1} Bausteinen', { 0: done, 1: comps.length })}</Small>
                </Row>
                <Small style={{ marginBottom: space.sm }}>{t(meal.title)}</Small>
                {comps.map((c) => (
                  <Row key={c.group} style={{ paddingVertical: 6 }}>
                    <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.done ? '✅' : '⚪'}</Text>
                    <View style={{ flex: 1 }}>
                      <P bold={c.done}>{GROUP_INFO[c.group].emoji} {t(GROUP_INFO[c.group].label)}</P>
                      <Small>{c.planned.map((id) => FOOD_BY_ID[id]?.name).join(', ')}</Small>
                    </View>
                  </Row>
                ))}
              </Card>
            );
          })}
          <Small style={{ marginBottom: space.lg }}>
            {t('✅ = heute schon eingetragen. Die Bausteine kommen aus den Grundrezepten von Gesund ins Leben – mal fehlt etwas, das ist völlig in Ordnung.')}</Small>
        </>
      ) : (
        <>
          <Row style={{ gap: space.md, marginBottom: space.lg }}>
            <Stat value={String(week.variety)} label={t('verschiedene Lebensmittel')} />
            <Stat value={String(week.newThisWeek)} label={t('davon neu entdeckt')} />
          </Row>
          <Card>
            <Row style={{ marginBottom: space.sm }}>
              <View style={{ width: 118 }} />
              {week.days.map((d) => (
                <Text key={d} style={[type.small, { flex: 1, textAlign: 'center', color: d === today ? color.sageDeep : color.inkSoft }]}>
                  {formatDay(d).slice(0, 2)}
                </Text>
              ))}
            </Row>
            {week.rows.map((r) => (
              <Row key={r.group} style={{ paddingVertical: 5 }}>
                <Text numberOfLines={1} style={[type.small, { width: 118, color: color.ink }]}>{GROUP_INFO[r.group].emoji} {t(GROUP_INFO[r.group].label)}</Text>
                {r.perDay.map((on, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? color.sage : color.line }} />
                  </View>
                ))}
              </Row>
            ))}
          </Card>
          <Small style={{ marginBottom: space.lg }}>{t('Zeigt, an welchen Tagen etwas aus der Gruppe eingetragen wurde.')}</Small>
        </>
      )}

      <Pressable onPress={() => setShowNutrients((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showNutrients }}
        style={{ backgroundColor: color.surface, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <P bold>{t('📊 Geschätzte Nährwerte')}</P>
          <Text style={[type.bodyBold, { color: color.sageDeep }]}>{showNutrients ? '−' : '+'}</Text>
        </Row>
        {showNutrients ? (
          <View style={{ marginTop: space.md }}>
            <NutrientTable label={tab === 'heute' ? t('Heute') : t('Ø pro Tag (7 Tage)')} est={tab === 'heute' ? todayEst : weekEst} />
            <Small style={{ marginTop: space.md }}>
              {t('Grobe Schätzung aus den Grundrezept-Mengen der eingetragenen Lebensmittel – nicht aus der tatsächlich gegessenen Menge. Ohne Milch und Stillen. Keine Zielwerte und keine Bewertung: Ob {0} gut versorgt ist, kann nur eure Kinderarztpraxis beurteilen.', { 0: child.name })}</Small>
          </View>
        ) : null}
      </Pressable>
      <SourceLink label={t('Gesund ins Leben 2024: Handlungsempfehlungen Säuglingsernährung')} url="https://doi.org/10.1007/s00112-024-02014-7" />
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.sageSoft, borderRadius: radius.lg, padding: space.lg }}>
      <Text style={[type.hero, { color: color.sageDeep }]}>{value}</Text>
      <Small soft={false}>{label}</Small>
    </View>
  );
}

function NutrientTable({ label, est }: { label: string; est: NutrientEstimate | null }) {
  if (!est) return <P>{t('Noch nichts eingetragen.')}</P>;
  const rows: [string, string][] = [
    ['Energie', `ca. ${Math.round(est.kcal / 10) * 10} kcal`],
    ['Eiweiß', `ca. ${est.protein.toFixed(0)} g`],
    ['Fett', `ca. ${est.fat.toFixed(0)} g`],
    ['Eisen', `ca. ${est.iron.toFixed(1).replace('.', ',')} mg`],
  ];
  return (
    <>
      <Small bold soft={false} style={{ marginBottom: space.xs }}>{t('{0} aus der Beikost', { 0: label })}</Small>
      {rows.map(([k, v]) => (
        <Row key={k} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
          <P>{k}</P>
          <P bold>{v}</P>
        </Row>
      ))}
    </>
  );
}
