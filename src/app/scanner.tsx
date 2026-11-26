import { useRef, useState } from 'react';
import { Image, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ageInMonths, todayIso } from '@/domain/dates';
import { analyzeProduct, fetchProduct, PRODUCT_SOURCES, VERDICT_TEXT, type CheckLevel, type ProductCheck } from '@/domain/productCheck';
import { useChild } from '@/state/AppContext';
import { Button, Card, P, Row, Screen, Small, SourceLink } from '@/ui/components';
import { color, radius, space, type } from '@/ui/theme';

const LEVEL_ICON: Record<CheckLevel, { icon: string; bg: string }> = {
  gut: { icon: '✓', bg: color.sageDeep },
  achtung: { icon: '!', bg: color.peachDeep },
  nein: { icon: '✕', bg: color.red },
  info: { icon: 'i', bg: color.inkSoft },
};

/** Supermarkt-Scanner: Barcode scannen → Zutaten allgemein einordnen, auf das Kind bezogen. */
export default function Scanner() {
  const { activeChild: child, logs } = useChild();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<'scan' | 'laden' | 'fertig' | 'nicht_gefunden' | 'fehler'>('scan');
  const [result, setResult] = useState<ProductCheck | null>(null);
  const [manual, setManual] = useState('');
  const busy = useRef(false);
  const age = ageInMonths(child.birthDate, todayIso());

  const lookup = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setState('laden');
    try {
      const p = await fetchProduct(code);
      if (!p) { setState('nicht_gefunden'); return; }
      setResult(analyzeProduct(p, child, logs, age));
      setState('fertig');
    } catch {
      setState('fehler');
    } finally {
      busy.current = false;
    }
  };
  const reset = () => { setResult(null); setManual(''); setState('scan'); };

  return (
    <Screen edges={['left', 'right']}>
      {state === 'scan' || state === 'laden' ? (
        <>
          <P soft style={{ marginBottom: space.md }}>Halte die Kamera auf den Barcode. Du siehst sofort, was für {child.name} drinsteckt.</P>
          {permission?.granted ? (
            <View style={{ height: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000', marginBottom: space.lg }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={state === 'scan' ? (r) => lookup(r.data) : undefined}
              />
              <View pointerEvents="none" style={{ position: 'absolute', left: '12%', right: '12%', top: '38%', height: '24%', borderWidth: 3, borderColor: '#fff', borderRadius: radius.md, opacity: 0.85 }} />
              {state === 'laden' ? (
                <View style={{ position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
                  <Text style={[type.smallBold, { color: '#fff' }]}>Suche Produkt …</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Card tone="sage">
              <P bold>📷 Kamera für den Scanner</P>
              <P style={{ marginTop: space.xs }}>Die Kamera liest nur den Barcode. Es werden keine Fotos gespeichert.</P>
              {permission && !permission.canAskAgain && Platform.OS !== 'web' ? (
                <Button label="In den Einstellungen erlauben" variant="soft" onPress={() => Linking.openSettings()} />
              ) : (
                <Button label="Kamera erlauben" onPress={requestPermission} />
              )}
            </Card>
          )}
          <Small bold soft={false} style={{ marginBottom: space.xs }}>Oder Barcode eintippen</Small>
          <Row>
            <TextInput
              value={manual}
              onChangeText={(v) => setManual(v.replace(/\D/g, '').slice(0, 14))}
              placeholder="z. B. 4062300020719"
              placeholderTextColor={color.inkSoft}
              keyboardType="number-pad"
              accessibilityLabel="Barcode eintippen"
              style={[type.body, { flex: 1, backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: space.lg, minHeight: 52, borderWidth: 2, borderColor: color.line, color: color.ink }]}
            />
            <Button label="Prüfen" disabled={manual.length < 8 || state === 'laden'} onPress={() => lookup(manual)} />
          </Row>
        </>
      ) : null}

      {state === 'nicht_gefunden' || state === 'fehler' ? (
        <Card tone="butter">
          <P bold>{state === 'fehler' ? 'Keine Verbindung' : 'Produkt nicht gefunden'}</P>
          <P style={{ marginTop: space.xs }}>
            {state === 'fehler'
              ? 'Bitte prüfe deine Internetverbindung und versuche es noch einmal.'
              : 'Dieses Produkt kennt Open Food Facts noch nicht. Lies am besten die Zutatenliste auf der Packung: Zucker, Sirup, Honig und Salz sollten nicht dabei sein.'}
          </P>
          <Button label="Nochmal scannen" onPress={reset} />
        </Card>
      ) : null}

      {state === 'fertig' && result ? <ResultCard result={result} childName={child.name} onAgain={reset} /> : null}

      <View style={{ marginTop: space.lg, gap: space.xs }}>
        <Small>Allgemeine Einordnung nach Zutatenliste – keine Garantie für Allergenfreiheit oder Eignung. Bitte immer die Packung prüfen.</Small>
        {PRODUCT_SOURCES.map((s) => <SourceLink key={s.url} label={s.label} url={s.url} />)}
      </View>
    </Screen>
  );
}

function ResultCard({ result, childName, onAgain }: { result: ProductCheck; childName: string; onAgain: () => void }) {
  const tone = result.verdict === 'gut' ? color.sageSoft : result.verdict === 'lieber_nicht' ? color.redSoft : color.peachSoft;
  const dot = result.verdict === 'gut' ? color.sageDeep : result.verdict === 'lieber_nicht' ? color.red : color.peachDeep;
  return (
    <>
      <View style={{ backgroundColor: color.surface, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg }}>
        <View style={{ backgroundColor: tone, borderRadius: radius.md, padding: space.lg, alignItems: 'center' }}>
          {result.image ? (
            <Image source={{ uri: result.image }} style={{ width: 120, height: 120, borderRadius: radius.sm }} resizeMode="contain" accessibilityIgnoresInvertColors />
          ) : <Text style={{ fontSize: 64 }}>🛒</Text>}
          {result.brand ? <Small style={{ marginTop: space.md }}>{result.brand}</Small> : null}
          <Text style={[type.title, { color: color.ink, textAlign: 'center', marginTop: 2 }]}>{result.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, marginTop: space.md }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot }} />
            <Text style={[type.bodyBold, { color: dot }]}>{VERDICT_TEXT[result.verdict](childName)}</Text>
          </View>
          <View style={{ alignSelf: 'stretch', marginTop: space.md }}>
            {result.points.map((pt, i) => (
              <Row key={pt.title + i} style={{ alignItems: 'flex-start', paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(0,0,0,0.06)' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: LEVEL_ICON[pt.level].bg, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Text style={[type.smallBold, { color: '#fff' }]}>{LEVEL_ICON[pt.level].icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <P bold>{pt.title}</P>
                  <Small soft={false}>{pt.text}</Small>
                </View>
              </Row>
            ))}
          </View>
        </View>
      </View>
      <Pressable onPress={onAgain} accessibilityRole="button" style={{ backgroundColor: color.sageDeep, borderRadius: 999, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[type.bodyBold, { color: '#fff' }]}>📷 Nächstes Produkt scannen</Text>
      </Pressable>
    </>
  );
}
