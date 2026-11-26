import { useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getMeta } from '@/db/repo';
import { shareExport } from '@/db/exportData';
import { useApp } from '@/state/AppContext';
import { deleteEverything } from '@/sync/sync';
import { Button, Card, Heading, Important, P, Screen, Small, SourceLink, Title } from '@/ui/components';
import { ConfirmButton } from '@/ui/ConfirmButton';
import { color, space, type } from '@/ui/theme';

/**
 * Datenschutzhinweise (Art. 13 DSGVO), Impressum, medizinischer Hinweis,
 * Export (Art. 15/20) und Löschen (Art. 17 / Widerruf nach Art. 7 Abs. 3).
 * Platzhalter in [eckigen Klammern] vor der Veröffentlichung ersetzen und rechtlich prüfen lassen.
 */
const IMPRESSUM = {
  name: '[Vor- und Nachname / Firma]',
  address: '[Straße Nr., PLZ Ort]',
  email: '[datenschutz@beispiel.de]',
  responsible: '[Name, Anschrift] (verantwortlich für Inhalte nach § 18 Abs. 2 MStV)',
};

const DATA_ITEMS = [
  {
    emoji: '📱',
    title: 'Auf deinem Gerät',
    text: 'Kind (optionaler Spitzname, Geburtsmonat), Plan, Protokoll mit Reaktionen, Verdauung, Vorrat, Journal „Erste Male“, Dienstplan und Einstellungen werden lokal gespeichert. Ohne Familienfreigabe oder Cloud-Sicherung verlässt nichts davon das Gerät. Dein Vorname für die Begrüßung bleibt immer nur auf dem Gerät.',
  },
  {
    emoji: '👪',
    title: 'Konto, Cloud-Sicherung und Familienfreigabe',
    text: 'Für das Konto speichern wir deine E-Mail-Adresse bei Supabase in der EU (Frankfurt) – ausschließlich, um dir Anmeldecodes zu schicken. Die Einträge zu deinem Kind werden erst übertragen und dort verschlüsselt gespeichert, wenn du die Cloud-Sicherung einschaltest, einlädst oder beitrittst (freiwillig, eigene Einwilligung). Zugriff haben nur Personen, die du per Einmal-Code einlädst; Leser können nichts ändern.',
  },
  {
    emoji: '⭐',
    title: 'Kauf des Beikost-Pakets',
    text: 'Die Zahlung läuft über Apple bzw. Google. RevenueCat (USA) erhält eine zufällige Kennung eurer Familie und den Kaufstatus – keine Daten über dein Kind. Damit der Kauf für die ganze Familie gilt, speichert unser Server (Supabase, EU) zu dieser Kennung nur, bis wann das Paket gültig ist. Grundlage der Übermittlung: [EU-US Data Privacy Framework / Standardvertragsklauseln – vor Launch prüfen].',
  },
  {
    emoji: '✨',
    title: 'KI-Vorschlag bei „Was habe ich da?“ (freiwillig)',
    text: 'Nur wenn du ihn antippst: Die gewählten Zutaten, dein kurzer Wunschtext und eine Liste geprüfter Rezepte gehen über unsere Server-Funktion (Supabase, EU) an Anthropic (USA) als Auftragsverarbeiter. Keine Angaben zu deinem Kind, keine Speicherung der Inhalte. Medizinische Fragen werden vorher abgefangen. Grundlage der Übermittlung: [DPF / Standardvertragsklauseln – vor Launch prüfen].',
  },
  {
    emoji: '📷',
    title: 'Supermarkt-Scanner',
    text: 'Die Kamera liest nur den Barcode, es werden keine Fotos gespeichert. Zum Nachschlagen wird ausschließlich die Barcode-Nummer an Open Food Facts (gemeinnützige Datenbank, Frankreich) gesendet – keine Angaben zu dir oder deinem Kind. Die Einordnung passiert auf deinem Gerät.',
  },
  {
    emoji: '🔔',
    title: 'Erinnerungen',
    text: 'Werden nur auf deinem Gerät geplant, ohne Push-Server. Sie können den Namen des Lebensmittels auf dem Sperrbildschirm zeigen – das lässt sich unter Familie → Erinnerungen ausblenden.',
  },
  {
    emoji: '🚫',
    title: 'Kein Tracking',
    text: 'Keine Werbung, keine Analyse- oder Tracking-Tools, kein Verkauf von Daten. Schriften sind in der App enthalten und werden nicht nachgeladen.',
  },
];

const LEGAL_BASES = [
  'Gesundheitsangaben deines Kindes: deine ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO), jederzeit widerrufbar.',
  'Übrige Angaben und Familienfreigabe: Bereitstellung der App auf deinen Wunsch (Art. 6 Abs. 1 lit. b DSGVO).',
  'Kauf: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).',
];

const RETENTION = [
  'Auf dem Gerät: bis du Einträge löschst, die App entfernst oder unten „Alle Daten löschen“ wählst.',
  'In der Cloud: E-Mail solange das Konto besteht, Einträge solange Sicherung oder Familienfreigabe bestehen. Gelöschte Einträge werden nach spätestens 30 Tagen endgültig entfernt, abgelaufene Einladungen sofort.',
];

