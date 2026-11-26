import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, Switch, View } from 'react-native';
import { todayIso } from '@/domain/dates';
import { newId } from '@/db/repo';
import { useApp } from '@/state/AppContext';
import { Button, Card, P, Row, Screen, Small } from '@/ui/components';
import { ChildForm } from '@/ui/ChildForm';
import { color, space } from '@/ui/theme';

export default function KindBearbeiten() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { children, familyId, saveChild, removeChild } = useApp();
  const existing = children.find((c) => c.id === id);

  const confirmDelete = () => {
    const doDelete = async () => {
      await removeChild(existing!.id);
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`${existing!.name} und alle Einträge löschen?`)) void doDelete();
    } else {
      Alert.alert('Kind löschen?', `${existing!.name} und alle Einträge werden gelöscht.`, [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <Screen edges={['left', 'right']}>
      <Stack.Screen options={{ title: existing ? existing.name : 'Weiteres Kind' }} />
      <ChildForm
        key={existing?.id ?? 'neu'}
        initial={existing}
        familyId={familyId}
        newId={newId}
        onSave={async (child) => {
          // Das Formular kennt die Kleinkind-Phase nicht – beim Bearbeiten erhalten
          await saveChild({ ...child, tableSince: existing?.tableSince ?? null });
          router.back();
        }}
      />
      {existing ? (
        <Card tone="lilac" style={{ marginTop: space.xl }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <P bold>Am Familientisch (ab 1 Jahr)</P>
              <Small soft={false}>Statt Breiplan: 5 Mahlzeiten am Tag, Brotdose und Familienrezepte. Jederzeit umschaltbar.</Small>
            </View>
            <Switch
              value={Boolean(existing.tableSince)}
              onValueChange={(v) => saveChild({ ...existing, tableSince: v ? todayIso() : null })}
              trackColor={{ true: color.sage, false: color.line }}
              accessibilityLabel="Am Familientisch"
            />
          </Row>
        </Card>
      ) : null}
      {existing && children.length > 1 ? (
        <Button label="Kind löschen" variant="ghost" style={{ marginTop: space.xl }} onPress={confirmDelete} />
      ) : null}
    </Screen>
  );
}
