import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  countObserved, NOT_READINESS_SIGNS, READINESS_DECISION, READINESS_GENERAL, READINESS_SIGNS_LIST, type Observation,
} from '@/domain/readiness';
import { useChild } from '@/state/AppContext';
import { Button, Card, Choice, Hero, P, ProgressBar, Row, Screen, Small, SourceLink } from '@/ui/components';
import { color, space, type } from '@/ui/theme';

const SOURCES = [
  { label: 'NHS: Your baby’s first solid foods', url: 'https://www.nhs.uk/baby/weaning-and-feeding/babys-first-solid-foods/' },
  { label: 'AAP / HealthyChildren: Starting Solid Foods', url: 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx' },
  { label: 'S3-Leitlinie Allergieprävention', url: 'https://register.awmf.org/assets/guidelines/061-016l_S3_Allergiepraevention_2022-11.pdf' },
];

/** Reifezeichen-Checkliste: Beobachtungen festhalten, ohne Bewertung durch die App. */
export default function Reifecheck() {
  const { activeChild: child } = useChild();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Observation>>({});
  const done = step >= READINESS_SIGNS_LIST.length;
  const sign = READINESS_SIGNS_LIST[step];

  const answer = (a: Observation) => {
    setAnswers((prev) => ({ ...prev, [sign.id]: a }));
    setStep((s) => s + 1);
  };

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: 'Reifezeichen-Checkliste' }} />
      {!done ? (
        <>
          <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((s) => s - 1)} accessibilityRole="button" hitSlop={12}>
                <Text style={[type.bodyBold, { color: color.sageDeep }]}>‹ Zurück</Text>
              </Pressable>
            ) : <View />}
            <Small>Zeichen {step + 1} von {READINESS_SIGNS_LIST.length}</Small>
          </Row>
          <ProgressBar value={step + 1} max={READINESS_SIGNS_LIST.length} />
          <Text style={{ fontSize: 56, marginTop: space.xl }}>{sign.emoji}</Text>
          <Hero style={{ marginVertical: space.lg, fontSize: 26, lineHeight: 32 }}>{sign.question}</Hero>
          <P soft style={{ marginBottom: space.xl }}>{sign.help}</P>
          <Choice emoji="👀" label="Ja, beobachtet" selected={answers[sign.id] === 'beobachtet'} onPress={() => answer('beobachtet')} />
          <Choice emoji="⏳" label="Noch nicht beobachtet" selected={answers[sign.id] === 'noch_nicht'} onPress={() => answer('noch_nicht')} />
          {step === 0 ? (
            <Card tone="butter" style={{ marginTop: space.lg }}>
              <P bold>Keine Reifezeichen sind übrigens:</P>
              {NOT_READINESS_SIGNS.map((s) => <P key={s}>• {s}</P>)}
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Hero style={{ marginTop: space.lg }}>Deine Beobachtungen</Hero>
          <P soft style={{ marginTop: space.xs, marginBottom: space.lg }}>
            {countObserved(answers)} von {READINESS_SIGNS_LIST.length} Zeichen hast du bei {child.name} schon beobachtet.
          </P>
          <Card>
            {READINESS_SIGNS_LIST.map((s) => (
              <Row key={s.id} style={{ paddingVertical: space.sm }}>
                <Text style={{ fontSize: 22 }}>{answers[s.id] === 'beobachtet' ? '✅' : '⏳'}</Text>
                <P style={{ flex: 1 }}>{s.title}</P>
              </Row>
            ))}
          </Card>
          <Card tone="sage">
            <P>{READINESS_DECISION}</P>
          </Card>
          <Card tone="butter">
            <P>{READINESS_GENERAL}</P>
          </Card>
          <View style={{ gap: space.md }}>
            <Button label="Fertig" onPress={() => router.back()} />
            <Button label="Startdatum anpassen" variant="soft" onPress={() => router.push({ pathname: '/kind', params: { id: child.id } })} />
            <Button label="Noch einmal durchgehen" variant="ghost" onPress={() => { setAnswers({}); setStep(0); }} />
          </View>
          <Card style={{ marginTop: space.xl }}>
            <Small bold soft={false}>Quellen</Small>
            {SOURCES.map((s) => <View key={s.url} style={{ marginTop: space.xs }}><SourceLink label={s.label} url={s.url} /></View>)}
          </Card>
        </>
      )}
    </Screen>
  );
}
