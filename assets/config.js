/* ============================================================
   PENGATURAN TAMPILAN WEBSITE  (file ini aman diedit)
   Semua teks, logo, banner, dan istilah ada di sini.
   Path gambar dihitung dari folder utama website (tempat index.html).
   ============================================================ */

export const SITE = {
  // ----- Logo & banner -----
  logo: "logo.svg",          // logo di navbar & hero. Boleh .png / .svg / .webp
  bannerLeft: "banner.svg",  // banner di kiri hero ("" = tanpa banner)
  bannerRight: "banner.svg", // banner di kanan hero (boleh beda file)

  // ----- Teks umum -----
  brand: "Valthera",                          // teks di pojok kiri navbar
  eyebrow: "Imperium of Aldervane",           // tulisan kecil di atas judul hero
  motto: "“Ad Gloria, Ad Aeterna”",           // motto di hero & footer
  footerLine: "Valthera Legion of Aldervane · Chronicles I: First Light",
  credit: "Web developed by <b>One</b> &amp; <b>Zero</b>", // boleh pakai HTML
  idCardFooter: "Imperium of Aldervane",      // tulisan di bawah ID card
  idCardTitle: "Valtherians",                 // judul di header ID card
};

// ----- Istilah yang tampil di website (hanya tampilan, nama kolom database tidak berubah) -----
export const LABELS = {
  id: "ID",
  points: "Sigil(s)",      // dipakai di kalimat, mis. "500 Sigil(s)"
  pointsColumn: "Sigil",   // dipakai di judul kolom tabel
  aspirant: "Aspirant",
  unranked: "Belum dinobatkan",
};

// ----- Ucapan selamat setelah redeem kalau rank naik (kunci = id rank) -----
export const RANKUP = {
  knight:   "Selamat telah menjadi bagian dari Legionnaires!",
  sentinel: "Selamat telah mencapai rank Sentinel of Aldervane!",
  praefect: "Selamat telah mencapai rank Praefect of Aldervane!",
};

// ----- Isi tiap halaman -----
// nav: urutan menu. hidden: true = menu hanya muncul di halaman itu sendiri.
export const NAV = [
  { key: "database",    label: "Database",    href: "database/" },
  { key: "leaderboard", label: "Leaderboard", href: "" },
  { key: "admin",       label: "Triune",      href: "admin/", hidden: true },
];

export const PAGES = {
  leaderboard: {
    title: "Leaderboard Aldervane",
    sub: "Peringkat para pahlawan terbaik. Cari ID untuk cek Sigil(s) dan peringkatmu.",
  },
  database: {
    title: "Valtherians Database",
    sub: "Catatan resmi para Valtherian. Cari ID untuk melihat kartu ID.",
  },
  admin: {
    title: "Dashboard Triune",
    sub: "Kelola Valtherians, staff, dan Sigil(s) leaderboard Aldervane",
    small: true, // hero kecil tanpa logo & banner
  },
};

// ----- Jabatan staff (Triune) -----
// Tag tampil "Segate - Arbiter". Urutan di sini = urutan tampil di website.
export const STAFF_ROLES = [
  { role: "Marshal", divisions: [] },
  { role: "Legate",  divisions: [] },
  { role: "Segate",  divisions: ["Arbiter", "Provost", "Herald", "Scrivener", "Artificer"] },
];
// Catatan: kalau menambah/mengubah jabatan atau divisi, samakan juga daftar di
// supabase-setup.sql (bagian "create table public.staff") supaya database menerimanya.

export const STAFF_COLOR = "#d9b84a"; // warna ID card & tag staff
