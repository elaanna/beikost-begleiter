import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, font, radius, space, TOUCH, type } from './theme';

export function Screen({ children, scroll = true, edges = ['top', 'left', 'right'] }: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'left' | 'right' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={s.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[s.scroll, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Hero({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[type.hero, { color: color.ink }, style]} accessibilityRole="header">{children}</Text>;
}

export function Title({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[type.title, { color: color.ink, marginTop: space.xl, marginBottom: space.md }, style]} accessibilityRole="header">{children}</Text>;
}

export function Heading({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[type.heading, { color: color.ink }, style]}>{children}</Text>;
}

export function P({ children, soft, bold, style }: { children: ReactNode; soft?: boolean; bold?: boolean; style?: object }) {
  return <Text style={[bold ? type.bodyBold : type.body, { color: soft ? color.inkSoft : color.ink }, style]}>{children}</Text>;
}

export function Small({ children, soft = true, bold, style }: { children: ReactNode; soft?: boolean; bold?: boolean; style?: object }) {
  return <Text style={[bold ? type.smallBold : type.small, { color: soft ? color.inkSoft : color.ink }, style]}>{children}</Text>;
}

export function Card({ children, style, tone, onPress, accessibilityLabel }: {
  children: ReactNode;
  style?: ViewStyle;
  tone?: 'peach' | 'sage' | 'butter';
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const bg = tone === 'peach' ? color.peachSoft : tone === 'sage' ? color.sageSoft : tone === 'butter' ? color.butter : color.surface;
  const body = <View style={[s.card, { backgroundColor: bg }, style]}>{children}</View>;
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {body}
    </Pressable>
  );
}

/**
 * Wichtiger Hinweis – immer rot, mit Ausrufezeichen-Symbol.
 * Rot wird in der App für nichts anderes verwendet.
 */
export function Important({ title = 'Wichtig', children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <View style={s.important} accessibilityRole="alert">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs }}>
        <View style={s.importantBadge}><Text style={{ color: '#fff', fontFamily: font.bodyHeavy, fontSize: 14 }}>!</Text></View>
        <Text style={[type.smallBold, { color: color.redDeep }]}>{title}</Text>
      </View>
      {typeof children === 'string' ? <Text style={[type.body, { color: color.redDeep }]}>{children}</Text> : children}
      {action}
    </View>
  );
}

export function Button({ label, onPress, variant = 'primary', disabled, style, icon }: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'peach' | 'soft' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
}) {
  const bg = { primary: color.sageDeep, peach: color.peach, soft: color.sageSoft, ghost: 'transparent', danger: color.red }[variant];
  const fg = { primary: '#fff', peach: '#fff', soft: color.sageDeep, ghost: color.sageDeep, danger: '#fff' }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === 'ghost' && { minHeight: 44, paddingHorizontal: space.sm },
        style,
      ]}
    >
      <Text style={[type.bodyBold, { color: fg, textAlign: 'center', fontSize: 17 }]}>
        {icon ? `${icon}  ` : ''}{label}
      </Text>
    </Pressable>
  );
}

