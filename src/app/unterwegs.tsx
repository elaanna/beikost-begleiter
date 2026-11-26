import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Check, Snowflake, Sun } from 'lucide-react-native';
import { COOLING_TIPS, PACK_GROUP_LABEL, PACK_ITEMS, RESTAURANT_TIPS, TRAVEL_SOURCES, type PackItem } from '@/data/travel';
import { getMeta, setMeta } from '@/db/repo';
import { Button, Card, Hero, P, Row, Screen, Segmented, Small, SourceLink } from '@/ui/components';
import { brand, color, ICON, radius, space, type } from '@/ui/theme';
import { t } from '@/i18n';

type Tab = 'packen' | 'restaurant' | 'kuehlung';

/** Unterwegs: Packliste zum Abhaken, Essen im Restaurant, was ohne Kühlung geht. */
export default function Unterwegs() {
  const db = useSQLiteContext();
  const [tab, setTab] = useState<Tab>('packen');
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMeta(db, 'packliste').then((v) => v && setDone(new Set(JSON.parse(v) as string[]))).catch(() => undefined);
  }, [db]);
  const toggle = async (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id); else next.add(id);
    setDone(next);
    await setMeta(db, 'packliste', JSON.stringify([...next]));
  };
  const reset = async () => { setDone(new Set()); await setMeta(db, 'packliste', '[]'); };

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.lg }}>{t('Unterwegs')}</Hero>
      <Segmented<Tab> options={[{ id: 'packen', label: t('Packliste') }, { id: 'restaurant', label: t('Restaurant') }, { id: 'kuehlung', label: t('Kühlung') }]} value={tab} onChange={setTab} />

      {tab === 'packen' ? (
        <>
          {(['essen', 'trinken', 'sonst'] as PackItem['group'][]).map((g) => (
            <Card key={g} style={{ paddingVertical: space.md }}>
              <Text style={[type.cardTitle, { color: brand.blue, marginBottom: space.xs }]}>{PACK_GROUP_LABEL[g]}</Text>
              {PACK_ITEMS.filter((i) => i.group === g).map((i) => {
                const on = done.has(i.id);
                return (
                  <Pressable key={i.id} onPress={() => toggle(i.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: brand.blue, backgroundColor: on ? brand.blue : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {on ? <Check size={16} strokeWidth={2.4} color="#fff" /> : null}
                    </View>
                    <P style={[{ flex: 1 }, on ? { color: color.inkSoft, textDecorationLine: 'line-through' } : {}]}>{t(i.text)}</P>
                  </Pressable>
                );
              })}
            </Card>
          ))}
          <Button label={t('Liste zurücksetzen')} variant="ghost" onPress={reset} />
        </>
      ) : null}

      {tab === 'restaurant' ? (
        <Card tone="yellow" style={{ borderRadius: radius.lg }}>
          <View style={{ gap: space.sm }}>
            {RESTAURANT_TIPS.map((tx) => <Text key={tx} style={[type.body, { color: color.ink }]}>• {t(tx)}</Text>)}
          </View>
        </Card>
      ) : null}

      {tab === 'kuehlung' ? (
        <Card style={{ paddingVertical: space.sm }}>
          {COOLING_TIPS.map((c, i) => (
            <Row key={c.text} style={{ alignItems: 'flex-start', paddingVertical: space.md, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: c.ok ? brand.yellowSoft : brand.blueSoft }}>
                {c.ok ? <Sun size={18} strokeWidth={ICON.stroke} color={brand.warning} /> : <Snowflake size={18} strokeWidth={ICON.stroke} color={brand.blue} />}
              </View>
              <View style={{ flex: 1 }}>
                <Small bold soft={false}>{c.ok ? t('Geht ohne Kühlung') : t('Kühl halten & sicher aufwärmen')}</Small>
                <P>{t(c.text)}</P>
              </View>
            </Row>
          ))}
        </Card>
      ) : null}

      <View style={{ marginTop: space.lg, gap: space.xs }}>
        <Small>{t('Allgemeine Hinweise, keine Garantie für Lebensmittelsicherheit im Einzelfall.')}</Small>
        {TRAVEL_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
      </View>
    </Screen>
  );
}
