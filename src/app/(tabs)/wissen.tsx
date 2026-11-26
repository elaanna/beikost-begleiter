import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AllergenGuide } from '@/ui/AllergenGuide';
import { Linking, Text, View } from 'react-native';
import {
  AVOID_FIRST_YEAR, EMERGENCY_SIGNS, GAG_VS_CHOKE, READINESS_SIGNS, SAFE_EATING, SOURCES, STATEMENTS, TOPIC_LABEL, type Topic,
} from '@/data/guidelines';
import { FULL_PORTIONS, PORTION_SOURCES } from '@/domain/portions';
import { CUP_TIPS, DRINK_AVOID, DRINK_SOURCES, DRINK_STEPS, IRON_TEXT, WATER_EXCEPTIONS, WATER_TIPS } from '@/data/drinks';
import { ironWeek } from '@/domain/care';
import { formatDay, todayIso } from '@/domain/dates';
import { useApp } from '@/state/AppContext';
import type { MengenTopic, WissenSection } from '@/ui/nav';
import {
  Button, Card, Heading, Hero, Important, P, Row, Screen, Segmented, Small, SourceLink, Title,
} from '@/ui/components';
import { color, space, type } from '@/ui/theme';
import { t } from '@/i18n';

type Section = WissenSection;

export default function Wissen() {
  const params = useLocalSearchParams<{ section?: Section; topic?: MengenTopic; t?: string }>();
  const [section, setSection] = useState<Section>(params.section ?? 'sicherheit');
  const [topic, setTopic] = useState<MengenTopic>(params.topic ?? 'brei');
  // Öffnen über eine Kachel springt direkt in den passenden Reiter (t ändert sich bei jedem Sprung)
  useEffect(() => {
    if (params.section) setSection(params.section);
    setTopic(params.topic ?? 'brei');
  }, [params.section, params.topic, params.t]);
  return (
    <Screen>
      <Hero style={{ marginBottom: space.lg }}>{t('Wissen')}</Hero>
      <Segmented<Section>
        options={[
          { id: 'sicherheit', label: t('Sicherheit') },
          { id: 'allergene', label: t('Allergene') },
          { id: 'portionen', label: t('Mengen') },
          { id: 'leitlinien', label: t('Leitlinien') },
        ]}
        value={section}
        onChange={setSection}
      />
      {section === 'sicherheit' ? <Sicherheit /> : section === 'allergene' ? <AllergenGuide /> : section === 'leitlinien' ? <Leitlinien /> : <Mengen topic={topic} onTopic={setTopic} />}
    </Screen>
  );
}

function Sicherheit() {
  return (
    <>
      <Important title={t('Notfall: sofort 112 anrufen bei')} action={
        <Button label={t('Notruf 112')} variant="danger" style={{ marginTop: space.md }} onPress={() => Linking.openURL('tel:112')} />
      }>
        {EMERGENCY_SIGNS.map((s) => <Text key={s} style={[type.body, { color: color.redDeep }]}>• {s}</Text>)}
      </Important>

      <Title>{t('Würgen oder Verschlucken?')}</Title>
      <Card tone="lilac">
        <P bold>{t('😮‍💨 Würgen ist normal')}</P>
        <P style={{ marginTop: space.xs }}>{GAG_VS_CHOKE.gag}</P>
      </Card>
      <Important title={t('Verschlucken ist ein Notfall')}>{GAG_VS_CHOKE.choke}</Important>

      <Title>{t('Im ersten Jahr nicht geben')}</Title>
      {AVOID_FIRST_YEAR.map((a) => (
        <Important key={a.name} title={a.name}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
            <Text style={[type.body, { color: color.redDeep, flex: 1 }]}>{a.why}</Text>
          </Row>
        </Important>
      ))}

      <Title>{t('Sicher essen')}</Title>
      <Card>
        {SAFE_EATING.map((s) => <P key={s} style={{ marginBottom: space.xs }}>✓ {s}</P>)}
      </Card>

      <Title>{t('Reifezeichen')}</Title>
      <Card tone="peach">
        {READINESS_SIGNS.map((s) => <P key={s} style={{ marginBottom: space.xs }}>🌱 {s}</P>)}
        <Button label={t('Reifezeichen-Checkliste')} style={{ marginTop: space.md }} onPress={() => router.push('/reifecheck')} />
      </Card>
    </>
  );
}

