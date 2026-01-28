---
name: nextjs-app-router
description: Mengandung standar koding untuk Next.js App Router, TypeScript, dan Server Components. Gunakan ini setiap kali membuat halaman atau API route baru.
---

# Next.js App Router Standards

Ikuti aturan ini saat membuat kode Next.js:

## 1. File Structure
- Gunakan folder `app/` (App Router).
- Jangan gunakan folder `pages/`.
- Gunakan format file: `page.tsx` (UI), `layout.tsx` (Wrapper), `loading.tsx` (Suspense), `route.ts` (API Backend).

## 2. Server vs Client Components
- **Default:** Selalu buat komponen sebagai Server Component (tanpa `"use client"`).
- **Client:** Hanya tambahkan `"use client"` di baris paling atas JIKA komponen membutuhkan interaksi (onClick, onChange, hooks seperti useState/useEffect).

## 3. Data Fetching
- Fetch data langsung di dalam Server Component (async/await).
- Jangan gunakan `useEffect` untuk fetch data awal.

## 4. API Routes
- Selalu gunakan `NextResponse` dari `next/server`.
- Struktur Route Handler:
  ```typescript
  import { NextResponse } from 'next/server';
  export async function POST(request: Request) {
    // Logic here
    return NextResponse.json({ success: true });
  }