// Dashboard Triune: kelola member (leaderboard), Triune (staff), impor CSV, riwayat.
// Kode redeem ada di admin-codes.js.
import "./layout.js";
import { RANKS, configured, el, fmt, parseCsv, rankFor, sb } from "./lib.js";
import { LABELS, STAFF_ROLES } from "./config.js";
import { ASPIRANT, staffSort, staffTag } from "./api.js";

const $ = (q) => document.querySelector(q);

const PAGE_SIZE = 50;      // jumlah baris member per halaman tabel
const MAX_TITLE = 60;
const MAX_ACH = 20;        // maks. insignia per orang

let players = [];
let staff = [];
let staffReady = true;     // false kalau tabel staff belum dibuat (supabase-staff.sql belum dijalankan)
let rankFilter = "all";
let search = "";
let page = 1;              // halaman tabel member yang sedang dibuka
let editingUid = null;     // null = tambah member baru
let staffFilter = "all";
let staffSearch = "";
let editingStaffUid = null;
let toastTimer;

/* ---------------------------------------------------------- util */

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3500);
}

const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-");
const cleanList = (arr) => arr.map((x) => x.trim()).filter(Boolean).map((x) => x.slice(0, MAX_TITLE));
const staffUids = () => new Set(staff.map((s) => s.uid));

function rankBadge(score) {
  const r = rankFor(score) || ASPIRANT;
  const b = el("span", "badge", r.short);
  b.style.color = r.color;
  return b;
}

function insigniaCell(list) {
  const td = el("td", "insignia");
  if (!list?.length) {
    td.textContent = "-";
    return td;
  }
  td.title = list.join("\n");
  for (const a of list.slice(0, 2)) td.append(el("span", "chip", a));
  if (list.length > 2) td.append(el("span", "chip more", `+${list.length - 2}`));
  return td;
}

function button(text, cls, onClick) {
  const b = el("button", cls, text);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

/* ---------------------------------------------------------- data */

async function fetchAllPlayers() {
  const base = "uid,name,score,joined_at,title,achievements,updated_at";
  let cols = base + ",is_test"; // is_test ada setelah supabase-register.sql dijalankan
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let res = await sb.from("players").select(cols).order("uid").range(from, from + 999);
    if (res.error && cols !== base) {
      cols = base; // SQL tahap 2 belum dijalankan: pakai kolom lama
      res = await sb.from("players").select(cols).order("uid").range(from, from + 999);
    }
    if (res.error) throw res.error;
    rows.push(...res.data);
    if (res.data.length < 1000) break;
  }
  return rows;
}

async function fetchStaff() {
  const { data, error } = await sb.from("staff").select("*");
  if (error) {
    console.error(error);
    staffReady = false;
    return [];
  }
  staffReady = true;
  return data.sort(staffSort);
}

async function loadAll() {
  try {
    players = await fetchAllPlayers();
  } catch (e) {
    console.error(e);
    return toast("Gagal memuat data: " + e.message, true);
  }
  staff = await fetchStaff();
  renderStats();
  renderPlayers();
  renderStaff();
  loadLog();
}

/* ---------------------------------------------------------- statistik */

function renderStats() {
  const box = $("#stats");
  box.replaceChildren();
  const tile = (label, value, color) => {
    const s = el("div", "stat");
    const v = el("div", "stat-value", fmt.format(value));
    if (color) v.style.color = color;
    s.append(v, el("div", "stat-label", label));
    box.append(s);
  };
  const real = players.filter((p) => !p.is_test); // data uji coba tidak dihitung
  tile("Total Valtherians", real.length + staff.length);
  for (const r of RANKS) tile(r.short, real.filter((p) => rankFor(p.score)?.id === r.id).length, r.color);
  tile(ASPIRANT.short, real.filter((p) => !rankFor(p.score)).length, ASPIRANT.color);
  tile("Triune", staff.length, "var(--gold)");
}

/* ---------------------------------------------------------- tabel member */

