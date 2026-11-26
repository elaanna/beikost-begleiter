import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, Vibration, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Minus, Plus, Timer } from 'lucide-react-native';
import { ALL_RECIPES } from '@/data/allRecipes';
import { newId } from '@/db/repo';
import { todayIso } from '@/domain/dates';
import { prepSession, rankForPlan } from '@/domain/prepSession';
import { useChild } from '@/state/AppContext';
import { usePlanDays } from '@/state/usePlan';
import { Button, Card, Hero, LockedNotice, P, Row, Screen, Small, SourceLink } from '@/ui/components';
import { useToast } from '@/ui/Toast';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';
import { t, tr } from '@/i18n';

interface RunningTimer { id: string; label: string; end: number; done?: boolean }

const PHASE_LABEL = tr({ vorbereiten: 'Vorbereiten', kochen: 'Kochen', abschluss: 'Abkühlen & Einfrieren' } as const);

/** Vorkoch-Sonntag: Rezepte wählen, geführt kochen mit Timern, am Ende automatisch ins Gefrierfach. */
export default function Vorkochen() {
  const { isPro, saveStock } = useChild();
  const toast = useToast();
  const today = todayIso();
  const days = usePlanDays(today, 7);
  const planned = useMemo(() => new Set(days.flatMap((d) => d.meals.flatMap((m) => m.foodIds))), [days]);
  const freezable = useMemo(
    () => rankForPlan(ALL_RECIPES.filter((r) => r.storage.freeze && r.category !== 'familie' && r.category !== 'kleinkind'), planned),
    [planned],
  );
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<'auswahl' | 'kochen' | 'fertig'>('auswahl');
  const [i, setI] = useState(0);
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const [now, setNow] = useState(Date.now());

  const recipes = freezable.filter((r) => chosen[r.id]);
  const steps = useMemo(() => prepSession(recipes), [recipes.map((r) => r.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer-Uhr nur, solange ein Timer läuft
  useEffect(() => {
    if (!timers.some((tx) => !tx.done)) return;
    const h = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setTimers((ts) => ts.map((tx) => {
        if (!tx.done && tx.end <= n) {
          if (Platform.OS !== 'web') Vibration.vibrate([0, 400, 200, 400]);
          return { ...tx, done: true };
        }
        return tx;
      }));
    }, 1000);
    return () => clearInterval(h);
  }, [timers]);

  const startTimer = (label: string, minutes: number) => {
    setTimers((ts) => [...ts, { id: newId(), label, end: Date.now() + minutes * 60_000 }]);
    setNow(Date.now());
  };

  if (!isPro) {
    return (
      <Screen edges={['left', 'right']}>
        <Hero style={{ marginBottom: space.lg }}>{t('Vorkoch-Sonntag')}</Hero>
        <LockedNotice text={t('Der geführte Vorkoch-Sonntag mit Timern und automatischem Gefrierfach gehört zum Beikost-Paket.')} onUnlock={() => router.push('/paywall')} />
      </Screen>
    );
  }

  if (stage === 'auswahl') {
    return (
      <Screen edges={['left', 'right']}>
        <Hero style={{ marginBottom: space.xs }}>{t('Vorkoch-Sonntag')}</Hero>
        <P soft style={{ marginBottom: space.lg }}>{t('Wähle 2–3 Breie. Passend zum Plan der nächsten Tage stehen oben. Am Ende trägt die App alles ins Gefrierfach ein.')}</P>
        <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.md }}>
          {freezable.map((r, k) => {
            const n = chosen[r.id] ?? 0;
            const inPlan = r.foods.some((f) => planned.has(f));
            return (
              <Row key={r.id} style={{ paddingVertical: space.md, borderTopWidth: k ? 1 : 0, borderTopColor: color.line }}>
                <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <P bold>{r.name}</P>
                  <Small>{t('{0} Min.', { 0: r.minutes })}{inPlan ? t(' · passt zum Plan') : ''}</Small>
                </View>
                {n ? (
                  <Row style={{ gap: space.sm }}>
                    <Pressable onPress={() => setChosen((c) => ({ ...c, [r.id]: Math.max(0, n - 2) }))} accessibilityLabel={t('{0}: weniger Portionen', { 0: r.name })} hitSlop={8}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Minus size={18} color={brand.blue} />
                    </Pressable>
                    <Text style={[type.bodyBold, { color: color.ink, minWidth: 24, textAlign: 'center' }]}>{n}</Text>
                    <Pressable onPress={() => setChosen((c) => ({ ...c, [r.id]: Math.min(20, n + 2) }))} accessibilityLabel={t('{0}: mehr Portionen', { 0: r.name })} hitSlop={8}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: brand.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={18} color={brand.blue} />
                    </Pressable>
                  </Row>
                ) : (
                  <Pressable onPress={() => setChosen((c) => ({ ...c, [r.id]: 6 }))} accessibilityRole="button" accessibilityLabel={t('{0} auswählen', { 0: r.name })}
                    style={{ borderRadius: radius.pill, borderWidth: 1.5, borderColor: brand.blue, paddingHorizontal: space.md, paddingVertical: 6 }}>
                    <Text style={[type.smallBold, { color: brand.blue }]}>{t('Wählen')}</Text>
                  </Pressable>
                )}
              </Row>
            );
          })}
        </Card>
        {recipes.length ? <Small style={{ marginBottom: space.md }}>{t('Zahl = Portionen fürs Gefrierfach.')}</Small> : null}
        <Button label={recipes.length ? t('Los geht\'s mit {0} {1}', { 0: recipes.length, 1: recipes.length === 1 ? 'Rezept' : 'Rezepten' }) : t('Rezepte wählen')} disabled={!recipes.length} onPress={() => { setI(0); setStage('kochen'); }} />
      </Screen>
    );
  }

  if (stage === 'fertig') {
    return (
      <Screen edges={['left', 'right']}>
        <Card tone="lilac" style={{ alignItems: 'center' }}>
          <Check size={40} strokeWidth={ICON.stroke} color={brand.success} />
          <Text style={[type.title, { color: brand.blue, marginTop: space.sm, textAlign: 'center' }]}>{t('Geschafft!')}</Text>
          <P style={{ textAlign: 'center', marginTop: space.xs }}>
            {recipes.reduce((s, r) => s + (chosen[r.id] ?? 0), 0)} {' '}{t('Portionen sind im Gefrierfach eingetragen.')}</P>
        </Card>
        <Button label={t('Zum Gefrierfach')} onPress={() => router.replace('/vorrat')} />
      </Screen>
    );
  }

  const step = steps[i];
  const last = i === steps.length - 1;
  const fmt = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  return (
    <Screen edges={['left', 'right']}>
      {timers.length ? (
        <View style={{ gap: space.xs, marginBottom: space.md }}>
          {timers.map((tx) => (
            <Row key={tx.id} style={{ backgroundColor: tx.done ? brand.successBg : brand.blueSoft, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: 8 }}>
              <Timer size={18} color={tx.done ? brand.success : brand.blue} />
              <Text style={[type.smallBold, { flex: 1, color: color.ink }]} numberOfLines={1}>{t(tx.label)}</Text>
              <Text style={[type.bodyBold, { color: tx.done ? brand.success : brand.blue }]}>{tx.done ? t('Fertig!') : fmt(tx.end - now)}</Text>
              {tx.done ? (
                <Pressable onPress={() => setTimers((ts) => ts.filter((x) => x.id !== tx.id))} accessibilityLabel={t('Timer schließen')} hitSlop={8}>
                  <Text style={[type.smallBold, { color: brand.success }]}>{t('OK')}</Text>
                </Pressable>
              ) : null}
            </Row>
          ))}
        </View>
      ) : null}

      <Small>{t('Schritt')}{' '}{i + 1} {' '}{t('von {0} · {1}', { 0: steps.length, 1: PHASE_LABEL[step.phase] })}</Small>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: color.line, marginVertical: space.sm, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${((i + 1) / steps.length) * 100}%`, backgroundColor: brand.blue }} />
      </View>

      <Card tone="yellow" hero>
        {step.recipeName ? <Small bold soft={false}>{step.recipeName}</Small> : null}
        <Text style={[type.title, { color: color.ink, marginTop: space.xs }]}>{t(step.text)}</Text>
        <Row style={{ flexWrap: 'wrap', gap: space.sm, marginTop: space.lg }}>
          {(step.minutes ? [step.minutes] : [5, 10, 15, 20]).map((m) => (
            <Pressable key={m} onPress={() => startTimer(t('{0} · {1} Min.', { 0: step.recipeName ?? 'Timer', 1: m }), m)} accessibilityRole="button" accessibilityLabel={t('Timer {0} Minuten', { 0: m })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 8 }}>
              <Timer size={16} color={brand.blue} />
              <Text style={[type.smallBold, { color: brand.blue }]}>{t('{0} Min.', { 0: m })}</Text>
            </Pressable>
          ))}
        </Row>
      </Card>

      <Row style={{ gap: space.sm }}>
        {i > 0 ? <Button label={t('Zurück')} variant="soft" style={{ flex: 1 }} onPress={() => setI(i - 1)} /> : null}
        <Button
          label={last ? t('Fertig – ins Gefrierfach') : t('Weiter')}
          style={{ flex: 2 }}
          onPress={async () => {
            if (!last) return setI(i + 1);
            for (const r of recipes) {
              await saveStock({ id: newId(), kind: 'gefroren', name: r.name, recipeId: r.id, foodId: null, portions: chosen[r.id] ?? 1, madeOn: today });
            }
            toast({ emoji: '❄️', text: t('Ins Gefrierfach eingetragen') });
            setStage('fertig');
          }}
        />
      </Row>
      <View style={{ marginTop: space.lg }}>
        <SourceLink label={t('BfR: Vorkochen für mehrere Tage')} url="https://www.bfr.bund.de/fragen-und-antworten/thema/vorkochen-fuer-mehrere-tage/" />
      </View>
    </Screen>
  );
}
