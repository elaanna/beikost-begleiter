# nimou – Beikost-App

*For every little first.* Arbeitsname der Marke: nimou (Markenrechte und Domains noch nicht abschließend geklärt). Design: [DESIGN-NIMOU.md](DESIGN-NIMOU.md).

Deutscher Beikostplaner nach den S3-Leitlinien Allergieprävention und Stilldauer.
Expo (React Native) + TypeScript, offline-first mit SQLite, Sync über Supabase (EU), Käufe über RevenueCat.

## Neue Versionen holen (ohne ZIP)

Einmalig: Projekt von GitHub holen und Pakete installieren

```bash
cd ~/Projekte            # oder ein Ordner deiner Wahl
git clone https://github.com/elaanna/beikost-begleiter.git
cd beikost-begleiter
npm install
```

Danach bei jeder neuen Version nur noch:

```bash
cd ~/Projekte/beikost-begleiter
npm run aktualisieren
```

Das holt die neueste Version, installiert nur bei Bedarf neue Pakete und startet Expo Go (QR-Code scannen).
Läuft noch ein alter Expo-Server, vorher im alten Terminal mit Strg+C beenden.

## Schnellstart

```bash
npm install
npx expo start --go     # mit Expo Go (iPhone: Kamera, Android: in Expo Go scannen)
npm test                # Planung, Dienste, Verdauung, Suche, Mengen, Reifezeichen, Abwechslung, Eisen, Trinken, Arztbericht, KI-Schutz (48 Tests)
npm run typecheck
```

Ohne `.env.local` läuft die App vollständig lokal im **Vorschau-Modus**: alle Funktionen frei, kein Sync, keine Käufe.

Für Käufe und Sync braucht es einen **Development Build** (Expo Go enthält RevenueCat nicht; vorher `npx expo install expo-dev-client`):

```bash
npx eas-cli@latest build --profile development --platform ios   # oder android
```

## Aufbau

```
src/
  app/                 Screens (Expo Router)
    (tabs)/            Heute · Woche (Plan/Einkauf/Rezepte) · Probiert (Probier-Pass) · Wissen (Sicherheit/Mengen/Leitlinien) · Familie
    suche.tsx          „Darf mein Baby …?“
    verdauung.tsx      Windel & Verdauung
    dienste.tsx        Dienstplan mit Auswahlmenü und „wie letzte Woche“
    rezept/[id].tsx    Familienrezept mit Babyportion
    onboarding.tsx     5 Schritte, eine Frage pro Schritt
    tutorial.tsx       Einführung nach dem Onboarding (erneut über Familie)
    food/[id].tsx      Lebensmittel-Detail mit Tracker
    kind.tsx           Kind anlegen/bearbeiten (mehrere Kinder)
    paywall.tsx        Beikost-Paket
  data/
    foods.ts           Lebensmittel-Datenbank, 37 Basis + 63 in foods-extra.ts = 100 (vor Launch fachlich prüfen)
    recipes.ts         12 Familienrezepte ab ca. 10 Monaten
    guidelines.ts      Leitlinien-Aussagen mit Quelle und Empfehlungsgrad
  domain/              Reine Logik, ohne React – vollständig getestet
    startWindow.ts     Startfenster aus Geburtsdatum + Milchernährung
    planner.ts         Wochenplan nach Breiplan-Schema
    shopping.ts        Einkaufs- und Vorkochliste
    pdf.ts             Wochenplan und Notfallblatt als HTML für PDF
    digestion.ts       Verdauungs-Tracker: Hinweise und Warnzeichen
    shifts.ts          Schichtdienst: Verfügbarkeit, Kita, wer füttert/holt ab, Lücken
    recipes.ts         Passt ein Rezept? (Allergien, schon probiert)
    askFood.ts         Schnellantwort mit Synonymen und Tabu-Liste
    portions.ts        Mengen je Mahlzeit (Gesund ins Leben)
    pass.ts            Meilensteine im Probier-Pass
  notifications/       Lokale Erinnerungen an Mahlzeiten (7 Tage voraus, Expo Go kompatibel)
  db/                  SQLite-Schema und Abfragen (offline-first)
  sync/                Supabase-Client und Sync (Upload dirty rows, Pull per Cursor)
  purchases/           RevenueCat
supabase/migrations/   Datenbankschema mit Row Level Security
tests/                 node:test für die Planungslogik
```

