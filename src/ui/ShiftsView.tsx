import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Settings } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { addDays, formatDay, parseDay } from '@/domain/dates';
import { planDays } from '@/domain/planner';
import { planDayTasks, SHIFT_ORDER, SHIFT_STYLE, type FamilySettings, type ShiftEntry, type ShiftKind } from '@/domain/shifts';
import { listShifts, newId } from '@/db/repo';
import { useChild } from '@/state/AppContext';
import { Button, Card, Choice, Field, Heading, Important, P, Pill, PillRow, Row, Small, Title } from './components';
import { useToast } from './Toast';
import { color, radius, space, type } from './theme';

const PERSON_EMOJI = ['👩', '👨', '👵', '👴', '🧑', '👩‍🍼'];
const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Uhrzeit mit Plus/Minus in 15-Minuten-Schritten – kein Tippen nötig. */
export function TimeStepper({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const shift = (delta: number) => {
    const [h, m] = value.split(':').map(Number);
    const total = (h * 60 + m + delta + 24 * 60) % (24 * 60);
    onChange(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
  };
  const btn = (txt: string, d: number) => (
    <Pressable
      onPress={() => shift(d)}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${d > 0 ? 'später' : 'früher'}`}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={[type.bodyBold, { color: color.sageDeep, fontSize: 20 }]}>{txt}</Text>
    </Pressable>
  );
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
      <P style={{ flex: 1 }}>{label}</P>
      {btn('−', -15)}
      <Text style={[type.bodyBold, { color: color.ink, width: 64, textAlign: 'center', fontSize: 18 }]}>{value}</Text>
      {btn('+', 15)}
    </Row>
  );
}

export function ShiftsView({ from }: { from: string }) {
  const db = useSQLiteContext();
  const { activeChild: child, logs, caregivers, saveCaregiver, removeCaregiver, familySettings, saveFamilySettings, shiftsVersion, setShift } = useChild();
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(PERSON_EMOJI[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [picker, setPicker] = useState<{ caregiverId: string; date: string } | null>(null);
  const [editKind, setEditKind] = useState<Exclude<ShiftKind, 'frei'> | null>(null);
  const toast = useToast();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(from, i)), [from]);
  const plan = useMemo(() => planDays(child, logs, from, 7), [child, logs, from]);

  useEffect(() => {
    listShifts(db, addDays(from, -1), addDays(from, 6)).then(setShifts);
  }, [db, from, shiftsVersion]);

  const kindOf = (cid: string, d: string): ShiftKind => shifts.find((s) => s.caregiverId === cid && s.date === d)?.kind ?? 'frei';
  const update = (patch: Partial<FamilySettings>) => saveFamilySettings({ ...familySettings, ...patch });

  /** Dienst setzen – sofort sichtbar, dann gespeichert. */
  const apply = async (entries: ShiftEntry[]) => {
    setShifts((prev) => [
      ...prev.filter((x) => !entries.some((e) => e.caregiverId === x.caregiverId && e.date === x.date)),
      ...entries,
    ]);
    for (const e of entries) await setShift(e.caregiverId, e.date, e.kind);
  };

  /** Dienste der Vorwoche übernehmen (typisch im Schichtrhythmus). */
  const copyLastWeek = async () => {
    const before = await listShifts(db, addDays(from, -7), addDays(from, -1));
    const previous = shifts.filter((x) => days.includes(x.date));
    await apply(before.map((e) => ({ ...e, date: addDays(e.date, 7) })));
    toast({
      emoji: '↺',
      text: before.length ? `${before.length} Dienste aus der Vorwoche übernommen` : 'Vorwoche war leer',
      undo: before.length ? async () => {
        await apply(days.flatMap((d) => caregivers.map((c) => ({
          caregiverId: c.id, date: d, kind: previous.find((p) => p.caregiverId === c.id && p.date === d)?.kind ?? 'frei',
        }))));
      } : undefined,
    });
  };

  const addPerson = (
    <Card>
      <Field label="Name" value={newName} onChangeText={setNewName} placeholder="z. B. Papa, Oma" maxLength={40} />
      <PillRow>
        {PERSON_EMOJI.map((e) => <Pill key={e} label={e} selected={newEmoji === e} onPress={() => setNewEmoji(e)} />)}
      </PillRow>
      <Button
        label="Person hinzufügen"
        disabled={!newName.trim()}
        onPress={async () => {
          await saveCaregiver({ id: newId(), name: newName.trim(), emoji: newEmoji });
          setNewName('');
        }}
      />
    </Card>
  );

  if (caregivers.length === 0) {
    return (
      <>
        <Card tone="peach">
          <Text style={{ fontSize: 40 }}>👥</Text>
          <Heading style={{ marginTop: space.sm }}>Wer kümmert sich wann?</Heading>
          <P style={{ marginTop: space.xs }}>
            Trage ein, wer Früh-, Spät- oder Nachtdienst hat. Die App zeigt dann für jeden Tag, wer füttern
            oder zur Kita bringen kann – und markiert Lücken rot.
          </P>
        </Card>
        <Title>Erste Person anlegen</Title>
        {addPerson}
      </>
    );
  }

  return (
    <>
      {/* Dienstplan-Raster: Antippen öffnet die Auswahl */}
      <Button label="Wie letzte Woche übernehmen" icon={RotateCcw} variant="soft" style={{ marginBottom: space.md }} onPress={copyLastWeek} />
      <Card style={{ paddingHorizontal: space.md }}>
        <Small style={{ marginBottom: space.sm }}>Tippe auf einen Tag, um den Dienst zu wählen.</Small>
        <Row style={{ gap: 4 }}>
          <View style={{ width: 44 }} />
          {days.map((d) => (
            <Text key={d} style={[type.smallBold, { flex: 1, textAlign: 'center', color: color.inkSoft }]}>
              {WEEKDAY_SHORT[(parseDay(d).getUTCDay() + 6) % 7]}
            </Text>
          ))}
        </Row>
        {caregivers.map((c) => (
          <Row key={c.id} style={{ gap: 4, marginTop: space.sm }}>
            <View style={{ width: 44, alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
              <Text style={[type.small, { color: color.inkSoft, fontSize: 11 }]} numberOfLines={1}>{c.name}</Text>
            </View>
            {days.map((d) => {
              const k = kindOf(c.id, d);
              return (
                <Pressable
                  key={d}
                  onPress={() => setPicker({ caregiverId: c.id, date: d })}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${formatDay(d)}: ${SHIFT_STYLE[k].short}`}
                  style={{
                    flex: 1, height: 56, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: k === 'frei' ? color.sageSoft : k === 'nacht' ? '#E7E3F4' : color.peachSoft,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{SHIFT_STYLE[k].emoji}</Text>
                  <Text style={[type.small, { fontSize: 10, color: color.ink }]}>{SHIFT_STYLE[k].short}</Text>
                </Pressable>
              );
            })}
          </Row>
        ))}
      </Card>

      {/* Wer macht was – pro Tag */}
      <Title>Wer macht was?</Title>
      {days.map((d, i) => {
        const tasks = planDayTasks({ date: d, caregivers, shifts, settings: familySettings, meals: plan[i].meals.map((m) => m.slot) });
        const gaps = tasks.filter((t) => !t.caregiverId).length;
        if (tasks.length === 0) return null;
        return (
          <Card key={d} style={{ paddingVertical: space.lg }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
              <Heading>{formatDay(d)}</Heading>
              {gaps ? <Text style={[type.smallBold, { color: color.red }]}>{gaps} {gaps === 1 ? 'Lücke' : 'Lücken'}</Text> : null}
            </Row>
            {tasks.map((t) => {
              const who = caregivers.find((c) => c.id === t.caregiverId);
              return (
                <Row key={t.kind} style={{ paddingVertical: 6 }}>
                  <Text style={[type.smallBold, { color: color.inkSoft, width: 48 }]}>{t.time}</Text>
                  <P style={{ flex: 1 }}>{t.label}</P>
                  {who ? (
                    <Text style={[type.bodyBold, { color: color.sageDeep }]}>{who.emoji} {who.name}</Text>
                  ) : (
                    <Text style={[type.bodyBold, { color: color.red }]}>! Niemand frei</Text>
                  )}
                </Row>
              );
            })}
          </Card>
        );
      })}
      {days.some((d, i) => planDayTasks({ date: d, caregivers, shifts, settings: familySettings, meals: plan[i].meals.map((m) => m.slot) }).some((t) => !t.caregiverId)) ? (
        <Important title="Betreuungslücken diese Woche">
          Rot markierte Zeiten sind durch niemanden abgedeckt. Fügt eine weitere Person hinzu (z. B. Großeltern) oder tauscht Dienste.
        </Important>
      ) : null}

      {/* Einstellungen */}
      <Button
        label={showSettings ? 'Einstellungen schließen' : 'Personen, Kita & Zeiten'}
        variant="soft"
        icon={Settings}
        onPress={() => setShowSettings((v) => !v)}
      />
      {showSettings ? (
        <>
          <Title>Personen</Title>
          <Card style={{ paddingVertical: space.md }}>
            {caregivers.map((c) => (
              <Row key={c.id} style={{ justifyContent: 'space-between', paddingVertical: space.xs }}>
                <P>{c.emoji} {c.name}</P>
                <Button label="Entfernen" variant="ghost" onPress={() => removeCaregiver(c.id)} />
              </Row>
            ))}
          </Card>
          {addPerson}

          <Title>Kita</Title>
          <Card>
            <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
              <P bold>Kind geht in die Kita</P>
              <Switch
                value={familySettings.kita.enabled}
                onValueChange={(v) => update({ kita: { ...familySettings.kita, enabled: v } })}
                trackColor={{ true: color.sage, false: color.line }}
                accessibilityLabel="Kita"
              />
            </Row>
            {familySettings.kita.enabled ? (
              <>
                <PillRow>
                  {[1, 2, 3, 4, 5].map((wd) => (
                    <Pill
                      key={wd}
                      label={WEEKDAY_SHORT[wd - 1]}
                      selected={familySettings.kita.weekdays.includes(wd)}
                      onPress={() => {
                        const w = familySettings.kita.weekdays;
                        update({ kita: { ...familySettings.kita, weekdays: w.includes(wd) ? w.filter((x) => x !== wd) : [...w, wd].sort() } });
                      }}
                    />
                  ))}
                </PillRow>
                <TimeStepper label="Bringen" value={familySettings.kita.bring} onChange={(v) => update({ kita: { ...familySettings.kita, bring: v } })} />
                <TimeStepper label="Abholen" value={familySettings.kita.pickup} onChange={(v) => update({ kita: { ...familySettings.kita, pickup: v } })} />
                <Small>An Kita-Tagen isst dein Kind mittags in der Kita.</Small>
              </>
            ) : null}
          </Card>

          <Title>Dienstzeiten</Title>
          <Card>
            {(['frueh', 'spaet', 'nacht', 'buero'] as const).map((k) => (
              <View key={k} style={{ marginBottom: space.md }}>
                <P bold>{SHIFT_STYLE[k].emoji} {familySettings.shiftTimes[k].label}</P>
                <TimeStepper label="Beginn" value={familySettings.shiftTimes[k].start}
                  onChange={(v) => update({ shiftTimes: { ...familySettings.shiftTimes, [k]: { ...familySettings.shiftTimes[k], start: v } } })} />
                <TimeStepper label="Ende" value={familySettings.shiftTimes[k].end}
                  onChange={(v) => update({ shiftTimes: { ...familySettings.shiftTimes, [k]: { ...familySettings.shiftTimes[k], end: v } } })} />
              </View>
            ))}
            <TimeStepper
              label="Arbeitsweg (Std:Min)"
              value={`${String(Math.floor(familySettings.commuteMinutes / 60)).padStart(2, '0')}:${String(familySettings.commuteMinutes % 60).padStart(2, '0')}`}
              onChange={(v) => {
                const [h, m] = v.split(':').map(Number);
                update({ commuteMinutes: Math.min(180, h * 60 + m) });
              }}
            />
          </Card>

          <Title>Essenszeiten</Title>
          <Card>
            <TimeStepper label="Mittag" value={familySettings.mealTimes.mittag} onChange={(v) => update({ mealTimes: { ...familySettings.mealTimes, mittag: v } })} />
            <TimeStepper label="Nachmittag" value={familySettings.mealTimes.nachmittag} onChange={(v) => update({ mealTimes: { ...familySettings.mealTimes, nachmittag: v } })} />
            <TimeStepper label="Abend" value={familySettings.mealTimes.abend} onChange={(v) => update({ mealTimes: { ...familySettings.mealTimes, abend: v } })} />
          </Card>
        </>
      ) : null}

      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => { setPicker(null); setEditKind(null); }}>
        <Pressable style={{ flex: 1, minHeight: 40, backgroundColor: 'rgba(61,46,42,0.35)' }} onPress={() => { setPicker(null); setEditKind(null); }} accessibilityLabel="Schließen" />
        {picker ? (
          <ScrollView style={{ maxHeight: '88%', backgroundColor: color.creme, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }} contentContainerStyle={{ padding: space.xl, paddingBottom: 40 }}>
            <Heading style={{ marginBottom: space.xs }}>
              {caregivers.find((c) => c.id === picker.caregiverId)?.emoji} {caregivers.find((c) => c.id === picker.caregiverId)?.name}
            </Heading>
            <Small style={{ marginBottom: space.lg }}>{formatDay(picker.date)}</Small>
            {SHIFT_ORDER.map((k) => (
              <Choice
                key={k}
                emoji={SHIFT_STYLE[k].emoji}
                label={SHIFT_STYLE[k].short}
                hint={k === 'frei' ? 'Kein Dienst' : `${familySettings.shiftTimes[k].start}–${familySettings.shiftTimes[k].end}`}
                selected={kindOf(picker.caregiverId, picker.date) === k}
                onPress={async () => {
                  await apply([{ caregiverId: picker.caregiverId, date: picker.date, kind: k }]);
                  setPicker(null);
                }}
              />
            ))}
            {/* Zeiten jedes Diensttyps direkt hier anpassen */}
            <Pressable
              onPress={() => {
                const k = kindOf(picker.caregiverId, picker.date);
                setEditKind(editKind ? null : k === 'frei' ? 'frueh' : k);
              }}
              accessibilityRole="button"
              style={{ paddingVertical: space.sm, marginBottom: space.sm }}
            >
              <Text style={[type.bodyBold, { color: color.sageDeep }]}>⏰ {editKind ? 'Zeiten ausblenden' : 'Zeiten anpassen'}</Text>
            </Pressable>
            {editKind ? (
              <View style={{ backgroundColor: color.surface, borderRadius: radius.md, padding: space.lg, marginBottom: space.md }}>
                <PillRow>
                  {(['frueh', 'spaet', 'nacht', 'buero'] as const).map((k) => (
                    <Pill key={k} label={`${SHIFT_STYLE[k].emoji} ${SHIFT_STYLE[k].short}`} selected={editKind === k} onPress={() => setEditKind(k)} />
                  ))}
                </PillRow>
                <TimeStepper
                  label="Beginn"
                  value={familySettings.shiftTimes[editKind].start}
                  onChange={(v) => update({ shiftTimes: { ...familySettings.shiftTimes, [editKind]: { ...familySettings.shiftTimes[editKind], start: v } } })}
                />
                <TimeStepper
                  label="Ende"
                  value={familySettings.shiftTimes[editKind].end}
                  onChange={(v) => update({ shiftTimes: { ...familySettings.shiftTimes, [editKind]: { ...familySettings.shiftTimes[editKind], end: v } } })}
                />
                <Small>Gilt für alle Personen und Tage mit diesem Dienst.</Small>
              </View>
            ) : null}
            <Button
              label="Für Mo–Fr dieser Woche übernehmen"
              variant="ghost"
              onPress={async () => {
                const k = kindOf(picker.caregiverId, picker.date);
                await apply(days.slice(0, 5).map((d) => ({ caregiverId: picker.caregiverId, date: d, kind: k })));
                setPicker(null);
                toast({ text: `${SHIFT_STYLE[k].short} für Mo–Fr eingetragen` });
              }}
            />
          </ScrollView>
        ) : null}
      </Modal>
    </>
  );
}
