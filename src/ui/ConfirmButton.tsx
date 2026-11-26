import { useEffect, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Button } from './components';

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
  icon?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button
      label={busy ? 'Einen Moment …' : armed ? confirmLabel : label}
      icon={armed ? '⚠️' : icon}
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