function renderPlayers() {
  const q = search.trim().toLowerCase();
  let rows = players
    .filter((p) => {
      if (q && !(p.uid.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))) return false;
      const r = rankFor(p.score);
      if (rankFilter === "aspirant") return !r;
      if (rankFilter !== "all") return r?.id === rankFilter;
      return true;
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const matched = rows.length;
  const pages = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  page = Math.min(Math.max(1, page), pages);
  const start = (page - 1) * PAGE_SIZE;
  rows = rows.slice(start, start + PAGE_SIZE);

  const body = $("#players-body");
  body.replaceChildren();
  if (!rows.length) {
    const tr = el("tr");
    const td = el("td", "empty", "Tidak ada Valtherians.");
    td.colSpan = 7;
    tr.append(td);
    body.append(tr);
  }
  for (const p of rows) {
    const tr = el("tr");
    const act = el("td", "actions");
    act.append(button("Edit", "btn small", () => openMemberDialog(p)), button("Hapus", "btn small danger", () => removeMember(p)));
    const rankTd = el("td");
    rankTd.append(rankBadge(p.score));
    const nameTd = el("td", "", p.name);
    if (p.is_test) nameTd.append(" ", el("span", "chip test", "uji coba"));
    tr.append(
      el("td", "mono", p.uid),
      nameTd,
      rankTd,
      el("td", "num", fmt.format(p.score)),
      insigniaCell(p.achievements),
      el("td", "", fmtDate(p.joined_at)),
      act
    );
    body.append(tr);
  }
  $("#table-note").textContent = matched
    ? `Menampilkan ${fmt.format(start + 1)}-${fmt.format(start + rows.length)} dari ${fmt.format(matched)} Valtherians`
    : "0 Valtherians";
  renderPager(pages);
}

function renderPager(pages) {
  const box = $("#pager");
  box.replaceChildren();
  if (pages <= 1) return;
  const go = (n) => { page = n; renderPlayers(); };
  const nav = (text, n, disabled) => {
    const b = button(text, "btn small", () => go(n));
    b.disabled = disabled;
    return b;
  };
  box.append(nav("‹ Sebelumnya", page - 1, page === 1));
  // nomor halaman: pertama, terakhir, dan 2 di kiri-kanan halaman aktif
  const show = new Set([1, pages]);
  for (let i = page - 2; i <= page + 2; i++) if (i >= 1 && i <= pages) show.add(i);
  let last = 0;
  for (const n of [...show].sort((a, b) => a - b)) {
    if (n - last > 1) box.append(el("span", "pager-gap", "…"));
    const b = button(String(n), "btn small" + (n === page ? " primary" : ""), () => go(n));
    if (n === page) b.setAttribute("aria-current", "page");
    box.append(b);
    last = n;
  }
  box.append(nav("Berikutnya ›", page + 1, page === pages));
}

/* ---------------------------------------------------------- dialog member */

function openMemberDialog(p) {
  editingUid = p ? p.uid : null;
  $("#dialog-title").textContent = p ? "Edit Valtherian" : "Tambah Valtherian";
  $("#f-uid").value = p?.uid ?? "";
  $("#f-uid").readOnly = !!p;
  $("#f-name").value = p?.name ?? "";
  $("#f-score").value = p?.score ?? 0;
  $("#f-joined").value = p?.joined_at ?? "";
  $("#f-title").value = p?.title ?? "";
  $("#f-ach").value = (p?.achievements ?? []).join("\n");
  $("#edit-dialog").showModal();
}

$("#edit-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const uid = $("#f-uid").value.trim();
  const name = $("#f-name").value.trim();
  const score = parseInt($("#f-score").value, 10);
  if (!uid || !name || !Number.isInteger(score) || score < 0) return toast("Data tidak valid.", true);
  if (editingUid === null && staffUids().has(uid)) return toast(`${LABELS.id} ini terdaftar sebagai Triune, tidak bisa masuk leaderboard.`, true);

  const ach = cleanList($("#f-ach").value.split("\n"));
  if (ach.length > MAX_ACH) return toast(`Maksimal ${MAX_ACH} insignia.`, true);
  const profile = {
    joined_at: $("#f-joined").value || null,
    title: $("#f-title").value.trim().slice(0, MAX_TITLE) || null,
    achievements: ach,
  };
  const q = editingUid === null
    ? sb.from("players").insert({ uid, name, score, ...profile })
    : sb.from("players").update({ name, score, ...profile }).eq("uid", editingUid);
  const { error } = await q;
  if (error) {
    if (error.code === "23505") return toast(`${LABELS.id} sudah dipakai.`, true);
    return toast(error.message, true);
  }
  $("#edit-dialog").close();
  toast("Tersimpan.");
  await loadAll();
});
$("#cancel-btn").addEventListener("click", () => $("#edit-dialog").close());
$("#add-btn").addEventListener("click", () => openMemberDialog(null));

