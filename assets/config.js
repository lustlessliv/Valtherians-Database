export const SITE = {
  logo: "logo.svg",          
  bannerLeft: "banner.svg",  
  bannerRight: "banner.svg", 
   
  brand: "Valthera",                          
  eyebrow: "Imperium of Aldervane",           
  motto: "“Ad Gloria, Ad Aeterna”",           
  footerLine: "Valthera Legion of Aldervane · Chronicles I: First Light",
  credit: "Web developed by <b>One</b> &amp; <b>Zero</b>", 
  idCardFooter: "Imperium of Aldervane",      
  idCardTitle: "Valtherians",                 
};

export const LABELS = {
  id: "ID",
  points: "Sigil",      
  pointsColumn: "Sigil",   
  aspirant: "Aspirant",
  unranked: "Belum dinobatkan",
};

export const RANKUP = {
  knight:   "Selamat telah menjadi bagian dari Legionnaires!",
  sentinel: "Selamat telah mencapai rank Sentinel of Aldervane!",
  praefect: "Selamat telah mencapai rank Praefect of Aldervane!",
};

export const NAV = [
  { key: "database",    label: "Database",    href: "database/" },
  { key: "leaderboard", label: "Leaderboard", href: "" },
  { key: "admin",       label: "Triune",      href: "admin/", hidden: true },
];

export const PAGES = {
  leaderboard: {
    title: "Valthera Legion Leaderboard",
    sub: "Peringkat para pahlawan terbaik. Cari Legion ID untuk melihat jumlah Sigil dan peringkatmu.",
  },
  database: {
    title: "Legionate Database",
    sub: "Catatan resmi para Valtherian. Cari Legion ID untuk melihat ID card.",
  },
  admin: {
    title: "Dashboard Triune",
    sub: "Kelola catatan Valtherians, Triune, dan Sigil Valthera Legion Leaderboard",
    small: true,
  },
};

export const STAFF_ROLES = [
  { role: "Marshal", divisions: [] },
  { role: "Legate",  divisions: [] },
  { role: "Segate",  divisions: ["Arbiter", "Provost", "Herald", "Scrivener", "Artificer"] },
];

export const STAFF_COLOR = "#d9b84a";
