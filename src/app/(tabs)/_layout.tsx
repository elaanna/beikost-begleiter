import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useApp } from '@/state/AppContext';
import { View } from 'react-native';
import { Apple, BookOpen, CalendarDays, ChefHat, Home, type LucideIcon } from 'lucide-react-native';
import { GuidedTour } from '@/ui/GuidedTour';
import { color, font, ICON } from '@/ui/theme';
import { t } from '@/i18n';

const TabIcon = (Icon: LucideIcon) => function TabIconRender({ focused }: { focused: boolean }) {
  return <Icon size={ICON.size} strokeWidth={ICON.stroke} color={focused ? color.sageDeep : color.inkSoft} />;
};

/**
 * Fünf Bereiche: Heute · Woche · Rezepte · Entdecken (Lebensmittel) · Wissen.
 * Familie & Einstellungen liegen im Menü (☰) oben rechts auf „Heute“.
 */
export default function TabsLayout() {
  const { ready, activeChild, needsAccount } = useApp();
  // Ohne Konto zuerst die Startseite; ohne Kind (z. B. nach „Alle Daten löschen“) das Einrichten
  if (ready && needsAccount) return <Redirect href="/willkommen" />;
  if (ready && !activeChild) return <Redirect href="/onboarding" />;
  if (!activeChild) return null;
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.sageDeep,
        tabBarInactiveTintColor: color.inkSoft,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.line, height: 72, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontFamily: font.bodyMedium },
      }}
    >
      <Tabs.Screen name="heute" options={{ title: t('Heute'), tabBarIcon: TabIcon(Home) }} />
      <Tabs.Screen name="woche" options={{ title: t('Plan'), tabBarIcon: TabIcon(CalendarDays) }} />
      <Tabs.Screen name="rezepte" options={{ title: t('Rezepte'), tabBarIcon: TabIcon(ChefHat) }} />
      <Tabs.Screen name="lebensmittel" options={{ title: t('Entdecken'), tabBarAccessibilityLabel: t('Lebensmittel entdecken'), tabBarIcon: TabIcon(Apple) }} />
      <Tabs.Screen name="wissen" options={{ title: t('Wissen'), tabBarIcon: TabIcon(BookOpen) }} />
    </Tabs>
    <GuidedTour />
    </View>
  );
}
