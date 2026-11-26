import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChefHat, ChevronDown, ChevronUp, Hand, Utensils } from 'lucide-react-native';
import { FOOD_BY_ID } from '@/data/foods';
import { TABLE_BASICS, TABLE_SLOT_INFO, TABLE_SOURCES } from '@/data/toddler';
import { todayIso } from '@/domain/dates';
import { currentTableSlot, tableDay, type TableMeal } from '@/domain/toddler';
import type { Liking, Reaction } from '@/domain/types';
import { useChild } from '@/state/AppContext';
import { Card, IconLabel, P, Row, Small, SourceLink } from './components';
import { QuickLog } from './QuickLog';
import { useToast } from './Toast';
import { brand, color, ICON, radius, space, type } from './theme';
import { t } from '@/i18n';
import { firstBirthdayChanges } from '@/domain/morning';

/** „Heute“ in der Kleinkind-Phase: 5 Mahlzeiten am Familientisch, die aktuelle hervorgehoben. */
export function TableToday() {
  const { activeChild: child, logs, addLog, removeLog } = useChild();
  const toast = useToast();
  const today = todayIso();
  const day = useMemo(() => tableDay(child, logs, today), [child, logs, today]);
  const [showBasics, setShowBasics] = useState(false);
  const now = new Date();
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const loggedToday = new Set(logs.filter((l) => l.childId === child.id && l.date === today).map((l) => l.foodId));
  const done = (m: TableMeal) => m.foods.every((id) => loggedToday.has(id));
  const nowSlot = currentTableSlot(hm);
  const current = day.meals.find((m) => m.slot === nowSlot && !done(m)) ?? day.meals.find((m) => !done(m));

  const logMeal = async (meal: TableMeal, liking: Liking, reaction: Reaction) => {
    const ids: string[] = [];
    for (const foodId of meal.foods) {
      if (loggedToday.has(foodId)) continue;
      const id = await addLog({ foodId, date: today, liking, reaction, note: '' });
      if (id) ids.push(id);
    }
    toast({
      emoji: reaction !== 'keine' ? '❗' : liking === 1 ? '♥' : '✓',
      text: `${TABLE_SLOT_INFO[meal.slot].label}: ${reaction !== 'keine' ? 'Reaktion notiert' : liking === 1 ? 'hat geschmeckt' : liking === -1 ? 'lieber nicht' : 'gegessen'}`,
      undo: async () => { for (const id of ids) await removeLog(id); },
    });
  };

  return (
    <>
      <Row style={{ gap: space.sm, marginBottom: space.md }}>
        <Utensils size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />
        <Text style={[type.cardTitle, { color: brand.blue, flex: 1 }]}>{t('Heute am Familientisch')}</Text>
        <Small bold soft={false}>{day.meals.filter(done).length}/{day.meals.length}</Small>
      </Row>

      {current ? (
        <Card tone="yellow" hero>
          <Small bold soft={false}>{t('Jetzt dran · {0}', { 0: t(TABLE_SLOT_INFO[current.slot].label) })}</Small>
          <Text style={[type.title, { color: color.ink, marginTop: space.xs }]}>{t(current.title)}</Text>
          <Row style={{ flexWrap: 'wrap', gap: space.sm, marginVertical: space.md }}>
            {current.foods.map((id) => FOOD_BY_ID[id] ? (
              <Pressable key={id} onPress={() => router.push(`/food/${id}`)} accessibilityRole="link"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 14 }}>{FOOD_BY_ID[id].emoji}</Text>
                <Text style={[type.small, { color: color.ink }]}>{FOOD_BY_ID[id].name}</Text>
              </Pressable>
            ) : null)}
          </Row>
          {current.hint ? <Small soft={false} style={{ marginBottom: space.sm }}>{t(current.hint)}</Small> : null}
          {current.recipeId ? (
            <Pressable onPress={() => router.push(`/rezept/${current.recipeId}`)} accessibilityRole="link" style={{ marginBottom: space.md }}>
              <IconLabel icon={ChefHat} label={t('Zum Rezept mit Kinderportion')} chevron />
            </Pressable>
          ) : null}
          <QuickLog compact onLog={(l, r) => logMeal(current, l, r)} />
        </Card>
      ) : (
        <Card tone="lilac" style={{ alignItems: 'center' }}>
          <Check size={36} strokeWidth={ICON.stroke} color={brand.success} />
          <Text style={[type.cardTitle, { color: color.ink, marginTop: space.sm }]}>{t('Alles notiert für heute')}</Text>
        </Card>
      )}

      <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.md }}>
        {day.meals.filter((m) => m !== current).map((m, i) => (
          <Pressable key={m.slot} disabled={!m.recipeId} onPress={() => m.recipeId && router.push(`/rezept/${m.recipeId}`)}
            accessibilityRole={m.recipeId ? 'link' : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: done(m) ? brand.successBg : brand.blueSoft }}>
              {done(m) ? <Check size={16} strokeWidth={2.2} color={brand.success} /> : <Text style={[type.caption, { color: brand.blue }]}>{TABLE_SLOT_INFO[m.slot].time.slice(0, 2)}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Small soft>{t(TABLE_SLOT_INFO[m.slot].label)}</Small>
              <P bold={TABLE_SLOT_INFO[m.slot].main}>{t(m.title)}</P>
            </View>
          </Pressable>
        ))}
      </Card>

      <Pressable onPress={() => setShowBasics((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showBasics }}
        style={{ backgroundColor: brand.lilacSoft, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg }}>
        <Row style={{ gap: space.sm }}>
          <Hand size={ICON.size} strokeWidth={ICON.stroke} color={brand.blue} />
          <P bold style={{ flex: 1 }}>{t('Wie viel? Die Hand eures Kindes als Maß')}</P>
          {showBasics ? <ChevronUp size={20} color={brand.blue} /> : <ChevronDown size={20} color={brand.blue} />}
        </Row>
        {showBasics ? (
          <View style={{ marginTop: space.md, gap: space.sm }}>
            {TABLE_BASICS.map((tx) => <Small key={tx} soft={false}>• {t(tx)}</Small>)}
            <Small soft={false}>{t('Ihr bestimmt, was und wann es etwas gibt – {0} bestimmt, wie viel.', { 0: child.name })}</Small>
            {TABLE_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
          </View>
        ) : null}
      </Pressable>
    </>
  );
}

