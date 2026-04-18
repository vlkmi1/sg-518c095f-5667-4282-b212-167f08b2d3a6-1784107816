---
title: Veřejná galerie úlovků
status: done
priority: high
type: feature
tags: [gallery, filtering, public]
created_by: agent
created_at: 2026-04-18T14:02:46Z
position: 2
---

## Notes
Hlavní stránka s přehledem všech úlovků. Velkoformátové fotografie v grid layoutu s možností filtrování podle lokace a druhu ryby. Každá karta zobrazuje náhled fotky, nick rybáře, druh, míry, datum a místo.

## Checklist
- [x] CatchService: načítání úlovků s filtrováním
- [x] Komponenta CatchCard: karta úlovku s foto a metadaty
- [x] Komponenta FilterBar: filtry (země, kraj, okres, druh)
- [x] Komponenta CatchGallery: grid layout s kartami
- [x] Stránka index.tsx: integrace galerie a filtrů
- [x] Responsive design (mobile-first)