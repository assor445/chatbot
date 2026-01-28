```markdown
---
name: supabase-auth
description: Standar keamanan dan autentikasi menggunakan Supabase. Gunakan ini saat menyentuh logic login, middleware, atau database.
---

# Supabase Auth Standards

Gunakan library `@supabase/ssr` untuk Next.js App Router. JANGAN gunakan library legacy auth-helpers.

## 1. Klien Supabase
- **Browser Client:** Gunakan `createBrowserClient` hanya di komponen yang ada `"use client"`.
- **Server Client:** Gunakan `createServerClient` di Server Components, Route Handlers, dan Server Actions.
- **Middleware:** Gunakan client khusus middleware untuk refresh session.

## 2. Row Level Security (RLS)
- Asumsikan semua tabel di database memiliki RLS aktif.
- Selalu masukkan `user_id` saat melakukan insert data:
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { error } = await supabase.from('chats').insert({
    user_id: user.id,
    content: "...",
  });