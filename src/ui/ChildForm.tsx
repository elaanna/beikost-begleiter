import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { ALLERGEN_LABEL } from '@/data/foods';
import { READINESS_SIGNS } from '@/data/guidelines';
import { addMonths, formatDayLong, formatMonth, recentMonths, todayIso } from '@/domain/dates';
import { computeStartWindow } from '@/domain/startWindow';
import type { Allergen, Child, FeedingApproach, MilkFeeding } from '@/domain/types';
import { Button, Card, Choice, Field, Heading, P, Row, Small } from './components';
import { DateField } from './DateField';
import { color, space, type } from './theme';

export const ALLERGENS: { id: Allergen; emoji: string }[] = [
  { id: 'milch', emoji: '🥛' }, { id: 'ei', emoji: '🥚' }, { id: 'erdnuss', emoji: '🥜' }, { id: 'baumnuss', emoji: '🌰' },
  { id: 'fisch', emoji: '🐟' }, { id: 'gluten', emoji: '🌾' }, { id: 'soja', emoji: '🫘' }, { id: 'sesam', emoji: '🌱' },
];

/** Gemeinsamer Zustand für Onboarding und Bearbeiten. */
export function useChildDraft(initial?: Child) {
  const [name, setName] = useState(initial?.name ?? '');
  // Bestehende genaue Geburtstage werden beim Bearbeiten auf den Monat reduziert
  const [birthDate, setBirthDate] = useState<string | null>(initial?.birthDate ? `${initial.birthDate.slice(0, 7)}-15` : null);
  const [startDate, setStartDate] = useState<string | null>(initial?.startDate ?? null);
  const [approach, setApproach] = useState<FeedingApproach>(initial?.approach ?? 'brei');
  const [milk, setMilk] = useState<MilkFeeding>(initial?.milk ?? 'stillen');
  const [exclusions, setExclusions] = useState<Allergen[]>(initial?.exclusions ?? []);
  const [ad, setAd] = useState(initial?.atopicDermatitis ?? false);
  const [peanutCleared, setPeanutCleared] = useState(initial?.peanutCleared ?? false);
  const toggleAllergen = (a: Allergen) => setExclusions((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));

  const build = (familyId: string, id: string): Child => ({
    id: initial?.id ?? id,
    familyId: initial?.familyId ?? familyId,
    name: name.trim() || 'Baby',
    birthDate: birthDate!,
    startDate,
    approach,
    milk,
    atopicDermatitis: ad,
    peanutCleared: ad ? peanutCleared : false,
    exclusions,
    excludedFoods: initial?.excludedFoods ?? [],
  });

  return {
    name, setName, birthDate, setBirthDate, startDate, setStartDate, approach, setApproach, milk, setMilk,
    exclusions, toggleAllergen, ad, setAd, peanutCleared, setPeanutCleared, build,
  };
}

export type ChildDraft = ReturnType<typeof useChildDraft>;

/**
 * Datensparsam: Spitzname optional, nur Geburtsmonat (kein genauer Geburtstag, kein voller Name).
 */
