/**
 * Design-Tokens nach NIMOU Brand Guidelines V1.0 („Bold & Playful“).
 *
 * Farbverteilung: 60 % neutrale Flächen (milk, surface), 30 % Akzente (yellow, lilac, peach), 10 % Signature Blue.
 * Blau: Logo, Headlines, primäre Aktionen · Gelb: Highlights · Lilac: Wissen · Peach: Rezepte · Milk: Hintergrund.
 * Statusfarben (success, error, warning) nur semantisch. Rot (error) bleibt ausschließlich wichtigen Sicherheitshinweisen vorbehalten.
 *
 * Die alten Namen (creme, sage, peach, butter, red …) sind Aliase auf die Markenfarben, damit alle Screens
 * zentral mitziehen. Neue Screens nutzen die Markennamen (brand.*).
 */
export const brand = {
  blue: '#313D8E',
  blueHover: '#263174',
  yellow: '#FFDE7A',
  lilac: '#D8CFF3',
  peach: '#F8A78C',
  milk: '#F8F6EE',
  surface: '#FFFFFF',
  text: '#20213D',
  textSecondary: '#66677A',
  border: '#E6E2DA',
  success: '#287A50',
  successBg: '#E4F2E8',
  error: '#B93838',
  errorBg: '#FBE8E8',
  warning: '#936000',
  warningBg: '#FFF1CC',
  disabled: '#B8B8C5',
  // Abgeleitete helle Töne für Flächen (aus der Palette aufgehellt)
  yellowSoft: '#FFF3CC',
  lilacSoft: '#EEEAFA',
  peachSoft: '#FDE4DA',
  blueSoft: '#E8EAF6',
};

export const color = {
  creme: brand.milk,
  surface: brand.surface,
  ink: brand.text,
  inkSoft: brand.textSecondary,
  line: brand.border,

  // früher Salbei = primäre Aktion → jetzt Signature Blue
  sage: brand.blue,
  sageSoft: brand.blueSoft,
  sageDeep: brand.blue,

  // Pfirsich bleibt Pfirsich (Rezepte, neues Lebensmittel); dunkler Ton für lesbaren Text auf hellem Pfirsich
  peach: brand.peach,
  peachSoft: brand.peachSoft,
  peachDeep: '#A0452A',

  // Hinweisflächen → Gelb der Marke
  butter: brand.yellowSoft,

  red: brand.error,
  redSoft: brand.errorBg,
  redDeep: '#8E2A2A',
};

export const font = {
  display: 'Baloo2_800ExtraBold',
  displayBold: 'Baloo2_700Bold',
  displayMedium: 'Baloo2_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_600SemiBold',
  bodyHeavy: 'Inter_600SemiBold',
};

/** 4-px-Raster. Seitenabstand mobil 20 px (screenX). */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, screenX: 20 };

/** Input 14 · Karte 20 · Hero 28 · Buttons pill. */
export const radius = { sm: 14, md: 20, lg: 20, hero: 28, pill: 999 };

/** Typo-Skala laut Guidelines (px/Gewicht), Zeilenhöhe 1.2 für Headlines, 1.5 für Text. */
export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 48, color: brand.blue },
  hero: { fontFamily: font.displayBold, fontSize: 32, lineHeight: 38 },          // H1 32/700
  title: { fontFamily: font.displayBold, fontSize: 26, lineHeight: 31 },         // H2 26/700
  heading: { fontFamily: font.displayMedium, fontSize: 22, lineHeight: 26 },     // H3 22/600
  cardTitle: { fontFamily: font.displayMedium, fontSize: 18, lineHeight: 22 },   // Karten 18/600
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },                 // Body 16/400
  bodyBold: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 24 },         // Button 16/600
  small: { fontFamily: font.body, fontSize: 14, lineHeight: 21 },                // Small 14/400
  smallBold: { fontFamily: font.bodyBold, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: font.bodyMedium, fontSize: 12, lineHeight: 18 },        // Caption/Navigation 12/500
};

/** Mindestgröße für Tippflächen (Buttons 52 px, Touch mindestens 44 × 44). */
export const TOUCH = 52;

/** Lucide-Icons: 24 px, Strichstärke 1.75. */
export const ICON = { size: 24, stroke: 1.75 };
