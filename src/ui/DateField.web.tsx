import { createElement } from 'react';
import { Text, View } from 'react-native';
import { color, font, radius, space, type } from './theme';

/** Web-Vorschau: natives HTML-Datumsfeld. */
export function DateField({ label, value, onChange, minimum, maximum }: {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  minimum?: string;
  maximum?: string;
}) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[type.bodyBold, { color: color.ink, marginBottom: space.xs }]}>{label}</Text>
      {createElement('input', {
        type: 'date',
        'aria-label': label,
        value: value ?? '',
        min: minimum,
        max: maximum,
        onChange: (e: { target: { value: string } }) => e.target.value && onChange(e.target.value),
        style: {
          minHeight: 52, border: `2px solid ${color.line}`, borderRadius: radius.md, padding: '0 16px',
          fontSize: 17, fontFamily: font.body, color: color.ink, backgroundColor: color.surface,
        },
      })}
    </View>
  );
}
