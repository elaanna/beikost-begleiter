import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setMeta } from '@/db/repo';
import { useApp } from '@/state/AppContext';
import {
  cleanOtp, confirmLinkCode, confirmSignIn, getAccount, isValidEmail, requestLinkCode, requestSignInCode,
} from '@/sync/account';
import { isSyncConfigured } from '@/sync/supabase';
import { Button, Card, Field, Hero, Important, P, Screen, Small } from '@/ui/components';
import { color, space } from '@/ui/theme';

type Mode = 'verknuepfen' | 'anmelden';
type Step = 'email' | 'code' | 'fertig';

/**
 * Konto per E-Mail (ohne Passwort, Code per E-Mail):
 * - „verknüpfen“: dieses Handy sichern, damit die Einträge einen Handywechsel überstehen
 * - „anmelden“: auf einem neuen Handy die gesicherten Einträge zurückholen
 */
export default function Konto() {
  const db = useSQLiteContext();
  const app = useApp();
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const mode: Mode = params.mode === 'anmelden' ? 'anmelden' : 'verknuepfen';
  const [linkedEmail, setLinkedEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccount().then((a) => setLinkedEmail(a.email)).catch(() => undefined);
  }, []);

  if (!isSyncConfigured) {
    return (
      <Screen edges={['left', 'right']}>
        <Card tone="butter"><P>Konten sind in dieser Testversion noch nicht eingerichtet.</P></Card>
      </Screen>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das hat nicht geklappt.');
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'verknuepfen' && linkedEmail && step !== 'fertig') {
    return (
      <Screen edges={['left', 'right']}>
        <Hero style={{ marginBottom: space.lg }}>Dein Konto</Hero>
        <Card tone="sage">
          <P bold>✓ Gesichert mit {linkedEmail}</P>
          <P style={{ marginTop: space.xs }}>
            Auf einem neuen Handy: App installieren, „Ich habe schon ein Konto“ wählen und mit dieser E-Mail anmelden.
          </P>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <Hero style={{ marginBottom: space.sm }}>{mode === 'anmelden' ? 'Willkommen zurück' : 'Einträge sichern'}</Hero>
      <P soft style={{ marginBottom: space.lg }}>
        {mode === 'anmelden'
          ? 'Melde dich mit der E-Mail an, die du auf deinem bisherigen Handy verknüpft hast. Wir schicken dir einen Code – ein Passwort brauchst du nicht.'
          : 'Verknüpfe eine E-Mail-Adresse, damit Plan, Probiert-Liste und Notizen einen Handywechsel überstehen. Ein Passwort brauchst du nicht.'}
      </P>

      {step === 'email' ? (
        <>
          <Field label="E-Mail" value={email} onChangeText={setEmail} placeholder="name@beispiel.de" keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} />
          {mode === 'verknuepfen' ? (
            <Card tone="butter">
              <Small soft={false}>
                Dafür werden deine Einträge (auch Allergien und Reaktionen) verschlüsselt übertragen und bei Supabase in der EU
                (Frankfurt) gespeichert. Die E-Mail nutzen wir nur für die Anmeldung. Löschen jederzeit unter Datenschutz.
              </Small>
            </Card>
          ) : null}
          <Button
            label={mode === 'verknuepfen' ? 'Einverstanden – Code senden' : 'Code senden'}
            disabled={!isValidEmail(email) || busy}
            onPress={() => run(async () => {
              await (mode === 'anmelden' ? requestSignInCode(email) : requestLinkCode(email));
              setStep('code');
            })}
          />
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <P style={{ marginBottom: space.md }}>Wir haben dir einen Code an <P bold>{email.trim()}</P> geschickt. Schau auch im Spam-Ordner nach.</P>
          <Field label="Code aus der E-Mail" value={code} onChangeText={(v) => setCode(cleanOtp(v))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" maxLength={10} />
          <Button
            label={mode === 'anmelden' ? 'Anmelden' : 'Bestätigen'}
            disabled={code.length < 6 || busy}
            onPress={() => run(async () => {
              if (mode === 'anmelden') {
                await confirmSignIn(db, email, code);
                await setMeta(db, 'tour_done', '1');
                await app.reload();
                router.replace('/heute');
              } else {
                await confirmLinkCode(db, email, code);
                setLinkedEmail(email.trim().toLowerCase());
                setStep('fertig');
              }
            })}
          />
          <Button label="Andere E-Mail oder neuen Code" variant="ghost" onPress={() => { setCode(''); setStep('email'); }} />
        </>
      ) : null}

      {step === 'fertig' ? (
        <Card tone="sage">
          <P bold>✓ Geschafft! Deine Einträge sind gesichert.</P>
          <P style={{ marginTop: space.xs }}>Auf einem neuen Handy meldest du dich einfach mit {linkedEmail} an.</P>
          <Button label="Fertig" onPress={() => router.back()} />
        </Card>
      ) : null}

      {busy ? <Small style={{ marginTop: space.md }}>Einen Moment …</Small> : null}
      {error ? <Important>{error}</Important> : null}
      {mode === 'anmelden' && step === 'email' ? (
        <Small style={{ marginTop: space.lg, color: color.inkSoft }}>Noch kein Konto? Dann starte einfach neu – das Konto kannst du später unter Familie verknüpfen.</Small>
      ) : null}
    </Screen>
  );
}
