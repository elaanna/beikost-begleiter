import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { openWissen } from './nav';
import { BookOpen, ChevronRight, Globe, GraduationCap, Lock, Mail, Menu, Settings, Star, Users, X, type LucideIcon } from 'lucide-react-native';
import { brand, color, font, ICON, radius, space, type } from './theme';
import { LANG_LABEL, LANGS, t } from '@/i18n';


/** Hamburger-Knopf oben rechts auf „Heute“ mit Menü für Familie, Konto und Einstellungen. */
export function MainMenu() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const go = (href: Href) => { setOpen(false); router.push(href); };
  const items: { emoji: LucideIcon; label: string; sub?: string; onPress: () => void }[] = [
    { emoji: Settings, label: t('Familie & Einstellungen'), sub: t('Kinder, Einladen, Erinnerungen, Berichte'), onPress: () => go('/familie') },
    { emoji: Users, label: t('Dienstplan & Kita'), sub: t('Wer füttert, bringt, holt ab'), onPress: () => go('/dienste') },
    { emoji: Mail, label: t('Konto & Handywechsel'), sub: app.accountEmail ?? t('Noch kein Konto'), onPress: () => go('/konto') },
    { emoji: Star, label: t('Beikost-Paket'), onPress: () => go('/paywall') },
    { emoji: GraduationCap, label: t('Geführte Tour starten'), onPress: () => { setOpen(false); void app.restartTutorial(); } },
    { emoji: BookOpen, label: t('Leitlinien & Quellen'), onPress: () => { setOpen(false); openWissen('leitlinien'); } },
    { emoji: Lock, label: t('Datenschutz & Impressum'), onPress: () => go('/rechtliches') },
  ];

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={t('Menü öffnen')} hitSlop={10}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Menu size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(61,46,42,0.4)' }} onPress={() => setOpen(false)} accessibilityLabel={t('Menü schließen')} />
          <View style={{ width: '82%', maxWidth: 360, backgroundColor: color.creme, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg, paddingHorizontal: space.lg }} accessibilityViewIsModal>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg }}>
              <Text style={[type.title, { color: brand.blue }]}>{t('Menü')}</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={t('Menü schließen')} hitSlop={10}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}>
                <X size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />
              </Pressable>
            </View>
            {app.parentName.trim() ? <Text style={[type.small, { color: color.inkSoft, marginBottom: space.md }]}>{t('Hallo {0} 👋', { 0: app.parentName.trim() })}</Text> : null}
            <View style={{ backgroundColor: color.surface, borderRadius: radius.lg, paddingVertical: space.xs }}>
              {items.map((it, k) => (
                <Pressable key={it.label} onPress={it.onPress} accessibilityRole="button"
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md, borderTopWidth: k ? 1 : 0, borderTopColor: color.line, opacity: pressed ? 0.6 : 1 })}>
                  <View style={{ width: 30, alignItems: 'center' }}><it.emoji size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.bodyBold, { color: color.ink }]}>{t(it.label)}</Text>
                    {it.sub ? <Text style={[type.small, { color: color.inkSoft }]} numberOfLines={1}>{t(it.sub)}</Text> : null}
                  </View>
                  <ChevronRight size={20} strokeWidth={ICON.stroke} color={color.inkSoft} />
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: space.lg, backgroundColor: color.surface, borderRadius: radius.lg, padding: space.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm }}>
                <View style={{ width: 30, alignItems: 'center' }}><Globe size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} /></View>
                <Text style={[type.bodyBold, { color: color.ink }]}>{t('Sprache')}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }} accessibilityRole="radiogroup">
                {LANGS.map((l) => {
                  const active = app.lang === l;
                  return (
                    <Pressable key={l} onPress={() => { setOpen(false); if (!active) void app.setLanguage(l); }}
                      accessibilityRole="radio" accessibilityState={{ checked: active }} accessibilityLabel={LANG_LABEL[l]}
                      style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: active ? brand.blue : color.creme, opacity: pressed ? 0.7 : 1 })}>
                      <Text style={[type.bodyBold, { color: active ? '#FFFFFF' : brand.blue }]}>{LANG_LABEL[l]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
