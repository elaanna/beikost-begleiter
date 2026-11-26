# Datenschutz- und Sicherheitsprüfung

Stand: 26.11.2026. Geprüft wurden App-Code, Supabase-Migrationen, Sync, lokale Speicherung, Einwilligung, Löschen und Export.
Die Datenbank-Regeln wurden gegen ein echtes PostgreSQL 16 getestet (`supabase/tests/run.sh`).

## Gefundene Lücken und Behebung

| # | Schwere | Befund | Behebung |
|---|---|---|---|
| 1 | **Kritisch** | `create_family(fid)` machte jeden zum **Owner** einer bestehenden Familie, der deren ID kannte – z. B. ein ausgetretenes oder entferntes Mitglied (im Test nachgestellt: Leser → Owner). | Funktion legt nur neue Familien an; bei bestehender ID Fehler „family exists“. Migration `20261127000000_sicherheit.sql`. |
| 2 | **Kritisch (DSGVO)** | Sobald Supabase konfiguriert war, wurden **alle Daten automatisch in die Cloud** geladen – auch ohne Familienfreigabe. Widerspricht Einwilligungstext und Datenschutzhinweis. | Sync läuft nur noch bei aktiver Freigabe (`meta.sharing = 1`, gesetzt erst beim Einladen/Beitreten). |
| 3 | Hoch | Einladungscodes: 6 Hex-Zeichen (~24 Bit), 7 Tage gültig, **mehrfach verwendbar**, keine Begrenzung von Fehlversuchen. | 10 Zeichen aus 31 Zeichen (~49 Bit), einmalig, 48 h gültig, max. 10 offene Codes, max. 10 Fehlversuche pro Stunde und Konto. |
| 4 | Hoch | Kein Weg, Mitglieder zu **entfernen** oder Codes zu **widerrufen**. | Owner kann Mitglieder entfernen, Codes widerrufen, Familie löschen (UI unter Familie → Gemeinsam planen). |
| 5 | Hoch (DSGVO) | **Kein Löschen** (Art. 17) und kein Widerruf der Einwilligung möglich; weich gelöschte Zeilen blieben für immer. | „Alle Daten löschen“ löscht Gerät + Cloud-Konto (`delete_my_account`), Familie geht an nächstes Mitglied über oder wird gelöscht. `purge_deleted()` entfernt Gelöschtes nach 30 Tagen (per pg_cron einplanen). |
| 6 | Mittel (DSGVO) | **Kein Export** (Art. 15/20). | „Meine Daten exportieren (JSON)“ unter Datenschutz. |
| 7 | Mittel | Einträge konnten auf ein **Kind einer fremden Familie** zeigen (nur `family_id` geprüft). | Zusammengesetzte Fremdschlüssel (Kind/Person muss zur selben Familie gehören). |
| 8 | Mittel | Zeitstempel aus der Zukunft (`updated_at = 2099`) **sperrten Zeilen** dauerhaft gegen Änderungen anderer. | `lww_guard` kappt auf „jetzt“; `search_path` fest gesetzt. |
| 9 | Mittel | Leser-Geräte versuchten eigene Daten hochzuladen (Endlos-Fehler im Sync). | `join_family` liefert die Rolle; Leser laden nichts hoch. |
| 10 | Niedrig | Keine Längen-/Formatgrenzen (Notiz, Namen, JSON). | CHECK-Constraints in der DB, `maxLength` in den Eingabefeldern. |
| 11 | Niedrig | Rolle `anon` hatte Standardrechte auf Tabellen/Funktionen (durch RLS abgefangen, aber unnötig). | Rechte für `anon` entzogen. |
| 12 | Niedrig (DSGVO) | Einwilligung wurde nicht nachweisbar gespeichert. | Datum + Textversion in `meta.consent_health`; Anzeige unter Datenschutz. |
| 13 | Niedrig | Android-Backup hätte die lokale DB inkl. Sitzung in Google-Backups kopiert. | `android.allowBackup: false` in `app.json`. |
| 14 | Info | Datenschutzhinweis unvollständig (Rechtsgrundlagen, Speicherdauer, Rechte, Drittland). | Seite „Datenschutz, Impressum & Hinweis“ ergänzt. |

## Ergebnis der Datenbank-Tests (`supabase/tests/run.sh`)

