export const SITE = {
  logo: "Valthera.png",
  bannerLeft: "banner.svg",
  bannerRight: "banner.svg",

  brand: "Valthera",
  eyebrow: "Imperium of Aldervane",
  motto: "“Ad Gloria, Ad Aeterna”",
  footerLine: "Valthera Legion of Aldervane · Chronicles I: First Light",
  credit: "Web developed by <b>One</b> &amp; <b>Zero</b>",
  idCardFooter: "Imperium of Aldervane",
  idCardTitle: "Valtherians",
 }

export const LABELS = {
  id: "ID",
  points: "Sigil", // (s)
  pointsColumn: "Sigil",
  aspirant: "Aspirant",
  unranked: "Belum dinobatkan",
  pin: "Emblem",
};

export const RANKUP = {
  knight:   "Selamat telah menjadi bagian dari Legionnaires!",
  sentinel: "Selamat telah mencapai rank Sentinel of Aldervane!",
  praefect: "Selamat telah mencapai rank Praefect of Aldervane!",
};

export const NAV = [
  { key: "database",    label: "Database",    href: "database/" },
  { key: "leaderboard", label: "Leaderboard", href: "" },
  { key: "repository",  label: "Repository",  href: "repository/" },
  { key: "register",    label: "Registration",      href: "daftar/" },
  { key: "admin",       label: "Triune",      href: "admin/", hidden: true },
];

export const PAGES = {
  leaderboard: {
    title: "Legionate Leaderboard",
    sub: "Peringkat para pahlawan terbaik. Cari Legion ID untuk melihat jumlah Sigil dan peringkatmu.",
  },
  database: {
    title: "Valthera Legion Database",
    sub: "Catatan resmi para Valtherian. Cari Legion ID untuk melihat ID card.",
  },
  register: {
    title: "Selamat Datang, Aspirant",
    sub: "Valthera Legion menyambutmu. Buat Legion ID-mu untuk memulai perjalanan menuju Imperial Knight.",
  },
  repository: {
    title: "Valtherian's Repository",
    sub: "Ruang pribadi para Valtherian. Masuk dengan ID dan Emblem-mu.",
  },
  admin: {
    title: "Dashboard Triune",
    sub: "Kelola catatan Valtherians, Triune, dan Sigil Legionate Leaderboard",
    small: true,
  },
};

export const STAFF_ROLES = [
  { role: "Marshal", divisions: [] },
  { role: "Legate",  divisions: [] },
  { role: "Segate",  divisions: ["Arbiter", "Provost", "Herald", "Scrivener", "Artificer"] },
];

export const STAFF_COLOR = "#d9b84a";

export const WELCOME = {
  doneTitle: "Salve! Selamat bergabung",
  finalText: "Selamat bergabung! Jelajahi berbagai area di Valthera Legion dengan mengunjungi Arx Divina dan WhatsApp/Discord Legion.",
  doneText: "Legion ID kamu sudah dibuat. Simpan Legion ID dan Emblem-mu baik-baik, keduanya dipakai untuk masuk ke berbagai area Legion.",
  joinTitle: "Bergabung dengan komunitas",
  joinLinks: [
    { label: "WhatsApp", url: "https://chat.whatsapp.com/CIvyrn2EtIfBMOKtJklldc?s=cl&p=a&iam=2" },
    { label: "Discord", url: "https://discord.gg/tYBkJMvXK" },
  ],
  infoTitle: "Informasi Legion",
  infoLinks: [
    { label: "Arx Divina", url: "https://lustlessliv.github.io/VLA-Arx-Divina", desc: "Pusat informasi Valthera Legion" },
  ],
  repositoryLabel: "Cek Valtherian's Repository",
  repositoryUrl: "repository/",
  renameCooldownText: "Nama hanya bisa diganti sekali setiap 7 hari.",
};

export const TRAINING = {
  week1Start: "",
  tabs: { register: "Registrasi", resume: "Lanjutkan Training", rename: "Ganti Nama" },
  tabsHint: "Pilih salah satu di atas untuk memulai.",
    steps: ["Buat ID", "Jadwal Training", "Eksplor Legion"],
  kinds: {
    sistem: "Pengenalan Sistem",
    ekspedisi: "Pelatihan Ekspedisi",
  },
  intro: "Sebelum dinobatkan menjadi Knight of Aldervane, seorang Aspirant wajib mengikuti sesi Training. Training terdiri dari pengenalan sistem Legion secara online dan pelatihan ekspedisi di dalam game.",
  title: "Pilih Arbiter dan jadwal Training",
  rules: "Pilih Arbiter, lalu pilih jadwal: tepat 1 sesi pengenalan sistem dan tepat 1 sesi pelatihan ekspedisi. Salah satunya wajib dipandu Arbiter pilihanmu, dan kedua sesi tidak boleh punya tanggal dan jam yang sama. Setelah cocok, tekan \"Ajukan status Trainee\".",
  arbiterLabel: "Arbiter",
  arbiterFixed: "Arbiter-mu",
  arbiterWarn: "Arbiter yang sudah dipilih hanya bisa diubah oleh Triune.",
  arbiterEmpty: "Belum ada Arbiter yang aktif. Hubungi Triune.",
  tip: "Tips: ambil sesi dengan Arbiter yang sama, atau sesi dengan peserta terbanyak. Ganti Arbiter jika tidak ada jadwal yang cocok.",
  noSessions: "Belum ada jadwal sesi. Cek lagi nanti, atau hubungi Triune.",
  mineBadge: "Arbiter-mu",
  checks: {
    arbiter: "Arbiter dipilih",
    sistem: "1 sesi pengenalan sistem",
    ekspedisi: "1 sesi pelatihan ekspedisi",
    mine: "Salah satunya dipandu Arbiter-mu",
  },
  clashLabel: "Bentrok jadwal",
  kindDoneLabel: "Sesi ini sudah terdaftar",
  submitLabel: "Ajukan Status Trainee",
  saveLabel: "Simpan",
  laterLabel: "Lanjutkan Nanti",
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
  graphTitle: "Grafik Sigil",
  graphPreTitle: "Pra-season",
  graphPreNote: "{n} hari sebelum season dimulai.",
  graphMaintenance: "Maintenance",
  graphMaintenanceNote: "Legion sedang maintenance. Redeem ditutup sampai Chronicle II dimulai.",
  guidedTitle: "Jadwal Training",
  guidedEmpty: "Belum ada jadwal mendatang yang kamu pandu.",
  guidedParticipants: "Peserta",
  guidedNoParticipants: "Belum ada peserta.",
  guidedNote: "Jadwal diatur lewat dashboard Triune.",
  menteesTitle: "Aspirants",
  menteesEmpty: "Belum ada Aspirant yang memilihmu sebagai Arbiter.",
  crownedLabel: "Dinobatkan",
  notCrowned: "Belum dinobatkan",
  staffNote: "Triune tidak masuk leaderboard dan tidak memiliki Sigil, grafik Sigil tidak ditampilkan.",
  expired: "Sesi login habis. Masuk lagi untuk melanjutkan.",
  scoreTitle: "Skor Training",
  scoreEmpty: "Belum ada data Training.",
  scoreNone: "Belum dinilai",
  scoreDate: "Selesai",
  uniformTitle: "Wardrobe",
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