const RIGHTS = [
  'Auskunft und Kopie deiner Daten (Export unten)',
  'Berichtigung – direkt in der App',
  'Löschung und Widerruf der Einwilligung (unten)',
  'Einschränkung und Widerspruch – per E-Mail an die Adresse im Impressum',
  'Beschwerde bei einer Datenschutz-Aufsichtsbehörde, z. B. der deines Bundeslandes',
];

export default function Rechtliches() {
  const db = useSQLiteContext();
  const app = useApp();
  const [consent, setConsent] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  useEffect(() => {
    getMeta(db, 'consent_health').then((v) => setConsent(v ? (JSON.parse(v) as { date: string }).date : null));
  }, [db]);

  return (
    <Screen edges={['left', 'right']}>
      <Important title="Medizinischer Hinweis">
        <Text style={[type.body, { color: color.redDeep }]}>
          nimou gibt allgemeine Informationen nach öffentlichen Empfehlungen (u. a. S3-Leitlinien,
          Netzwerk Gesund ins Leben). Er stellt keine Diagnose und ersetzt keine kinderärztliche Beratung.
          Bei Allergieverdacht, Gedeihstörungen oder Unsicherheit sprich bitte mit deiner Kinderarztpraxis.
          Im Notfall 112.
        </Text>
      </Important>

      <Title>Deine Daten</Title>
      <Card>
        <Button label="Meine Daten exportieren (JSON)" icon={Download} variant="soft" onPress={async () => {
          try {
            await shareExport(db);
          } catch {
            setMessage({ text: 'Export nicht möglich. Bitte noch einmal versuchen.', error: true });
          }
        }} />
        <Small style={{ marginTop: space.sm, marginBottom: space.lg }}>
          Alle Einträge dieses Geräts als Datei – zum Aufheben oder für einen Wechsel.
        </Small>
        <ConfirmButton
          label="Alle Daten löschen"
          confirmLabel="Wirklich alles endgültig löschen"
          icon={Trash2}
          onConfirm={async () => {
            try {
              await deleteEverything(db);
              await app.resetApp();
              router.replace('/');
            } catch (e) {
              setMessage({ text: e instanceof Error ? e.message : 'Löschen fehlgeschlagen.', error: true });
            }
          }}
        />
        <Small style={{ marginTop: space.sm }}>
          Löscht alles auf diesem Gerät und dein Konto in der Cloud. Verwaltest du eine Familie allein, werden auch die
          Familiendaten gelöscht; gibt es weitere Eintragende, übernimmt die erste Person die Verwaltung.
          Das ist gleichzeitig der Widerruf deiner Einwilligung.
        </Small>
        {consent ? <Small style={{ marginTop: space.md }}>Einwilligung erteilt am {new Date(consent).toLocaleDateString('de-DE')}.</Small> : null}
        {message ? <P style={{ marginTop: space.md, color: message.error ? color.red : color.sageDeep }}>{message.text}</P> : null}
      </Card>

      <Title>Datenschutz in Kürze</Title>
      <Card>
        {DATA_ITEMS.map((d) => (
          <View key={d.title} style={{ flexDirection: 'row', gap: space.md, marginBottom: space.lg }}>
            <Text style={{ fontSize: 24 }}>{d.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{d.title}</P>
              <P style={{ marginTop: 2 }}>{d.text}</P>
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <Heading style={{ marginBottom: space.sm }}>Rechtsgrundlagen</Heading>
        {LEGAL_BASES.map((t) => <P key={t} style={{ marginBottom: space.xs }}>• {t}</P>)}
        <Heading style={{ marginTop: space.lg, marginBottom: space.sm }}>Speicherdauer</Heading>
        {RETENTION.map((t) => <P key={t} style={{ marginBottom: space.xs }}>• {t}</P>)}
        <Heading style={{ marginTop: space.lg, marginBottom: space.sm }}>Deine Rechte</Heading>
        {RIGHTS.map((t) => <P key={t} style={{ marginBottom: space.xs }}>• {t}</P>)}
      </Card>

      <Title>Impressum</Title>
      <Card>
        <Heading>Angaben nach § 5 DDG · Verantwortlicher nach Art. 4 Nr. 7 DSGVO</Heading>
        <P style={{ marginTop: space.sm }}>{IMPRESSUM.name}</P>
        <P>{IMPRESSUM.address}</P>
        <P style={{ marginTop: space.sm }}>E-Mail: {IMPRESSUM.email}</P>
        <P style={{ marginTop: space.sm }}>{IMPRESSUM.responsible}</P>
      </Card>

      <Title>Quellen der Inhalte</Title>
      <Card>
        <P style={{ marginBottom: space.sm }}>Alle Empfehlungen sind in der App direkt bei der Aussage verlinkt. Die wichtigsten:</P>
        <SourceLink label="S3-Leitlinie Allergieprävention" url="https://register.awmf.org/assets/guidelines/061-016l_S3_Allergiepraevention_2022-11.pdf" />
        <View style={{ height: space.xs }} />
        <SourceLink label="Netzwerk Gesund ins Leben" url="https://www.gesund-ins-leben.de/" />
      </Card>
    </Screen>
  );
}
