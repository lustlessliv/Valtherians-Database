import { sb, el, fmt } from "./lib.js";
import { LABELS } from "./config.js";

const $ = (q) => document.querySelector(q);
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 karakter, tanpa I/O/0/1
const SHOW_LIMIT = 200;

let codes = [];
let filter = "all";
let tm;

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(tm);
  tm = setTimeout(() => (t.className = "toast"), 3500);
}

function randomCode() {
  const b = new Uint32Array(8);
  crypto.getRandomValues(b);
  const c = [...b].map((x) => ALPHABET[x % ALPHABET.length]).join("");
  return `VAL-${c.slice(0, 4)}-${c.slice(4)}`;
}

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "";
}

function render() {
  const body = $("#codes-body");
  body.replaceChildren();
  const list = codes.filter((c) =>
    filter === "free" ? !c.redeemed_at : filter === "used" ? !!c.redeemed_at : true
  );
  const shown = list.slice(0, SHOW_LIMIT);

  if (!shown.length) {
    const tr = el("tr");
    const td = el("td", "empty", "Belum ada kode.");
    td.colSpan = 5;
    tr.append(td);
    body.append(tr);
  }
  for (const c of shown) {
    const tr = el("tr");
    const status = c.redeemed_at
      ? `Dipakai ID ${c.redeemed_by} • ${fmtDate(c.redeemed_at)}`
      : "Tersedia";
    const act = el("td", "actions");
    if (!c.redeemed_at) {
      const del = el("button", "btn small danger", "Hapus");
      del.type = "button";
      del.addEventListener("click", () => removeCode(c));
      act.append(del);
    }
    tr.append(el("td", "mono", c.code), el("td", "num", fmt.format(c.points)), el("td", "", c.note || "-"), el("td", "", status), act);
    body.append(tr);
  }
  const free = codes.filter((c) => !c.redeemed_at).length;
  $("#codes-note").textContent =
    `${fmt.format(codes.length)} kode • ${fmt.format(free)} tersedia` +
    (list.length > SHOW_LIMIT ? ` • menampilkan ${SHOW_LIMIT} terbaru` : "");
}

async function loadCodes() {
  const { data, error } = await sb.from("redeem_codes").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) {
    console.error(error);
    toast("Gagal memuat kode: " + error.message, true);
    return;
  }
  codes = data;
  render();
}

async function removeCode(c) {
  if (!confirm(`Hapus kode ${c.code}?`)) return;
  const { error } = await sb.from("redeem_codes").delete().eq("code", c.code).is("redeemed_at", null);
  if (error) return toast(error.message, true);
  toast("Kode dihapus.");
  await loadCodes();
}

$("#code-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const points = parseInt($("#c-points").value, 10);
  const qty = parseInt($("#c-qty").value, 10);
  const custom = $("#c-custom").value.trim().toUpperCase();
  const note = $("#c-note").value.trim().slice(0, 80) || null;

  if (!Number.isInteger(points) || points < 1) return toast(`${LABELS.points} harus angka 1 atau lebih.`, true);
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return toast("Jumlah kode 1 sampai 100.", true);
  if (custom && qty !== 1) return toast("Kode sendiri hanya untuk jumlah 1.", true);
  if (custom && !/^[A-Z0-9-]{4,40}$/.test(custom)) return toast("Kode sendiri: 4-40 karakter huruf/angka/tanda -", true);

  const made = new Set();
  while (made.size < qty) made.add(custom || randomCode());
  const rows = [...made].map((code) => ({ code, points, note }));

  const { error } = await sb.from("redeem_codes").insert(rows);
  if (error) return toast(error.code === "23505" ? "Kode itu sudah ada." : error.message, true);

  $("#c-output").value = rows.map((r) => r.code).join("\n");
  $("#c-output").hidden = false;
  $("#c-output-actions").hidden = false;
  $("#c-custom").value = "";
  toast(`${fmt.format(rows.length)} kode dibuat.`);
  await loadCodes();
});

$("#c-copy").addEventListener("click", async () => {
  const text = $("#c-output").value;
  try {
    await navigator.clipboard.writeText(text);
    toast("Tersalin.");
  } catch {
    $("#c-output").select();
    toast("Pilih teks lalu salin manual.", true);
  }
});

$("#c-filter").addEventListener("change", (ev) => {
  filter = ev.target.value;
  render();
});

// Muat daftar kode begitu dashboard terbuka (setelah login admin)
const app = $("#app");
new MutationObserver(() => { if (!app.hidden) loadCodes(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) loadCodes();
