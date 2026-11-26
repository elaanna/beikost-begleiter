import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ALLERGEN_SOURCES, HOW_TO_INTRODUCE, MILD_SIGNS, NOT_A_REACTION, SEVERE_SIGNS } from '@/data/allergens';
import { FOOD_BY_ID } from '@/data/foods';
import { allergenStatuses, type AllergenState, type AllergenStatus } from '@/domain/allergenStatus';
import { diffDays, formatDayLong, todayIso } from '@/domain/dates';
import { useApp } from '@/state/AppContext';
import { Card, Heading, Important, P, Row, Segmented, Small, SourceLink, Title } from './components';
import { color, radius, space, type } from './theme';
import { t } from '@/i18n';

const STATE_STYLE: Record<AllergenState, { bg: string; fg: string; icon: string }> = {
  eingefuehrt: { bg: color.sageSoft, fg: color.sageDeep, icon: '✓' },
  geplant: { bg: color.butter, fg: color.peachDeep, icon: '⏳' },
  reaktion: { bg: color.redSoft, fg: color.redDeep, icon: '!' },
  ausgeschlossen: { bg: color.redSoft, fg: color.redDeep, icon: '✕' },
  abklaeren: { bg: color.redSoft, fg: color.redDeep, icon: '!' },
};

const SWIPE = 70;

/** Allergen-Guide: Karten zum Wischen, Erklärungen darunter, plus Übersicht. */
export function AllergenGuide() {
  const { activeChild: child, logs } = useApp();
  const statuses = useMemo(() => (child ? allergenStatuses(child, logs) : []), [child, logs]);
  const [mode, setMode] = useState<'karten' | 'uebersicht'>('karten');
  const [index, setIndex] = useState(0);
  const dx = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  indexRef.current = index;

  const go = (delta: number) => {
    const next = Math.max(0, Math.min(statuses.length - 1, indexRef.current + delta));
    if (next === indexRef.current) {
      Animated.spring(dx, { toValue: 0, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(dx, { toValue: delta > 0 ? -400 : 400, duration: 160, useNativeDriver: true }).start(() => {
      setIndex(next);
      dx.setValue(delta > 0 ? 400 : -400);
      Animated.spring(dx, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    });
  };

  const pan = useRef(
    PanResponder.create({
      // Nur waagerechte Wischbewegungen übernehmen, senkrechtes Scrollen bleibt möglich
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_e, g) => dx.setValue(g.dx),
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -SWIPE) go(1);
        else if (g.dx > SWIPE) go(-1);
        else Animated.spring(dx, { toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => Animated.spring(dx, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  if (!child) return null;
  const done = statuses.filter((s) => s.state === 'eingefuehrt').length;
  const current = statuses[index];
  const rotate = dx.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-8deg', '0deg', '8deg'] });

  return (
    <>
      <P soft style={{ marginBottom: space.lg }}>
        {t('Allgemeines Wissen zu den häufigsten Allergenen nach Leitlinien und Fachstellen. Die S3-Leitlinie rät, sie nicht vorbeugend wegzulassen. {0} von {1} Gruppen habt ihr schon angeboten.', { 0: done, 1: statuses.length })}</P>
      <Segmented<'karten' | 'uebersicht'>
        options={[{ id: 'karten', label: t('🃏 Karten') }, { id: 'uebersicht', label: t('📋 Übersicht') }]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'uebersicht' ? (
        <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.sm }}>
          {statuses.map((s, i) => (
            <Pressable
              key={s.guide.id}
              onPress={() => {
                setIndex(i);
                setMode('karten');
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.sm,
                backgroundColor: pressed ? color.creme : 'transparent',
              })}
            >
              <Text style={{ fontSize: 30 }}>{s.guide.emoji}</Text>
              <View style={{ flex: 1 }}>
                <P bold>{s.guide.name}</P>
                <Text style={[type.small, { color: STATE_STYLE[s.state].fg }]}>
                  {STATE_STYLE[s.state].icon} {t(s.label)}{s.plannedDate ? t(' ab {0}', { 0: formatDayLong(s.plannedDate) }) : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 22, color: color.inkSoft }}>›</Text>
            </Pressable>
          ))}
        </Card>
      ) : (
        <>
          {/* Karte zum Wischen */}
          <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: dx }, { rotate }] }}>
            <AllergenCard status={current} />
          </Animated.View>

          <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
            <NavButton label="‹" a11y={t('Vorheriges Allergen')} disabled={index === 0} onPress={() => go(-1)} />
            <Row style={{ gap: 6 }}>
              {statuses.map((s, i) => (
                <View key={s.guide.id} style={{
                  width: i === index ? 20 : 8, height: 8, borderRadius: 4,
                  backgroundColor: s.state === 'eingefuehrt' ? color.sage : i === index ? color.peach : color.line,
                }} />
              ))}
            </Row>
            <NavButton label="›" a11y={t('Nächstes Allergen')} disabled={index === statuses.length - 1} onPress={() => go(1)} />
          </Row>
          <Small style={{ textAlign: 'center', marginBottom: space.lg }}>{t('Wische nach links oder rechts für das nächste Allergen')}</Small>

          {/* Erklärungen darunter */}
          <AllergenDetails status={current} />
        </>
      )}

      <Title>{t('So führst du Allergene ein')}</Title>
      <Card>
        {HOW_TO_INTRODUCE.map((tx, i) => (
          <Row key={tx} style={{ alignItems: 'flex-start', marginBottom: space.md }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color.peach, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.smallBold, { color: '#fff' }]}>{i + 1}</Text>
            </View>
            <P style={{ flex: 1 }}>{t(tx)}</P>
          </Row>
        ))}
      </Card>

      <Title>{t('Woran erkenne ich eine Reaktion?')}</Title>
      <Card tone="butter">
        <P bold>{t('Leichte bis mittlere Reaktion')}</P>
        {MILD_SIGNS.map((s) => <P key={s}>• {s}</P>)}
        <P style={{ marginTop: space.sm }}>{t('Das Lebensmittel nicht weiter geben und ärztlichen Rat holen.')}</P>
        <Small soft={false} style={{ marginTop: space.sm }}>{t(NOT_A_REACTION)}</Small>
      </Card>
      <Important title={t('Notfall – sofort 112')}>
        {SEVERE_SIGNS.map((s) => <Text key={s} style={[type.body, { color: color.redDeep }]}>• {s}</Text>)}
      </Important>

      <Title>{t('Quellen')}</Title>
      {Object.values(ALLERGEN_SOURCES).map((s) => (
        <View key={s.url} style={{ marginBottom: space.sm }}><SourceLink label={s.label} url={s.url} /></View>
      ))}
    </>
  );
}

