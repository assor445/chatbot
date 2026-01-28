---
name: shadcn-ui
description: Panduan styling menggunakan Tailwind CSS dan komponen Shadcn UI. Gunakan ini saat membuat tampilan antarmuka (UI).
---

# Shadcn UI & Tailwind Standards

## 1. Komponen
- Cek file `components.json` untuk melihat komponen yang tersedia.
- Jika butuh tombol, input, atau card, gunakan komponen import dari `@/components/ui/...` jangan buat tag HTML `<button>` biasa.
- Contoh:
  ```tsx
  import { Button } from "@/components/ui/button"
  // Usage
  <Button variant="outline">Klik Saya</Button>