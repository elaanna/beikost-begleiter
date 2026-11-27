import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FOOD_BY_ID } from '@/data/foods';
import { revisitFoods } from '@/domain/care';
import { todayIso } from '@/domain/dates';
import { useChild } from '@/state/AppContext';
import { Card, P, Pill, Row, Small } from './components';
import { useToast } from './Toast';
import { space } from './theme';
import { t } from '@/i18n';

/** Schon probiert, aber länger nicht dabei – zum Wiederanbieten, mit Schnell-Eintrag. */
export function Revisit() {
  const { activeChild: child, logs, addLog, removeLog } = useChild();
  const toast = useToast();
  const today = todayIso();
  const items = useMemo(() => revisitFoods(child, logs, today).slice(0, 3), [child, logs, today]);
  if (!items.length) return null;
  return (
    <Card tone="butter">
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 30 }}>🔁</Text>
        <View style={{ flex: 1 }}>
          <P bold>{t('Mal wieder anbieten?')}</P>
          <Small soft={false}>{t('Schon probiert, aber länger nicht dabei.')}</Small>
        </View>
      </Row>
      {items.map((r) => {
        const food = FOOD_BY_ID[r.foodId];
        return (
          <Row key={r.foodId} style={{ marginTop: space.md, justifyContent: 'space-between' }}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/food/${food.id}`)} accessibilityRole="link">
              <P bold>{food.emoji} {food.name}{r.liked ? ' ♥' : ''}</P>
              <Small>{t('zuletzt vor {0} Tagen', { 0: r.daysSince })}</Small>
            </Pressable>
            <Pill
              label={t('Heute gegeben')}
              onPress={async () => {
                const id = await addLog({ foodId: food.id, date: today, liking: 0, reaction: 'keine', note: '' });
                toast({ emoji: '✓', text: t('{0} notiert', { 0: food.name }), undo: id ? () => removeLog(id) : undefined });
              }}
            />
          </Row>
        );
      })}
    </Card>
  );
}
