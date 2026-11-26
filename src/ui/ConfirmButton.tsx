import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react-native';
import type { ViewStyle } from 'react-native';
import { Button, type IconLike } from './components';
import { t } from '@/i18n';

/**
 * Zweistufige Bestätigung ohne System-Dialog: Der erste Tipp fragt nach,
 * erst der zweite führt aus. Nach 5 Sekunden ohne zweiten Tipp springt der Knopf zurück.
 */
export function ConfirmButton({ label, confirmLabel, onConfirm, variant = 'soft', style, icon }: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'soft' | 'ghost' | 'danger';
  style?: ViewStyle;
  icon?: IconLike;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const tx = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(tx);
  }, [armed]);
  return (
    <Button
      label={busy ? t('Einen Moment …') : armed ? confirmLabel : label}
      icon={armed ? TriangleAlert : icon}
      variant={armed ? 'danger' : variant}
      disabled={busy}
      style={style}
      onPress={async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
    />
  );
}
