import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { migrateDb } from '@/db/schema';
import { AppProvider, useApp } from '@/state/AppContext';
import { ToastProvider } from '@/ui/Toast';
import { color, font } from '@/ui/theme';
import { t } from '@/i18n';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Baloo2_600SemiBold, Baloo2_700Bold, Baloo2_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

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

/** Der Schlüssel aus epoch und Sprache baut die Navigation nach „Alle Daten löschen“ komplett neu auf. */
function Navigation() {
  const { epoch, ready, lang } = useApp();
  // Erst nach dem Laden der Daten anzeigen: sonst stürzen direkt geöffnete Seiten (Link, Erinnerung) ohne Kind ab
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.creme }}>
        <ActivityIndicator color={color.sageDeep} />
      </View>
    );
  }
  return (
    <Stack
      key={`${epoch}-${lang}`}
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: color.creme },
              headerTintColor: color.sageDeep,
              headerTitleStyle: { color: color.ink, fontFamily: font.displayMedium },
              headerBackTitle: t('Zurück'),
              contentStyle: { backgroundColor: color.creme },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('Zurück') }} />
            <Stack.Screen name="food/[id]" options={{ title: '' }} />
            <Stack.Screen name="kind" options={{ title: t('Kind bearbeiten') }} />
            <Stack.Screen name="rezept/[id]" options={{ title: "" }} />
            <Stack.Screen name="suche" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="verdauung" options={{ title: t('Windel & Verdauung') }} />
            <Stack.Screen name="dienste" options={{ title: t('Dienstplan') }} />
            <Stack.Screen name="reifecheck" options={{ title: t('Reifezeichen-Checkliste') }} />
            <Stack.Screen name="rechtliches" options={{ title: t('Datenschutz & Impressum') }} />
            <Stack.Screen name="uebersicht" options={{ title: t('Beikost-Übersicht') }} />
            <Stack.Screen name="scanner" options={{ title: t('Im Regal scannen') }} />
            <Stack.Screen name="mahlzeit" options={{ title: t('Mahlzeit') }} />
            <Stack.Screen name="familie" options={{ title: t('Familie & Einstellungen') }} />
            <Stack.Screen name="brotdose" options={{ title: t('Kita-Brotdose') }} />
            <Stack.Screen name="wiederanbieten" options={{ title: t('Noch mal anbieten') }} />
            <Stack.Screen name="unterwegs" options={{ title: t('Unterwegs') }} />
            <Stack.Screen name="vorkochen" options={{ title: t('Vorkoch-Sonntag') }} />
            <Stack.Screen name="journal" options={{ title: t('Erste Male') }} />
            <Stack.Screen name="konto" options={{ title: t('Konto & Handywechsel') }} />
            <Stack.Screen name="willkommen" options={{ headerShown: false }} />
            <Stack.Screen name="vorrat" options={{ title: t('Vorrat & Gefrierfach') }} />
            <Stack.Screen name="konverter" options={{ title: t('Familienessen umwandeln') }} />
            <Stack.Screen name="rezeptsuche" options={{ title: t('Was habe ich da?') }} />
            <Stack.Screen name="paywall" options={{ title: t('Beikost-Paket'), presentation: 'modal' }} />
          </Stack>
  );
}
