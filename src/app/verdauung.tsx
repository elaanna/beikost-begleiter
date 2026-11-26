import { Pressable, Text, View } from 'react-native';
import { addDays, formatDay, todayIso } from '@/domain/dates';
import { DIGESTION_INFO, DIGESTION_RED_FLAGS, STOOL_LABEL, type StoolKind } from '@/domain/digestion';
import { useChild } from '@/state/AppContext';
import { Card, Heading, Important, P, Row, Screen, Small, Title } from '@/ui/components';
import { useToast } from '@/ui/Toast';
import { color, radius, space, type } from '@/ui/theme';

export default function Verdauung() {
  const { digestion, addDigestion, removeDigestion } = useChild();
  const toast = useToast();
  const today = todayIso();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, -i));

  return (
    <Screen edges={['left', 'right']}>
      <Heading style={{ marginBottom: space.md }}>Wie war die Windel?</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }}>
        {(Object.keys(STOOL_LABEL) as StoolKind[]).map((k) => (
          <Pressable
            key={k}
            onPress={async () => {
              const id = await addDigestion(today, k);
              toast({ emoji: STOOL_LABEL[k].emoji, text: `Notiert: ${STOOL_LABEL[k].label}`, undo: id ? () => removeDigestion(id) : undefined });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Stuhl: ${STOOL_LABEL[k].label}`}
            style={({ pressed }) => ({
              width: '31%', alignItems: 'center', paddingVertical: space.lg, borderRadius: radius.md,
              backgroundColor: pressed ? color.sageSoft : color.surface,
            })}
          >
            <Text style={{ fontSize: 32 }}>{STOOL_LABEL[k].emoji}</Text>
            <Text style={[type.bodyBold, { color: color.ink, marginTop: 4 }]}>{STOOL_LABEL[k].label}</Text>
          </Pressable>
        ))}
      </View>


      <Title>Letzte 7 Tage</Title>
      <Card style={{ paddingVertical: space.md }}>
        {week.map((d) => {
          const entries = digestion.filter((x) => x.date === d);
          return (
            <Row key={d} style={{ paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: color.line }}>
              <Text style={[type.smallBold, { color: color.inkSoft, width: 96 }]}>{d === today ? 'Heute' : formatDay(d)}</Text>
              <Text style={{ fontSize: 20, flex: 1 }}>
                {entries.length ? entries.map((e) => STOOL_LABEL[e.kind].emoji).join(' ') : '–'}
              </Text>
            </Row>
          );
        })}
      </Card>

      <Title>Gut zu wissen</Title>
      <Card tone="butter">
        {DIGESTION_INFO.map((t) => <P key={t} style={{ marginBottom: space.xs }}>• {t}</P>)}
      </Card>
      <Important title="Allgemein gilt: Kinderarztpraxis anrufen bei">
        {DIGESTION_RED_FLAGS.map((f) => <Text key={f} style={[type.body, { color: color.redDeep }]}>• {f}</Text>)}
      </Important>
      <Small>Die App wertet die Einträge nicht aus – sie sind dein Tagebuch, etwa für den nächsten Arzttermin. Einen Eintrag von heute löschen: auf „Rückgängig“ direkt nach dem Notieren tippen.</Small>
    </Screen>
  );
}
