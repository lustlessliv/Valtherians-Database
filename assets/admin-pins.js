// Dashboard: buat & kelola Emblem (PIN) member, hapus data uji coba.
// Fungsi database: create_pins, delete_test_data (lihat supabase-register.sql).
import { sb, el, fmt } from "./lib.js";
import { LABELS } from "./config.js";
import { logAction } from "./adminlog.js";

const $ = (q) => document.querySelector(q);

let pins = [];
let tm;

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(tm);
  tm = setTimeout(() => (t.className = "toast"), 3500);
}

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-");

function showOutput(list) {
  $("#pin-output").value = list.join("\n");
  $("#pin-output").hidden = false;
  $("#pin-output-actions").hidden = false;
  $("#pin-output").rows = Math.min(10, Math.max(2, list.length));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Tersalin.");
  } catch {
    toast("Gagal menyalin, salin manual.", true);
  }
}

/* ---------- Ringkasan Emblem asli (per catatan). Emblem asli tidak pernah ditampilkan. ---------- */

function renderSummary() {
  const body = $("#pins-summary");
  body.replaceChildren();
  const groups = new Map();
  for (const p of pins.filter((x) => !x.is_test)) {
    const key = p.note || "";
    const g = groups.get(key) || { note: p.note, total: 0, used: 0 };
    g.total++;
    if (p.claimed_at) g.used++;
    groups.set(key, g);
  }
  if (!groups.size) {
    const tr = el("tr");
    const td = el("td", "empty", `Belum ada ${LABELS.pin}.`);
    td.colSpan = 5;
    tr.append(td);
    body.append(tr);
    return;
  }
  for (const g of groups.values()) {
    const free = g.total - g.used;
    const act = el("td", "actions");
    if (free > 0) {
      const b = el("button", "btn small danger", "Hapus yang belum dipakai");
      b.type = "button";
      b.addEventListener("click", () => removeUnused(g, free));
      act.append(b);
    }
    const tr = el("tr");
    tr.append(
      el("td", "", g.note || "(tanpa catatan)"),
      el("td", "num", fmt.format(g.total)),
      el("td", "num", fmt.format(g.used)),
      el("td", "num", fmt.format(free)),
      act
    );
    body.append(tr);
  }
}

async function removeUnused(g, free) {
  if (!confirm(`Hapus ${fmt.format(free)} ${LABELS.pin} yang belum dipakai di "${g.note || "(tanpa catatan)"}"? ${LABELS.pin} itu tidak bisa dipakai mendaftar lagi. Yang sudah terpakai tidak tersentuh.`)) return;
  let q = sb.from("member_pins").delete().is("claimed_at", null).eq("is_test", false);
  q = g.note ? q.eq("note", g.note) : q.is("note", null);
  const { error } = await q;
  if (error) return toast(error.message, true);
  toast(`${LABELS.pin} yang belum dipakai dihapus.`);
  logAction("emblem", `Hapus ${fmt.format(free)} ${LABELS.pin} belum terpakai (${g.note || "tanpa catatan"})`);
  await load();
}

/* ---------- Daftar Emblem uji coba (ditampilkan lengkap) ---------- */

function renderTests() {
  const body = $("#pins-body");
  body.replaceChildren();
  const list = pins.filter((p) => p.is_test);
  if (!list.length) {
    const tr = el("tr");
    const td = el("td", "empty", `Belum ada ${LABELS.pin} uji coba.`);
    td.colSpan = 4;
    tr.append(td);
    body.append(tr);
  }
  for (const p of list) {
    const code = el("td", "mono copyable", p.pin_plain || "(tidak tersimpan)");
    code.title = "Klik untuk menyalin";
    if (p.pin_plain) code.addEventListener("click", () => copyText(p.pin_plain));
    const tr = el("tr");
    tr.append(code, el("td", "", p.note || "-"), el("td", "", p.claimed_at ? "Terikat ID" : "Belum dipakai"), el("td", "mono", p.uid || "-"));
    body.append(tr);
  }
  const free = list.filter((p) => !p.claimed_at).length;
  $("#pins-note").textContent = `${fmt.format(list.length)} ${LABELS.pin} uji coba • ${fmt.format(free)} belum dipakai`;
}

function render() {
  renderSummary();
  renderTests();
}

async function load() {
  const base = "id,uid,note,is_test,created_at,claimed_at,last_rename_at";
  let res = await sb.from("member_pins").select(base + ",pin_plain").order("created_at", { ascending: false }).limit(1000);
  if (res.error) res = await sb.from("member_pins").select(base).order("created_at", { ascending: false }).limit(1000); // pin_plain belum ada
  if (res.error) {
    console.error(res.error);
    pins = [];
    render();
    $("#pins-note").textContent = `Data ${LABELS.pin} belum tersedia. Jalankan supabase-register.sql di Supabase (lihat README).`;
    return;
  }
  pins = res.data;
  render();
}

// Buat Emblem pendaftaran baru
$("#pin-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const qty = parseInt($("#pin-qty").value, 10);
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return toast("Jumlah harus 1 sampai 100.", true);
  const { data, error } = await sb.rpc("create_pins", {
    p_qty: qty,
    p_note: $("#pin-note").value.trim() || null,
    p_uid: null,
    p_test: $("#pin-test").checked,
  });
  if (error) return toast(error.message, true);
  showOutput(data.map((r) => r.pin));
  toast(`${fmt.format(data.length)} ${LABELS.pin} dibuat.`);
  logAction("emblem", `Buat ${fmt.format(data.length)} ${LABELS.pin}${$("#pin-test").checked ? " uji coba" : ""}${$("#pin-note").value.trim() ? ` (${$("#pin-note").value.trim()})` : ""}`);
  await load();
});

// Buat / reset Emblem untuk ID yang sudah ada
$("#pin-bound-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const uid = $("#pin-uid").value.trim();
  if (!uid) return;
  if (!confirm(`Buat ${LABELS.pin} baru untuk ID ${uid}? ${LABELS.pin} lama ID itu (kalau ada) tidak berlaku lagi.`)) return;
  const { data, error } = await sb.rpc("create_pins", { p_qty: 1, p_note: null, p_uid: uid, p_test: false });
  if (error) return toast(error.message, true);
  showOutput([`${LABELS.id} ${uid}: ${data[0].pin}`]);
  $("#pin-uid").value = "";
  toast(`${LABELS.pin} untuk ${uid} dibuat.`);
  logAction("emblem", `Buat/reset ${LABELS.pin} untuk ${LABELS.id} ${uid}`);
  await load();
});

$("#pin-copy").addEventListener("click", () => copyText($("#pin-output").value));

$("#test-clean").addEventListener("click", async () => {
  if (!confirm("Hapus SEMUA data uji coba (member TEST..., Emblem uji coba, dan riwayatnya)? Data asli tidak tersentuh.")) return;
  const { data, error } = await sb.rpc("delete_test_data");
  if (error) return toast(error.message, true);
  toast(`${fmt.format(data)} member uji coba dihapus.`);
  logAction("emblem", `Hapus data uji coba (${fmt.format(data)} member)`);
  await load();
  $("#refresh")?.click(); // segarkan tabel member
});

// Muat daftar begitu dashboard terbuka (setelah login admin)
const app = $("#app");
new MutationObserver(() => { if (!app.hidden) load(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) load();
