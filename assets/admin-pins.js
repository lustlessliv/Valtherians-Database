// Dashboard: buat & kelola Emblem (PIN) member, hapus data uji coba.
// Fungsi database: create_pins, delete_test_data (lihat supabase-register.sql).
import { sb, el, fmt } from "./lib.js";
import { LABELS } from "./config.js";

const $ = (q) => document.querySelector(q);
const SHOW_LIMIT = 200;

let pins = [];
let filter = "all";
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

function render() {
  const body = $("#pins-body");
  body.replaceChildren();
  const list = pins.filter((p) =>
    filter === "free" ? !p.claimed_at
    : filter === "used" ? !!p.claimed_at
    : filter === "test" ? p.is_test
    : true
  );
  const shown = list.slice(0, SHOW_LIMIT);
  if (!shown.length) {
    const tr = el("tr");
    const td = el("td", "empty", `Belum ada ${LABELS.pin}.`);
    td.colSpan = 5;
    tr.append(td);
    body.append(tr);
  }
  for (const p of shown) {
    const tr = el("tr");
    const note = el("td", "", p.note || "-");
    if (p.is_test) note.append(" ", el("span", "chip test", "uji coba"));
    const status = el("td", "", p.claimed_at ? "Terikat ID" : "Belum dipakai");
    const del = el("button", "btn small danger", "Hapus");
    del.type = "button";
    del.addEventListener("click", () => remove(p));
    const act = el("td", "actions");
    act.append(del);
    tr.append(note, status, el("td", "mono", p.uid || "-"), el("td", "", fmtDate(p.created_at)), act);
    body.append(tr);
  }
  const free = pins.filter((p) => !p.claimed_at).length;
  $("#pins-note").textContent = `${fmt.format(pins.length)} ${LABELS.pin} • ${fmt.format(free)} belum dipakai`;
}

async function load() {
  const { data, error } = await sb
    .from("member_pins")
    .select("id,uid,note,is_test,created_at,claimed_at,last_rename_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error(error);
    pins = [];
    $("#pins-body").replaceChildren();
    $("#pins-note").textContent = `Daftar ${LABELS.pin} belum tersedia. Jalankan supabase-register.sql di Supabase (lihat README).`;
    return;
  }
  pins = data;
  render();
}

async function remove(p) {
  const msg = p.uid
    ? `Hapus ${LABELS.pin} milik ID ${p.uid}? Member itu tidak bisa ganti nama lagi sampai dibuatkan ${LABELS.pin} baru.`
    : `Hapus ${LABELS.pin} yang belum dipakai ini? ${LABELS.pin} itu tidak bisa dipakai mendaftar lagi.`;
  if (!confirm(msg)) return;
  const { error } = await sb.from("member_pins").delete().eq("id", p.id);
  if (error) return toast(error.message, true);
  toast(`${LABELS.pin} dihapus.`);
  await load();
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
  await load();
});

$("#pin-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#pin-output").value);
    toast("Tersalin.");
  } catch {
    $("#pin-output").select();
    toast("Pilih teks lalu salin manual.", true);
  }
});

$("#pin-filter").addEventListener("change", (ev) => { filter = ev.target.value; render(); });

$("#test-clean").addEventListener("click", async () => {
  if (!confirm("Hapus SEMUA data uji coba (member TEST..., Emblem uji coba, dan riwayatnya)? Data asli tidak tersentuh.")) return;
  const { data, error } = await sb.rpc("delete_test_data");
  if (error) return toast(error.message, true);
  toast(`${fmt.format(data)} member uji coba dihapus.`);
  await load();
  $("#refresh")?.click(); // segarkan tabel member
});

// Muat daftar begitu dashboard terbuka (setelah login admin)
const app = $("#app");
new MutationObserver(() => { if (!app.hidden) load(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) load();
