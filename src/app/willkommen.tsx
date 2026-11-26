import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { isSyncConfigured } from '@/sync/supabase';
import { Button, P, Screen, Small } from '@/ui/components';
import { color, font, radius, space, type } from '@/ui/theme';

const BENEFITS: [string, string][] = [
  ['🗓️', 'Ein Plan, der mitwächst – Tag für Tag, nach Gesund ins Leben'],
  ['🥚', 'Neue Lebensmittel und Allergene einzeln und in Ruhe einführen'],
  ['👪', 'Gemeinsam planen mit Partner, Großeltern oder Kita'],
];

/** Startseite beim ersten Öffnen: neu starten oder mit bestehendem Konto anmelden. */
export default function Willkommen() {
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: space.xl }}>
        <View style={{ width: 168, height: 168, borderRadius: 84, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 76 }}>🥄</Text>
          <View style={{ position: 'absolute', top: 14, right: 6, width: 54, height: 54, borderRadius: 27, backgroundColor: color.peachSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 30 }}>🥕</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 10, left: 4, width: 48, height: 48, borderRadius: 24, backgroundColor: color.butter, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>🍐</Text>
          </View>
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 38, lineHeight: 44, color: color.ink, textAlign: 'center', marginTop: space.xl }}>
          Beikost-Begleiter
        </Text>
        <P soft style={{ textAlign: 'center', marginTop: space.sm, maxWidth: 320 }}>
          Vom ersten Löffel bis zum Familientisch – entspannt und gut begleitet.
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

      <Button label="Los geht's" style={{ marginTop: space.xl }} onPress={() => router.push('/onboarding')} />
      {isSyncConfigured ? (
        <Button label="Ich habe schon ein Konto" variant="ghost" onPress={() => router.push({ pathname: '/konto', params: { mode: 'anmelden' } })} />
      ) : null}
      <Small style={{ textAlign: 'center', marginTop: space.md }}>Kein Konto nötig. Deine Angaben bleiben auf deinem Handy.</Small>
    </Screen>
  );
}