/** Große Auswahlkarte (Onboarding, Filter). */
export function Choice({ label, hint, emoji, selected, onPress, tone }: {
  label: string; hint?: string; emoji?: string; selected?: boolean; onPress: () => void; tone?: 'red';
}) {
  const active = tone === 'red' ? color.red : color.sageDeep;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        s.choice,
        { borderColor: selected ? active : color.line, backgroundColor: selected ? (tone === 'red' ? color.redSoft : color.sageSoft) : color.surface },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      {emoji ? <Text style={{ fontSize: 30 }}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyBold, { color: color.ink, fontSize: 17 }]}>{label}</Text>
        {hint ? <Text style={[type.small, { color: color.inkSoft }]}>{hint}</Text> : null}
      </View>
      <View style={[s.radio, { borderColor: selected ? active : color.line, backgroundColor: selected ? active : 'transparent' }]}>
        {selected ? <Text style={{ color: '#fff', fontFamily: font.bodyHeavy, fontSize: 13 }}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.pill, { backgroundColor: selected ? color.sageDeep : color.surface, borderColor: selected ? color.sageDeep : color.line }]}
    >
      <Text style={[type.smallBold, { color: selected ? '#fff' : color.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function PillRow({ children }: { children: ReactNode }) {
  return <View style={s.pillRow}>{children}</View>;
}

/** Segmentierter Umschalter, z. B. Woche / Einkauf. */
export function Segmented<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={s.segment} accessibilityRole="tablist">
      {options.map((o) => (
        <Pressable
          key={o.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === o.id }}
          onPress={() => onChange(o.id)}
          style={[s.segmentItem, value === o.id && { backgroundColor: color.surface }]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[type.bodyBold, { color: value === o.id ? color.sageDeep : color.inkSoft, fontSize: options.length > 3 ? 14 : 16 }]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, hint, keyboardType, autoCapitalize, maxLength = 200 }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; hint?: string;
  keyboardType?: 'default' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; maxLength?: number;
}) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[type.bodyBold, { color: color.ink, marginBottom: space.xs }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkSoft}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        keyboardType={keyboardType}
        style={s.input}
      />
      {hint ? <Small style={{ marginTop: space.xs }}>{hint}</Small> : null}
    </View>
  );
}

/** Großes rundes Lebensmittel-Symbol. */
export function FoodBadge({ emoji, size = 56, tone = 'peach' }: { emoji: string; size?: number; tone?: 'peach' | 'sage' | 'white' }) {
  const bg = tone === 'peach' ? color.peachSoft : tone === 'sage' ? color.sageSoft : color.surface;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.52 }}>{emoji}</Text>
    </View>
  );
}

/** Punkte für Tag 1–n eines neuen Lebensmittels. */
export function DayDots({ day, total }: { day: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Tag ${day} von ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[s.dot, { backgroundColor: i < day ? color.peach : 'transparent' }]} />
      ))}
    </View>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={s.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      <View style={[s.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.md }, style]}>{children}</View>;
}

/** Listeneintrag mit Pfeil – für Navigation zu Unterseiten. */
export function ListItem({ title, subtitle, emoji, onPress, right }: {
  title: string; subtitle?: string; emoji?: string; onPress?: () => void; right?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [s.listItem, pressed && { backgroundColor: color.creme }]}
    >
      {emoji ? <FoodBadge emoji={emoji} size={44} tone="sage" /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyBold, { color: color.ink }]}>{title}</Text>
        {subtitle ? <Text style={[type.small, { color: color.inkSoft }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Text style={{ fontSize: 22, color: color.inkSoft }}>›</Text> : null)}
    </Pressable>
  );
}

export function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" hitSlop={8}>
      <Text style={[type.small, { color: color.sageDeep, textDecorationLine: 'underline' }]}>{label}</Text>
    </Pressable>
  );
}

export function LockedNotice({ text, onUnlock }: { text: string; onUnlock: () => void }) {
  return (
    <Card tone="butter" style={{ gap: space.md }}>
      <Text style={{ fontSize: 28 }}>🔓</Text>
      <P>{text}</P>
      <Button label="Beikost-Paket ansehen" onPress={onUnlock} />
    </Card>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.creme },
  scroll: { padding: space.xl, paddingBottom: 96, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: {
    borderRadius: radius.lg,
    padding: space.xl,
    marginBottom: space.lg,
    shadowColor: '#B88A6A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  important: {
    backgroundColor: color.redSoft,
    borderLeftWidth: 5,
    borderLeftColor: color.red,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.xs,
  },
  importantBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: color.red, alignItems: 'center', justifyContent: 'center',
  },
  button: {
    minHeight: TOUCH,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.md,
    minHeight: 68,
  },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pill: { minHeight: 40, borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: space.lg, justifyContent: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  segment: { flexDirection: 'row', backgroundColor: color.line, borderRadius: radius.pill, padding: 4, marginBottom: space.lg },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: TOUCH,
    borderWidth: 2,
    borderColor: color.line,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    paddingHorizontal: space.lg,
    fontSize: 17,
    fontFamily: font.body,
    color: color.ink,
  },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: color.peach },
  progress: { height: 10, borderRadius: 5, backgroundColor: color.line, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 5, backgroundColor: color.sage },
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.sm,
    borderRadius: radius.sm, minHeight: TOUCH,
  },
});
