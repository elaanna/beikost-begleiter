# NIMOU-Design – Umsetzungsstand

Grundlage: *NIMOU Brand Guidelines V1.0 – Konzept 02 „Bold & Playful“* (Arbeitsstand zur Entwicklerübergabe).
Vorgehen nach Kapitel „Implementierung und Abnahme“. Keine Änderungen an Backend, Auth, Datenbank oder Geschäftslogik;
keine Funktionen entfernt, keine neuen fachlichen Funktionen aus dem Mockup abgeleitet.

## Stand

| Schritt | Status |
|---|---|
| 1. Architektur, Screens, Komponenten analysiert | ✅ (siehe unten) |
| 2. Abweichungen und betroffene Dateien dokumentiert | ✅ |
| 3. Plan zur Freigabe | ✅ dieses Dokument |
| 4. Tokens und Theme zentral | ✅ `src/ui/theme.ts` |
| 5. Komponenten vereinheitlicht (Basis) | ✅ `src/ui/components.tsx`, Navigation, Menü |
| 6. Home als Referenzscreen | ✅ `src/app/(tabs)/heute.tsx` – **wartet auf Freigabe** |
| 7. Weitere Screens übertragen | ⏳ nach Freigabe |
| 8. Responsive-, Accessibility-, Regressionstests | ⏳ teilweise (Web-Durchlauf 390 px ohne Fehler, 73 Tests grün) |
| 9. Übergabe | ⏳ |

## Was zentral umgestellt ist (wirkt in allen Screens)

- **Farben** (`theme.ts`): Markenpalette als `brand.*`. Die alten Namen (`creme`, `sage`, `peach`, `butter`, `red` …) zeigen
  auf die Markenfarben, damit alle Screens ohne Einzelumbau mitziehen: Milk-Hintergrund, Signature Blue für primäre Aktionen
  und Headlines, Peach bleibt Peach, Hinweisflächen in hellem Gelb, Rot = `error` nur für Sicherheitshinweise.
  Helle Flächentöne (yellowSoft, lilacSoft, peachSoft, blueSoft) sind aus der Palette aufgehellt – bitte im Design gegenprüfen.
- **Typografie**: Baloo 2 (Headlines) und Inter (UI/Text), lokal eingebunden über `@expo-google-fonts` (SIL Open Font License,
  Lizenztext liegt im jeweiligen Paket unter `node_modules/@expo-google-fonts/*/LICENSE_FONT`). Skala nach Guidelines:
  H1 32/700, H2 26/700, Karten 18/600, Body 16/400, Small 14/400, Button 16/600, Navigation 12/500.
- **Layout**: Seitenabstand 20 px, Kartenradius 20, Hero 28, Input 14, Buttons pill 52 px, Touch ≥ 44 px.
- **Icons**: Lucide 24 px / 1.75 in Navigation, Menü, Suche und Home-Kacheln (`lucide-react-native`, nutzt `react-native-svg`, in Expo Go enthalten).
- **Wortmarke**: vorläufig nachgebaut (`src/ui/Wordmark.tsx`) – Baloo 2 Extrabold + gelbe Strahlen. Kein finales Logo;
  sobald `nimou-logo-primary.svg` vorliegt, an dieser einen Stelle ersetzen.
- **App-Icon/Startbild**: Übergangsversion in Markenfarben (Schale mit Sonnenstrahlen), Quelle `assets/icon-quelle.svg`.

## Referenzscreen Home („Heute“)

Header mit Wortmarke und Menü · Begrüßung (H1 in Blau) · Satz des Tages · Suche „Darf … schon?“ ·
**gelbe Hero-Karte** „Jetzt dran“ (Radius 28) · drei Einstiege Wochenplan (Gelb), Rezepte (Peach), Wissen (Lilac) ·
Tipp des Tages, Saison, weitere Kacheln wie bisher.

## Abweichungen vom Mockup (bewusst, zur Entscheidung)

| Thema | Guidelines/Mockup | Umsetzung | Grund |
|---|---|---|---|
| Navigation | Vorschlag Home · Entdecken · Planer · Journal · Profil (Mockup: Home · Rezepte · Planer · Wissen) | Heute · Woche · Rezepte · Lebensmittel · Wissen | „Mit vorhandener Informationsarchitektur abgleichen“ – entspricht dem Konzept-Dokument; Profil liegt im Menü (☰) |
| Journal | „selbst gewählte Entdeckungen ohne Leistungsdruck“ | nicht gebaut | keine neuen Funktionen aus dem Mockup ableiten |
| Avatar im Header | Profilfoto | Menü-Knopf (☰) | App speichert bewusst keine Fotos |
| Food-Fotografie | editorial, lizenziert | weiterhin Emojis | Bildrechte/lizenzierte Bilder stehen aus |
| App-Name | nimou (Arbeitsname) | Wortmarke in der App, Store-Name weiter „Beikost-Begleiter“ (`app.json`) | Markenrechte und Domains nicht geklärt |
| Statusfarbe Erfolg | success #287A50 nur semantisch | „✓ erledigt“ noch überwiegend in Blau | Schritt 7 |

## Offen für Schritt 7 (nach Freigabe des Home-Screens)

1. Alle Screens einzeln übertragen: Woche, Rezepte, Lebensmittel, Steckbrief, Wissen, Familie, Onboarding, Startseite, Konto, Scanner, Übersicht.
2. Emojis in Bedienelementen durch Lucide ersetzen (Lebensmittel-Emojis bleiben bis Fotos lizenziert sind).
3. Wording nach Kommunikationsleitlinie prüfen („Eure Beikostreise“, „Lebensmittel entdeckt“, „Jedes Kind hat sein eigenes Tempo“);
   insbesondere Probier-Pass „0 von 100“ und Meilensteine auf Leistungsdruck prüfen.
4. Statusfarben semantisch (success/warning) statt Blau.
5. WCAG 2.2 AA: Kontraste messen (v. a. Text auf Gelb/Peach), Fokus sichtbar, Screenreader-Labels, Textvergrößerung, Reduced Motion.
6. Finale Assets laut Checkliste einsetzen (Logo-Varianten, Symbol, App-Icon, Maskable, Favicon, Apple-Touch-Icon).
