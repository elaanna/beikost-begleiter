import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Bell, BellOff, Trash2 } from 'lucide-react-native';
import { deleteAppointment, listAppointments, newId, saveAppointment } from '@/db/repo';
import { APPOINTMENT_KINDS, CALENDAR_SOURCES, kindInfo, upcoming, uWindows, type Appointment, type AppointmentKind, type UWindow } from '@/domain/calendar';
import { formatDayLong, formatMonth, todayIso } from '@/domain/dates';
import { remindersSupported, requestReminderPermission, rescheduleAppointments } from '@/notifications/reminders';
import { useChild } from '@/state/AppContext';
import { Button, Card, Hero, P, Pill, PillRow, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { DateField } from '@/ui/DateField';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';
import { t, tr } from '@/i18n';

const PLACEHOLDER: Record<AppointmentKind, string> = tr({
  u: 'z. B. U5',
  impfung: 'z. B. Impfung bei der Kinderärztin',
  kita: 'z. B. Kita Sonnenschein, erster Tag',
  sonstiges: 'z. B. Babyschwimmen',
});

const STATE_LABEL: Record<UWindow['state'], string> = tr({ jetzt: 'Jetzt im Zeitraum', bald: 'Bald', spaeter: 'Später', vorbei: 'Vorbei' });

interface Draft { id: string | null; kind: AppointmentKind; title: string; date: string; time: string; note: string; remind: boolean }

const emptyDraft = (kind: AppointmentKind = 'u', title = '', date = todayIso()): Draft => ({ id: null, kind, title, date, time: '', note: '', remind: true });

/**
 * Familienkalender: Zeiträume der U-Untersuchungen und eigene Termine mit Erinnerung.
 * Reine Organisation – keine Bewertung, keine Impfempfehlung. Alles bleibt nur auf diesem Gerät.
 */
export default function Termine() {
  const db = useSQLiteContext();
  const { activeChild: child, children, reminders } = useChild();
  const params = useLocalSearchParams<{ u?: string }>();
  const today = todayIso();
  const [items, setItems] = useState<Appointment[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAllU, setShowAllU] = useState(false);

  const load = useCallback(async () => setItems(await listAppointments(db)), [db]);
  useEffect(() => { void load(); }, [load]);

  const windows = useMemo(() => uWindows(child, today, items).filter((w) => w.state !== 'vorbei'), [child, today, items]);
  const shownWindows = showAllU ? windows : windows.slice(0, 3);
  const next = upcoming(items, child.id, today);
  const past = items.filter((a) => a.childId === child.id && a.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Aus „Heute“: direkt das Formular für eine U-Untersuchung öffnen
  useEffect(() => {
    if (!params.u) return;
    const w = uWindows(child, today).find((x) => x.id === params.u);
    if (w) setDraft(emptyDraft('u', w.id, w.from > today ? w.from : today));
  }, [params.u, child, today]);

  const reschedule = async (list: Appointment[]) => {
    const names = new Map(children.map((c) => [c.id, c.name]));
    await rescheduleAppointments(list, (id) => names.get(id) ?? '', reminders.discreet).catch(() => 0);
  };

  const save = async () => {
    if (!draft) return;
    const a: Appointment = {
      id: draft.id ?? newId(), childId: child.id, kind: draft.kind, title: draft.title.trim(), date: draft.date,
      time: /^\d{1,2}:\d{2}$/.test(draft.time.trim()) ? draft.time.trim().padStart(5, '0') : null, note: draft.note.trim(), remind: draft.remind,
    };
    await saveAppointment(db, a);
    const list = await listAppointments(db);
    setItems(list);
    setDraft(null);
    let text = t('Termin gespeichert.');
    if (a.remind && remindersSupported) {
      if (await requestReminderPermission()) text = t('Termin gespeichert. Wir erinnern dich am Vortag um 18 Uhr.');
      else text = t('Termin gespeichert. Erinnerungen sind nicht erlaubt – du kannst sie in den Einstellungen des Handys einschalten.');
    }
    setMessage(text);
    await reschedule(list);
  };

  const remove = async (id: string) => {
    await deleteAppointment(db, id);
    const list = await listAppointments(db);
    setItems(list);
    if (draft?.id === id) setDraft(null);
    setMessage(t('Termin gelöscht.'));
    await reschedule(list);
  };

  const edit = (a: Appointment) => setDraft({ id: a.id, kind: a.kind, title: a.title, date: a.date, time: a.time ?? '', note: a.note, remind: a.remind });

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.xs }}>{t('Familienkalender')}</Hero>
      <P soft style={{ marginBottom: space.lg }}>{t('U-Untersuchungen, Impftermine und Kita-Eingewöhnung für {0} – mit Erinnerung am Vortag.', { 0: child.name })}</P>

      {message ? <Small soft={false} style={{ marginBottom: space.md, color: brand.blue }}>{message}</Small> : null}

      {draft ? (
        <Card tone="yellow">
          <Text style={[type.cardTitle, { color: brand.blue, marginBottom: space.sm }]}>{draft.id ? t('Termin bearbeiten') : t('Neuer Termin')}</Text>
          <PillRow>
            {APPOINTMENT_KINDS.map((k) => (
              <Pill key={k.id} label={`${k.emoji} ${k.label}`} selected={draft.kind === k.id} onPress={() => setDraft({ ...draft, kind: k.id })} />
            ))}
          </PillRow>
          <TextInput
            value={draft.title}
            onChangeText={(v) => setDraft({ ...draft, title: v })}
            placeholder={PLACEHOLDER[draft.kind]}
            placeholderTextColor={color.inkSoft}
            maxLength={60}
            accessibilityLabel={t('Bezeichnung')}
            style={[type.body, { backgroundColor: color.surface, borderRadius: radius.sm, padding: space.md, color: color.ink, marginBottom: space.md }]}
          />
          <DateField label={t('Datum')} value={draft.date} onChange={(d) => setDraft({ ...draft, date: d })} />
          <TextInput
            value={draft.time}
            onChangeText={(v) => setDraft({ ...draft, time: v.replace(/[^\d:]/g, '').slice(0, 5) })}
            placeholder={t('Uhrzeit (freiwillig), z. B. 09:30')}
            placeholderTextColor={color.inkSoft}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel={t('Uhrzeit (freiwillig)')}
            style={[type.body, { backgroundColor: color.surface, borderRadius: radius.sm, padding: space.md, color: color.ink, marginBottom: space.md }]}
          />
          <TextInput
            value={draft.note}
            onChangeText={(v) => setDraft({ ...draft, note: v })}
            placeholder={t('Notiz (freiwillig), z. B. Gelbes Heft mitnehmen')}
            placeholderTextColor={color.inkSoft}
            maxLength={200}
            multiline
            accessibilityLabel={t('Notiz')}
            style={[type.body, { backgroundColor: color.surface, borderRadius: radius.sm, padding: space.md, minHeight: 60, color: color.ink, marginBottom: space.md }]}
          />
          <Pressable
            onPress={() => setDraft({ ...draft, remind: !draft.remind })}
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.remind }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, marginBottom: space.md }}
          >
            {draft.remind ? <Bell size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} /> : <BellOff size={ICON.size} strokeWidth={ICON.stroke} color={color.inkSoft} />}
            <Text style={[type.body, { color: color.ink, flex: 1 }]}>{t('Am Vortag um 18 Uhr erinnern')}</Text>
          </Pressable>
          {!remindersSupported ? <Small style={{ marginBottom: space.md }}>{t('Erinnerungen funktionieren nur in der App auf dem Handy.')}</Small> : null}
          <Button label={t('Speichern')} onPress={save} />
          <Button label={t('Abbrechen')} variant="ghost" onPress={() => setDraft(null)} style={{ marginTop: space.sm }} />
        </Card>
      ) : (
        <Button label={t('Termin eintragen')} onPress={() => { setMessage(null); setDraft(emptyDraft('sonstiges')); }} style={{ marginBottom: space.lg }} />
      )}

      {next.length ? <Title>{t('Nächste Termine')}</Title> : null}
      {next.map((a) => <AppointmentRow key={a.id} a={a} onEdit={() => edit(a)} onDelete={() => remove(a.id)} />)}

      <Title>{t('U-Untersuchungen')}</Title>
      <Card>
        {shownWindows.length ? shownWindows.map((w, i) => (
          <View key={w.id} style={{ paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 52, height: 36, borderRadius: radius.pill, backgroundColor: w.state === 'jetzt' ? brand.yellow : brand.lilacSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[type.bodyBold, { color: brand.blue }]}>{w.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <P bold>{formatMonth(w.from) === formatMonth(w.to) ? formatMonth(w.from) : t('etwa {0} bis {1}', { 0: formatMonth(w.from), 1: formatMonth(w.to) })}</P>
                <Small>{`${w.label} · ${STATE_LABEL[w.state]}`}</Small>
                {w.booked ? (
                  <Small soft={false} style={{ color: brand.blue, marginTop: 2 }}>{t('✓ Termin am {0}', { 0: formatDayLong(w.booked.date) })}</Small>
                ) : (
                  <Pressable onPress={() => { setMessage(null); setDraft(emptyDraft('u', w.id, w.from > today ? w.from : today)); }} accessibilityRole="button" hitSlop={8} style={{ marginTop: 2 }}>
                    <Text style={[type.smallBold, { color: brand.blue }]}>{t('Termin eintragen')}</Text>
                  </Pressable>
                )}
              </View>
            </Row>
          </View>
        )) : <Small>{t('Alle U-Untersuchungen bis zur U9 liegen hinter euch.')}</Small>}
        {windows.length > 3 ? (
          <Pressable onPress={() => setShowAllU(!showAllU)} accessibilityRole="button" hitSlop={8} style={{ marginTop: space.sm }}>
            <Text style={[type.smallBold, { color: brand.blue }]}>{showAllU ? t('Weniger anzeigen') : t('Alle anzeigen ({0})', { 0: windows.length })}</Text>
          </Pressable>
        ) : null}
        <Small style={{ marginTop: space.md }}>
          {t('Zeiträume laut Kinder-Richtlinie des G-BA. Weil die App nur den Geburtsmonat kennt, sind sie auf den Monat genau. Den Termin vereinbart ihr mit der Kinderarztpraxis; maßgeblich ist das Gelbe Heft.')}</Small>
      </Card>

      <Card tone="lilac">
        <Text style={[type.bodyBold, { color: brand.blue }]}>{t('💉 Impftermine')}</Text>
        <Small soft={false} style={{ marginTop: space.xs }}>
          {t('Welche Impfungen wann anstehen, bespricht die Kinderarztpraxis mit euch – oft zusammen mit einer U-Untersuchung. Die App gibt keine Impfempfehlung; tragt eure Termine einfach hier ein.')}</Small>
      </Card>

      {past.length ? <Title>{t('Vergangene Termine')}</Title> : null}
      {past.map((a) => <AppointmentRow key={a.id} a={a} past onEdit={() => edit(a)} onDelete={() => remove(a.id)} />)}

      <Small style={{ marginTop: space.lg }}>{t('🔒 Termine bleiben nur auf diesem Gerät – auch bei Familienfreigabe werden sie nicht übertragen.')}</Small>
      <View style={{ marginTop: space.md, gap: space.xs }}>
        {CALENDAR_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
      </View>
    </Screen>
  );
}

function AppointmentRow({ a, past, onEdit, onDelete }: { a: Appointment; past?: boolean; onEdit: () => void; onDelete: () => void }) {
  const k = kindInfo(a.kind);
  return (
    <Card onPress={onEdit} accessibilityLabel={t('{0} bearbeiten', { 0: a.title || k.label })} style={{ paddingVertical: space.lg, opacity: past ? 0.7 : 1 }}>
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: brand.lilacSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>{k.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Small>{a.time ? t('{0}, {1} Uhr', { 0: formatDayLong(a.date), 1: a.time }) : formatDayLong(a.date)}</Small>
          <P bold>{a.title || k.label}</P>
          {a.note ? <Small soft={false}>{a.note}</Small> : null}
          {a.remind && !past ? <Small>{t('🔔 Erinnerung am Vortag')}</Small> : null}
        </View>
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel={t('{0} löschen', { 0: a.title || k.label })} hitSlop={10}>
          <Trash2 size={18} color={color.inkSoft} />
        </Pressable>
      </Row>
    </Card>
  );
}
