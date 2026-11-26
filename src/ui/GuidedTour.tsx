import { useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/state/AppContext';
import { color, font, radius, space, type } from './theme';

type Tab = 'heute' | 'woche' | 'rezepte' | 'lebensmittel' | 'wissen';
const TABS: Tab[] = ['heute', 'woche', 'rezepte', 'lebensmittel', 'wissen'];

interface Step {
  tab: Tab;
  emoji: string;
  title: string;
  text: string;
  /** Markierung: ein Reiter unten oder der Familie-Knopf oben rechts. */
  mark?: 'tab' | 'familie';
}

/** Die Schritte der Tour – persönlich mit Vornamen und Namen des Kindes. */
export function tourSteps(parentName: string, childName: string): Step[] {
  const hi = parentName.trim() ? `Hallo ${parentName.trim()}!` : 'Hallo!';
  return [
    { tab: 'heute', emoji: '👋', title: hi, text: `Ich bin dein Beikost-Assistent und zeige dir in einer Minute, wie alles funktioniert. Du kannst jederzeit überspringen.` },
    { tab: 'heute', emoji: '☀️', title: 'Jeden Tag das Wichtigste', text: `Unter „Heute“ steht, was für ${childName} gerade dran ist – mit Menge und Zubereitung. Nach dem Essen tippst du „Hat geschmeckt“ oder „Lieber nicht“. Fertig.`, mark: 'tab' },
    { tab: 'heute', emoji: '🔍', title: `„Darf ${childName} schon …?“`, text: 'Ganz oben fragst du nach jedem Lebensmittel und siehst sofort, ob und wie es geht. Neues kommt immer einzeln: 2 Tage, Allergene 3 Tage.', mark: 'tab' },
    { tab: 'woche', emoji: '🗓️', title: 'Der Wochenplan', text: 'Tippe auf einen Tag oder eine Mahlzeit, um Mengen und Zubereitung zu sehen. „Tauschen“ ersetzt eine Mahlzeit, unter „Einkauf“ entsteht die Einkaufsliste.', mark: 'tab' },
    { tab: 'rezepte', emoji: '🍲', title: 'Rezepte nach Alter', text: `Gefiltert für ${childName} oder nach Alter und Kategorie. Mit „Was habe ich da?“ findest du Rezepte zu dem, was im Kühlschrank ist.`, mark: 'tab' },
    { tab: 'lebensmittel', emoji: '🥕', title: 'Lebensmittel entdecken', text: `Alle Lebensmittel auf einen Blick: was ${childName} schon entdeckt hat, was geschmeckt hat und was als Nächstes kommt – ganz im eigenen Tempo.`, mark: 'tab' },
    { tab: 'wissen', emoji: '📖', title: 'Wissen mit Quellen', text: 'Mengen, Trinken, Allergene und Leitlinien – alles mit Quellen. Rot markiert heißt immer: wichtig.', mark: 'tab' },
    { tab: 'heute', emoji: '☰', title: 'Das Menü', text: 'Oben rechts auf „Heute“: Familie und Einstellungen, Partner und Kita einladen, Konto, Erinnerungen, Bericht für die Kinderarztpraxis – und diese Tour noch einmal starten.', mark: 'familie' },
  ];
}

/**
 * Geführte Tour beim ersten Öffnen: ein Assistent geht mit dir durch die echten Bereiche der App,
 * wechselt selbst die Reiter und markiert, worum es gerade geht.
 */
export function GuidedTour() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const steps = tourSteps(app.parentName, app.activeChild?.name ?? 'deinem Kind');
  const step = steps[i];
  const last = i === steps.length - 1;

  useEffect(() => {
    if (!app.tutorialDone) router.navigate(`/${step.tab}`);
  }, [app.tutorialDone, step.tab]);

  if (app.tutorialDone || !app.activeChild) return null;

  const finish = async () => {
    await app.finishTutorial();
    setI(0);
    router.navigate('/heute');
  };

  const tabBar = 72 + insets.bottom;
  const tabX = ((TABS.indexOf(step.tab) + 0.5) / TABS.length) * width;
  const atTop = step.mark === 'familie';

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} accessibilityViewIsModal>
      {/* Abdunkeln – Tippen außerhalb macht nichts, damit niemand versehentlich die Tour verlässt */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(61,46,42,0.45)' }} />

      {step.mark === 'tab' ? (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: insets.bottom + 4, left: tabX - 36, width: 72, height: 64, borderRadius: 22, borderWidth: 3, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.18)' }} />
      ) : null}
      {step.mark === 'familie' ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, right: 10, width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.18)' }} />
      ) : null}

      <View
        style={{
          position: 'absolute', left: space.lg, right: space.lg,
          ...(atTop ? { top: insets.top + 80 } : { bottom: tabBar + space.lg }),
          backgroundColor: color.surface, borderRadius: radius.lg, padding: space.lg,
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
        }}
        accessibilityLiveRegion="polite"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>{step.emoji}</Text>
          </View>
          <Text style={{ flex: 1, fontFamily: font.display, fontSize: 22, lineHeight: 28, color: color.ink }}>{step.title}</Text>
        </View>
        <Text style={[type.body, { color: color.ink, marginTop: space.md }]}>{step.text}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {steps.map((_, k) => (
              <View key={k} style={{ width: k === i ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: k <= i ? color.sage : color.line }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            {!last ? (
              <Pressable onPress={finish} accessibilityRole="button" hitSlop={10}>
                <Text style={[type.smallBold, { color: color.inkSoft }]}>Überspringen</Text>
              </Pressable>
            ) : null}
            {i > 0 ? (
              <Pressable onPress={() => setI(i - 1)} accessibilityRole="button" accessibilityLabel="Zurück" hitSlop={10}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.creme, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[type.bodyBold, { color: color.sageDeep }]}>‹</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => (last ? finish() : setI(i + 1))} accessibilityRole="button"
              style={{ backgroundColor: color.sageDeep, borderRadius: radius.pill, paddingHorizontal: space.xl, minHeight: 44, justifyContent: 'center' }}>
              <Text style={[type.bodyBold, { color: '#fff' }]}>{last ? 'Los geht’s' : i === 0 ? 'Zeig’s mir' : 'Weiter'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