## Wie der Plan entsteht

1. **Startfenster** (`startWindow.ts`): Beginn 5. bis Beginn 7. Lebensmonat (S3 Allergieprävention).
   Bei gestillten Kindern schlägt die App den vollendeten 6. Monat vor (S3 Stilldauer 2026) und erklärt den Unterschied.
2. **Einführung** (`planner.ts`): Allergene 3 Tage hintereinander und nie zwei neue gleichzeitig (ASCIA 2024),
   andere Lebensmittel 2 Tage. Eine feste 3–5-Tage-Wartezeit ist nicht belegt (Samady et al., JAMA Netw Open 2020)
   und steht nicht in den deutschen Empfehlungen.
   Danach Allergene etwa 2× pro Woche (ASCIA), Fisch 1–2× pro Woche (Gesund ins Leben 2024). Meilensteine nach Breiplan:
   Woche 1 Gemüse, dann Kartoffel und Öl, ab Woche 3 Fleisch, Ei ab Woche 4, Abendbrei nach ca. 1 Monat,
   Nachmittagsbrei nach ca. 2 Monaten.
3. **Allergene**: Nicht vorbeugend gemieden (S3, Empfehlung A). Ei durcherhitzt und danach wöchentlich.
   Erdnuss bei mittelschwerer bis schwerer Neurodermitis erst nach ärztlicher Abklärung (S3, Empfehlung A).
4. **Sicherheit**: Ärztlich bekannte Allergien und ausgeschlossene Lebensmittel erscheinen nie im Plan.
   Nach einer notierten Reaktion wird das Lebensmittel pausiert. Bei „Atmung/Schwellung“ erscheint der Notruf-Hinweis 112.
5. **Reifezeichen-Check** (`reifecheck.tsx`, `readiness.ts`): vier Fragen (sitzen, greifen, schlucken, Interesse) nach NHS und AAP.
   Ergebnis: bereit, bald, zu früh (unter 4 Monaten) oder ärztlich abklären (ab 6 Monaten ohne alle Zeichen).
6. **Allergen-Guide** (`AllergenGuide.tsx`, `data/allergens.ts`): acht Allergen-Gruppen als Wisch-Karten mit Status aus
   Plan und Protokoll, Erklärungen darunter, plus Übersicht. Quellen: S3, ASCIA 2024, Gesund ins Leben, NHS, SCHN.

## Supabase einrichten

1. Projekt in Region **Frankfurt (eu-central-1)** anlegen.
2. Authentication → Providers → **Anonymous sign-ins** aktivieren (Sync ohne Pflicht-Konto).
3. Alle Dateien in `supabase/migrations/` der Reihe nach ausführen (SQL-Editor oder `supabase db push`). Die dritte härtet Rechte und Einladungen, die vierte bringt Vorrat, getauschte Mahlzeiten und das KI-Kontingent, die fünfte die serverseitige Kaufprüfung, die sechste die Kleinkind-Phase – siehe `SICHERHEIT.md`.
   Tests der Regeln gegen ein lokales PostgreSQL: `supabase/tests/run.sh`.
4. URL und Publishable Key in `.env.local` eintragen (Vorlage: `.env.example`).
5. **Konto per E-Mail** (Pflicht beim Start, ohne Passwort; die Cloud-Sicherung der Einträge ist ein eigener, freiwilliger Schritt. Ohne Supabase-Zugangsdaten zeigt die Startseite „Ohne Konto weiter“ für Tests): Authentication → Providers → Email aktiv, „Confirm email“ an.
   Unter Email Templates in „Magic Link“ **und** „Change Email Address“ den Code einbauen: `{{ .Token }}`
   (die App arbeitet mit Codes statt Links). Für den Versand eigenen SMTP-Server eintragen (der eingebaute ist stark begrenzt).
