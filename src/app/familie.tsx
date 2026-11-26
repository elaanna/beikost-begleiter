import { useState } from 'react';
import { Baby, BookOpen, Users, FileText, GraduationCap, Lock, Mail, Plus, Star, Stethoscope } from 'lucide-react-native';
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
import { brand, color, space } from '@/ui/theme';
import { t } from '@/i18n';

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
            emoji={Baby}
            title={c.name}
            subtitle={t('{0} Monate · geboren im {1}', { 0: ageInMonths(c.birthDate, today), 1: formatMonth(c.birthDate) })}
            onPress={() => router.push({ pathname: '/kind', params: { id: c.id } })}
          />
        ))}
        {isPro ? <ListItem emoji={Plus} title={t('Weiteres Kind anlegen')} onPress={() => router.push('/kind')} /> : null}
      </Card>

      <Card tone="peach" onPress={() => router.push('/dienste')} accessibilityLabel={t('Dienstplan öffnen')}>
        <Row>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' }}><Users size={26} strokeWidth={1.75} color={brand.blue} /></View>
          <View style={{ flex: 1 }}>
            <P bold>{t('Dienstplan & Kita')}</P>
            <Small soft={false}>{t('Wer füttert, wer bringt, wer holt ab – Lücken in Rot')}</Small>
          </View>
          <Text style={{ fontSize: 22, color: color.inkSoft }}>›</Text>
        </Row>
      </Card>

      <Title>{t('Du')}</Title>
      <Card>
        <Field
          label={t('Dein Vorname')}
          value={app.parentName}
          onChangeText={(v) => app.saveParentName(v)}
          placeholder={t('z. B. Michaela')}
          hint={t('Nur für die Begrüßung auf diesem Handy.')}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={40}
        />
        <ListItem emoji={Mail} title={t('Konto & Handywechsel')} subtitle={app.accountEmail ?? t('Noch kein Konto')} onPress={() => router.push('/konto')} />
      </Card>

      <Title>{t('Gemeinsam planen')}</Title>
      <FamilySharing />
      {message ? <P style={{ color: color.sageDeep, marginBottom: space.md }}>{message}</P> : null}

      <Title>{t('Erinnerungen')}</Title>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <P bold>{t('🔔 An Mahlzeiten erinnern')}</P>
            <Small>{t('Mit dem, was gerade dran ist – zum Beispiel „Mittag: neu ist Ei, Tag 1 von 3“.')}</Small>
          </View>
          <Switch
            value={app.reminders.enabled}
            disabled={!remindersSupported}
            trackColor={{ true: color.sage, false: color.line }}
            accessibilityLabel={t('Erinnerungen')}
            onValueChange={async (v) => {
              if (v && !(await requestReminderPermission())) {
                setMessage(t('Mitteilungen sind nicht erlaubt. Du kannst sie in den Einstellungen deines Handys einschalten.'));
                return;
              }
              await app.saveReminders({ ...app.reminders, enabled: v });
            }}
          />
        </Row>
        {!remindersSupported ? <Small style={{ marginTop: space.sm }}>{t('Erinnerungen funktionieren nur in der App auf dem Handy.')}</Small> : null}
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
            <Small>{t('Erinnert nur an Mahlzeiten, die laut Breiplan schon dran sind – am Familientisch pausieren die Erinnerungen.')}</Small>
            <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <P bold>{t('🔒 Details auf dem Sperrbildschirm ausblenden')}</P>
                <Small>{t('Zeigt nur „Zeit für Mittag“ – ohne Namen und Lebensmittel.')}</Small>
              </View>
              <Switch
                value={app.reminders.discreet}
                trackColor={{ true: color.sage, false: color.line }}
                accessibilityLabel={t('Details auf dem Sperrbildschirm ausblenden')}
                onValueChange={(v) => app.saveReminders({ ...app.reminders, discreet: v })}
              />
            </Row>
          </View>
        ) : null}
      </Card>

      <Title>{t('Für die Kinderarztpraxis')}</Title>
      <Card tone="sage">
        <P style={{ marginBottom: space.lg }}>
          {t('Alles auf einen Blick für die U5 oder U6: Allergene mit Datum, Reaktionen, was probiert wurde, Eisen und Verdauung.')}</P>
        <Button
          label={t('Bericht als PDF')}
          icon={Stethoscope}
          onPress={() => shareHtmlAsPdf(doctorReportHtml(child, logs, digestion, today), t('Beikost-Bericht {0}', { 0: child.name }))}
        />
      </Card>

      <Title>{t('Notfallblatt')}</Title>
      <Card>
        <P soft style={{ marginBottom: space.lg }}>
          {t('Allergien, beobachtete Reaktionen und Notruf-Hinweise auf einer Seite – für Oma, Babysitter oder Kita.')}</P>
        <Field label={t('Telefon Eltern')} value={parentContact} onChangeText={setParentContact} placeholder="0151 …" keyboardType="phone-pad" />
        <Field label={t('Kinderarztpraxis')} value={doctor} onChangeText={setDoctor} placeholder={t('Name und Telefon')} />
        <Button label={t('Notfallblatt als PDF')} icon={FileText} variant="soft" onPress={() => shareHtmlAsPdf(emergencyHtml(child, logs, { parent: parentContact, doctor }), 'Notfallblatt')} />
      </Card>

      <Title>{t('Mehr')}</Title>
      <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.sm }}>
        <ListItem
          emoji={Star}
          title={t('Beikost-Paket')}
          subtitle={previewMode ? t('Testversion: alles freigeschaltet') : isPro ? t('Aktiv{0}', { 0: until ? ` bis ${formatDayLong(until.slice(0, 10))}` : '' }) : t('12 Monate, einmal zahlen')}
          onPress={() => router.push('/paywall')}
        />
        <ListItem emoji={GraduationCap} title={t('Geführte Tour noch einmal starten')} onPress={() => app.restartTutorial()} />
        <ListItem emoji={BookOpen} title={t('Leitlinien & Quellen')} onPress={() => openWissen('leitlinien')} />
        <ListItem emoji={Lock} title={t('Datenschutz, Impressum & Hinweis')} onPress={() => router.push('/rechtliches')} />
      </Card>
    </Screen>
  );
}
