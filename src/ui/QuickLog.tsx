import { useState } from 'react';
import { Heart } from 'lucide-react-native';
import { Alert, Linking, Platform, Text, View } from 'react-native';
import { EMERGENCY_SIGNS } from '@/data/guidelines';
import type { Liking, Reaction } from '@/domain/types';
import { Button, Important, Pill, PillRow } from './components';
import { color, space, type } from './theme';
import { t, tr } from '@/i18n';

const REACTIONS: { id: Reaction; label: string }[] = tr([
  { id: 'haut', label: 'Haut: Rötung, Quaddeln' },
  { id: 'verdauung', label: 'Bauch, Durchfall' },
  { id: 'erbrechen', label: 'Erbrechen' },
  { id: 'atemwege', label: 'Atmung oder Schwellung' },
]);

/**
 * Notieren mit einem Tipp: „Hat geschmeckt“ oder „Lieber nicht“.
 * Eine Reaktion ist ein bewusster zweiter Schritt.
 */
export function QuickLog({ onLog, compact }: { onLog: (liking: Liking, reaction: Reaction) => void; compact?: boolean }) {
  const [showReaction, setShowReaction] = useState(false);

  const logReaction = (r: Reaction) => {
    onLog(0, r);
    setShowReaction(false);
    if (r === 'atemwege') {
      const msg = t('Bei {0}: sofort den Notruf 112 wählen.', { 0: EMERGENCY_SIGNS.join(', ') });
      if (Platform.OS === 'web') window.alert(msg);
      else
        Alert.alert(t('Ist es ein Notfall?'), msg, [
          { text: t('112 anrufen'), style: 'destructive', onPress: () => Linking.openURL('tel:112') },
          { text: t('Schließen'), style: 'cancel' },
        ]);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: compact ? 'row' : 'column', gap: space.sm }}>
        <Button label={t('Hat geschmeckt')} icon={Heart} onPress={() => onLog(1, 'keine')} style={compact ? { flex: 1 } : undefined} />
        <Button label={t('Lieber nicht')} variant="soft" onPress={() => onLog(-1, 'keine')} style={compact ? { flex: 1 } : undefined} />
      </View>
      <Button
        label={showReaction ? t('Doch keine Reaktion') : t('Reaktion bemerkt?')}
        variant="ghost"
        onPress={() => setShowReaction((v) => !v)}
        style={{ alignSelf: 'center' }}
      />
      {showReaction ? (
        <Important title={t('Was ist dir aufgefallen?')}>
          <PillRow>
            {REACTIONS.map((r) => <Pill key={r.id} label={r.label} onPress={() => logReaction(r.id)} />)}
          </PillRow>
          <Text style={[type.small, { color: color.redDeep }]}>
            {t('Das Lebensmittel wird danach im Plan pausiert. Sprich mit eurer Kinderärztin, bevor ihr es wieder anbietet.')}</Text>
          <Button label={t('Notruf 112')} variant="danger" style={{ marginTop: space.md }} onPress={() => Linking.openURL('tel:112')} />
        </Important>
      ) : null}
    </View>
  );
}