async function removeMember(p) {
  if (!confirm(`Hapus ${p.name} (${p.uid})? Tindakan ini tidak bisa dibatalkan.`)) return;
  const { error } = await sb.from("players").delete().eq("uid", p.uid);
  if (error) return toast(error.message, true);
  toast("Valtherians dihapus.");
  await loadAll();
}

/* ---------------------------------------------------------- tambah / kurangi Sigil cepat */

$("#adjust-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const uid = $("#a-uid").value.trim();
  const delta = parseInt($("#a-delta").value, 10);
  if (!uid || !Number.isInteger(delta)) return toast(`Isi ${LABELS.id} dan jumlah ${LABELS.points} (boleh negatif).`, true);
  if (staffUids().has(uid)) return toast(`${LABELS.id} ini Triune, tidak punya ${LABELS.points}.`, true);
  const { data, error } = await sb.rpc("adjust_score", { p_uid: uid, p_delta: delta });
  if (error) return toast(error.message, true);
  if (data === null) return toast(`${LABELS.id} tidak ditemukan.`, true);
  toast(`${LABELS.points} sekarang ${fmt.format(data)}.`);
  ev.target.reset();
  await loadAll();
});

/* ---------------------------------------------------------- staff */

function fillSelect(sel, options) {
  sel.replaceChildren(...options.map(([value, text]) => Object.assign(el("option", "", text), { value })));
}

function renderStaff() {
  const note = $("#staff-note");
  const body = $("#staff-body");
  body.replaceChildren();

  if (!staffReady) {
    const tr = el("tr");
    const td = el("td", "empty", "Tabel Triune belum ada. Jalankan supabase-staff.sql di Supabase (lihat README).");
    td.colSpan = 6;
    tr.append(td);
    body.append(tr);
    note.textContent = "";
    return;
  }

  const q = staffSearch.trim().toLowerCase();
  const rows = staff.filter((s) => {
    if (q && !(s.uid.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))) return false;
    return staffFilter === "all" || s.role === staffFilter;
  });

  if (!rows.length) {
    const tr = el("tr");
    const td = el("td", "empty", "Belum ada Triune.");
    td.colSpan = 6;
    tr.append(td);
    body.append(tr);
  }
  for (const s of rows) {
    const tr = el("tr");
    const tag = el("td");
    tag.append(el("span", "tag", staffTag(s)));
    const status = el("td");
    status.append(el("span", "status-pill " + (s.active ? "on" : "off"), s.active ? "Active" : "Deactive"));
    const act = el("td", "actions");
    act.append(button("Edit", "btn small", () => openStaffDialog(s)), button("Hapus", "btn small danger", () => removeStaff(s)));
    tr.append(el("td", "mono", s.uid), el("td", "", s.name), tag, status, el("td", "", fmtDate(s.joined_at)), act);
    body.append(tr);
  }
  note.textContent = `${fmt.format(rows.length)} Triune`;
}

function syncDivisionField() {
  const role = STAFF_ROLES.find((r) => r.role === $("#s-role").value);
  const divs = role?.divisions ?? [];
  $("#s-division-wrap").hidden = divs.length === 0;
  fillSelect($("#s-division"), divs.map((d) => [d, d]));
}

function openStaffDialog(s) {
  editingStaffUid = s ? s.uid : null;
  $("#staff-dialog-title").textContent = s ? "Edit Triune" : "Tambah Triune";
  $("#s-uid").value = s?.uid ?? "";
  $("#s-uid").readOnly = !!s;
  $("#s-name").value = s?.name ?? "";
  $("#s-role").value = s?.role ?? STAFF_ROLES[0].role;
  syncDivisionField();
  if (s?.division) $("#s-division").value = s.division;
  $("#s-active").value = s ? String(s.active) : "true";
  $("#s-joined").value = s?.joined_at ?? "";
  $("#s-title").value = s?.title ?? "";
  $("#s-ach").value = (s?.achievements ?? []).join("\n");
  $("#staff-dialog").showModal();
}

$("#s-role").addEventListener("change", syncDivisionField);
$("#staff-cancel").addEventListener("click", () => $("#staff-dialog").close());
$("#staff-add-btn").addEventListener("click", () => {
  if (!staffReady) return toast("Jalankan supabase-staff.sql dulu (lihat README).", true);
  openStaffDialog(null);
});

