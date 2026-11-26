import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ageInMonths, formatDayLong, formatMonth, todayIso } from '@/domain/dates';
import { doctorReportHtml, emergencyHtml } from '@/domain/pdf';
import { accessUntil } from '@/purchases/revenuecat';
import { useChild } from '@/state/AppContext';
import { Button, Card, Field, ListItem, P, Row, Screen, Small, Title } from '@/ui/components';
import { shareHtmlAsPdf } from '@/ui/exportPdf';
import { TimeStepper } from '@/ui/ShiftsView';
import { FamilySharing } from '@/ui/FamilySharing';
import { openWissen } from '@/ui/nav';
import { remindersSupported, requestReminderPermission } from '@/notifications/reminders';
import { Switch } from 'react-native';
import { color, space } from '@/ui/theme';

export default function Familie() {
  const app = useChild();
  const { activeChild: child, children, logs, digestion, isPro, previewMode, customerInfo } = app;
  const [message, setMessage] = useState<string | null>(null);
  const [parentContact, setParentContact] = useState('');
  const [doctor, setDoctor] = useState('');
  const until = accessUntil(customerInfo);
  const today = todayIso();

  return (
    <Screen edges={['left', 'right']}>

      <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.sm }}>
        {children.map((c) => (
          <ListItem
            key={c.id}
            emoji="👶"
            title={c.name}
            subtitle={`${ageInMonths(c.birthDate, today)} Monate · geboren im ${formatMonth(c.birthDate)}`}
            onPress={() => router.push({ pathname: '/kind', params: { id: c.id } })}
          />
        ))}
        {isPro ? <ListItem emoji="➕" title="Weiteres Kind anlegen" onPress={() => router.push('/kind')} /> : null}
      </Card>

      <Card tone="peach" onPress={() => router.push('/dienste')} accessibilityLabel="Dienstplan öffnen">
        <Row>
          <Text style={{ fontSize: 36 }}>👥</Text>
          <View style={{ flex: 1 }}>
            <P bold>Dienstplan & Kita</P>
            <Small soft={false}>Wer füttert, wer bringt, wer holt ab – Lücken in Rot</Small>
          </View>
          <Text style={{ fontSize: 22, color: color.inkSoft }}>›</Text>
        </Row>
      </Card>

      <Title>Du</Title>
      <Card>
        <Field
          label="Dein Vorname"
          value={app.parentName}
          onChangeText={(v) => app.saveParentName(v)}
          placeholder="z. B. Michaela"
          hint="Nur für die Begrüßung auf diesem Handy."
          autoCapitalize="words"
          autoComplete="name"
          maxLength={40}
        />
        <ListItem emoji="📧" title="Konto & Handywechsel" subtitle="Einträge mit E-Mail sichern" onPress={() => router.push('/konto')} />
      </Card>

      <Title>Gemeinsam planen</Title>
      <FamilySharing />
      {message ? <P style={{ color: color.sageDeep, marginBottom: space.md }}>{message}</P> : null}

      <Title>Erinnerungen</Title>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <P bold>🔔 An Mahlzeiten erinnern</P>
            <Small>Mit dem, was gerade dran ist – zum Beispiel „Mittag: neu ist Ei, Tag 1 von 3“.</Small>
          </View>
          <Switch
            value={app.reminders.enabled}
            disabled={!remindersSupported}
            trackColor={{ true: color.sage, false: color.line }}
            accessibilityLabel="Erinnerungen"
            onValueChange={async (v) => {
              if (v && !(await requestReminderPermission())) {
                setMessage('Mitteilungen sind nicht erlaubt. Du kannst sie in den Einstellungen deines Handys einschalten.');
                return;
              }
              await app.saveReminders({ ...app.reminders, enabled: v });
            }}
          />
        </Row>
        {!remindersSupported ? <Small style={{ marginTop: space.sm }}>Erinnerungen funktionieren nur in der App auf dem Handy.</Small> : null}
        {app.reminders.enabled ? (
          <View style={{ marginTop: space.lg }}>
            {(['mittag', 'nachmittag', 'abend'] as const).map((slot) => (
              <TimeStepper
                key={slot}
                label={{ mittag: 'Mittag', nachmittag: 'Nachmittag', abend: 'Abend' }[slot]}
                value={app.reminders.times[slot]}
                onChange={(v) => app.saveReminders({ ...app.reminders, times: { ...app.reminders.times, [slot]: v } })}
              />
            ))}
            <Small>Erinnert nur an Mahlzeiten, die laut Plan schon dran sind.</Small>
            <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <P bold>🔒 Details auf dem Sperrbildschirm ausblenden</P>
                <Small>Zeigt nur „Zeit für Mittag“ – ohne Namen und Lebensmittel.</Small>
              </View>
              <Switch
                value={app.reminders.discreet}
                trackColor={{ true: color.sage, false: color.line }}
                accessibilityLabel="Details auf dem Sperrbildschirm ausblenden"
                onValueChange={(v) => app.saveReminders({ ...app.reminders, discreet: v })}
              />
            </Row>
          </View>
        ) : null}
      </Card>

      <Title>Für die Kinderarztpraxis</Title>
      <Card tone="sage">
        <P style={{ marginBottom: space.lg }}>
          Alles auf einen Blick für die U5 oder U6: Allergene mit Datum, Reaktionen, was probiert wurde, Eisen und Verdauung.
        </P>
        <Button
          label="Bericht als PDF"
          icon="🩺"
          onPress={() => shareHtmlAsPdf(doctorReportHtml(child, logs, digestion, today), `Beikost-Bericht ${child.name}`)}
        />
      </Card>

      <Title>Notfallblatt</Title>
      <Card>
        <P soft style={{ marginBottom: space.lg }}>
          Allergien, beobachtete Reaktionen und Notruf-Hinweise auf einer Seite – für Oma, Babysitter oder Kita.
        </P>
        <Field label="Telefon Eltern" value={parentContact} onChangeText={setParentContact} placeholder="0151 …" keyboardType="phone-pad" />
        <Field label="Kinderarztpraxis" value={doctor} onChangeText={setDoctor} placeholder="Name und Telefon" />
        <Button label="Notfallblatt als PDF" icon="📄" variant="soft" onPress={() => shareHtmlAsPdf(emergencyHtml(child, logs, { parent: parentContact, doctor }), 'Notfallblatt')} />
      </Card>

      <Title>Mehr</Title>
      <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.sm }}>
        <ListItem
          emoji="⭐"
          title="Beikost-Paket"
          subtitle={previewMode ? 'Testversion: alles freigeschaltet' : isPro ? `Aktiv${until ? ` bis ${formatDayLong(until.slice(0, 10))}` : ''}` : '12 Monate, einmal zahlen'}
          onPress={() => router.push('/paywall')}
        />
        <ListItem emoji="🎓" title="Geführte Tour noch einmal starten" onPress={() => app.restartTutorial()} />
        <ListItem emoji="📖" title="Leitlinien & Quellen" onPress={() => openWissen('leitlinien')} />
        <ListItem emoji="🔒" title="Datenschutz, Impressum & Hinweis" onPress={() => router.push('/rechtliches')} />
      </Card>
    </Screen>
  );
}
