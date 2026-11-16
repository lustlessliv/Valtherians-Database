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
  { key: "repository",  label: "Repository",  href: "repository/" },
  { key: "register",    label: "Registration",      href: "daftar/" },
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
  repository: {
    title: "Repository Member",
    sub: "Ruang pribadi para Valtherian. Masuk dengan ID dan Emblem-mu.",
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
  repositoryUrl: "repository/", // isi saat halaman Repository sudah ada, mis. "repository/"
  renameCooldownText: "Nama hanya bisa diganti sekali setiap 7 hari.",
};

export const TRAINING = {
  tabs: { register: "Registrasi", resume: "Lanjutkan Training", rename: "Ganti Nama" },
  tabsHint: "Pilih salah satu di atas untuk memulai.",
  kinds: {
    sistem: "Pengenalan sistem Legion (online)",
    ekspedisi: "Pelatihan ekspedisi (in-game)",
  },
  intro: "Sebelum dinobatkan menjadi Knight of Aldervane, seorang Aspirant wajib mengikuti sesi Training. Training terdiri dari pengenalan sistem Legion secara online dan pelatihan ekspedisi di dalam game.",
  title: "Pilih Arbiter dan jadwal Training",
  rules: "Pilih Arbiter, lalu pilih jadwal: tepat 1 sesi pengenalan sistem dan tepat 1 sesi pelatihan ekspedisi. Salah satunya wajib dipandu Arbiter pilihanmu, dan kedua sesi tidak boleh punya tanggal dan jam yang sama. Setelah cocok, tekan \"Ajukan status Trainee\".",
  arbiterLabel: "Arbiter",
  arbiterFixed: "Arbiter-mu",
  arbiterWarn: "Arbiter yang sudah dipilih hanya bisa diubah oleh Triune.",
  arbiterEmpty: "Belum ada Arbiter yang aktif. Hubungi Triune.",
  tip: "Tip: ambil sesi dengan Arbiter yang sama, atau sesi dengan peserta terbanyak.",
  noSessions: "Belum ada jadwal sesi. Cek lagi nanti, atau hubungi Triune.",
  mineBadge: "Arbiter-mu",
  checks: {
    arbiter: "Arbiter dipilih",
    sistem: "1 sesi pengenalan sistem",
    ekspedisi: "1 sesi pelatihan ekspedisi",
    mine: "Salah satunya dipandu Arbiter-mu",
  },
  clashLabel: "Bentrok jadwal",
  kindDoneLabel: "Jenis ini sudah terdaftar",
  submitLabel: "Ajukan status Trainee",
  saveLabel: "Simpan",
  laterLabel: "Lanjutkan nanti",
  laterText: "Kamu bisa melanjutkan pemilihan Arbiter dan jadwal kapan saja lewat tab \"Lanjutkan Training\".",
  doneTitle: "Selamat datang di Valthera Legion",
};

export const REPOSITORY = {
  loginTitle: "Masuk ke Repository",
  loginText: "Masuk dengan ID dan Emblem-mu. Sesi login berlaku 60 menit.",
  logout: "Keluar",
  profileTitle: "Profil",
  trainingTitle: "Training",
  trainingEmpty: "Belum ada sesi Training yang kamu ikuti.",
  trainingContinue: "Pilih atau lengkapi Training",
  graphTitle: "Grafik Sigil(s)",
  graphMaintenance: "Maintenance",
  graphMaintenanceNote: "Season sedang maintenance. Redeem ditutup sampai season berikutnya dimulai.",
  staffNote: "Triune tidak masuk leaderboard dan tidak memiliki Sigil(s), jadi grafik Sigil(s) tidak ditampilkan.",
  expired: "Sesi login habis. Masuk lagi untuk melanjutkan.",
  scoreTitle: "Skor Training",
  scoreEmpty: "Belum ada data Training.",
  scoreNone: "Belum dinilai",
  scoreDate: "Selesai",
  uniformTitle: "Uniform",
  uniformText: "Ketuk gambar untuk membuka, atau unduh file PDF-nya.",
  uniformMissing: "Belum tersedia",
  uniformDownload: "Unduh PDF",
  uniformFail: "File tidak bisa dibuka. Coba lagi nanti.",
};

export const UNIFORMS = [
  { id: "aspirant", rank: "Aspirant",                 name: "Wayfarer's Raiment",   image: "uniform/aspirant.png" },
  { id: "knight",   rank: "I. Knight of Aldervane",   name: "Valtherian's Aegis",   image: "uniform/knight.png" },
  { id: "sentinel", rank: "I. Sentinel of Aldervane", name: "",                     image: "uniform/sentinel.png" },
  { id: "praefect", rank: "I. Praefect of Aldervane", name: "",                     image: "uniform/praefect.png" },
  { id: "triune",   rank: "Triune",                   name: "",                     image: "uniform/triune.png" },
];
