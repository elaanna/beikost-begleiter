import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { buy, getPackages, restore } from '@/purchases/revenuecat';
import { useApp } from '@/state/AppContext';
import { Button, Card, Hero, P, Screen, Small } from '@/ui/components';
import { color, space } from '@/ui/theme';
import { t, tr } from '@/i18n';

/**
 * Preisstruktur: Der Planer für heute bleibt kostenlos. Das Paket bringt Planung, Familie und die Kleinkind-Phase.
 * Kostenlos bleiben außerdem alles zur Sicherheit, der Scanner, „Noch mal anbieten“, Unterwegs und das Journal.
 */
const INCLUDED = tr([
  { emoji: '🗓️', text: 'Plan beliebig weit im Voraus' },
  { emoji: '🛒', text: 'Einkaufsliste und Vorkoch-Sonntag' },
  { emoji: '❄️', text: 'Vorrat & Gefrierfach' },
  { emoji: '🍽️', text: 'Familientisch ab 1 Jahr: Tagesplan, Kleinkind-Rezepte, Kita-Brotdose' },
  { emoji: '🔄', text: 'Familienessen-Konverter' },
  { emoji: '👪', text: 'Gemeinsam planen mit Partner, Großeltern, Kita' },
  { emoji: '👶', text: 'Geschwisterkinder' },
  { emoji: '📄', text: 'Wochenplan als PDF' },
]);

export default function Paywall() {
  const { previewMode, setCustomerInfo } = useApp();
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getPackages().then(setPackages).catch(() => setPackages([]));
  }, []);

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Text style={{ fontSize: 56, textAlign: 'center' }}>⭐</Text>
      <Hero style={{ textAlign: 'center', marginTop: space.md }}>{t('Vom ersten Löffel bis zum Familientisch')}</Hero>
      <P soft style={{ textAlign: 'center', marginTop: space.sm, marginBottom: space.xl }}>
        {t('Einmal zahlen, 12 Monate nutzen. Kein Abo, das sich still verlängert.')}</P>

      <Card>
        {INCLUDED.map((x) => (
          <View key={x.text} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', marginBottom: space.md }}>
            <Text style={{ fontSize: 24 }}>{x.emoji}</Text>
            <P style={{ flex: 1 }}>{t(x.text)}</P>
          </View>
        ))}
        <Small>{t('Immer kostenlos: Tagesplan, Notieren mit Reaktionen, Lebensmittel entdecken, Scanner, Wissen & Sicherheit, Notfallblatt, Noch mal anbieten, Unterwegs und das Journal „Erste Male“.')}</Small>
      </Card>

      {previewMode ? (
        <Card tone="sage"><P>{t('Testversion: Alle Funktionen sind freigeschaltet, Käufe sind noch nicht eingerichtet.')}</P></Card>
      ) : packages === null ? (
        <ActivityIndicator color={color.sageDeep} />
      ) : packages.length === 0 ? (
        <P soft>{t('Angebote konnten nicht geladen werden. Prüfe die Internetverbindung.')}</P>
      ) : (
        <View style={{ gap: space.md }}>
          {packages.map((p) => (
            <Button
              key={p.identifier}
              disabled={busy}
              label={`${p.product.title} – ${p.product.priceString}`}
              variant={p.packageType === 'MONTHLY' ? 'soft' : 'primary'}
              onPress={async () => {
                setBusy(true);
                const r = await buy(p);
                setBusy(false);
                if (r.outcome === 'gekauft') {
                  setCustomerInfo(r.info ?? null);
                  router.back();
                } else if (r.outcome === 'fehler') {
                  setMessage(r.message ?? t('Kauf fehlgeschlagen.'));
                }
              }}
            />
          ))}
        </View>
      )}

      {message ? <P style={{ color: color.red, marginTop: space.md }}>{message}</P> : null}
      {!previewMode ? (
        <Button
          label={t('Käufe wiederherstellen')}
          variant="ghost"
          style={{ marginTop: space.lg, alignSelf: 'center' }}
          onPress={async () => setCustomerInfo(await restore())}
        />
      ) : null}
    </Screen>
  );
}
