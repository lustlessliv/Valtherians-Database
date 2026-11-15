// Pengambilan data dari Supabase + helper rank/staff yang dipakai beberapa halaman.
import { RANKS, sb, configured } from "./lib.js";
import { LABELS, STAFF_ROLES } from "./config.js";

// Kategori di luar rank: member yang belum mencapai Knight.
export const ASPIRANT = { id: "aspirant", name: LABELS.aspirant, short: LABELS.aspirant, color: "#aab2c8" };
export const KNIGHT = RANKS[RANKS.length - 1]; // rank terendah = batas dinobatkan

export const rankOf = (rankId) => RANKS.find((r) => r.id === rankId) || ASPIRANT;

/** Tag staff: "Marshal", "Legate", atau "Segate - Arbiter". */
export const staffTag = (s) => (s.division ? `${s.role} - ${s.division}` : s.role);

/** Urutan tampil staff mengikuti STAFF_ROLES di config.js. */
export function staffSort(a, b) {
  const ri = (s) => STAFF_ROLES.findIndex((r) => r.role === s.role);
  const di = (s) => Math.max(0, (STAFF_ROLES[ri(s)]?.divisions || []).indexOf(s.division));
  return ri(a) - ri(b) || di(a) - di(b) || a.name.localeCompare(b.name);
}

/**
 * Cari ID. Hasil: { member } dengan member = null kalau tidak ada.
 * member.kind = "member" (punya Sigil + peringkat) atau "staff" (tanpa Sigil/peringkat).
 */
export async function lookupMember(uid) {
  if (!configured) return { error: new Error("not configured") };
  const res = await sb.rpc("lookup_member", { p_uid: uid });
  if (!res.error) return { member: res.data?.[0] ?? null };

  // Cadangan: update SQL (supabase-staff.sql) belum dijalankan -> pakai fungsi lama.
  const old = await sb.rpc("lookup_player", { p_uid: uid });
  if (old.error) return { error: old.error };
  const p = old.data?.[0];
  return { member: p ? { kind: "member", uid, ...p, overall_pos: null, overall_total: null } : null };
}

/** Daftar staff untuk halaman Database. */
export async function getStaff() {
  if (!configured) return { staff: [], error: new Error("not configured") };
  const { data, error } = await sb.rpc("get_staff");
  if (error) return { staff: [], error };
  return { staff: [...data].sort(staffSort) };
}
