import "./layout.js";
import { RANKS, configured, el, fmt, sb } from "./lib.js";
import { LABELS, STAFF_ROLES } from "./config.js";
import { ASPIRANT, getStaff, lookupMember, staffTag } from "./api.js";
import { buildIdCard } from "./idcard.js";

const $ = (q) => document.querySelector(q);

/* ---------------------------------------------------------- data */

async function loadMemberCounts() {
  const full = await sb.rpc("get_member_stats");
  if (!full.error && Array.isArray(full.data)) {
    return { counts: Object.fromEntries(full.data.map((r) => [r.rank_id, Number(r.total)])), complete: true };
  }
  const lb = await sb.rpc("get_leaderboard");
  if (lb.error) return null;
  const counts = {};
  for (const r of RANKS) counts[r.id] = lb.data.find((x) => x.rank_id === r.id)?.total ?? 0;
  return { counts, complete: false };
}

/* ---------------------------------------------------------- Triune */

function staffCard(s) {
  const card = el("div", "staff-card" + (s.active ? "" : " off"));
  const status = el("span", "status-pill " + (s.active ? "on" : "off"), s.active ? "Active" : "Deactive");
  const line = el("div", "staff-line");
  line.append("Status: ", status);
  card.append(
    el("span", "staff-tag", staffTag(s)),
    el("div", "staff-name", s.name),
    el("div", "staff-line mono", `${LABELS.id} ${s.uid}`),
    line
  );
  return card;
}

function renderTriune(staff, error) {
  const box = $("#triune");
  box.replaceChildren();
  if (error) {
    box.append(el("p", "stats-note", configured ? "Data Triune belum tersedia (jalankan supabase-staff.sql, lihat README)." : "Database belum dikonfigurasi (lihat README)."));
    return;
  }
  if (!staff.length) {
    box.append(el("p", "stats-note", "Belum ada Triune yang terdata."));
    return;
  }
  for (const s of staff) box.append(staffCard(s));
}

/* ---------------------------------------------------------- Total & statistik member */

function renderTotal(counts, staffRes) {
  const num = $("#total-num");
  const sub = $("#total-sub");
  if (!counts) {
    num.textContent = "–";
    sub.textContent = "";
    return;
  }
  const members = Object.values(counts).reduce((a, b) => a + b, 0);
  const staffCount = staffRes.error ? 0 : staffRes.staff.length;
  num.textContent = fmt.format(members + staffCount);

  const perRole = STAFF_ROLES.map((r) => `${r.role} ${fmt.format(staffRes.staff.filter((s) => s.role === r.role).length)}`).join(" · ");
  sub.textContent = staffRes.error
    ? `${fmt.format(members)} Legionnaires`
    : `${fmt.format(members)} Legionnaires + ${fmt.format(staffCount)} Triune (${perRole})`;
}

async function renderStats(counts, complete) {
  const grid = $("#member-stats");
  const note = $("#stats-note");
  const cats = [...RANKS, ASPIRANT];
  const tile = (cat, value) => {
    const t = el("div", "stat-tile");
    t.style.setProperty("--c", cat.color);
    t.append(el("div", "stat-num", value), el("div", "stat-name", cat.short));
    return t;
  };

  if (!counts) {
    grid.replaceChildren(...cats.map((c) => tile(c, "–")));
    note.textContent = configured ? "Gagal memuat statistik." : "Database belum dikonfigurasi (lihat README).";
    return;
  }
  grid.replaceChildren(...cats.map((c) => tile(c, c.id in counts ? fmt.format(counts[c.id]) : "–")));
  if (complete) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    $("#member-sub").textContent = `Jumlah Valtherians per rank`;
    note.textContent = "";
  } else {
    note.textContent = `Jumlah ${LABELS.aspirant} belum tersedia: jalankan supabase-setup.sql di Supabase (lihat README).`;
  }
}

async function init() {
  if (!configured) {
    renderTriune([], true);
    renderTotal(null, { staff: [] });
    renderStats(null);
    return;
  }
  const [staffRes, memberRes] = await Promise.all([getStaff(), loadMemberCounts()]);
  renderTriune(staffRes.staff, staffRes.error);
  renderTotal(memberRes?.counts ?? null, staffRes);
  renderStats(memberRes?.counts ?? null, memberRes?.complete);
}

/* ---------------------------------------------------------- Cari ID */

$("#search-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const out = $("#search-result");
  out.replaceChildren();
  const uid = $("#uid-input").value.trim();
  if (!uid) return;
  if (!configured) return out.append(el("p", "notfound", "Database belum dikonfigurasi (lihat README)."));

  const { member, error } = await lookupMember(uid);
  if (error) {
    console.error(error);
    return out.append(el("p", "notfound", "Terjadi kesalahan, coba lagi nanti."));
  }
  if (!member) return out.append(el("p", "notfound", `${LABELS.id} "${uid}" tidak ditemukan.`));
  out.append(buildIdCard(member));
});

init();
