/**
 * Gestaltung „warm & verspielt“: Creme als Grund, Salbei für Aktionen und Navigation,
 * Pfirsich für das neue Lebensmittel, Rot ausschließlich für wichtige Sicherheitshinweise.
 * Runde Formen, große Tippflächen (oft einhändig mit Baby auf dem Arm).
 */
export const color = {
  creme: '#FFF6EC',
  surface: '#FFFFFF',
  ink: '#3D2E2A',
  inkSoft: '#7B6A63',
  line: '#F0E2D4',

  sage: '#9CBF9B',
  sageSoft: '#E6F1E3',
  sageDeep: '#3F6B4B',

  peach: '#F59E7A',
  peachSoft: '#FFE6D8',
  peachDeep: '#B5532E',

  butter: '#FFF0C2',

  red: '#C93636',
  redSoft: '#FDE8E6',
  redDeep: '#9E2424',
};

export const font = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Nunito_400Regular',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 12, md: 20, lg: 28, pill: 999 };

export const type = {
  hero: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: font.displayMedium, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyBold: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: font.bodyBold, fontSize: 14, lineHeight: 20 },
};

/** Mindestgröße für Tippflächen. */
export const TOUCH = 52;
