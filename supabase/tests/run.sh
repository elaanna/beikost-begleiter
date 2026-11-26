#!/usr/bin/env bash
# Sicherheitstests der Datenbank-Regeln gegen ein lokales PostgreSQL (ab 15).
# Nutzung: PGHOST=… PGPORT=… PGUSER=postgres ./supabase/tests/run.sh
# Legt eine Wegwerf-Datenbank "beikost_test" an, spielt die Migrationen ein und führt die Tests aus.
# Jede Zeile mit "T…" bzw. "J…" zeigt ein Ergebnis; erwartete Fehler (RLS, family exists …) sind Absicht.
set -euo pipefail
cd "$(dirname "$0")/.."
psql -q -c "drop database if exists beikost_test" -c "create database beikost_test"
psql -q -d beikost_test -v ON_ERROR_STOP=1 -f tests/00_supabase_stub.sql $(ls migrations/*.sql | sed 's/^/-f /')
psql -q -t -d beikost_test -f tests/10_sicherheit.sql 2>&1 | grep -v '^ *$'
psql -q -t -d beikost_test -f tests/20_beitritt.sql 2>&1 | grep -v '^ *$'
psql -q -t -d beikost_test -f tests/30_kauf.sql 2>&1 | grep -v '^ *$'
