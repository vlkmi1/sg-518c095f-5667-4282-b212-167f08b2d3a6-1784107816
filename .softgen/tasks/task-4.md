---
title: Nahrávání úlovků
status: done
priority: high
type: feature
tags: [upload, storage, ai, geolocation]
created_by: agent
created_at: 2026-04-18T14:02:46Z
position: 4
---

## Notes
Formulář pro přidání nového úlovku. Upload fotky s automatickou kompresí a resize. Automatická detekce GPS polohy. AI analýza druhu ryby a odhad rozměrů (placeholder pro budoucí integraci).

## Checklist
- [x] StorageService: upload do Supabase Storage, komprese obrázků
- [x] Komponenta UploadForm: formulář s drag&drop uploadem
- [x] Geolokace: automatické získání GPS souřadnic
- [x] AI placeholder: manuální výběr druhu, zadání rozměrů (AI integrace jako TODO)
- [x] Stránka /profile/add-catch: formulář pro přidání úlovku
- [x] Validace a error handling