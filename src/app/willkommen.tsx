import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/AppContext';
import { isSyncConfigured } from '@/sync/supabase';
import { Button, P, Screen, Small } from '@/ui/components';
import { Wordmark } from '@/ui/Wordmark';
import { color, radius, space, type } from '@/ui/theme';

const BENEFITS: [string, string][] = [
  ['🗓️', 'Ein Plan, der mitwächst – Tag für Tag, nach Gesund ins Leben'],
  ['🥚', 'Neue Lebensmittel und Allergene einzeln und in Ruhe einführen'],
  ['👪', 'Gemeinsam planen mit Partner, Großeltern oder Kita'],
];

/** Startseite beim ersten Öffnen: neu starten oder mit bestehendem Konto anmelden. */
export default function Willkommen() {
  const { skipAccount, activeChild } = useApp();
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: space.xxl * 2 }}>
        <Wordmark size={64} claim />
        <P soft style={{ textAlign: 'center', marginTop: space.xl, maxWidth: 320 }}>
          Eure Beikostreise – vom ersten Löffel bis zum Familientisch. Jedes Kind hat sein eigenes Tempo.
        </P>
      </View>

      <View style={{ backgroundColor: color.surface, borderRadius: radius.lg, padding: space.lg, marginTop: space.xl, gap: space.md }}>
        {BENEFITS.map(([emoji, text]) => (
          <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Text style={{ fontSize: 24 }}>{emoji}</Text>
            <Text style={[type.body, { color: color.ink, flex: 1 }]}>{text}</Text>
          </View>
        ))}
      </View>

      {isSyncConfigured ? (
        <>
          <Button label="Konto erstellen" style={{ marginTop: space.xl }} onPress={() => router.push({ pathname: '/konto', params: { mode: 'registrieren' } })} />
          <Button label="Ich habe schon ein Konto" variant="ghost" onPress={() => router.push({ pathname: '/konto', params: { mode: 'anmelden' } })} />
          <Small style={{ textAlign: 'center', marginTop: space.md }}>Nur mit E-Mail, ohne Passwort. Deine Einträge bleiben auf deinem Handy, bis du die Sicherung einschaltest.</Small>
        </>
      ) : (
        <>
          <View style={{ backgroundColor: color.butter, borderRadius: radius.lg, padding: space.lg, marginTop: space.xl }}>
            <Text style={[type.body, { color: color.ink }]}>
              Testversion: Konten werden aktiv, sobald der Server (Supabase) eingerichtet ist. Bis dahin geht es ohne Konto weiter.
            </Text>
          </View>
          <Button label="Ohne Konto weiter" style={{ marginTop: space.lg }} onPress={async () => { await skipAccount(); router.replace(activeChild ? '/heute' : '/onboarding'); }} />
        </>
      )}
    </Screen>
  );
}
