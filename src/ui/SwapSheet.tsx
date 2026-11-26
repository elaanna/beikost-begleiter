import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CATEGORY_INFO } from '@/data/babyRecipes';
import { SLOT_LABEL } from '@/domain/planner';
import { swapCandidates } from '@/domain/recipes';
import { todayIso } from '@/domain/dates';
import type { PlannedMeal } from '@/domain/types';
import { useChild } from '@/state/AppContext';
import { Button, Heading, P, Small } from './components';
import { useToast } from './Toast';
import { color, radius, space, type } from './theme';

/**
 * Mahlzeit tauschen: zeigt nur Rezepte für dieselbe Mahlzeit mit schon probierten,
 * nicht blockierten Zutaten. Einführungstage lassen sich nicht tauschen.
 */
export function SwapSheet({ date, meal, onClose }: { date: string; meal: PlannedMeal | null; onClose: () => void }) {
  const { activeChild: child, logs, setSwap } = useChild();
  const toast = useToast();
  if (!meal) return null;
  const options = swapCandidates(child, logs, meal.slot, todayIso()).filter((r) => r.id !== meal.recipeId);

  const choose = async (recipeId: string | null, label: string) => {
    const previous = meal.recipeId ?? null;
    await setSwap(date, meal.slot, recipeId);
    onClose();
    toast({ emoji: '🔄', text: label, undo: () => setSwap(date, meal.slot, previous) });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(60,40,30,0.35)' }} onPress={onClose} accessibilityLabel="Schließen" />
      <View style={{ maxHeight: '80%', backgroundColor: color.creme, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.xl }}>
        <Heading>{SLOT_LABEL[meal.slot]} tauschen</Heading>
        <Small style={{ marginBottom: space.md }}>Nur Rezepte, deren Zutaten schon probiert sind – so kommt nichts Neues dazu.</Small>
        <ScrollView>
          {meal.recipeId ? (
            <Button label="Zurück zum Vorschlag aus dem Plan" variant="soft" style={{ marginBottom: space.md }} onPress={() => choose(null, 'Vorschlag aus dem Plan wiederhergestellt')} />
          ) : null}
          {options.length === 0 ? (
            <P>Noch keine passenden Rezepte – sobald mehr Lebensmittel probiert sind, gibt es hier Auswahl.</P>
          ) : options.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => choose(r.id, `${SLOT_LABEL[meal.slot]}: ${r.name}`)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md,
                backgroundColor: pressed ? color.sageSoft : color.surface, marginBottom: space.sm,
              })}
            >
              <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <P bold>{r.name}</P>
                <Text style={[type.small, { color: color.inkSoft }]}>{CATEGORY_INFO[r.category].label} · {r.minutes} Min.</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <Button label="Abbrechen" variant="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}
