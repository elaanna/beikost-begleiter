import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { openWissen } from './nav';
import { color, font, radius, space, type } from './theme';

/** Drei Striche, gezeichnet statt Emoji – sieht auf allen Geräten gleich aus. */
function BurgerIcon() {
  return (
    <View style={{ gap: 4 }}>
      {[0, 1, 2].map((k) => <View key={k} style={{ width: 20, height: 2.5, borderRadius: 2, backgroundColor: color.ink }} />)}
    </View>
  );
}

/** Hamburger-Knopf oben rechts auf „Heute“ mit Menü für Familie, Konto und Einstellungen. */
export function MainMenu() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const go = (href: Href) => { setOpen(false); router.push(href); };
  const items: { emoji: string; label: string; sub?: string; onPress: () => void }[] = [
    { emoji: '👪', label: 'Familie & Einstellungen', sub: 'Kinder, Einladen, Erinnerungen, Berichte', onPress: () => go('/familie') },
    { emoji: '👥', label: 'Dienstplan & Kita', sub: 'Wer füttert, bringt, holt ab', onPress: () => go('/dienste') },
    { emoji: '📧', label: 'Konto & Handywechsel', sub: app.accountEmail ?? 'Noch kein Konto', onPress: () => go('/konto') },
    { emoji: '⭐', label: 'Beikost-Paket', onPress: () => go('/paywall') },
    { emoji: '🎓', label: 'Geführte Tour starten', onPress: () => { setOpen(false); void app.restartTutorial(); } },
    { emoji: '📖', label: 'Leitlinien & Quellen', onPress: () => { setOpen(false); openWissen('leitlinien'); } },
    { emoji: '🔒', label: 'Datenschutz & Impressum', onPress: () => go('/rechtliches') },
  ];

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Menü öffnen" hitSlop={10}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
        <BurgerIcon />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(61,46,42,0.4)' }} onPress={() => setOpen(false)} accessibilityLabel="Menü schließen" />
          <View style={{ width: '82%', maxWidth: 360, backgroundColor: color.creme, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg, paddingHorizontal: space.lg }} accessibilityViewIsModal>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
              <Text style={{ fontFamily: font.display, fontSize: 26, color: color.ink }}>Menü</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Menü schließen" hitSlop={10}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[type.bodyBold, { color: color.ink, fontSize: 20 }]}>✕</Text>
              </Pressable>
            </View>
            {app.parentName.trim() ? <Text style={[type.small, { color: color.inkSoft, marginBottom: space.md }]}>Hallo {app.parentName.trim()} 👋</Text> : null}
            <View style={{ backgroundColor: color.surface, borderRadius: radius.lg, paddingVertical: space.xs }}>
              {items.map((it, k) => (
                <Pressable key={it.label} onPress={it.onPress} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md, borderTopWidth: k ? 1 : 0, borderTopColor: color.line, opacity: pressed ? 0.6 : 1 })}>
                  <Text style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{it.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodyBold, { color: color.ink }]}>{it.label}</Text>
                    {it.sub ? <Text style={[type.small, { color: color.inkSoft }]} numberOfLines={1}>{it.sub}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 20, color: color.inkSoft }}>›</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
