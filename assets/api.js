import { RANKS, sb, configured } from "./lib.js";
import { LABELS, STAFF_ROLES } from "./config.js";

export const ASPIRANT = { id: "aspirant", name: LABELS.aspirant, short: LABELS.aspirant, color: "#aab2c8" };
export const KNIGHT = RANKS[RANKS.length - 1]; 

export const rankOf = (rankId) => RANKS.find((r) => r.id === rankId) || ASPIRANT;

export const staffTag = (s) => (s.division ? `${s.role} - ${s.division}` : s.role);

export function staffSort(a, b) {
  const ri = (s) => STAFF_ROLES.findIndex((r) => r.role === s.role);
  const di = (s) => Math.max(0, (STAFF_ROLES[ri(s)]?.divisions || []).indexOf(s.division));
  return ri(a) - ri(b) || di(a) - di(b) || a.name.localeCompare(b.name);
}

export async function lookupMember(uid) {
  if (!configured) return { error: new Error("not configured") };
  const res = await sb.rpc("lookup_member", { p_uid: uid });
  if (!res.error) return { member: res.data?.[0] ?? null };

  const old = await sb.rpc("lookup_player", { p_uid: uid });
  if (old.error) return { error: old.error };
  const p = old.data?.[0];
  return { member: p ? { kind: "member", uid, ...p, overall_pos: null, overall_total: null } : null };
}

export async function getStaff() {
  if (!configured) return { staff: [], error: new Error("not configured") };
  const { data, error } = await sb.rpc("get_staff");
  if (error) return { staff: [], error };
  return { staff: [...data].sort(staffSort) };
}