$("#staff-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const uid = $("#s-uid").value.trim();
  const name = $("#s-name").value.trim();
  const role = $("#s-role").value;
  const hasDivisions = (STAFF_ROLES.find((r) => r.role === role)?.divisions.length ?? 0) > 0;
  const division = hasDivisions ? $("#s-division").value : null;
  if (!uid || !name || !role || (hasDivisions && !division)) return toast("Data tidak valid.", true);

  const ach = cleanList($("#s-ach").value.split("\n"));
  if (ach.length > MAX_ACH) return toast(`Maksimal ${MAX_ACH} insignia.`, true);

  const row = {
    name, role, division,
    active: $("#s-active").value === "true",
    joined_at: $("#s-joined").value || null,
    title: $("#s-title").value.trim().slice(0, MAX_TITLE) || null,
    achievements: ach,
  };

  let q;
  if (editingStaffUid === null) {
    const asMember = players.find((p) => p.uid === uid);
    if (asMember && !confirm(
      `${LABELS.id} ${uid} (${asMember.name}) masih terdaftar sebagai member dengan ${fmt.format(asMember.score)} ${LABELS.points}.\n\n` +
      "Kalau dijadikan Triune, datanya dihapus dari leaderboard (tercatat di riwayat perubahan). Lanjutkan?"
    )) return;
    q = sb.from("staff").insert({ uid, ...row });
  } else {
    q = sb.from("staff").update(row).eq("uid", editingStaffUid);
  }
  const { error } = await q;
  if (error) return toast(error.code === "23505" ? `${LABELS.id} sudah terdaftar sebagai Triune.` : error.message, true);

  $("#staff-dialog").close();
  toast("Triune tersimpan.");
  await loadAll();
});

async function removeStaff(s) {
  if (!confirm(`Hapus ${s.name} (${s.uid}) dari Triune?\n\n${LABELS.id} ini bisa ditambahkan ke leaderboard lagi setelahnya. Kalau hanya berhenti menjabat, ubah Status jadi Deactive.`)) return;
  const { error } = await sb.from("staff").delete().eq("uid", s.uid);
  if (error) return toast(error.message, true);
  toast("Triune dihapus.");
  await loadAll();
}

/* ---------------------------------------------------------- riwayat */

async function loadLog() {
  const [sc, rn] = await Promise.all([
    sb.from("score_log").select("*").order("id", { ascending: false }).limit(30),
    sb.from("rename_log").select("*").order("id", { ascending: false }).limit(30),
  ]);
  const list = $("#log");
  list.replaceChildren();
  if (sc.error) {
    list.append(el("li", "empty", "Gagal memuat riwayat."));
    return;
  }
  const verb = { create: "Ditambahkan", update: "Diubah", delete: "Dihapus" };
  const entries = sc.data.map((r) => {
    const change =
      r.action === "create" ? `→ ${fmt.format(r.new_score)}`
      : r.action === "delete" ? `(${fmt.format(r.old_score)})`
      : `${fmt.format(r.old_score)} → ${fmt.format(r.new_score)}`;
    return { at: r.created_at, text: `${verb[r.action]}: ${r.name} (${r.uid}) ${change}` };
  });
  // Ganti nama (kosong kalau SQL tahap 2 belum dijalankan)
  for (const r of rn.data || []) entries.push({ at: r.created_at, text: `Ganti nama: ${r.old_name} → ${r.new_name} (${r.uid})` });

  entries.sort((x, y) => new Date(y.at) - new Date(x.at));
  if (!entries.length) {
    list.append(el("li", "empty", "Belum ada riwayat."));
    return;
  }
  for (const e of entries.slice(0, 30)) {
    const when = new Date(e.at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    const li = el("li", "log-row");
    li.append(el("span", "log-time", when), el("span", "log-text", e.text));
    list.append(li);
  }
}

/* ---------------------------------------------------------- impor CSV */

// kolom opsional di header -> nama kolom database
const OPTIONAL_COLS = [
  ["joined_at", ["joined_at", "joined", "bergabung"]],
  ["title", ["title"]],
  ["achievements", ["achievements", "insignia"]],
];

function parseImport(text) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  let col = { uid: 0, name: 1, score: 2 };
  const extra = {};
  const header = rows[0].map((h) => h.trim().toLowerCase());
  if (header.includes("uid")) {
    col = { uid: header.indexOf("uid"), name: header.indexOf("name"), score: header.indexOf("score") };
    if (Object.values(col).some((i) => i < 0)) throw new Error("Header harus berisi uid, name, score.");
    for (const [key, aliases] of OPTIONAL_COLS) {
      const i = header.findIndex((h) => aliases.includes(h));
      if (i >= 0) extra[key] = i;
    }
    rows.shift();
  }
  const out = new Map();
  for (const r of rows) {
    const uid = (r[col.uid] || "").trim();
    const name = (r[col.name] || "").trim();
    const raw = String(r[col.score] ?? "").replace(/[^\d-]/g, "");
    const score = Number(raw);
    if (!uid || !name || raw === "" || !Number.isFinite(score) || score < 0) continue;
    const item = { uid, name, score };
    if ("joined_at" in extra) {
      const d = (r[extra.joined_at] || "").trim();
      item.joined_at = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
    }
    if ("title" in extra) item.title = (r[extra.title] || "").trim().slice(0, MAX_TITLE) || null;
    if ("achievements" in extra) item.achievements = cleanList((r[extra.achievements] || "").split("|")).slice(0, MAX_ACH);
    out.set(uid, item);
  }
  return [...out.values()];
}

