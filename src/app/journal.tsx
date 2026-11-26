import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Trash2 } from 'lucide-react-native';
import { JOURNAL_BY_ID, JOURNAL_KINDS } from '@/data/journal';
import { deleteJournal, listJournal, newId, saveJournal, type JournalEntry } from '@/db/repo';
import { formatDayLong, todayIso } from '@/domain/dates';
import { genitive } from '@/domain/beikostOverview';
import { useChild } from '@/state/AppContext';
import { Button, Card, Hero, P, Pill, PillRow, Row, Screen, Small, Title } from '@/ui/components';
import { DateField } from '@/ui/DateField';
import { brand, color, radius, space, type } from '@/ui/theme';
import { t } from '@/i18n';

/** Journal „Erste Male“ – kleine Momente als Notiz, ohne Fotos, ohne Vergleich. */
export default function Journal() {
  const db = useSQLiteContext();
  const { activeChild: child, logs, familyId, sync } = useChild();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [kind, setKind] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayIso());

  const load = useCallback(async () => setEntries(await listJournal(db, child.id)), [db, child.id]);
  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  // Erster Löffel ergibt sich aus dem ersten Eintrag im Tracker – nur anzeigen, wenn nicht selbst notiert
  const firstLog = logs.filter((l) => l.childId === child.id).map((l) => l.date).sort()[0];
  const auto: JournalEntry[] = firstLog && !entries.some((e) => e.kind === 'loeffel')
    ? [{ id: 'auto-loeffel', childId: child.id, date: firstLog, kind: 'loeffel', text: t('Aus dem Tracker') }]
    : [];
  const all = [...entries, ...auto].sort((a, b) => b.date.localeCompare(a.date));

  const add = async () => {
    if (!kind) return;
    await saveJournal(db, familyId, { id: newId(), childId: child.id, date, kind, text: text.trim() });
    setKind(null); setText(''); setDate(todayIso());
    await load();
    void sync();
  };

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.xs }}>{t('{0} erste Male', { 0: genitive(child.name) })}</Hero>
      <P soft style={{ marginBottom: space.lg }}>{t('Kleine Momente zum Erinnern – ohne Fotos, ohne Vergleich. Jedes Kind hat sein eigenes Tempo.')}</P>

      <Card tone="yellow">
        <Text style={[type.cardTitle, { color: brand.blue, marginBottom: space.sm }]}>{t('Neuer Moment')}</Text>
        <PillRow>
          {JOURNAL_KINDS.map((k) => (
            <Pill key={k.id} label={`${k.emoji} ${k.label}`} selected={kind === k.id} onPress={() => setKind(kind === k.id ? null : k.id)} />
          ))}
        </PillRow>
        {kind ? (
          <>
            <DateField label={t('Wann?')} value={date} onChange={setDate} maximum={todayIso()} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={kind === 'eigenes' ? t('Was ist passiert?') : t('Kurze Notiz (freiwillig)')}
              placeholderTextColor={color.inkSoft}
              maxLength={200}
              multiline
              accessibilityLabel={t('Notiz')}
              style={[type.body, { backgroundColor: color.surface, borderRadius: radius.sm, padding: space.md, minHeight: 72, color: color.ink, marginBottom: space.md }]}
            />
            <Button label={t('Festhalten')} disabled={kind === 'eigenes' && !text.trim()} onPress={add} />
          </>
        ) : null}
      </Card>

      {all.length ? <Title>{t('Eure Momente')}</Title> : null}
      {all.map((e) => {
        const k = JOURNAL_BY_ID[e.kind] ?? JOURNAL_BY_ID.eigenes;
        return (
          <Card key={e.id} style={{ paddingVertical: space.lg }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: brand.lilacSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{k.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Small>{formatDayLong(e.date)}</Small>
                <P bold>{t(k.label)}</P>
                {e.text ? <Small soft={false}>{t(e.text)}</Small> : null}
              </View>
              {!e.id.startsWith('auto-') ? (
                <Pressable onPress={async () => { await deleteJournal(db, e.id); await load(); void sync(); }} accessibilityLabel={t('{0} löschen', { 0: k.label })} hitSlop={10}>
                  <Trash2 size={18} color={color.inkSoft} />
                </Pressable>
              ) : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
