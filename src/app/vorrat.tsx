import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ALL_RECIPES, RECIPE_BY_ID } from '@/data/allRecipes';
import { MEAL_PREP_RULES, STORAGE_SOURCES } from '@/data/babyRecipes';
import { FOOD_BY_ID, FOODS } from '@/data/foods';
import { formatDayLong, todayIso } from '@/domain/dates';
import { freezerAge } from '@/domain/stock';
import { newId, type StockItem } from '@/db/repo';
import { useApp } from '@/state/AppContext';
import { Button, Card, Field, Heading, P, Pill, PillRow, Row, Screen, Segmented, Small, SourceLink, Title } from '@/ui/components';
import { ConfirmButton } from '@/ui/ConfirmButton';
import { DateField } from '@/ui/DateField';
import { useToast } from '@/ui/Toast';
import { color, radius, space, type } from '@/ui/theme';

type Tab = 'gefroren' | 'vorrat';

/** Vorrat & Gefrierfach: vorgekochte Portionen und Vorräte im Blick (Konzept F08). */
export default function Vorrat() {
  const params = useLocalSearchParams<{ add?: string }>();
  const { stock, saveStock, removeStock } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('gefroren');
  const today = todayIso();

  // Formular „Portionen einfrieren“
  const freezable = useMemo(() => ALL_RECIPES.filter((r) => r.storage.freeze && r.category !== 'familie'), []);
  const [recipeId, setRecipeId] = useState<string | null>(params.add ?? null);
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(4);
  const [madeOn, setMadeOn] = useState<string>(today);
  const [adding, setAdding] = useState(!!params.add);
  useEffect(() => {
    if (params.add) { setRecipeId(params.add); setAdding(true); setTab('gefroren'); }
  }, [params.add]);

  const frozen = stock.filter((s) => s.kind === 'gefroren');
  const pantry = stock.filter((s) => s.kind === 'vorrat' && s.portions > 0);
  const [query, setQuery] = useState('');
  const results = query.trim().length >= 2
    ? FOODS.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const addFrozen = async () => {
    const recipe = recipeId ? RECIPE_BY_ID[recipeId] : undefined;
    const label = (recipe?.name ?? name).trim();
    if (!label) return;
    await saveStock({ id: newId(), kind: 'gefroren', name: label, recipeId: recipe?.id ?? null, foodId: null, portions, madeOn });
    toast({ emoji: '❄️', text: `${portions} Portionen ${label} eingetragen` });
    setAdding(false); setRecipeId(null); setName(''); setPortions(4); setMadeOn(today);
  };

  const togglePantry = async (foodId: string) => {
    const existing = stock.find((s) => s.kind === 'vorrat' && s.foodId === foodId);
    if (existing && existing.portions > 0) await saveStock({ ...existing, portions: 0 });
    else if (existing) await saveStock({ ...existing, portions: 1 });
    else await saveStock({ id: newId(), kind: 'vorrat', name: FOOD_BY_ID[foodId].name, recipeId: null, foodId, portions: 1, madeOn: today });
  };

  return (
    <Screen edges={['left', 'right']}>
      <Segmented<Tab>
        options={[{ id: 'gefroren', label: '❄️ Gefrierfach' }, { id: 'vorrat', label: '🧺 Vorrat' }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'gefroren' ? (
        <>
          {frozen.length === 0 && !adding ? (
            <Card tone="sage"><P>Noch nichts eingefroren. Vorkochen spart Zeit: einmal kochen, mehrere Mahlzeiten.</P></Card>
          ) : null}
          {frozen.map((item) => <FrozenRow key={item.id} item={item} today={today} onSave={saveStock} onRemove={removeStock} />)}

          {adding ? (
            <Card>
              <Heading style={{ marginBottom: space.md }}>Portionen einfrieren</Heading>
              <Small bold soft={false} style={{ marginBottom: space.xs }}>Rezept</Small>
              <PillRow>
                {freezable.map((r) => (
                  <Pill key={r.id} label={`${r.emoji} ${r.name}`} selected={recipeId === r.id} onPress={() => { setRecipeId(r.id); setName(''); }} />
                ))}
              </PillRow>
              <Field label="… oder eigener Name" value={name} onChangeText={(v) => { setName(v); setRecipeId(null); }} placeholder="z. B. Karotten-Hirse" maxLength={60} />
              <Stepper label="Portionen" value={portions} onChange={setPortions} />
              <DateField label="Eingefroren am" value={madeOn} onChange={setMadeOn} maximum={today} />
              <Button label="Eintragen" disabled={!recipeId && !name.trim()} onPress={addFrozen} />
              <Button label="Abbrechen" variant="ghost" onPress={() => setAdding(false)} />
            </Card>
          ) : (
            <Button label="Portionen einfrieren" icon={Plus} onPress={() => setAdding(true)} />
          )}

          <Title>Vorkochen & Einfrieren</Title>
          <Card tone="butter">
            {MEAL_PREP_RULES.map((r) => <P key={r} style={{ marginBottom: space.xs }}>• {r}</P>)}
            <Small style={{ marginTop: space.sm }}>Allgemeine Hinweise – die App kann Haltbarkeit und Frische im Einzelfall nicht beurteilen.</Small>
            {STORAGE_SOURCES.map((s) => <View key={s.url} style={{ marginTop: space.xs }}><SourceLink label={s.label} url={s.url} /></View>)}
          </Card>
        </>
      ) : (
        <>
          <P soft style={{ marginBottom: space.md }}>Was du da hast, landet auf der Einkaufsliste als „vorrätig“ – und hilft bei „Was habe ich da?“.</P>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Lebensmittel suchen, z. B. Hirse"
            placeholderTextColor={color.inkSoft}
            accessibilityLabel="Lebensmittel für den Vorrat suchen"
            maxLength={40}
            style={[type.body, { backgroundColor: color.surface, borderRadius: radius.pill, paddingHorizontal: space.lg, minHeight: 52, borderWidth: 2, borderColor: color.line, color: color.ink, marginBottom: space.md }]}
          />
          {results.map((f) => {
            const on = pantry.some((p) => p.foodId === f.id);
            return (
              <Pressable key={f.id} onPress={() => togglePantry(f.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: color.surface, borderRadius: radius.md, marginBottom: space.sm }}>
                <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                <P style={{ flex: 1 }}>{f.name}</P>
                <Text style={[type.bodyBold, { color: on ? color.sageDeep : color.inkSoft }]}>{on ? '✓ da' : '+ da'}</Text>
              </Pressable>
            );
          })}
          <Title>Im Vorrat ({pantry.length})</Title>
          {pantry.length === 0 ? <Card><P>Noch nichts eingetragen.</P></Card> : (
            <Card>
              <Row style={{ flexWrap: 'wrap', gap: space.sm }}>
                {pantry.map((p) => (
                  <Pill key={p.id} label={`${p.foodId ? FOOD_BY_ID[p.foodId]?.emoji ?? '' : ''} ${p.name} ✕`} selected onPress={() => p.foodId && togglePantry(p.foodId)} />
                ))}
              </Row>
              <Small style={{ marginTop: space.sm }}>Antippen, wenn etwas aufgebraucht ist.</Small>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function FrozenRow({ item, today, onSave, onRemove }: {
  item: StockItem; today: string; onSave: (s: StockItem) => Promise<void>; onRemove: (id: string) => Promise<void>;
}) {
  const age = freezerAge(item.madeOn, today);
  const recipe = item.recipeId ? RECIPE_BY_ID[item.recipeId] : undefined;
  return (
    <Card>
      <Row style={{ alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 30 }}>{recipe?.emoji ?? '❄️'}</Text>
        <View style={{ flex: 1 }}>
          <P bold>{item.name}</P>
          <Small>Eingefroren am {formatDayLong(item.madeOn)} · vor {age.days} Tagen</Small>
          {age.beyondGuide ? (
            <Text style={[type.small, { color: color.peachDeep, marginTop: 2 }]}>
              Älter als die allgemeine Orientierung von etwa 2 Monaten – im Zweifel nicht mehr verwenden.
            </Text>
          ) : null}
        </View>
      </Row>
      <Stepper label="Portionen" value={item.portions} onChange={(v) => onSave({ ...item, portions: v })} />
      {item.portions === 0 ? (
        <Button label="Leer – entfernen" variant="soft" onPress={() => onRemove(item.id)} />
      ) : (
        <ConfirmButton label="Entfernen" confirmLabel="Ja, entfernen" variant="ghost" onConfirm={() => onRemove(item.id)} />
      )}
    </Card>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const btn = (txt: string, d: number) => (
    <Pressable
      onPress={() => onChange(Math.max(0, Math.min(99, value + d)))}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${d > 0 ? 'mehr' : 'weniger'}`}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.sageSoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={[type.bodyBold, { color: color.sageDeep, fontSize: 20 }]}>{txt}</Text>
    </Pressable>
  );
  return (
    <Row style={{ justifyContent: 'space-between', marginVertical: space.sm }}>
      <P style={{ flex: 1 }}>{label}</P>
      {btn('−', -1)}
      <Text style={[type.bodyBold, { color: color.ink, width: 48, textAlign: 'center', fontSize: 18 }]}>{value}</Text>
      {btn('+', 1)}
    </Row>
  );
}
