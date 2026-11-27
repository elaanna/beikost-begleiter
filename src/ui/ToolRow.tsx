import { Pressable, Text, View } from 'react-native';
import { Glyph, type IconLike } from './components';
import { brand, color, radius, space, type } from './theme';

export interface Tool {
  icon: IconLike;
  label: string;
  sub?: string;
  /** Rot hervorgehoben, z. B. Lücken im Dienstplan. */
  alert?: string;
  onPress: () => void;
}

/** Kompakte Einstiege in Werkzeuge eines Bereichs (zwei pro Zeile). */
export function ToolRow({ tools, style }: { tools: Tool[]; style?: object }) {
  if (!tools.length) return null;
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg }, style]}>
      {tools.map((tool) => (
        <Pressable
          key={tool.label}
          onPress={tool.onPress}
          accessibilityRole="button"
          accessibilityLabel={tool.sub || tool.alert ? `${tool.label}: ${tool.alert ?? tool.sub}` : tool.label}
          style={({ pressed }) => ({
            flexGrow: 1, flexBasis: '45%', minHeight: 64, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: space.sm,
            backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', gap: space.sm,
            borderWidth: tool.alert ? 2 : 0, borderColor: color.red, opacity: pressed ? 0.8 : 1,
          })}
        >
          <Glyph icon={tool.icon} size={22} color={brand.blue} />
          <View style={{ flex: 1 }}>
            <Text style={[type.smallBold, { color: color.ink }]} numberOfLines={2}>{tool.label}</Text>
            {tool.alert ? (
              <Text style={[type.caption, { color: color.red }]} numberOfLines={1}>{`! ${tool.alert}`}</Text>
            ) : tool.sub ? (
              <Text style={[type.caption, { color: color.inkSoft }]} numberOfLines={1}>{tool.sub}</Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