/** Vorschlag zum Wechsel in die Kleinkind-Phase (ab 12 Monaten). Eltern bestätigen. */
export function TableSwitchCard({ onYes, onLater }: { onYes: () => void; onLater: () => void }) {
  const { activeChild: child } = useChild();
  return (
    <Card tone="lilac">
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 36 }}>🎂</Text>
        <View style={{ flex: 1 }}>
          <Text style={[type.cardTitle, { color: brand.blue }]}>{t('{0} ist ein Jahr alt', { 0: child.name })}</Text>
          <Small soft={false} style={{ marginTop: space.xs }}>
            {t('Bereit für den Familientisch? Statt Breiplan zeigt die App dann 5 Mahlzeiten am Tag mit Kinderportionen, Brotdose und Familienrezepten. Alles Bisherige bleibt erhalten, und ihr könnt jederzeit zurück.')}</Small>
          <Text style={[type.smallBold, { color: brand.blue, marginTop: space.md }]}>{t('Was sich ab jetzt ändert')}</Text>
          {firstBirthdayChanges().map((line) => (
            <Small key={line} soft={false} style={{ marginTop: space.xs }}>{`• ${line}`}</Small>
          ))}
        </View>
      </Row>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <Pressable onPress={onYes} accessibilityRole="button" style={{ flex: 1, backgroundColor: brand.blue, borderRadius: radius.pill, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[type.bodyBold, { color: '#fff' }]}>{t('Ja, umstellen')}</Text>
        </Pressable>
        <Pressable onPress={onLater} accessibilityRole="button" style={{ flex: 1, borderRadius: radius.pill, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[type.bodyBold, { color: brand.blue }]}>{t('Noch Beikost')}</Text>
        </Pressable>
      </View>
    </Card>
  );
}
