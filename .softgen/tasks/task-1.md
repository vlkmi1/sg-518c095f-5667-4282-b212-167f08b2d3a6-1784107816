---
title: Systém autentizace a profily
status: done
priority: urgent
type: feature
tags: [auth, supabase, profile]
created_by: agent
created_at: 2026-04-18T14:02:46Z
position: 1
---

## Notes
Implementace registrace, přihlášení a správy profilů. Uživatelé se mohou přihlásit nickem nebo emailem. Každý profil má unikátní nickname.

## Checklist
- [x] Databázové tabulky (profiles, RLS polícy)
- [x] Auto-create profile trigger
- [x] AuthService: registrace s nickem, přihlášení (nick/email), odhlášení
- [x] ProfileService: CRUD operace pro profily
- [x] Komponenty: LoginForm, RegisterForm, ProfileView
- [x] Stránka /auth/login a /auth/register
- [x] Protected route wrapper pro přihlášené oblasti