6. **Kaufprüfung**: `supabase functions deploy revenuecat-webhook --no-verify-jwt` und `supabase functions deploy kauf-abgleich`,
   dann `supabase secrets set REVENUECAT_WEBHOOK_SECRET=<mind. 24 Zeichen Zufall> REVENUECAT_SECRET_KEY=<sk_…>`.
   In RevenueCat → Integrations → Webhooks die URL `…/functions/v1/revenuecat-webhook` mit Header `Authorization: Bearer <Geheimnis>` eintragen.
   Zum Testen ohne RevenueCat: `update app_config set value = 'false' where key = 'require_entitlement';` (vor dem Launch wieder `true`).

Familienmodell: Jede Installation erzeugt lokal eine Familien-ID. Daten gehen erst in die Cloud, wenn die Freigabe startet.
„Einladungscode erstellen“ erzeugt einen 10-stelligen Einmal-Code (48 h gültig), mit Rolle „darf mit eintragen“ oder „nur lesen“ (z. B. Kita).
Row Level Security erlaubt Zugriff nur für Mitglieder; Schreiben nur für owner/member.
Konflikte löst der Server per Last-Write-Wins (`lww_guard`).

## RevenueCat einrichten

- Entitlement: `beikost_paket`
- App Store: `beikost_paket_12m` als **Non-Renewing Subscription** (12 Monate in RevenueCat hinterlegen),
  optional `beikost_monat` als Auto-Renewable.
- Google Play: Prepaid-Plan 12 Monate, optional Monatsabo.
- Beide Produkte in das Current Offering, öffentliche SDK-Keys in `.env.local`.
- Der Kauf gilt **pro Familie**: Die App meldet sich mit der Familien-ID als App User ID an. Wer per Code beitritt, wechselt auf die
  Familien-ID und hat damit denselben Zugang. Der Server prüft beim Einladen selbst (Webhook → Tabelle `entitlements`).

Kostenlos: Lebensmittel-Datenbank, Tracker inklusive Reaktionen, aktuelle Woche, Notfallblatt.
Beikost-Paket: weitere Wochen, Einkauf/Vorkochen, Familienfreigabe, Geschwister, PDF-Wochenplan.

## KI-Rezeptsuche (optional)

„Was habe ich da?“ funktioniert ohne KI (regelbasiert). Der optionale KI-Vorschlag läuft über die Edge Function
`supabase/functions/rezept-assistent`:

1. `supabase secrets set ANTHROPIC_API_KEY=… ` (optional `ANTHROPIC_MODEL`, `AI_DAILY_LIMIT`, Standard 30/Tag)
2. `supabase functions deploy rezept-assistent`
3. In `.env.local`: `EXPO_PUBLIC_AI_ENABLED=1`

Die KI wählt nur IDs aus geprüften Rezepten und Begründungen aus einer festen Liste; es wird kein KI-Text angezeigt.
Medizinische Anfragen werden in App und Server abgefangen (`src/ai/guard.ts`, Kopie im Function-Ordner, Test prüft Gleichheit).

## Zweckbestimmung & Konzept

Abgleich mit dem Projektkonzept (MDR-Abgrenzung, Datensparsamkeit): [KONZEPT-ABGLEICH.md](KONZEPT-ABGLEICH.md).

## Datenschutz & Sicherheit

Prüfbericht, behobene Lücken und offene Launch-Aufgaben: [SICHERHEIT.md](SICHERHEIT.md).

## Vor dem Launch offen

- [ ] Lebensmitteltexte und Hinweise von einer Fachperson prüfen lassen
- [x] Kaufprüfung serverseitig, Kauf pro Familie
- [x] Konto per E-Mail für Geräte-Wechsel
- [x] Eigenes App-Icon und Startbild (Quelle: `assets/icon-quelle.svg`)
- [x] Ausdrückliche Einwilligung für Gesundheitsdaten (Art. 9 DSGVO) im Onboarding, mit Datum gespeichert – Text anwaltlich prüfen lassen
- [ ] Haftungs- und Medizinprodukte-Einordnung rechtlich prüfen lassen
