import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '@/state/AppContext';
import { color } from '@/ui/theme';

export default function Index() {
  const { ready, activeChild, needsAccount } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.creme }}>
        <ActivityIndicator color={color.sageDeep} />
      </View>
    );
  }
  if (needsAccount) return <Redirect href="/willkommen" />;
  if (!activeChild) return <Redirect href="/onboarding" />;
  return <Redirect href="/heute" />;
}
