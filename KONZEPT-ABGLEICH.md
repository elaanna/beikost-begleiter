# Abgleich mit dem Projektkonzept

Stand: 26.11.2026. Grundlage: Projektkonzept „KI-gestützte Beikost- und Familienernährungs-App“, Kap. 4, 6, 8, 10.
Leitprinzip: **Organisation statt medizinischer Beratung** – die App dokumentiert, informiert und plant, sie bewertet kein Kind.

## Vorgeschlagene Zweckbestimmung (für App-Store-Text und Rechtsprüfung)

> Die Anwendung dient der allgemeinen Wissensvermittlung, Rezeptinspiration, Organisation und Dokumentation der Beikost
> sowie des Übergangs zur Familienernährung bei gesunden, altersgerecht entwickelten Kindern. Sie unterstützt erwachsene
> Betreuungspersonen bei der Planung ihres Ernährungsalltags. Sie dient nicht der Diagnose, Prävention, Überwachung oder
> Behandlung von Erkrankungen und ersetzt keine individuelle medizinische oder ernährungstherapeutische Beratung.

## Entschärft (vorher → jetzt)

| Funktion | Vorher | Jetzt |
|---|---|---|
| Reifezeichen | Check mit Ergebnis „Dein Kind wirkt bereit“ / „sprich mit der Ärztin“ und Knopf „Heute starten“ | **Checkliste zum Beobachten** ohne Ergebnis; Hinweis „keine Einschätzung deines Kindes“ + allgemeines Zeitfenster der S3-Leitlinie |
| Allergene | Erinnerung „Allergene weitergeben, damit der Schutz bleibt“; Status „regelmäßig weitergeben“ | **„Mal wieder anbieten?“** für alle schon probierten Lebensmittel (Abwechslung); Allergen-Karten als allgemeines Wissen + Dokumentation „schon angeboten / zuletzt“ |
| Eisen | Ampel mit Zielwert (grün ab 5/7 Tagen, „wenig“) | **neutrale Übersicht** der Tage mit eisenreichen Lebensmitteln, ausdrücklich ohne Bewertung |
| Verdauung | Automatische Hinweise aus den Einträgen („Häufiger Durchfall“ in Rot) | **Tagebuch ohne Auswertung** + allgemeines Wissen und allgemeine Warnzeichen |
| Kinderdaten | Vorname und genaues Geburtsdatum | **optionaler Spitzname + Geburtsmonat** (Monatsmitte als Stellvertreter, bestehende Daten werden beim Bearbeiten reduziert) |
| Texte | „beugt Allergien vor“, „wenn dein Kind bereit ist“ | Leitlinien-Aussagen mit Quelle, keine Produktversprechen |

## Bewusst beibehalten (mit Begründung, rechtlich prüfen lassen)

- **Plan mit Einführungsregeln** (2 bzw. 3 Tage, nie zwei Neue, Allergene danach etwa 2×/Woche): allgemeine Regeln aus ASCIA/Gesund ins Leben, für alle Kinder gleich. Im Konzept unter „Personalisierte Beikostpläne – erhöhter Prüfungsbedarf“.
- **Reaktion notieren → Lebensmittel pausieren, Hinweis auf Kinderarztpraxis**: verhindert, dass der Plan nach einer Reaktion erneut anbietet (Konzept F06: keine Empfehlung zur erneuten Gabe).
- **Notruf-Hinweis 112** bei „Atmung/Schwellung“ und Erste-Hilfe-Wissen: Konzept Kap. 8 erlaubt den Notruf-Hinweis ohne Diagnose oder Entwarnung.
- **Erdnuss bei Neurodermitis vorher ärztlich abklären**: allgemeine S3-Empfehlung, aus Elternangabe.
- **Bericht für die Kinderarztpraxis**: reine Dokumentation der Elterneinträge.

## Neu nach Konzept

| Konzept | Umsetzung |
|---|---|
| F03 Rezeptbibliothek | 15 Beikost-Rezepte nach Gesund-ins-Leben-Grundrezepten + 12 Familienrezepte, 9 Kategorien, Allergene, Konsistenz, Sicherheit, Aufbewahren/Einfrieren/Auftauen |
| F02 Austausch einzelner Mahlzeiten | „Tauschen“ in Heute und Woche – nur Rezepte mit schon probierten, nicht blockierten Zutaten; Einführungstage nicht tauschbar; synchronisiert |
| F08 Meal Prep & Gefrierschrank | Vorrat & Gefrierfach: Portionen mit Datum, „1 Portion nehmen“, neutraler Hinweis nach 2 Monaten, Vorrat erscheint als „vorrätig“ auf der Einkaufsliste |
| F09 Familienessen-Konverter | Gerichtstyp + Esstufe + enthaltene Zutaten → Babyvariante aus festen Regeln (keine KI) |
| F04 KI-Rezeptassistent | „Was habe ich da?“: regelbasierte Suche; optionaler KI-Vorschlag wählt nur aus geprüften Rezepten, feste Begründungen, medizinische Anfragen werden abgefangen, Kontingent pro Nutzer |

## Offen gegenüber dem Konzept

- Fachliche Prüfung aller Rezepte, Regeln und Texte durch eine Fachkraft für Säuglingsernährung (Konzept Kap. 9).
- MDR-Abgrenzung juristisch prüfen, ggf. Statusfeststellung beim BfArM.
- EU AI Act: Rolle (Anbieter/Betreiber) und Dokumentation der KI-Funktion; Kennzeichnung ist umgesetzt („KI-Auswahl aus geprüften Rezepten“).
- AVV mit Anthropic (KI) zusätzlich zu Supabase und RevenueCat; Drittlandtransfer prüfen.
- Kühlschrank-/Zutatenlisten-Scanner (F10/F11) und KI-Wissensassistent (F13): nicht umgesetzt (Phase 3).
- Navigation laut Konzept (Heute · Wochenplan · Rezepte · Lebensmittel · Assistent) weicht ab; Rezepte liegen unter „Woche“.
