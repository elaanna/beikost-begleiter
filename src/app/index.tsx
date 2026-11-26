import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '@/state/AppContext';
import { color } from '@/ui/theme';

export default function Index() {
  const { ready, activeChild } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.creme }}>
        <ActivityIndicator color={color.sageDeep} />
      </View>
    );
  }
  if (!activeChild) return <Redirect href="/willkommen" />;
  return <Redirect href="/heute" />;
}