function Leitlinien() {
  const topics = Object.keys(TOPIC_LABEL) as Topic[];
  return (
    <>
      <P soft style={{ marginBottom: space.lg }}>
        {t('Der Plan folgt den deutschen S3-Leitlinien und den Empfehlungen des Netzwerks Gesund ins Leben. Jede Aussage ist verlinkt. Die App ersetzt keine kinderärztliche Beratung.')}</P>
      {topics.map((tx) => {
        const items = STATEMENTS.filter((s) => s.topic === tx);
        return (
          <View key={tx}>
            <Title>{TOPIC_LABEL[tx].emoji} {t(TOPIC_LABEL[tx].title)}</Title>
            {items.map((s) =>
              s.important ? (
                <Important key={s.id} title={t('Wichtig')}>
                  <Text style={[type.body, { color: color.redDeep }]}>{t(s.text)}</Text>
                  <View style={{ marginTop: space.sm }}>
                    <SourceLink label={`${SOURCES[s.source].short}${s.strength ? ` · ${s.strength}` : ''}`} url={SOURCES[s.source].url} />
                  </View>
                </Important>
              ) : (
                <Card key={s.id} style={{ paddingVertical: space.lg }}>
                  <P>{t(s.text)}</P>
                  <View style={{ marginTop: space.sm }}>
                    <SourceLink label={`${SOURCES[s.source].short}${s.strength ? ` · ${s.strength}` : ''}`} url={SOURCES[s.source].url} />
                  </View>
                </Card>
              ),
            )}
          </View>
        );
      })}

      <Title>{t('Quellen')}</Title>
      <Card>
        {Object.values(SOURCES).map((s) => (
          <View key={s.id} style={{ marginBottom: space.md }}>
            <SourceLink label={s.title} url={s.url} />
            <Small>{s.status}</Small>
          </View>
        ))}
        <Small>{t('Stand der Recherche: 25. November 2026')}</Small>
      </Card>
    </>
  );
}

function Mengen({ topic, onTopic }: { topic: MengenTopic; onTopic: (tx: MengenTopic) => void }) {
  return (
    <>
      <Segmented<MengenTopic>
        options={[{ id: 'brei', label: t('🥣 Brei') }, { id: 'eisen', label: t('🥩 Eisen') }, { id: 'trinken', label: t('💧 Trinken') }]}
        value={topic}
        onChange={onTopic}
      />
      {topic === 'eisen' ? <Eisen /> : topic === 'trinken' ? <Trinken /> : <Portionen />}
    </>
  );
}

function Eisen() {
  const { activeChild: child, logs } = useApp();
  const week = child ? ironWeek(child, logs, todayIso()) : null;
  return (
    <>
      {week && week.active ? (
        <Card>
          <Small bold soft={false}>{t('Eisenreiche Lebensmittel · letzte 7 Tage')}</Small>
          <Heading style={{ marginTop: space.xs }}>{t('An {0} von 7 Tagen eingetragen', { 0: week.days })}</Heading>
          <Row style={{ gap: 6, marginTop: space.md }}>
            {week.perDay.map((d) => (
              <View key={d.date} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: '100%', height: 28, borderRadius: 8, backgroundColor: d.iron ? color.sage : color.line }} />
                <Small style={{ marginTop: 2 }}>{formatDay(d.date).slice(0, 2)}</Small>
              </View>
            ))}
          </Row>
          <Small style={{ marginTop: space.md }}>{t('Eine Übersicht deiner Einträge – keine Bewertung der Versorgung.')}</Small>
        </Card>
      ) : (
        <Card tone="butter"><P>{t('Hier siehst du, an welchen Tagen eisenreiche Lebensmittel eingetragen wurden – sobald das erste dabei ist.')}</P></Card>
      )}
      <Card>
        <P>{IRON_TEXT.why}</P>
        {IRON_TEXT.how.map((tx) => <P key={tx} style={{ marginTop: space.sm }}>• {t(tx)}</P>)}
        <Small style={{ marginTop: space.md }}>{IRON_TEXT.app}</Small>
      </Card>
      <Title>{t('Quellen')}</Title>
      {[PORTION_SOURCES[0], DRINK_SOURCES[2]].map((s) => (
        <View key={s.url} style={{ marginBottom: space.sm }}><SourceLink label={s.label} url={s.url} /></View>
      ))}
    </>
  );
}

