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
- Kühlschrank-Scanner (F10) und KI-Wissensassistent (F13): nicht umgesetzt (Phase 3). Zutatenlisten-Scanner (F11) siehe Nachtrag.
- Navigation jetzt wie im Konzept: Heute · Woche · Rezepte · Lebensmittel · Wissen (statt „Assistent“, der ist Phase 3). Familie & Einstellungen im Menü (☰) oben rechts auf „Heute“.

## Nachtrag 26.11.2026 (Abend)

| Konzept | Umsetzung | Abgrenzung |
|---|---|---|
| F11 Zutatenlisten-Scanner | „Im Regal scannen“: Barcode → Open Food Facts → Einordnung nach WHO-Europa-Nährwertprofil (Zuckerzusätze, Süßstoffe, Salz, Honig < 1 Jahr, Packungsalter, Allergene vs. Profil, Zusatzstoffe) | Nur Barcode wird gesendet; Hinweis „keine Garantie für Allergenfreiheit oder Eignung, Packung prüfen“; Urteil sprachlich weich („Sieht gut aus / Mit Bedacht / Lieber nicht für …“) |
| Nährwertübersichten (erhöhter Prüfungsbedarf) | „Mias Beikost“: Plan-Bausteine heute, Lebensmittelgruppen der Woche, aufklappbar grob geschätzte Nährwerte | Nur Beikost, ohne Milch; keine Zielwerte, keine Bewertung, Hinweis auf Kinderarztpraxis – juristisch mitprüfen lassen |
| F12 Wissensbibliothek | Lebensmittel-Steckbrief (Kategorie, „ab Beikost-Woche“, Saison, Status beim Kind, nummerierte Zubereitung, passende Rezepte); Tipp des Tages; Saison-Karte | – |
| F03 Rezepte | Filter nach Alter („Für Mia“, 5–6, 7–9, ab 10 Monaten) | Allgemeine Orientierung, keine individuelle Empfehlung |

## Nachtrag 26.11.2026 – Kleinkind-Phase „nimou table“ (1–3 Jahre)

| Baustein | Umsetzung | Abgrenzung |
|---|---|---|
| Übergang | Ab 12 Monaten Vorschlag auf „Heute“ („Ja, umstellen“ / „Noch Beikost“, erneut nach 30 Tagen); Schalter unter Kind bearbeiten; Feld `table_since` (lokal, Sync, Supabase-Migration 6) | Eltern entscheiden; Beikost-Daten bleiben |
| Familien-Tagesplan | 5 Mahlzeiten (Frühstück, Vormittag, Mittag, Nachmittag, Abend), Mittag aus 12 Familienrezepten im Wochenrhythmus (Fisch 1–2×, Fleisch nicht täglich), Handmaß statt Grammangaben, „Hat geschmeckt / Lieber nicht“ je Mahlzeit; Woche + Einkauf aus dem Familienplan | Orientierung nach Gesund ins Leben (Koletzko 2013) und KKH; keine Bewertung der Menge; Brei-Erinnerungen pausieren |
| Kleinkind-Rezepte | Kategorie „Kleinkind ab 1 Jahr“ mit Kinderportion („vor dem Würzen abnehmen“), Sicherheitshinweisen (Gräten, Kichererbsen, Hack/Geflügel durchgaren) | Rezepte eigene, einfache Grundrezepte – fachlich prüfen lassen |
| Kita-Brotdose | Mo–Fr aus Bekanntem (sonst Hinweis „erst zu Hause probieren“), neu mischen, Einkaufsliste, Tipps nach Verbraucherzentrale | Ausschlüsse/Allergene werden nie vorgeschlagen |
| Wählerische Esser | „Noch mal anbieten“: zuletzt Abgelehntes mit Anzahl der Angebote, ohne Zielzahl; Tipps (Eltern was/wann, Kind wie viel; kein Druck, keine Belohnung) | Hinweis auf Kinderarztpraxis bei Warnzeichen; keine Diagnose |

## Nachtrag 26.11.2026 (spät) – Ideen 5–9

| Idee | Umsetzung |
|---|---|
| Preisstruktur | Kostenlos: Tagesplan, Notieren, Entdecken, Scanner, Wissen & Sicherheit, Notfallblatt, Noch mal anbieten, Unterwegs, Journal. Paket: Planung im Voraus, Einkauf + Vorkoch-Sonntag, Vorrat, Familientisch ab 1 Jahr (Tagesplan, Kleinkind-Rezepte, Brotdose), Konverter, Familienfreigabe, Geschwister, PDF. Preis/Laufzeit für die längere Nutzung bis 3 Jahre noch offen |
| Einkaufsliste weitergeben | „Liste teilen“ (Text) in Woche → Einkauf und Brotdose; Lieferdienst-Anbindung erst mit Partner |
| Unterwegs | Packliste zum Abhaken (gespeichert), Restaurant-Tipps, „ohne Kühlung / kühl halten“ nach BfR und KKH |
| Vorkoch-Sonntag | Einfrierbare Breie passend zum Plan wählen, Portionen, geführter Ablauf (vorbereiten → kochen → abkühlen/einfrieren) mit Timern, Öl wird beim Vorkochen weggelassen, am Ende automatisch ins Gefrierfach |
| Journal „Erste Male“ | Tabelle `journal_entries` (lokal, Sync, Supabase mit RLS, im Datenexport), Vorschläge ohne Altersangaben oder Vergleich, erster Löffel automatisch aus dem Tracker |

## Nachtrag 26.11.2026 – Englisch, Etappe 1

- Sprache folgt dem Handy, Umschalter im Menü. Alle Bildschirme, Sicherheits-, Allergen- und Notfallhinweise sowie die Datenschutzseite sind übersetzt (rund 1.500 Texte).
- Noch Deutsch (Etappe 2): Lebensmittelnamen und Zubereitung, Rezepte, Tipps, PDF-Berichte inkl. Notfallblatt. Vor einem englischen Launch: Übersetzung der Gesundheitstexte fachlich gegenlesen lassen; Leitlinien bleiben die deutschen (für UK/US-Markt eigene Quellen nötig).

## Nachtrag 26.11.2026 – Englisch, Etappe 2

- Notfallblatt, Wochenplan- und Arzt-PDF, alle ~150 Lebensmittel, alle Rezepte und Tipps sind übersetzt (insgesamt rund 2.250 Texte); die Suche versteht englische Begriffe.
- Nebenbei behoben: In den PDFs standen bei „Bekannte Allergien“ die internen Kürzel (z. B. „ei, milch“) statt der Namen.
- Vor einem englischen Launch weiterhin: fachliches Gegenlesen der Gesundheitstexte, eigene Quellen für UK/US.
