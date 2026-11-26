import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { newId, setMeta } from '@/db/repo';
import { useSQLiteContext } from 'expo-sqlite';

const CONSENT_VERSION = '2026-11-26b';
import { useApp } from '@/state/AppContext';
import { Button, Card, Field, Hero, Important, P, ProgressBar, Row, Screen, Small } from '@/ui/components';
import { AllergyStep, ApproachStep, MilkStep, NameAndBirth, StartStep, useChildDraft } from '@/ui/ChildForm';
import { color, space, type } from '@/ui/theme';

const STEPS = [
  { title: 'Hallo! Wer startet mit der Beikost?', emoji: '👶' },
  { title: 'Wie trinkt dein Kind Milch?', emoji: '🍼' },
  { title: 'Wie möchtet ihr starten?', emoji: '🥄' },
  { title: 'Gibt es bekannte Allergien?', emoji: '🩺' },
  { title: 'Wann geht es los?', emoji: '🗓️' },
];

/** Eine Frage pro Schritt, Auswahlkarten statt Formular. */
export default function Onboarding() {
  const { familyId, saveChild, saveParentName } = useApp();
  const [parentName, setParentName] = useState('');
  const db = useSQLiteContext();
  const d = useChildDraft();
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const last = step === STEPS.length - 1;
  const canNext = step === 0 ? !!d.birthDate : step === 3 ? consent : true;

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} accessibilityRole="button" hitSlop={12}>
            <Text style={[type.bodyBold, { color: color.sageDeep }]}>‹ Zurück</Text>
          </Pressable>
        ) : <View />}
        <Small>Schritt {step + 1} von {STEPS.length}</Small>
      </Row>
      <ProgressBar value={step + 1} max={STEPS.length} />

      <Text style={{ fontSize: 56, marginTop: space.xl }}>{STEPS[step].emoji}</Text>
      <Hero style={{ marginVertical: space.lg }}>{STEPS[step].title}</Hero>

      {step === 0 ? (
        <>
          <NameAndBirth d={d} />
          <Field label="Und wie heißt du? (freiwillig)" value={parentName} onChangeText={setParentName} placeholder="Dein Vorname" hint="Damit wir dich jeden Tag persönlich begrüßen können. Bleibt auf diesem Handy." autoCapitalize="words" autoComplete="name" maxLength={40} />
          <Pressable onPress={() => router.push('/rechtliches')} accessibilityRole="link">
            <Small>Diese App ersetzt keine kinderärztliche Beratung. <Text style={{ textDecorationLine: 'underline' }}>Datenschutz & Hinweise</Text></Small>
          </Pressable>
        </>
      ) : null}
      {step === 1 ? <MilkStep d={d} /> : null}
      {step === 2 ? (
        <>
          <ApproachStep d={d} />
          {d.approach === 'blw' ? (
            <Important>
              Laut Netzwerk Gesund ins Leben fehlen für Baby-led Weaning bisher ein durchgerechnetes Konzept und ein
              Sicherheitsnachweis. Achte besonders auf weiche Stücke und lass dein Kind nie allein essen.
            </Important>
          ) : null}
        </>
      ) : null}
      {step === 3 ? (
        <>
          <AllergyStep d={d} />
          <Card tone="butter">
            <Row>
              <View style={{ flex: 1 }}>
                <P>
                  Ich willige ein, dass Gesundheitsangaben meines Kindes (Allergien, Reaktionen, Verdauung) in der App
                  gespeichert werden. Sie bleiben auf diesem Gerät, bis du die Familienfreigabe startest oder ein Konto verknüpfst. Widerruf jederzeit
                  unter Familie → Datenschutz (löscht die Daten).
                </P>
              </View>
              <Switch value={consent} onValueChange={setConsent} trackColor={{ true: color.sage, false: color.line }} accessibilityLabel="Einwilligung Gesundheitsdaten" />
            </Row>
          </Card>
        </>
      ) : null}
      {step === 4 ? <StartStep d={d} /> : null}

      <Button
        label={last ? 'Plan erstellen' : 'Weiter'}
        disabled={!canNext}
        style={{ marginTop: space.xl }}
        onPress={async () => {
          if (!last) return setStep((s) => s + 1);
          // Einwilligung mit Datum und Textversion festhalten (Nachweispflicht, Art. 7 Abs. 1 DSGVO)
          await setMeta(db, 'consent_health', JSON.stringify({ version: CONSENT_VERSION, date: new Date().toISOString() }));
          if (parentName.trim()) await saveParentName(parentName);
          await saveChild(d.build(familyId, newId()));
          router.replace('/heute'); // dort startet die geführte Tour
        }}
      />
    </Screen>
  );
}
