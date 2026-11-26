import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { color, font, radius, space, type } from './theme';
import { t } from '@/i18n';

interface ToastOptions {
  text: string;
  emoji?: string;
  /** Wenn gesetzt, erscheint „Rückgängig“. */
  undo?: () => void | Promise<void>;
}

const Ctx = createContext<(tx: ToastOptions) => void>(() => undefined);

/**
 * Kurze Rückmeldung nach jeder Aktion: was gespeichert wurde, mit „Rückgängig“.
 * Verschwindet nach 5 Sekunden.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback((tx: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(tx);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(hide, 5000);
  }, [opacity, hide]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: 96, opacity, alignItems: 'center' }}
        >
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={{
              flexDirection: 'row', alignItems: 'center', gap: space.md, maxWidth: 560, width: '100%',
              backgroundColor: color.ink, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.lg,
              shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
            }}
          >
            <Text style={{ fontSize: 20 }}>{toast.emoji ?? '✓'}</Text>
            <Text style={[type.bodyBold, { color: '#fff', flex: 1 }]}>{t(toast.text)}</Text>
            {toast.undo ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={async () => {
                  const u = toast.undo!;
                  hide();
                  await u();
                }}
              >
                <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: color.peach }}>{t('Rückgängig')}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
