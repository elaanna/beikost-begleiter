import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { setMeta } from '@/db/repo';
import { useApp } from '@/state/AppContext';
import {
  cleanOtp, confirmLinkCode, confirmSignIn, enableBackup, isBackupEnabled, isValidEmail, requestLinkCode, requestSignInCode,
} from '@/sync/account';
import { isSyncConfigured } from '@/sync/supabase';
import { Button, Card, Field, Hero, Important, P, Screen, Small } from '@/ui/components';
import { space } from '@/ui/theme';

type Mode = 'registrieren' | 'anmelden';
type Step = 'email' | 'code' | 'sicherung' | 'fertig';

/**
 * Konto per E-Mail (ohne Passwort, Code per E-Mail):
 * - „registrieren“: Konto erstellen, danach freiwillig die Cloud-Sicherung wählen
 * - „anmelden“: auf einem neuen Handy anmelden und gesicherte Einträge zurückholen
 * Ohne Modus (aus Familie): Übersicht mit E-Mail und Sicherung.
 */
export default function Konto() {
  const db = useSQLiteContext();
  const app = useApp();
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const mode: Mode = params.mode === 'anmelden' ? 'anmelden' : 'registrieren';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [backup, setBackup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isBackupEnabled(db).then(setBackup).catch(() => undefined);
  }, [db]);

  /** Nach Konto/Anmeldung weiter: ohne Kind ins Einrichten, sonst zu „Heute“. */
  const goOn = async () => {
    await app.reload();
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM children WHERE deleted = 0');
    router.replace(row && row.n > 0 ? '/heute' : '/onboarding');
  };

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

  if (!isSyncConfigured) {
    return (
      <Screen edges={['left', 'right']}>
        <Card tone="butter"><P>Konten sind in dieser Testversion noch nicht eingerichtet.</P></Card>
      </Screen>
    );
  }

  // Übersicht für angemeldete Nutzer (aus Familie geöffnet)
  if (app.accountEmail && !params.mode && step !== 'fertig') {
    return (
      <Screen edges={['left', 'right']}>
        <Hero style={{ marginBottom: space.lg }}>Dein Konto</Hero>
        <Card tone="sage">
          <P bold>✓ Angemeldet als {app.accountEmail}</P>
          <P style={{ marginTop: space.xs }}>Auf einem neuen Handy: App installieren, „Ich habe schon ein Konto“ wählen und mit dieser E-Mail anmelden.</P>
        </Card>
        {backup ? (
          <Card><P bold>☁️ Cloud-Sicherung ist an</P><Small soft={false}>Deine Einträge werden beim Handywechsel wiederhergestellt.</Small></Card>
        ) : (
          <BackupChoice busy={busy} onYes={() => run(async () => { await enableBackup(db); setBackup(true); })} />
        )}
        {error ? <Important>{error}</Important> : null}
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      {step === 'email' || step === 'code' ? (
        <>
          <Hero style={{ marginBottom: space.sm }}>{mode === 'anmelden' ? 'Willkommen zurück' : 'Konto erstellen'}</Hero>
          <P soft style={{ marginBottom: space.lg }}>
            {mode === 'anmelden'
              ? 'Melde dich mit deiner E-Mail an. Wir schicken dir einen Code – ein Passwort brauchst du nicht.'
              : 'Mit deiner E-Mail-Adresse. Wir schicken dir einen Code – ein Passwort brauchst du nicht.'}
          </P>
        </>
      ) : null}

      {step === 'email' ? (
        <>
          <Field label="E-Mail" value={email} onChangeText={setEmail} placeholder="name@beispiel.de" keyboardType="email-address" autoCapitalize="none" autoComplete="email" maxLength={254} />
          <Button
            label="Code senden"
            disabled={!isValidEmail(email) || busy}
            onPress={() => run(async () => {
              await (mode === 'anmelden' ? requestSignInCode(email) : requestLinkCode(email));
              setStep('code');
            })}
          />
          <Small style={{ marginTop: space.md }}>Die E-Mail nutzen wir nur für die Anmeldung – keine Werbung, keine Weitergabe.</Small>
        </>
      ) : null}

      {step === 'code' ? (
        <>
          <P style={{ marginBottom: space.md }}>Wir haben dir einen Code an <P bold>{email.trim()}</P> geschickt. Schau auch im Spam-Ordner nach.</P>
          <Field label="Code aus der E-Mail" value={code} onChangeText={(v) => setCode(cleanOtp(v))} placeholder="123456" keyboardType="number-pad" autoComplete="one-time-code" maxLength={10} />
          <Button
            label={mode === 'anmelden' ? 'Anmelden' : 'Konto bestätigen'}
            disabled={code.length < 6 || busy}
            onPress={() => run(async () => {
              if (mode === 'anmelden') {
                const restored = await confirmSignIn(db, email, code);
                if (restored) await setMeta(db, 'tour_done', '1');
                await app.refreshAccount();
                await goOn();
              } else {
                await confirmLinkCode(email, code);
                await app.refreshAccount();
                setStep(backup ? 'fertig' : 'sicherung');
              }
            })}
          />
          <Button label="Andere E-Mail oder neuen Code" variant="ghost" onPress={() => { setCode(''); setStep('email'); }} />
        </>
      ) : null}

      {step === 'sicherung' ? (
        <>
          <Hero style={{ marginBottom: space.lg }}>✓ Konto erstellt</Hero>
          <BackupChoice
            busy={busy}
            onYes={() => run(async () => { await enableBackup(db); setBackup(true); setStep('fertig'); })}
            onNo={() => setStep('fertig')}
          />
        </>
      ) : null}

      {step === 'fertig' ? (
        <Card tone="sage">
          <P bold>✓ Alles bereit!</P>
          <P style={{ marginTop: space.xs }}>
            {backup ? 'Deine Einträge sind gesichert.' : 'Deine Einträge bleiben auf diesem Handy. Die Sicherung kannst du jederzeit unter Familie → Konto einschalten.'}
          </P>
          <Button label="Weiter" onPress={goOn} />
        </Card>
      ) : null}

      {busy ? <Small style={{ marginTop: space.md }}>Einen Moment …</Small> : null}
      {error ? <Important>{error}</Important> : null}
    </Screen>
  );
}

/** Freiwillige Cloud-Sicherung – eigene Entscheidung, nicht Voraussetzung für das Konto. */
function BackupChoice({ busy, onYes, onNo }: { busy: boolean; onYes: () => void; onNo?: () => void }) {
  return (
    <Card tone="butter">
      <P bold>☁️ Einträge in der Cloud sichern?</P>
      <Small soft={false} style={{ marginTop: space.xs }}>
        Empfohlen für den Handywechsel. Dafür werden deine Einträge – auch Allergien und Reaktionen – verschlüsselt übertragen
        und bei Supabase in der EU (Frankfurt) gespeichert. Freiwillig und jederzeit unter Datenschutz löschbar.
      </Small>
      <Button label="Ja, sichern" disabled={busy} onPress={onYes} />
      {onNo ? <Button label="Nein, nur auf diesem Handy" variant="ghost" onPress={onNo} /> : null}
    </Card>
  );
}
