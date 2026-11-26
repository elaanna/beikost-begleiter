import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDayLong, parseDay, toIso } from '@/domain/dates';
import { color, radius, space, TOUCH, type } from './theme';

/** Datumsauswahl ohne Tippen (iOS: kompakter Kalender, Android: Dialog). */
export function DateField({ label, value, onChange, minimum, maximum }: {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  minimum?: string;
  maximum?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? parseDay(value) : maximum ? parseDay(maximum) : new Date();
  const toLocalIso = (d: Date) => toIso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));

  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[type.bodyBold, { color: color.ink, marginBottom: space.xs }]}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="inline"
          locale="de-DE"
          accentColor={color.sageDeep}
          minimumDate={minimum ? parseDay(minimum) : undefined}
          maximumDate={maximum ? parseDay(maximum) : undefined}
          onValueChange={(_e, d) => onChange(toLocalIso(d))}
        />
      ) : (
        <>
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{
              minHeight: TOUCH, borderWidth: 2, borderColor: color.line, borderRadius: radius.md,
              backgroundColor: color.surface, paddingHorizontal: space.lg, justifyContent: 'center',
            }}
          >
            <Text style={[type.body, { color: value ? color.ink : color.inkSoft, fontSize: 17 }]}>
              {value ? formatDayLong(value) : 'Datum wählen'}
            </Text>
          </Pressable>
          {open ? (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={minimum ? parseDay(minimum) : undefined}
              maximumDate={maximum ? parseDay(maximum) : undefined}
              onValueChange={(_e, d) => {
                setOpen(false);
                onChange(toLocalIso(d));
              }}
              onDismiss={() => setOpen(false)}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
