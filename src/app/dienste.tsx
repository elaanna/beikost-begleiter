import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { addDays, formatDay, todayIso, weekStart } from '@/domain/dates';
import { useApp } from '@/state/AppContext';
import { Heading, LockedNotice, Row, Screen, Small } from '@/ui/components';
import { ShiftsView } from '@/ui/ShiftsView';
import { color, space } from '@/ui/theme';

/** Dienstplan als eigener Bereich: erreichbar über „Familie“ und die Kachel auf „Heute“. */
export default function Dienste() {
  const { isPro, activeChild } = useApp();
  const [offset, setOffset] = useState(0);
  const from = addDays(weekStart(todayIso()), offset * 7);
  if (!activeChild) return null;

  return (
    <Screen edges={['left', 'right']}>
      {!isPro ? (
        <LockedNotice
          text="Mit dem Beikost-Paket plant ihr Dienste, Kita und Fütterzeiten gemeinsam – Lücken werden rot markiert."
          onUnlock={() => router.push('/paywall')}
        />
      ) : (
        <>
          <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
            <Arrow label="‹" a11y="Vorherige Woche" onPress={() => setOffset((o) => o - 1)} />
            <View style={{ alignItems: 'center' }}>
              <Heading>{offset === 0 ? 'Diese Woche' : offset === 1 ? 'Nächste Woche' : offset === -1 ? 'Letzte Woche' : formatDay(from, false)}</Heading>
              <Small>{formatDay(from, false)} – {formatDay(addDays(from, 6), false)}</Small>
            </View>
            <Arrow label="›" a11y="Nächste Woche" onPress={() => setOffset((o) => o + 1)} />
          </Row>
          <ShiftsView from={from} />
        </>
      )}
    </Screen>
  );
}

function Arrow({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 30, color: color.sageDeep, marginTop: -3 }}>{label}</Text>
    </Pressable>
  );
}