export function NameAndBirth({ d }: { d: ChildDraft }) {
  const months = recentMonths(todayIso(), 15);
  const selected = d.birthDate ? d.birthDate.slice(0, 7) : null;
  return (
    <>
      <Field
        label="Spitzname (optional)"
        value={d.name === 'Baby' ? '' : d.name}
        onChangeText={d.setName}
        placeholder="z. B. Maus – leer lassen geht auch"
        maxLength={30}
      />
      <Text style={[type.bodyBold, { color: color.ink, marginBottom: space.xs }]}>Geburtsmonat</Text>
      <Small style={{ marginBottom: space.sm }}>Den genauen Tag brauchen wir nicht.</Small>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
        {months.map((m) => {
          const on = selected === m.iso.slice(0, 7);
          return (
            <Pressable
              key={m.iso}
              onPress={() => d.setBirthDate(m.iso)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={formatMonth(m.iso)}
              style={{
                paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 2,
                borderColor: on ? color.sageDeep : color.line, backgroundColor: on ? color.sageSoft : color.surface,
              }}
            >
              <Text style={[type.smallBold, { color: on ? color.sageDeep : color.ink }]}>{formatMonth(m.iso)}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function MilkStep({ d }: { d: ChildDraft }) {
  return (
    <>
      <Choice emoji="🤱" label="Gestillt" selected={d.milk === 'stillen'} onPress={() => d.setMilk('stillen')} />
      <Choice emoji="🍼" label="Flasche" hint="Säuglingsnahrung" selected={d.milk === 'flasche'} onPress={() => d.setMilk('flasche')} />
      <Choice emoji="💞" label="Beides" selected={d.milk === 'beides'} onPress={() => d.setMilk('beides')} />
    </>
  );
}

export function ApproachStep({ d }: { d: ChildDraft }) {
  return (
    <>
      <Choice emoji="🥣" label="Brei vom Löffel" hint="Klassischer Breiplan, empfohlen von Gesund ins Leben" selected={d.approach === 'brei'} onPress={() => d.setApproach('brei')} />
      <Choice emoji="🥦" label="Gemischt" hint="Brei und weiche Stücke zum Selberessen" selected={d.approach === 'gemischt'} onPress={() => d.setApproach('gemischt')} />
      <Choice emoji="✋" label="Fingerfood (BLW)" hint="Baby isst selbst weiche Stücke" selected={d.approach === 'blw'} onPress={() => d.setApproach('blw')} />
    </>
  );
}

export function AllergyStep({ d }: { d: ChildDraft }) {
  return (
    <>
      <Small style={{ marginBottom: space.md }}>
        Nur auswählen, was ärztlich festgestellt wurde. Vorbeugendes Weglassen schützt laut S3-Leitlinie nicht vor Allergien.
      </Small>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
        {ALLERGENS.map((a) => (
          <View key={a.id} style={{ width: '48%' }}>
            <Choice emoji={a.emoji} label={ALLERGEN_LABEL[a.id]} tone="red" selected={d.exclusions.includes(a.id)} onPress={() => d.toggleAllergen(a.id)} />
          </View>
        ))}
      </View>
      <Card style={{ paddingVertical: space.lg }}>
        <Row>
          <View style={{ flex: 1 }}>
            <P bold>Mittelschwere bis schwere Neurodermitis</P>
            <Small>Dann wird Erdnuss erst nach ärztlicher Abklärung eingeplant.</Small>
          </View>
          <Switch value={d.ad} onValueChange={d.setAd} trackColor={{ true: color.sage, false: color.line }} accessibilityLabel="Neurodermitis" />
        </Row>
        {d.ad ? (
          <Row style={{ marginTop: space.lg }}>
            <View style={{ flex: 1 }}><P bold>Erdnuss ist ärztlich abgeklärt</P></View>
            <Switch value={d.peanutCleared} onValueChange={d.setPeanutCleared} trackColor={{ true: color.sage, false: color.line }} accessibilityLabel="Erdnuss abgeklärt" />
          </Row>
        ) : null}
      </Card>
    </>
  );
}

export function StartStep({ d }: { d: ChildDraft }) {
  if (!d.birthDate) return null;
  const w = computeStartWindow(d.birthDate, d.milk);
  const chosen = d.startDate ?? w.suggested;
  return (
    <>
      <Card tone="peach">
        <Small bold soft={false}>Unser Vorschlag</Small>
        <Text style={[type.title, { color: color.ink }]}>{formatDayLong(w.suggested)}</Text>
        <Small soft={false} style={{ marginTop: space.xs }}>
          Empfohlenes Fenster: {formatDayLong(w.earliest)} bis {formatDayLong(w.latest)}
        </Small>
        <P style={{ marginTop: space.md }}>{w.note}</P>
      </Card>
      <Card tone="sage">
        <Heading>🌱 Achte auf die Reifezeichen</Heading>
        {READINESS_SIGNS.map((r) => <P key={r} style={{ marginTop: space.xs }}>• {r}</P>)}
      </Card>
      <DateField
        label="Startdatum (änderbar)"
        value={chosen}
        onChange={d.setStartDate}
        minimum={addMonths(d.birthDate, 3)}
        maximum={addMonths(d.birthDate, 9)}
      />
    </>
  );
}

/** Einseitige Bearbeitung (Kind bearbeiten / Geschwisterkind). */
export function ChildForm({ initial, familyId, newId, onSave }: {
  initial?: Child; familyId: string; newId: () => string; onSave: (child: Child) => void;
}) {
  const d = useChildDraft(initial);
  const valid = !!d.birthDate;
  return (
    <View>
      <NameAndBirth d={d} />
      <Heading style={{ marginVertical: space.md }}>Milch</Heading>
      <MilkStep d={d} />
      <Heading style={{ marginVertical: space.md }}>Wie esst ihr?</Heading>
      <ApproachStep d={d} />
      <Heading style={{ marginVertical: space.md }}>Bekannte Allergien</Heading>
      <AllergyStep d={d} />
      {d.birthDate ? <><Heading style={{ marginVertical: space.md }}>Beikoststart</Heading><StartStep d={d} /></> : null}
      <Button label="Speichern" disabled={!valid} style={{ marginTop: space.lg }} onPress={() => onSave(d.build(familyId, newId()))} />
    </View>
  );
}
