Product Requirements Document (PRD)Project Name: AI Chatbot Personal Wrapper

**Version:** 1.0 (MVP \- Minimum Viable Product)  
**Date:** 27 Januari 2026  
**Owner:** \[Iqbal Husni\]-----1. Executive Summary

Membuat aplikasi web AI Chatbot berbasis web yang memungkinkan pengguna untuk berinteraksi dengan berbagai model LLM (Large Language Models) "open-weight" dan hemat biaya (seperti DeepSeek, Llama 3\) melalui OpenRouter. Aplikasi ini mengutamakan keamanan API Key, efisiensi biaya, dan pengalaman pengguna yang responsif dengan fitur *streaming text*.2. Goals & Objectives

* **Akses Model Murah/Gratis:** Memanfaatkan DeepSeek dan model *free tier* lainnya lewat OpenRouter.  
* **Keamanan:** Menyembunyikan API Key OpenRouter di sisi server (tidak terekspos di browser).  
* **User Management:** Membatasi akses hanya untuk pengguna yang terdaftar (mencegah penyalahgunaan kuota API).  
* **Responsivitas:** Menggunakan teknologi *streaming* untuk *UX chat* yang cepat.

3\. Tech Stack

| Kategori | Teknologi | Keterangan |
| ----- | ----- | ----- |
| **Framework** | Next.js versi terbaru | App Router |
| **Language** | TypeScript |  |
| **Styling** | Tailwind CSS \+ Shadcn UI | Komponen UI |
| **Authentication** | Supabase Auth (SSR) | Providers: Email/Password & Google OAuth |
| **Database** | Supabase (PostgreSQL) | Untuk menyimpan data *user* dan *history chat* di masa depan. |
| **AI Integration** | Vercel AI SDK \+ OpenRouter API |  |
| **Deployment** | Vercel |  |

4\. User Stories (Fitur)A. Authentication (Login/Register)

1. Sebagai User, saya ingin bisa mendaftar/login menggunakan akun **Google** agar praktis (satu kali klik).  
2. Sebagai User, saya ingin opsi login menggunakan **Email & Password** sebagai alternatif.  
3. Sebagai User, saya harus login terlebih dahulu sebelum bisa mengakses halaman chat.

B. Core Chat Experience

1. Sebagai User, saya ingin bisa mengetik pesan dan mendapatkan balasan dari AI.  
2. Sebagai User, saya ingin melihat balasan AI muncul huruf-per-huruf (**Streaming**) agar tidak menunggu lama.  
3. Sebagai User, saya ingin bisa memilih model AI (Contoh: DeepSeek R1 untuk *coding*, Llama 3 untuk ngobrol santai).  
4. Sebagai User, saya ingin tampilan *chat bubble* yang rapi (User di kanan, AI di kiri).

C. System & Security

1. Sebagai Developer, saya ingin API Key OpenRouter tersimpan di server (`.env.local`) agar tidak dicuri orang lain.  
2. Sebagai Developer, saya ingin *middleware* memblokir akses ke `/chat` jika *user* belum memiliki *session* login.

5\. Functional Requirements (Detail Teknis)5.1. Authentication Flow

* Menggunakan `@supabase/ssr` untuk manajemen *session cookie*.  
* **Middleware:**  
  * Cek *path* `/chat`.  
  * Jika tidak ada *cookie auth* \-\> *Redirect* ke `/login`.  
  * Jika ada *cookie auth* \-\> *Allow*.  
* **Callback Route:** Menangani *redirect* dari Google OAuth dan menukar *code* menjadi *session*.

5.2. Chat Logic (Backend)

* Endpoint: `/api/chat` (POST).  
* Validasi: Cek *session user* via Supabase sebelum memproses *request*.  
* Payload ke OpenRouter:  
  * `model`: (Dinami sesuai pilihan *user*).  
  * `messages`: Array percakapan sebelumnya.  
* Response: *Streaming text* (Vercel AI SDK format).

5.3. Environment Variables

File `.env.local` harus berisi:  
NEXT\_PUBLIC\_SUPABASE\_URL= [https://jiplojripkqephwmcpuj.supabase.co](https://jiplojripkqephwmcpuj.supabase.co)

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcGxvanJpcGtxZXBod21jcHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTEyNDYsImV4cCI6MjA4NTA2NzI0Nn0.D60X1Tf2bAGfcpP4e3FXISyEtVaghYQSsJRGhzb6LmM

OPENROUTER\_API\_KEY=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  
6\. Database Schema (Supabase)

Struktur disiapkan untuk fitur History Chat (meskipun opsional untuk MVP).

* **Table: `profiles`** (Otomatis dibuat saat user login jika disetup *trigger*, atau pakai *default* `auth.users`)  
  * `id` (UUID, PK, ref to `auth.users`)  
  * `email` (Text)  
  * `full_name` (Text)  
  * `avatar_url` (Text)  
* **Table: `chats`** (Optional untuk MVP)  
  * `id` (UUID, PK)  
  * `user_id` (UUID, FK)  
  * `title` (Text)  
  * `created_at` (Timestamp)

7\. UI/UX Design Guidelines

* **Theme:** Clean, Minimalist. Mendukung Dark Mode (bawaan Shadcn UI).  
* **Layout:**  
  * **Login Page:** *Card* di tengah layar, tombol "Login with Google" mencolok.  
  * **Chat Page:** *Sidebar* (kiri) untuk opsi model/logout, Main Area (tengah) untuk *chat bubble*, Input Box (bawah) *sticky*.

8\. Roadmap & PhasingPhase 1: MVP (Fokus Sekarang)

* Setup Next.js \+ Shadcn UI.  
* Setup Supabase Auth (Google & Email).  
* Halaman Login & Middleware Protection.  
* Integrasi OpenRouter (*Streaming Response*).  
* UI Chat Sederhana.

Phase 2: Enhancements (Nanti)

* Simpan riwayat chat ke database Supabase.  
* Sidebar daftar *chat history*.  
* Markdown rendering (agar AI bisa menulis kode program dengan rapi).  
* Settings (Ubah System Prompt *custom*).

