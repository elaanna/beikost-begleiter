import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { newId } from '@/db/repo';
import { useApp } from '@/state/AppContext';
import { Button, Screen } from '@/ui/components';
import { ChildForm } from '@/ui/ChildForm';
import { space } from '@/ui/theme';

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
          await saveChild(child);
          router.back();
        }}
      />
      {existing && children.length > 1 ? (
        <Button label="Kind löschen" variant="ghost" style={{ marginTop: space.xl }} onPress={confirmDelete} />
      ) : null}
    </Screen>
  );
}