function AllergenCard({ status }: { status: AllergenStatus }) {
  const st = STATE_STYLE[status.state];
  const g = status.guide;
  return (
    <View
      accessibilityLabel={`${g.name}: ${status.label}`}
      style={{
        backgroundColor: color.surface, borderRadius: radius.lg, padding: space.xl, marginBottom: space.lg, minHeight: 300,
        shadowColor: '#B88A6A', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 4,
      }}
    >
      <View style={{ alignSelf: 'flex-start', backgroundColor: st.bg, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 }}>
        <Text style={[type.smallBold, { color: st.fg }]}>
          {st.icon} {t(status.label)}{status.plannedDate ? t(' ab {0}', { 0: formatDayLong(status.plannedDate) }) : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'center', marginVertical: space.lg }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: color.peachSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64 }}>{g.emoji}</Text>
        </View>
        <Text style={[type.hero, { color: color.ink, marginTop: space.md, textAlign: 'center' }]}>{g.name}</Text>
      </View>
      {status.lastDate ? (
        <LastGiven date={status.lastDate} />
      ) : null}
      <Small bold soft={false}>{t('Erste Portion')}</Small>
      <P style={{ marginBottom: space.md }}>{g.firstServing}</P>
      <Small bold soft={false}>{t('Allgemeine Empfehlung danach')}</Small>
      <P>{g.keepUp}</P>
    </View>
  );
}

function AllergenDetails({ status }: { status: AllergenStatus }) {
  const g = status.guide;
  return (
    <>
      {g.important ? <Important>{g.important}</Important> : null}
      {status.state === 'reaktion' ? (
        <Important title={t('Reaktion notiert')}>
          {t('Bitte nicht erneut anbieten, bevor ihr mit der Kinderärztin gesprochen habt.')}</Important>
      ) : null}
      <Card>
        <Heading style={{ marginBottom: space.sm }}>{t('Gut zu wissen')}</Heading>
        {g.special.map((tx) => <P key={tx} style={{ marginBottom: space.xs }}>• {t(tx)}</P>)}
        <Heading style={{ marginTop: space.lg, marginBottom: space.sm }}>{t('Passende Lebensmittel')}</Heading>
        <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
          {g.starterFoods.map((id) => {
            const f = FOOD_BY_ID[id];
            const tried = status.triedFoods.includes(id);
            return (
              <Pressable
                key={id}
                onPress={() => router.push(`/food/${id}`)}
                accessibilityRole="link"
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12,
                  borderRadius: radius.pill, backgroundColor: tried ? color.sageSoft : color.creme,
                }}
              >
                <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                <Text style={[type.smallBold, { color: color.ink }]}>{f.name}{tried ? ' ✓' : ''}</Text>
              </Pressable>
            );
          })}
        </Row>
        <View style={{ marginTop: space.lg, gap: space.xs }}>
          {g.sources.map((s) => <SourceLink key={s} label={ALLERGEN_SOURCES[s].label} url={ALLERGEN_SOURCES[s].url} />)}
        </View>
      </Card>
    </>
  );
}

function LastGiven({ date }: { date: string }) {
  const days = diffDays(date, todayIso());
  return (
    <View style={{ backgroundColor: color.sageSoft, borderRadius: radius.sm, padding: space.md, marginBottom: space.md }}>
      <Text style={[type.smallBold, { color: color.sageDeep }]}>
        {days === 0 ? t('Heute angeboten') : days === 1 ? t('Zuletzt gestern angeboten') : t('Zuletzt vor {0} Tagen angeboten', { 0: days })}
      </Text>
    </View>
  );
}

function NavButton({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}
    >
      <Text style={{ fontSize: 30, color: color.sageDeep, marginTop: -3 }}>{label}</Text>
    </Pressable>
  );
}
