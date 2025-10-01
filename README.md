# ArenaKita 🏟️

ArenaKita adalah platform booking lapangan olahraga berbasis web yang dibangun untuk memudahkan pengguna menemukan dan memesan lapangan, serta membantu pengelola untuk mengatur jadwal dan pendapatan mereka.

## Deskripsi Proyek

Proyek ini dibuat sebagai portofolio Fullstack Developer yang mencakup sistem otentikasi, manajemen database, peran pengguna yang berbeda (user, manager, admin), dan interaksi frontend-backend yang modern.

## Teknologi yang Digunakan

* **Frontend**: Next.js (React)
* **Backend & Database**: Supabase (PostgreSQL, Auth, Storage)
* **Styling**: Tailwind CSS
* **Bahasa**: TypeScript

## Cara Menjalankan Proyek Secara Lokal

1.  **Clone repository ini:**
    ```bash
    git clone [URL_GITHUB_ANDA_NANTI]
    ```

2.  **Masuk ke direktori proyek:**
    ```bash
    cd arenakita-app
    ```

3.  **Install semua dependencies:**
    ```bash
    npm install
    ```

4.  **Buat file `.env.local`** dan isi dengan kunci API Supabase Anda:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_SUPABASE_ANDA
    NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_PUBLIC_ANDA
    ```

5.  **Jalankan aplikasi:**
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:3000`.