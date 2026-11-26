import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { FOOD_BY_ID } from '@/data/foods';
import { PICKY_DOCTOR, PICKY_SOURCES, PICKY_TIPS } from '@/data/toddler';
import { todayIso } from '@/domain/dates';
import { reofferList } from '@/domain/toddler';
import { useChild } from '@/state/AppContext';
import { Card, Hero, P, Row, Screen, Small, SourceLink, Title } from '@/ui/components';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';

/** Wählerische Esser: Abgelehntes entspannt wieder anbieten – ohne Zielzahl und ohne Druck. */
export default function WiederAnbieten() {
  const { activeChild: child, logs } = useChild();
  const list = reofferList(child, logs, todayIso());

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.xs }}>Noch mal anbieten</Hero>
      <P soft style={{ marginBottom: space.lg }}>
        Viele Kinder mögen Neues erst nach mehreren Versuchen. Ablehnung ist oft nur vorübergehend – jedes Kind hat sein eigenes Tempo.
      </P>

      {list.length === 0 ? (
        <Card tone="lilac"><P>Gerade gibt es nichts, das {child.name} zuletzt nicht mochte. Wenn ihr „Lieber nicht“ notiert, erscheint es hier.</P></Card>
      ) : (
        <Card style={{ paddingVertical: space.sm, paddingHorizontal: space.md }}>
          {list.map((r, i) => {
            const f = FOOD_BY_ID[r.foodId];
            return (
              <Pressable key={r.foodId} onPress={() => router.push(`/food/${r.foodId}`)} accessibilityRole="link"
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: brand.peachSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <P bold>{f.name}</P>
                  <Small>
                    {r.offered}× angeboten · zuletzt {r.daysAgo === 0 ? 'heute' : r.daysAgo === 1 ? 'gestern' : `vor ${r.daysAgo} Tagen`}
                  </Small>
                </View>
                <ChevronRight size={20} strokeWidth={ICON.stroke} color={color.inkSoft} />
              </Pressable>
            );
          })}
        </Card>
      )}
      {list.length ? <Small style={{ marginBottom: space.lg }}>Tipp: neben etwas Bekanntes legen, mal roh, mal gegart, mal klein geschnitten anbieten.</Small> : null}

      <Title>Entspannt am Tisch</Title>
      <Card tone="yellow" style={{ borderRadius: radius.lg }}>
        <View style={{ gap: space.sm }}>
          {PICKY_TIPS.map((t) => <Text key={t} style={[type.small, { color: color.ink }]}>• {t}</Text>)}
        </View>
      </Card>
      <Row style={{ alignItems: 'flex-start', marginBottom: space.lg }}>
        <Small soft={false}>{PICKY_DOCTOR}</Small>
      </Row>
      {PICKY_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
    </Screen>
  );
}
