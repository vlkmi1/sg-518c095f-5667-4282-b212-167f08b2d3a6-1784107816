---
title: Systém trofejí
status: in_progress
priority: high
type: feature
tags: [trofeje, automatizace, notifikace]
created_by: agent
created_at: 2026-04-22
position: 6
---

## Notes
Automatický systém trofejí vyhodnocující úspěchy rybářů na konci každého týdne, měsíce a roku. Trofeje se získávají za 1. místo v síni slávy pro jednotlivé druhy ryb. Uživatel po přihlášení vidí notifikaci o nových trofejích.

## Checklist
- [ ] Databázová tabulka `trophies` (id, user_id, fish_species, period_type, period_end_date, weight_kg, length_cm, position, created_at)
- [ ] Databázová tabulka `trophy_notifications` (id, user_id, trophy_id, is_read, created_at)
- [ ] RLS politiky pro obě tabulky
- [ ] Edge Function `award-trophies` pro automatické vyhodnocování (cron job)
- [ ] Service `trophyService.ts` pro práci s trofejemi
- [ ] Komponenta `TrophyNotifications.tsx` pro zobrazení notifikací
- [ ] Zobrazení trofejí v `ProfileView.tsx`
- [ ] Aktualizace `Header.tsx` s ikonou notifikací

## Acceptance
- Uživatel vidí notifikaci po získání nové trofeje
- V profilu se zobrazuje seznam všech získaných trofejí
- Edge Function správně vyhodnocuje trofeje na konci období