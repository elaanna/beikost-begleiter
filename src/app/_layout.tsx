import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { migrateDb } from '@/db/schema';
import { AppProvider, useApp } from '@/state/AppContext';
import { ToastProvider } from '@/ui/Toast';
import { color, font } from '@/ui/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.creme }}>
        <ActivityIndicator color={color.sageDeep} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="beikost.db" onInit={migrateDb}>
        <AppProvider>
          <ToastProvider>
          <StatusBar style="dark" />
          <Navigation />
          </ToastProvider>
        </AppProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

/** Der Schlüssel epoch baut die Navigation nach „Alle Daten löschen“ komplett neu auf. */
function Navigation() {
  const { epoch } = useApp();
  return (
    <Stack
      key={epoch}
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: color.creme },
              headerTintColor: color.sageDeep,
              headerTitleStyle: { color: color.ink, fontFamily: font.displayMedium },
              headerBackTitle: 'Zurück',
              contentStyle: { backgroundColor: color.creme },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="tutorial" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Zurück' }} />
            <Stack.Screen name="food/[id]" options={{ title: '' }} />
            <Stack.Screen name="kind" options={{ title: "Kind bearbeiten" }} />
            <Stack.Screen name="rezept/[id]" options={{ title: "" }} />
            <Stack.Screen name="suche" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="verdauung" options={{ title: 'Windel & Verdauung' }} />
            <Stack.Screen name="dienste" options={{ title: 'Dienstplan' }} />
            <Stack.Screen name="reifecheck" options={{ title: 'Reifezeichen-Checkliste' }} />
            <Stack.Screen name="rechtliches" options={{ title: 'Datenschutz & Impressum' }} />
            <Stack.Screen name="mahlzeit" options={{ title: 'Mahlzeit' }} />
            <Stack.Screen name="vorrat" options={{ title: 'Vorrat & Gefrierfach' }} />
            <Stack.Screen name="konverter" options={{ title: 'Familienessen umwandeln' }} />
            <Stack.Screen name="rezeptsuche" options={{ title: 'Was habe ich da?' }} />
            <Stack.Screen name="paywall" options={{ title: 'Beikost-Paket', presentation: 'modal' }} />
          </Stack>
  );
}