$("#import-file").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (f) $("#import-text").value = await f.text();
});

$("#import-btn").addEventListener("click", async () => {
  let rows;
  try {
    rows = parseImport($("#import-text").value);
  } catch (e) {
    return toast(e.message, true);
  }
  // ID staff tidak boleh masuk leaderboard
  const blocked = staffUids();
  const skipped = rows.filter((r) => blocked.has(r.uid));
  rows = rows.filter((r) => !blocked.has(r.uid));
  if (!rows.length) return toast("Tidak ada baris valid untuk diimpor.", true);

  const skipNote = skipped.length ? `\n${fmt.format(skipped.length)} baris dilewati karena ${LABELS.id}-nya Triune.` : "";
  if (!confirm(`Impor ${fmt.format(rows.length)} Valtherians? ${LABELS.id} yang sudah ada akan ditimpa.${skipNote}`)) return;

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("players").upsert(rows.slice(i, i + 500), { onConflict: "uid" });
    if (error) return toast(error.message, true);
  }
  $("#import-text").value = "";
  $("#import-file").value = "";
  toast(`${fmt.format(rows.length)} Valtherians diimpor.` + (skipped.length ? ` ${fmt.format(skipped.length)} Triune dilewati.` : ""));
  await loadAll();
});

/* ---------------------------------------------------------- filter & kontrol umum */

fillSelect($("#rank-filter"), [["all", "Semua rank"], ...RANKS.map((r) => [r.id, r.short]), ["aspirant", ASPIRANT.short]]);
$("#rank-filter").addEventListener("change", (ev) => { rankFilter = ev.target.value; page = 1; renderPlayers(); });
$("#search").addEventListener("input", (ev) => { search = ev.target.value; page = 1; renderPlayers(); });

fillSelect($("#staff-filter"), [["all", "Semua jabatan"], ...STAFF_ROLES.map((r) => [r.role, r.role])]);
$("#staff-filter").addEventListener("change", (ev) => { staffFilter = ev.target.value; renderStaff(); });
$("#staff-search").addEventListener("input", (ev) => { staffSearch = ev.target.value; renderStaff(); });

fillSelect($("#s-role"), STAFF_ROLES.map((r) => [r.role, r.role]));
$("#refresh").addEventListener("click", loadAll);

/* ---------------------------------------------------------- login */

function showLogin(msg = "") {
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#login-error").textContent = msg;
}

async function enter(user) {
  const { data, error } = await sb.rpc("is_admin");
  if (error || !data) {
    await sb.auth.signOut();
    return showLogin("Akun ini bukan Triune.");
  }
  $("#login").hidden = true;
  $("#app").hidden = false;
  $("#who").textContent = user.email;
  await loadAll();
}

$("#login-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("#login-error").textContent = "";
  const { data, error } = await sb.auth.signInWithPassword({
    email: $("#l-email").value.trim(),
    password: $("#l-pass").value,
  });
  if (error) return showLogin("Email atau password salah.");
  $("#l-pass").value = "";
  await enter(data.user);
});

$("#logout").addEventListener("click", async () => {
  await sb.auth.signOut();
  players = [];
  staff = [];
  showLogin();
});

(async function start() {
  if (!configured) return showLogin("Database belum dikonfigurasi. Lihat README.");
  const { data } = await sb.auth.getSession();
  if (data.session) await enter(data.session.user);
})();
