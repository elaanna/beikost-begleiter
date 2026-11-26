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
| 6. Home als Referenzscreen | ✅ freigegeben (26.11.2026) |
| 7. Weitere Screens übertragen | ✅ (siehe Nachtrag) |
| 8. Responsive-, Accessibility-, Regressionstests | ⏳ teilweise: Web-Durchlauf 390 px ohne Fehler, 73 Tests grün, Kontraste berechnet (unten); Screenreader-/Textvergrößerungstest auf Geräten offen |
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
| App-Name | nimou (Arbeitsname) | App heißt „nimou“ (`app.json`); Bundle-ID `de.beikostbegleiter.app` und Slug unverändert | Entscheidung 26.11.: nimou. Markenrechte/Domains vor Store-Veröffentlichung klären; Bundle-ID vor dem ersten Store-Upload festlegen (danach nicht mehr änderbar) |
| Statusfarbe Erfolg | success #287A50 nur semantisch | „✓ erledigt“ noch überwiegend in Blau | Schritt 7 |

## Offen für Schritt 7 (nach Freigabe des Home-Screens)

1. Alle Screens einzeln übertragen: Woche, Rezepte, Lebensmittel, Steckbrief, Wissen, Familie, Onboarding, Startseite, Konto, Scanner, Übersicht.
2. Emojis in Bedienelementen durch Lucide ersetzen (Lebensmittel-Emojis bleiben bis Fotos lizenziert sind).
3. Wording nach Kommunikationsleitlinie prüfen („Eure Beikostreise“, „Lebensmittel entdeckt“, „Jedes Kind hat sein eigenes Tempo“);
   insbesondere Probier-Pass „0 von 100“ und Meilensteine auf Leistungsdruck prüfen.
4. Statusfarben semantisch (success/warning) statt Blau.
5. WCAG 2.2 AA: Kontraste messen (v. a. Text auf Gelb/Peach), Fokus sichtbar, Screenreader-Labels, Textvergrößerung, Reduced Motion.
6. Finale Assets laut Checkliste einsetzen (Logo-Varianten, Symbol, App-Icon, Maskable, Favicon, Apple-Touch-Icon).

## Nachtrag 26.11.2026 – Schritt 7 und Entscheidungen

Entscheidungen: Home freigegeben · App-Name „nimou“ · Lebensmittel-Bereich ohne Leistungsdruck.

- **Lebensmittel**: kein „0 von 100“, kein Fortschrittsbalken, keine Zähler bei Meilensteinen. Stattdessen „5 Lebensmittel entdeckt –
  jedes Kind hat sein eigenes Tempo“, Erinnerungen nur für Erreichtes, Filter „Entdeckt / Noch zu entdecken“, je Kategorie „4 entdeckt“.
  Reiter heißt „Entdecken“ (passte als „Lebensmittel“ nicht ungekürzt in 390 px; Begriff aus dem Navigationsvorschlag der Guidelines).
- **Icons**: Bedienelemente mit Lucide (24 px / 1.75) statt Emojis – Buttons, Listen, Menü, Kacheln, Links („Tauschen“, „Wie viel?“,
  „Mengen & Zubereitung“), Wochenpfeile, Startseite. Lebensmittel- und Illustrations-Emojis bleiben bis lizenzierte Bilder vorliegen.
- **Farben nach Rolle**: Jetzt-dran- und Neu-Karten Gelb (Highlight), Wissen-Karten Lilac, Rezepte Peach, Statusfarben semantisch
  (Schon probiert, Scanner „Sieht gut aus“ = success; „Mit Bedacht“ = warning; Rot nur für Sicherheitshinweise).
- **Name**: „nimou“ in App, Datenexport und PDF-Berichten; PDFs in Markenfarben.

### Kontraste (WCAG 2.2 AA, berechnet)

| Paar | Verhältnis |
|---|---|
| Text auf Milk | 14,4 : 1 |
| Zweittext auf Milk / Weiß | 5,1 / 5,6 : 1 |
| Weiß auf Blau (Button) | 9,6 : 1 |
| Text / Blau auf Gelb | 11,9 / 7,3 : 1 |
| „Neu“ (peachDeep) auf Gelb | 4,7 : 1 |
| Zweittext auf Gelb | 4,2 : 1 → **nicht** verwendet; in gelben Karten steht Zweittext in voller Textfarbe |
| Fehler / Erfolg / Warnung auf eigenem Hintergrund | 4,8 / 4,6 / 4,8 : 1 |
