import { sb, el, fmt } from "./lib.js";
import { LABELS } from "./config.js";
import { logAction } from "./adminlog.js";

const $ = (q) => document.querySelector(q);
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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

const isFree = (c) => c.max_uses == null || c.use_count < c.max_uses;
let openCode = null;
let logs = [];

function render() {
  const body = $("#codes-body");
  body.replaceChildren();
  const list = codes.filter((c) => (filter === "free" ? isFree(c) : filter === "used" ? c.use_count > 0 : true));
  const shown = list.slice(0, SHOW_LIMIT);

  if (!shown.length) {
    const tr = el("tr");
    const td = el("td", "empty", "Belum ada kode.");
    td.colSpan = 6;
    tr.append(td);
    body.append(tr);
  }
  for (const c of shown) {
    const tr = el("tr");
    const cap = c.max_uses == null ? "∞" : fmt.format(c.max_uses);
    const status = c.use_count
      ? `${fmt.format(c.use_count)}/${cap} ID • terakhir ${c.redeemed_by} (${fmtDate(c.redeemed_at)})`
      : `Tersedia (0/${cap})`;
    const act = el("td", "actions");
    if (c.use_count > 0) {
      const det = el("button", "btn small", openCode === c.code ? "Tutup" : "Rincian");
      det.type = "button";
      det.addEventListener("click", () => toggleDetail(c));
      act.append(det);
    } else {
      const del = el("button", "btn small danger", "Hapus");
      del.type = "button";
      del.addEventListener("click", () => removeCode(c));
      act.append(del);
    }
    tr.append(el("td", "mono", c.code), el("td", "num", fmt.format(c.points)), el("td", "", c.batch || "-"), el("td", "", c.note || "-"), el("td", "", status), act);
    body.append(tr);
    if (openCode === c.code) {
      const dr = el("tr");
      const dt = el("td", "small-text muted", logs.length ? logs.map((l) => `${l.uid} (${fmtDate(l.redeemed_at)})`).join(", ") : "Memuat…");
      dt.colSpan = 6;
      dr.append(dt);
      body.append(dr);
    }
  }
  const free = codes.filter(isFree).length;
  $("#codes-note").textContent =
    `${fmt.format(codes.length)} kode • ${fmt.format(free)} masih bisa dipakai` +
    (list.length > SHOW_LIMIT ? ` • menampilkan ${SHOW_LIMIT} terbaru` : "");

  const names = [...new Set(codes.map((c) => c.batch).filter(Boolean))];
  $("#c-batches").replaceChildren(...names.map((n) => { const o = el("option"); o.value = n; return o; }));
}

async function toggleDetail(c) {
  if (openCode === c.code) { openCode = null; return render(); }
  openCode = c.code;
  logs = [];
  render();
  const { data } = await sb.from("redeem_log").select("uid, redeemed_at").eq("code", c.code).order("redeemed_at", { ascending: false });
  logs = data || [];
  render();
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
  const { error } = await sb.from("redeem_codes").delete().eq("code", c.code).eq("use_count", 0);
  if (error) return toast(error.message, true);
  toast("Kode dihapus.");
  logAction("redeem", `Hapus kode ${c.code}`);
  await loadCodes();
}

$("#code-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const points = parseInt($("#c-points").value, 10);
  const qty = parseInt($("#c-qty").value, 10);
  const multi = $("#c-multi-on").checked;
  const unlimited = multi && $("#c-unlimited").checked;
  const maxUses = !multi ? 1 : unlimited ? null : parseInt($("#c-max").value, 10);
  const batch = $("#c-batch-on").checked ? $("#c-batch").value.trim().slice(0, 60) || null : null;
  if ($("#c-batch-on").checked && !batch) return toast("Isi nama batch.", true);
  const custom = $("#c-custom").value.trim().toUpperCase();
  const note = $("#c-note").value.trim().slice(0, 80) || null;

  if (!Number.isInteger(points) || points < 1) return toast(`${LABELS.points} harus angka 1 atau lebih.`, true);
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) return toast("Jumlah kode 1 sampai 100.", true);
  if (multi && !unlimited && (!Number.isInteger(maxUses) || maxUses < 2)) return toast("Batas multi-pakai minimal 2 ID, atau centang Tanpa batas.", true);
  if (batch) {
    const hit = codes.find((c) => c.batch && c.batch.toLowerCase() === batch.toLowerCase() && c.batch !== batch);
    if (hit) return toast(`Batch "${hit.batch}" sudah ada, pakai penulisan yang sama.`, true);
  }
  if (custom && qty !== 1) return toast("Kode custom hanya untuk jumlah 1.", true);
  if (custom && !/^[A-Z0-9-]{4,40}$/.test(custom)) return toast("Kode custom: 4-40 karakter huruf/angka/tanda -", true);

  const made = new Set();
  while (made.size < qty) made.add(custom || randomCode());
  const rows = [...made].map((code) => ({ code, points, note, max_uses: maxUses, batch }));

  const { error } = await sb.from("redeem_codes").insert(rows);
  if (error) return toast(error.code === "23505" ? "Kode itu sudah ada." : error.message, true);

  $("#c-output").value = rows.map((r) => r.code).join("\n");
  $("#c-output").hidden = false;
  $("#c-output-actions").hidden = false;
  $("#c-custom").value = "";
  $("#c-qty").disabled = false;
  $("#c-custom-hint").hidden = true;
  toast(`${fmt.format(rows.length)} kode dibuat.`);
  logAction("redeem", `Buat ${fmt.format(rows.length)} kode (${fmt.format(points)} ${LABELS.points}${batch ? `, batch ${batch}` : ""}${unlimited ? ", tanpa batas" : maxUses > 1 ? `, ${maxUses} ID/kode` : ""}${note ? `, ${note}` : ""})`);
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

// Batch //
function syncOptions(changed) {
  if (changed === "multi" && $("#c-multi-on").checked) $("#c-batch-on").checked = false;
  if (changed === "batch" && $("#c-batch-on").checked) $("#c-multi-on").checked = false;
  $("#c-multi-box").hidden = !$("#c-multi-on").checked;
  $("#c-batch-box").hidden = !$("#c-batch-on").checked;
}
$("#c-multi-on").addEventListener("change", () => syncOptions("multi"));
$("#c-unlimited").addEventListener("change", (ev) => { $("#c-max").disabled = ev.target.checked; });
$("#c-custom").addEventListener("input", (ev) => {
  const on = ev.target.value.trim() !== "";
  if (on) $("#c-qty").value = 1;
  $("#c-qty").disabled = on;
  $("#c-custom-hint").hidden = !on;
});
$("#c-batch-on").addEventListener("change", () => syncOptions("batch"));

$("#c-filter").addEventListener("change", (ev) => {
  filter = ev.target.value;
  render();
});

const app = $("#app");
new MutationObserver(() => { if (!app.hidden) loadCodes(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) loadCodes();