Fremder mit Familien-ID → „family exists“ · Fremder liest 0 Kinder · Leser liest, darf aber nicht schreiben (RLS) ·
ausgetretener Leser wird nicht Owner und sieht 0 · Code zweimal → ungültig · 11. Fehlversuch → gesperrt ·
Log auf fremdes Kind → Fremdschlüssel-Fehler · Zukunftszeitstempel gekappt · zu lange Notiz abgelehnt ·
entferntes Mitglied sieht 0 · `anon` → permission denied · Konto löschen → Familie, Kinder, Logs, Nutzer = 0 ·
Beitritt mit eigenen Daten → Kind und Log landen korrekt in der neuen Familie.

## Vor dem Launch noch zu erledigen (nicht im Code lösbar)

1. **Supabase-Dashboard**: Region Frankfurt · Auth → Rate Limits für anonyme Anmeldungen senken · CAPTCHA (Turnstile/hCaptcha) für anonyme Anmeldungen aktivieren · `purge_deleted` per pg_cron täglich einplanen · Security Advisor ohne Warnungen.
2. **Auftragsverarbeitung (Art. 28)**: AVV/DPA mit Supabase und RevenueCat abschließen; Drittlandtransfer RevenueCat (USA) prüfen (DPF-Zertifizierung bzw. SCC) und im Datenschutzhinweis eintragen.
3. **Datenschutz-Folgenabschätzung (Art. 35)**: Gesundheitsdaten von Kindern → DSFA durchführen bzw. begründet dokumentieren, warum keine nötig ist.
4. **Verzeichnis der Verarbeitungstätigkeiten (Art. 30)** und TOM-Dokumentation anlegen.
5. **Impressum/Datenschutz**: Platzhalter in `src/app/rechtliches.tsx` ersetzen, anwaltlich prüfen lassen.
6. **Kaufprüfung serverseitig**: Das Beikost-Paket wird nur in der App geprüft. Wer die App manipuliert, könnte die Familienfreigabe ohne Kauf nutzen. Abhilfe: RevenueCat-Webhook → Tabelle `entitlements` → Prüfung in `create_invite`.
7. **Vorschau-Modus**: Ohne RevenueCat-Schlüssel ist alles freigeschaltet. Produktions-Build nur mit Schlüsseln bauen (EAS-Secrets).
8. **Lokale Datenbank** ist nicht zusätzlich verschlüsselt; sie liegt in der App-Sandbox und ist durch die Geräteverschlüsselung (iOS Data Protection, Android FBE) geschützt. Für mehr Schutz: SQLCipher (`expo-sqlite` mit `useSQLCipher`, erfordert Development Build).
9. **Erinnerungen** zeigen den Lebensmittelnamen auf dem Sperrbildschirm – ggf. Option „Details ausblenden“ ergänzen.
10. **Abhängigkeiten**: `npm audit` meldet 3 mittlere Lücken in `minimatch` über `@expo/fingerprint` – nur Build-Werkzeug, nicht in der App enthalten. Bei nächstem Expo-Update erneut prüfen.
11. **Penetrationstest** der Supabase-API vor dem Launch (z. B. mit zwei Testkonten alle Tabellen per REST durchprobieren).

## Nachtrag: Version 4 (Vorrat, Tausch, KI-Rezeptsuche)

- Neue Tabellen `stock_items` und `plan_swaps` mit denselben Regeln: RLS, Fremdschlüssel auf Kind derselben Familie, Formatprüfung der ID, Längenlimits, LWW, `purge_deleted`.
- KI-Rezeptsuche (`supabase/functions/rezept-assistent`): nur angemeldete Nutzer, Tageskontingent (`take_ai_quota`, speichert nur Zeitpunkte),
  strenge Eingabeprüfung, medizinische Anfragen werden ohne Modellaufruf abgewiesen, Modell darf nur IDs aus übergebenen geprüften Rezepten
  und Begründungen aus fester Liste zurückgeben; App prüft die Antwort erneut; kein KI-Text wird angezeigt; keine Kinderdaten.
  Prompt-Injection: Nutzereingaben werden bereinigt und als Daten markiert; selbst bei erfolgreicher Injection kann das Modell nur
  zwischen geprüften Rezepten wählen.
- Tests: `supabase/tests/run.sh` (V1–V4) und `tests/care.test.ts` (KI-Schutz).
- Offen: AVV mit Anthropic, Drittlandtransfer USA prüfen, API-Schlüssel nur als Supabase-Secret.
