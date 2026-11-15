// Pintu masuk ke kode hasil build (shared-*.js) dengan nama yang mudah dibaca.
// Kalau nama file shared-*.js berubah, cukup ganti path di baris ini.
export {
  R as RANKS,        // daftar rank (Praefect, Sentinel, Knight) + batas poin + warna
  c as configured,   // true kalau kunci Supabase terpasang
  e as el,           // el("div", "kelas", "teks") -> elemen
  T as TOP,
  r as rangeText,
  f as fmt,          // format angka id-ID
  s as sb,           // klien Supabase
  g as rankFor,      // rankFor(poin) -> rank atau null (Aspirant)
  p as parseCsv,
} from "./shared-BhyKLrjU.js";
