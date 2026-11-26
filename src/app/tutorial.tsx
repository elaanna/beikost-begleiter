import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/state/AppContext';
import { Button, Card, DayDots, Hero, Important, P, Row, Screen, Small } from '@/ui/components';
import { color, space, type } from '@/ui/theme';

/** Kurze Einführung nach dem Onboarding. Erneut aufrufbar unter Familie. */
const SLIDES = [
  {
    emoji: '☀️',
    title: 'Jeden Tag eine klare Aufgabe',
    text: 'Unter „Heute“ siehst du die Mahlzeit, die jetzt dran ist – mit Zubereitung und Menge. Ganz oben fragst du: „Darf mein Baby schon …?“',
    demo: 'today',
  },
  {
    emoji: '🥕',
    title: 'Neues kommt Schritt für Schritt',
    text: 'Ein neues Lebensmittel bietest du 2 Tage hintereinander an, ein Allergen 3 Tage – nie zwei neue gleichzeitig. Danach plant die App Allergene nach allgemeinen Empfehlungen etwa 2× pro Woche ein.',
    demo: 'dots',
  },
  {
    emoji: '♥',
    title: 'Notieren mit einem Tipp',
    text: '„Hat geschmeckt“ oder „Lieber nicht“ reicht – vertippt? Einfach „Rückgängig“. Jedes probierte Lebensmittel wird im Probier-Pass bunt.',
    demo: 'log',
  },
  {
    emoji: '❗',
    title: 'Rot heißt: Wichtig',
    text: 'Sicherheitshinweise sind immer rot markiert – zum Beispiel, was im ersten Jahr tabu ist. Alles mit Quellen findest du unter „Wissen“.',
    demo: 'red',
  },
  {
    emoji: '👪',
    title: 'Gemeinsam planen',
    text: 'Unter „Familie“ tragt ihr Dienste und Kita-Zeiten ein. Die App zeigt, wer füttert oder abholt – und wo es eine Lücke gibt.',
    demo: null,
  },
] as const;

export default function Tutorial() {
  const { finishTutorial } = useApp();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const done = async () => {
    await finishTutorial();
    router.replace('/heute');
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 6 }}>
          {SLIDES.map((_, k) => (
            <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: k <= i ? color.sage : color.line }} />
          ))}
        </Row>
        <Pressable onPress={done} accessibilityRole="button" hitSlop={12}>
          <Text style={[type.bodyBold, { color: color.inkSoft }]}>Überspringen</Text>
        </Pressable>
      </Row>

      <View style={{ alignItems: 'center', marginTop: space.xxl }}>
        <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: color.peachSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 68 }}>{slide.emoji}</Text>
        </View>
      </View>
      <Hero style={{ textAlign: 'center', marginTop: space.xl }}>{slide.title}</Hero>
      <P soft style={{ textAlign: 'center', marginTop: space.md, fontSize: 17, lineHeight: 26 }}>{slide.text}</P>

      <View style={{ marginTop: space.xl }}>
        {slide.demo === 'today' ? (
          <Card tone="peach">
            <Small bold soft={false}>Jetzt dran · Mittag</Small>
            <Text style={[type.title, { color: color.ink }]}>🥕 Karotte</Text>
            <Small soft={false}>Weich dämpfen und fein pürieren.</Small>
          </Card>
        ) : null}
        {slide.demo === 'dots' ? (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}><P bold>🥔 Kartoffel</P><DayDots day={2} total={2} /></Row>
            <Row style={{ justifyContent: 'space-between', marginTop: space.md }}><P bold>🥚 Ei (Allergen)</P><DayDots day={1} total={3} /></Row>
          </Card>
        ) : null}
        {slide.demo === 'log' ? (
          <View style={{ gap: space.sm }}>
            <Button label="Hat geschmeckt" icon="♥" onPress={() => {}} />
            <Button label="Lieber nicht" variant="soft" onPress={() => {}} />
          </View>
        ) : null}
        {slide.demo === 'red' ? <Important title="Im ersten Jahr nicht geben">🍯 Honig kann Säuglingsbotulismus auslösen.</Important> : null}
      </View>

      <Button label={last ? 'Los geht’s' : 'Weiter'} style={{ marginTop: space.xl }} onPress={() => (last ? done() : setI(i + 1))} />
    </Screen>
  );
}
