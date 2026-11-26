import { useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Share2, Shuffle } from 'lucide-react-native';
import { shoppingText } from '@/domain/shareText';
import { LUNCHBOX_LABEL, LUNCHBOX_PARTS, LUNCHBOX_SOURCES, LUNCHBOX_TIPS } from '@/data/toddler';
import { addDays, formatDay, todayIso, weekStart } from '@/domain/dates';
import { lunchboxShopping, lunchboxWeek } from '@/domain/toddler';
import { useChild } from '@/state/AppContext';
import { Button, Card, Hero, IconLabel, LockedNotice, P, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { brand, color, space, type } from '@/ui/theme';

/** Kita-Brotdose: Ideen für Montag bis Freitag aus dem, was das Kind schon kennt, plus Einkaufsliste. */
export default function Brotdose() {
  const { activeChild: child, logs, isPro } = useChild();
  const today = todayIso();
  // Ab Freitagnachmittag schon die nächste Woche zeigen
  const monday = new Date().getDay() >= 5 || new Date().getDay() === 0 ? addDays(weekStart(today), 7) : weekStart(today);
  const [shuffle, setShuffle] = useState(0);
  const week = lunchboxWeek(child, logs, monday, shuffle);
  const shopping = lunchboxShopping(week);

  if (!isPro) {
    return (
      <Screen edges={['left', 'right']}>
        <Hero style={{ marginBottom: space.lg }}>Kita-Brotdose</Hero>
        <LockedNotice text="Brotdosen-Ideen für die Woche mit Einkaufsliste gehören zum Beikost-Paket." onUnlock={() => router.push('/paywall')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.xs }}>Kita-Brotdose</Hero>
      <P soft style={{ marginBottom: space.lg }}>
        Ideen für {formatDay(monday, false)} – {formatDay(addDays(monday, 4), false)} aus Lebensmitteln, die {child.name} schon kennt.
      </P>
      {week.map((d) => (
        <Card key={d.date} style={{ paddingVertical: space.lg }}>
          <Text style={[type.cardTitle, { color: brand.blue, marginBottom: space.sm }]}>{formatDay(d.date)}</Text>
          {LUNCHBOX_PARTS.map((part) => (
            <Row key={part} style={{ paddingVertical: 3 }}>
              <Small style={{ width: 120 }}>{LUNCHBOX_LABEL[part]}</Small>
              <View style={{ flex: 1 }}>
                <P>{d.items[part].text}</P>
                {!d.items[part].known ? <Small style={{ color: color.peachDeep }}>Noch nicht probiert – erst zu Hause anbieten</Small> : null}
              </View>
            </Row>
          ))}
          <Small style={{ marginTop: space.xs }}>Dazu: Wasser oder ungesüßter Tee</Small>
        </Card>
      ))}
      <Button label="Neu mischen" icon={Shuffle} variant="soft" onPress={() => setShuffle((x) => x + 1)} />

      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Einkaufsliste</Title>
        <Pressable accessibilityRole="button" accessibilityLabel="Einkaufsliste teilen" hitSlop={10}
          onPress={() => Share.share({ message: shoppingText(`Brotdose ${formatDay(monday, false)} – ${formatDay(addDays(monday, 4), false)}`, shopping.map((x) => ({ name: x.text, detail: `${x.count}×` }))) })}>
          <IconLabel icon={Share2} label="Teilen" />
        </Pressable>
      </Row>
      <Card>
        {shopping.map((x) => (
          <Row key={x.text} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
            <P>{x.text}</P>
            <Small soft={false}>{x.count}×</Small>
          </Row>
        ))}
      </Card>

      <Title>Gut zu wissen</Title>
      <Card tone="lilac">
        <View style={{ gap: space.sm }}>
          {LUNCHBOX_TIPS.map((t) => <Small key={t} soft={false}>• {t}</Small>)}
        </View>
      </Card>
      {LUNCHBOX_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
      <Small style={{ marginTop: space.sm, color: color.inkSoft }}>Allgemeine Ideen – ausgeschlossene Lebensmittel und Allergene lässt die App weg.</Small>
    </Screen>
  );
}
