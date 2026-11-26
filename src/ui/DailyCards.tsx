import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MONTH_NAMES, SEASON_SOURCE } from '@/data/season';
import { parseDay, todayIso } from '@/domain/dates';
import { seasonalFoods, tipOfDay } from '@/domain/daily';
import { useChild } from '@/state/AppContext';
import { Card, P, Row, Small, SourceLink } from './components';
import { color, radius, space, type } from './theme';
import { t } from '@/i18n';

/** Tipp des Tages – jeden Tag ein anderer, passend zu Phase und Jahreszeit. */
export function TipOfDayCard() {
  const { activeChild: child } = useChild();
  const today = todayIso();
  const [offset, setOffset] = useState(0);
  const tip = tipOfDay(child, today, offset);
  return (
    <Card tone="butter">
      <Small bold soft={false}>{t('💡 Tipp des Tages')}</Small>
      <Row style={{ alignItems: 'flex-start', marginTop: space.sm }}>
        <Text style={{ fontSize: 32 }}>{tip.emoji}</Text>
        <View style={{ flex: 1 }}>
          <P bold>{t(tip.title)}</P>
          <P style={{ marginTop: space.xs }}>{t(tip.text)}</P>
        </View>
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: space.md }}>
        {tip.link ? (
          <Pressable onPress={() => router.push(tip.link!.href as never)} accessibilityRole="link" hitSlop={8}>
            <Text style={[type.smallBold, { color: color.sageDeep }]}>{t(tip.link.label)} ›</Text>
          </Pressable>
        ) : <View />}
        <Pressable onPress={() => setOffset((o) => o + 1)} accessibilityRole="button" accessibilityLabel={t('Noch ein Tipp')} hitSlop={8}>
          <Text style={[type.smallBold, { color: color.inkSoft }]}>{t('Noch ein Tipp ↻')}</Text>
        </Pressable>
      </Row>
    </Card>
  );
}

/** Was gerade Saison hat – regional, ohne blockierte Lebensmittel. */
export function SeasonCard() {
  const { activeChild: child, logs } = useChild();
  const today = todayIso();
  const [all, setAll] = useState(false);
  const items = useMemo(() => seasonalFoods(child, logs, today), [child, logs, today]);
  if (!items.length) return null;
  const month = MONTH_NAMES[parseDay(today).getUTCMonth()];
  const shown = all ? items : items.slice(0, 8);
  return (
    <Card>
      <P bold>{t('🧺 Gerade Saison im {0}', { 0: month })}</P>
      <Small style={{ marginBottom: space.md }}>{t('Regional aus Deutschland – frisch geerntet oder als Lagerware.')}</Small>
      <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
        {shown.map(({ food, stored, status }) => (
          <Pressable
            key={food.id}
            onPress={() => router.push(`/food/${food.id}`)}
            accessibilityRole="link"
            accessibilityLabel={`${food.name}${status === 'probiert' ? ', schon probiert' : ''}${stored ? ', Lagerware' : ''}`}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 11,
              borderRadius: radius.pill, backgroundColor: status === 'probiert' ? color.sageSoft : color.creme,
            }}
          >
            <Text style={{ fontSize: 16 }}>{food.emoji}</Text>
            <Text style={[type.smallBold, { color: color.ink }]}>
              {food.name}{status === 'probiert' ? ' ✓' : ''}{stored ? t(' · Lager') : ''}
            </Text>
          </Pressable>
        ))}
      </Row>
      {items.length > 8 ? (
        <Pressable onPress={() => setAll((a) => !a)} accessibilityRole="button" hitSlop={8}>
          <Text style={[type.smallBold, { color: color.sageDeep, marginTop: space.md }]}>{all ? t('Weniger zeigen') : t('Alle {0} zeigen', { 0: items.length })}</Text>
        </Pressable>
      ) : null}
      <Small style={{ marginTop: space.md }}>{t('✓ = schon probiert. Neues führt der Plan nacheinander ein.')}</Small>
      <View style={{ marginTop: space.xs }}><SourceLink label={SEASON_SOURCE.label} url={SEASON_SOURCE.url} /></View>
    </Card>
  );
}
