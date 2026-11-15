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
  points: "Sigil",      // dipakai di kalimat, mis. "500 Sigil(s)"
  pointsColumn: "Sigil",   // dipakai di judul kolom tabel
  aspirant: "Aspirant",
  unranked: "Belum dinobatkan",
  pin: "Emblem",           // istilah untuk PIN member
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
  { key: "register",    label: "Daftar",      href: "daftar/", hidden: true }, // hanya tampil di halamannya sendiri
  { key: "admin",       label: "Triune",      href: "admin/", hidden: true },
];

export const PAGES = {
  leaderboard: {
    title: "Leaderboard Aldervane",
    sub: "Peringkat para pahlawan terbaik. Cari Legion ID untuk melihat jumlah Sigil dan peringkatmu.",
  },
  database: {
    title: "Valtherians Database",
    sub: "Catatan resmi para Valtherian. Cari Legion ID untuk melihat ID card.",
  },
  register: {
    title: "Selamat Datang, Aspirant",
    sub: "Valthera Legion menyambutmu. Buat Legion ID-mu untuk memulai perjalanan menuju Imperial Knight.",
  },
  admin: {
    title: "Dashboard Triune",
    sub: "Kelola catatan Valtherians, Triune, dan Sigil Valthera Legion Leaderboard",
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

// ----- Halaman Daftar (tersembunyi: tidak ada di menu, buka lewat alamat /daftar/) -----
// Link dengan url kosong tidak ditampilkan.
export const WELCOME = {
  doneTitle: "Selamat datang di Valthera Legion",
  doneText: "Legion ID kamu sudah dibuat. Simpan Legion ID dan Emblem-mu baik-baik, keduanya dipakai untuk masuk ke berbagai area Legion.",
  joinTitle: "Bergabung dengan komunitas",
  joinLinks: [
    { label: "WhatsApp", url: "" },
    { label: "Discord", url: "" },
  ],
  infoTitle: "Informasi Legion",
  infoLinks: [
    // { label: "Nama website", url: "https://...", desc: "Penjelasan singkat (opsional)" },
  ],
  repositoryLabel: "Cek Valtherian's Repository",
  repositoryUrl: "", // isi saat halaman Repository sudah ada, mis. "repository/"
  renameCooldownText: "Nama hanya bisa diganti sekali setiap 7 hari.",
};

export const TRAINING = {
  kinds: {
    sistem: "Pengenalan sistem Legion (online)",
    ekspedisi: "Pelatihan ekspedisi (in-game)",
  },
  intro: "Sebelum dinobatkan menjadi Knight of Aldervane, seorang Aspirant wajib mengikuti sesi Training. Training terdiri dari pengenalan sistem Legion secara online dan pelatihan ekspedisi di dalam game.",
  arbiterTitle: "Pilih Arbiter",
  arbiterText: "Silakan pilih Arbiter untuk mengajukan status Trainee:",
  arbiterWarn: "Arbiter yang sudah dipilih hanya bisa diubah oleh Triune.",
  arbiterEmpty: "Belum ada Arbiter yang aktif. Hubungi Triune, lalu lanjutkan lewat tombol di bawah.",
  sessionsTitle: "Pilih sesi Training",
  sessionsText: "Pilih minimal 1 sesi yang dipandu Arbiter-mu. Sesi lain boleh dipilih sesuai keinginanmu.",
  tip: "Tip: ambil sesi dengan Arbiter yang sama, atau sesi dengan peserta terbanyak.",
  noSessions: "Belum ada jadwal sesi. Cek lagi nanti, atau hubungi Triune.",
  requiredOk: "Syarat terpenuhi: kamu sudah ikut sesi bersama Arbiter-mu.",
  requiredNo: "Syarat belum terpenuhi: pilih minimal 1 sesi bersama Arbiter-mu.",
  mineBadge: "Arbiter-mu",
  finishLabel: "Selesai",
  laterLabel: "Lanjutkan nanti",
  laterText: "Kamu bisa melanjutkan pemilihan sesi kapan saja lewat kartu \"Lanjutkan Training\" di halaman ini.",
};
