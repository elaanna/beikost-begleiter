import { Hero, Screen } from '@/ui/components';
import { RecipesView } from '@/ui/RecipesView';
import { space } from '@/ui/theme';
import { t } from '@/i18n';

/** Rezepte als eigener Bereich (Konzept): nach Alter, Kategorie und Zutaten. */
export default function Rezepte() {
  return (
    <Screen>
      <Hero style={{ marginBottom: space.lg }}>{t('Rezepte')}</Hero>
      <RecipesView />
    </Screen>
  );
}
