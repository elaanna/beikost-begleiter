import { Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { brand, font } from './theme';
import { t } from '@/i18n';

/**
 * Vorläufige Wortmarke „nimou“ mit gelben Sonnenstrahlen – nachgebaut aus dem Mockup der Brand Guidelines.
 * Kein finales Logo: Sobald nimou-logo-primary.svg vorliegt, hier ersetzen (eine Stelle für die ganze App).
 */
export function Wordmark({ size = 28, claim = false, color = brand.blue }: { size?: number; claim?: boolean; color?: string }) {
  const rays = size * 0.55;
  return (
    <View accessibilityRole="header" accessibilityLabel={claim ? t('nimou – For every little first.') : t('nimou')} style={{ alignItems: claim ? 'center' : 'flex-start' }}>
      <View>
        <Text style={{ fontFamily: font.display, fontSize: size, lineHeight: size * 1.15, color, letterSpacing: -0.5 }}>{t('nimou')}</Text>
        {/* Sonnenstrahlen über dem „ou“ */}
        <Svg width={rays} height={rays * 0.6} viewBox="0 0 100 60" style={{ position: 'absolute', right: -size * 0.12, top: -rays * 0.32 }}>
          {[[18, 52, 6, 30], [38, 44, 32, 10], [62, 44, 68, 10], [82, 52, 94, 30]].map(([x1, y1, x2, y2], k) => (
            <Line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={brand.yellow} strokeWidth={13} strokeLinecap="round" />
          ))}
        </Svg>
      </View>
      {claim ? (
        <Text style={{ fontFamily: font.bodyMedium, fontSize: Math.max(11, size * 0.22), letterSpacing: 2.4, color, marginTop: size * 0.1 }}>
          {t('FOR EVERY LITTLE FIRST.')}</Text>
      ) : null}
    </View>
  );
}
