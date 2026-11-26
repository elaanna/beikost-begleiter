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
import { t } from '@/i18n';

/** Wählerische Esser: Abgelehntes entspannt wieder anbieten – ohne Zielzahl und ohne Druck. */
export default function WiederAnbieten() {
  const { activeChild: child, logs } = useChild();
  const list = reofferList(child, logs, todayIso());

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.xs }}>{t('Noch mal anbieten')}</Hero>
      <P soft style={{ marginBottom: space.lg }}>
        {t('Viele Kinder mögen Neues erst nach mehreren Versuchen. Ablehnung ist oft nur vorübergehend – jedes Kind hat sein eigenes Tempo.')}</P>

      {list.length === 0 ? (
        <Card tone="lilac"><P>{t('Gerade gibt es nichts, das {0} zuletzt nicht mochte. Wenn ihr „Lieber nicht“ notiert, erscheint es hier.', { 0: child.name })}</P></Card>
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
                    {t('{0}× angeboten · zuletzt', { 0: r.offered })}{' '}{r.daysAgo === 0 ? t('heute') : r.daysAgo === 1 ? t('gestern') : t('vor {0} Tagen', { 0: r.daysAgo })}
                  </Small>
                </View>
                <ChevronRight size={20} strokeWidth={ICON.stroke} color={color.inkSoft} />
              </Pressable>
            );
          })}
        </Card>
      )}
      {list.length ? <Small style={{ marginBottom: space.lg }}>{t('Tipp: neben etwas Bekanntes legen, mal roh, mal gegart, mal klein geschnitten anbieten.')}</Small> : null}

      <Title>{t('Entspannt am Tisch')}</Title>
      <Card tone="yellow" style={{ borderRadius: radius.lg }}>
        <View style={{ gap: space.sm }}>
          {PICKY_TIPS.map((tx) => <Text key={tx} style={[type.small, { color: color.ink }]}>• {t(tx)}</Text>)}
        </View>
      </Card>
      <Row style={{ alignItems: 'flex-start', marginBottom: space.lg }}>
        <Small soft={false}>{t(PICKY_DOCTOR)}</Small>
      </Row>
      {PICKY_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
    </Screen>
  );
}