function Trinken() {
  return (
    <>
      {DRINK_STEPS.map((s) => (
        <Card key={s.when}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <P bold>{s.when}</P>
              <P style={{ marginTop: space.xs }}>{t(s.text)}</P>
            </View>
          </Row>
        </Card>
      ))}
      <Title>{t('Welches Wasser?')}</Title>
      <Card>
        {WATER_TIPS.map((tx) => <P key={tx} style={{ marginBottom: space.sm }}>💧 {t(tx)}</P>)}
      </Card>
      <Important title={t('Dann besser abgepacktes Babywasser')}>
        {WATER_EXCEPTIONS.map((tx) => <Text key={tx} style={[type.body, { color: color.redDeep }]}>• {t(tx)}</Text>)}
        <Text style={[type.body, { color: color.redDeep, marginTop: space.xs }]}>
          {t('Infos zu deinem Leitungswasser gibt dein Wasserversorger oder das Gesundheitsamt.')}</Text>
      </Important>
      <Title>{t('Der richtige Becher')}</Title>
      <Card tone="lilac">
        {CUP_TIPS.map((tx) => <P key={tx} style={{ marginBottom: space.xs }}>✓ {t(tx)}</P>)}
      </Card>
      <Important title={t('Im ersten Jahr nicht als Getränk')}>
        {DRINK_AVOID.map((tx) => <Text key={tx} style={[type.body, { color: color.redDeep }]}>• {t(tx)}</Text>)}
      </Important>
      <Title>{t('Quellen')}</Title>
      {DRINK_SOURCES.map((s) => (
        <View key={s.url} style={{ marginBottom: space.sm }}><SourceLink label={s.label} url={s.url} /></View>
      ))}
    </>
  );
}

function Portionen() {
  return (
    <>
      <P soft style={{ marginBottom: space.lg }}>
        {t('So viel ist eine volle Breimahlzeit. Am Anfang reichen wenige Löffel – dein Kind bestimmt die Menge. Was es nicht isst, trinkt es weiter als Milch.')}</P>
      {(['mittag', 'abend', 'nachmittag'] as const).map((slot) => {
        const p = FULL_PORTIONS[slot];
        return (
          <Card key={slot}>
            <Small bold soft={false}>{{ mittag: '🕛 Mittag', abend: '🌙 Abend', nachmittag: '☕ Nachmittag' }[slot]}</Small>
            <Heading style={{ marginBottom: space.md }}>{t(p.title)}</Heading>
            {p.lines.map((l) => (
              <Row key={l.label} style={{ justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: color.line }}>
                <P style={{ flex: 1 }}>{t(l.label)}</P>
                <P bold>{l.amount}</P>
              </Row>
            ))}
            <Small style={{ marginTop: space.md }}>{p.note}</Small>
          </Card>
        );
      })}
      <Card tone="butter">
        <P bold>{t('Satt oder hungrig?')}</P>
        <P style={{ marginTop: space.xs }}>
          {t('Wendet dein Kind den Kopf ab, presst den Mund zu oder spielt nur noch, ist es satt. Nicht nachschieben – lieber zur nächsten Mahlzeit wieder anbieten.')}</P>
      </Card>
      <Title>{t('Quellen')}</Title>
      {PORTION_SOURCES.map((s) => (
        <View key={s.url} style={{ marginBottom: space.sm }}><SourceLink label={s.label} url={s.url} /></View>
      ))}
    </>
  );
}
