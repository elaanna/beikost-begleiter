import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getMeta, newId } from '@/db/repo';
import { useApp } from '@/state/AppContext';
import { isSyncConfigured } from '@/sync/supabase';
import {
  createInvite, INVITE_CODE_LENGTH, isSharingEnabled, joinFamily, listMembers, normalizeInviteCode,
  removeMember, revokeInvites, stopSharing, type FamilyMember, type FamilyRole,
} from '@/sync/sync';
import { Button, Card, Choice, Field, LockedNotice, P, Row, Small } from './components';
import { ConfirmButton } from './ConfirmButton';
import { color, space, type } from './theme';
import { t, tr } from '@/i18n';

const ROLE_LABEL: Record<FamilyRole, string> = tr({ owner: 'Verwaltet die Familie', member: 'Darf eintragen', reader: 'Nur lesen' });
const ROLE_EMOJI: Record<FamilyRole, string> = { owner: '⭐', member: '✍️', reader: '👀' };

/** Familienfreigabe: einladen, beitreten, Mitglieder verwalten, beenden. */
export function FamilySharing() {
  const db = useSQLiteContext();
  const app = useApp();
  const [sharing, setSharing] = useState(false);
  const [myRole, setMyRole] = useState<FamilyRole>('owner');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [role, setRole] = useState<'member' | 'reader'>('member');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const refresh = useCallback(async () => {
    const on = await isSharingEnabled(db);
    setSharing(on);
    setMyRole(((await getMeta(db, 'family_role')) as FamilyRole | null) ?? 'owner');
    if (on) {
      try {
        setMembers(await listMembers(db));
      } catch (e) {
        setMessage({ text: e instanceof Error ? e.message : String(e), error: true });
      }
    } else setMembers([]);
  }, [db]);
  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (fn: () => Promise<string | void>) => {
    setMessage(null);
    try {
      const text = await fn();
      if (text) setMessage({ text });
      await refresh();
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : t('Das hat nicht geklappt.'), error: true });
    }
  };

  if (!isSyncConfigured) {
    return (
      <Card tone="butter">
        <P>{t('Die Familienfreigabe ist in dieser Testversion noch nicht eingerichtet. Alle Daten bleiben auf diesem Gerät.')}</P>
      </Card>
    );
  }
  if (!app.isPro) {
    return <LockedNotice text={t('Lade Partner, Großeltern oder die Kita ein. Alle sehen denselben Plan.')} onUnlock={() => router.push('/paywall')} />;
  }

  const canInvite = myRole !== 'reader';
  const isOwner = myRole === 'owner';
  const cleanJoin = normalizeInviteCode(joinCode);

  return (
    <>
      {!sharing ? (
        <Card tone="butter">
          <P bold>{t('🔒 Bisher bleibt alles auf diesem Gerät')}</P>
          <P style={{ marginTop: space.xs }}>
            {t('Mit der Freigabe werden Kind, Protokoll, Verdauung und Dienstplan verschlüsselt übertragen und in der EU (Frankfurt) gespeichert, damit alle Eingeladenen denselben Stand sehen. Du kannst die Freigabe jederzeit beenden.')}</P>
        </Card>
      ) : null}

      {canInvite ? (
        <Card>
          <P bold style={{ marginBottom: space.md }}>{t('Jemanden einladen')}</P>
          <Choice emoji="✍️" label={t('Darf mit eintragen')} hint={t('Partner, Großeltern')} selected={role === 'member'} onPress={() => setRole('member')} />
          <Choice emoji="👀" label={t('Nur lesen')} hint={t('Kita, Babysitter')} selected={role === 'reader'} onPress={() => setRole('reader')} />
          <Button
            label={sharing ? t('Einladungscode erstellen') : t('Freigabe starten & Code erstellen')}
            onPress={() => run(async () => {
              setCode(await createInvite(db, role));
              await app.reload();
            })}
          />
          {code ? (
            <View style={{ alignItems: 'center', marginTop: space.lg }}>
              <Text selectable style={[type.title, { color: color.sageDeep, letterSpacing: 3 }]}>{code}</Text>
              <Small style={{ textAlign: 'center' }}>{t('Einmal verwendbar, 48 Stunden gültig. Nur persönlich oder per Nachricht an die Person weitergeben.')}</Small>
            </View>
          ) : null}
        </Card>
      ) : null}

      {!sharing ? (
        <Card>
          <Field
            label={t('Code erhalten?')}
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.slice(0, 14))}
            placeholder={t('z. B. ABCDE-FGHJK')}
            autoCapitalize="characters"
          />
          <Small style={{ marginBottom: space.md }}>
            {t('Darfst du mit eintragen, werden deine bisherigen Einträge mit der Familie geteilt. Mit einem Lese-Code bleiben sie nur auf diesem Gerät.')}</Small>
          <Button
            label={t('Familie beitreten')}
            variant="soft"
            disabled={cleanJoin.length !== INVITE_CODE_LENGTH}
            onPress={() => run(async () => {
              const r = await joinFamily(db, joinCode, '');
              await app.reload();
              setJoinCode('');
              return r === 'reader' ? t('Du siehst jetzt den Plan der Familie (nur lesen).') : t('Ihr plant jetzt gemeinsam.');
            })}
          />
        </Card>
      ) : null}

      {sharing ? (
        <Card style={{ paddingHorizontal: space.md }}>
          <P bold style={{ marginBottom: space.sm, paddingHorizontal: space.sm }}>{t('Wer hat Zugriff?')}</P>
          {members.map((m, i) => (
            <Row key={m.userId} style={{ paddingVertical: space.sm, paddingHorizontal: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
              <Text style={{ fontSize: 24 }}>{ROLE_EMOJI[m.role]}</Text>
              <View style={{ flex: 1 }}>
                <P bold>{m.isMe ? t('Du') : m.displayName || t('Person {0}', { 0: i + 1 })}</P>
                <Small>{t('{0} · seit {1}', { 0: ROLE_LABEL[m.role], 1: new Date(m.joinedAt).toLocaleDateString('de-DE') })}</Small>
              </View>
              {isOwner && !m.isMe && m.role !== 'owner' ? (
                <ConfirmButton
                  label={t('Entfernen')}
                  confirmLabel={t('Ja, entfernen')}
                  variant="ghost"
                  onConfirm={() => run(async () => { await removeMember(db, m.userId); return t('Zugriff entfernt.'); })}
                />
              ) : null}
            </Row>
          ))}
          <Small style={{ marginTop: space.sm, paddingHorizontal: space.sm }}>{t('Abgleich: {0}', { 0: app.syncState })}</Small>
        </Card>
      ) : null}

      {sharing && isOwner ? (
        <ConfirmButton
          label={t('Alle offenen Codes widerrufen')}
          confirmLabel={t('Ja, Codes ungültig machen')}
          variant="ghost"
          onConfirm={() => run(async () => { await revokeInvites(db); setCode(null); return t('Alle offenen Codes sind jetzt ungültig.'); })}
        />
      ) : null}
      {sharing ? (
        <>
          <ConfirmButton
            label={isOwner ? t('Freigabe beenden') : t('Familie verlassen')}
            confirmLabel={isOwner ? t('Für alle beenden & Cloud-Daten löschen') : t('Ja, Familie verlassen')}
            variant="ghost"
            onConfirm={() => run(async () => {
              await stopSharing(db, newId());
              await app.reload();
              setCode(null);
              return t('Die Freigabe ist beendet. Deine Einträge bleiben auf diesem Gerät.');
            })}
          />
          <Small style={{ textAlign: 'center', marginBottom: space.md }}>
            {isOwner
              ? t('Beenden löscht die Familiendaten in der Cloud. Alle Eingeladenen verlieren den Zugriff.')
              : t('Du verlierst den Zugriff auf den Familienplan. Deine Einträge bleiben auf diesem Gerät.')}
          </Small>
        </>
      ) : null}

      {message ? (
        <P style={{ color: message.error ? color.red : color.sageDeep, marginBottom: space.md }}>{t(message.text)}</P>
      ) : null}
    </>
  );
}
