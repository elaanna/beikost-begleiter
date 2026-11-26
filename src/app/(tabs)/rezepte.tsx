import { Hero, Screen } from '@/ui/components';
import { RecipesView } from '@/ui/RecipesView';
import { space } from '@/ui/theme';

/** Rezepte als eigener Bereich (Konzept): nach Alter, Kategorie und Zutaten. */
export default function Rezepte() {
  return (
    <Screen>
      <Hero style={{ marginBottom: space.lg }}>Rezepte</Hero>
      <RecipesView />
    </Screen>
  );
}
