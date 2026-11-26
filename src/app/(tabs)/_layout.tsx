import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useApp } from '@/state/AppContext';
import { Text } from 'react-native';
import { color, font } from '@/ui/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
}

/**
 * Fünf Bereiche nach dem, was Eltern wollen:
 * Was ist heute dran? · Was gibt es diese Woche? · Was hat mein Kind schon probiert? · Was muss ich wissen? · Wer hilft mit?
 */
export default function TabsLayout() {
  const { ready, activeChild } = useApp();
  // Ohne Kind (z. B. nach „Alle Daten löschen“) gibt es nichts anzuzeigen
  if (ready && !activeChild) return <Redirect href="/onboarding" />;
  if (!activeChild) return null;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.sageDeep,
        tabBarInactiveTintColor: color.inkSoft,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.line, height: 72, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontFamily: font.bodyBold },
      }}
    >
      <Tabs.Screen name="heute" options={{ title: 'Heute', tabBarIcon: ({ focused }) => <TabIcon emoji="☀️" focused={focused} /> }} />
      <Tabs.Screen name="woche" options={{ title: 'Woche', tabBarIcon: ({ focused }) => <TabIcon emoji="🗓️" focused={focused} /> }} />
      <Tabs.Screen name="lebensmittel" options={{ title: 'Probiert', tabBarIcon: ({ focused }) => <TabIcon emoji="🥕" focused={focused} /> }} />
      <Tabs.Screen name="wissen" options={{ title: 'Wissen', tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} /> }} />
      <Tabs.Screen name="familie" options={{ title: 'Familie', tabBarIcon: ({ focused }) => <TabIcon emoji="👪" focused={focused} /> }} />
    </Tabs>
  );
}
