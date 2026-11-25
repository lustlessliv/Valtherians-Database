import "./layout.js";
import { RANKS, TOP, configured, el, fmt, rangeText, rankFor, sb } from "./lib.js";
import { LABELS, RANKUP } from "./config.js";
import { lookupMember } from "./api.js";
import { statusCard } from "./idcard.js";

const $ = (q) => document.querySelector(q);
const REFRESH_MS = 60000;

/* ---------------------------------------------------------- Cari ID */

function say(box, kind, text) {
  box.append(el("div", `notice ${kind}`, text));
}

async function showStatus(box, uid) {
  const { member, error } = await lookupMember(uid);
  if (error) {
    console.error(error);
    return say(box, "error", "Terjadi kesalahan, coba lagi nanti.");
  }
  if (!member) return say(box, "error", `${LABELS.id} "${uid}" tidak ditemukan.`);
  box.append(statusCard(member));
}

$("#search-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const box = $("#search-result");
  box.replaceChildren();
  const uid = $("#uid-input").value.trim();
  if (!uid) return;
  if (!configured) return say(box, "error", "Database belum dikonfigurasi (lihat README).");
  await showStatus(box, uid);
});

/* ---------------------------------------------------------- Leaderboard */

let data = Object.fromEntries(RANKS.map((r) => [r.id, []]));
let active = RANKS[0].id;

function renderTabs() {
  const tabs = $("#tabs");
  tabs.replaceChildren();
  for (const r of RANKS) {
    const b = el("button", "tab" + (r.id === active ? " active" : ""), r.short);
    b.type = "button";
    b.role = "tab";
    b.style.setProperty("--c", r.color);
    b.addEventListener("click", () => { active = r.id; renderTabs(); renderBoard(); });
    tabs.append(b);
  }
}

function renderBoard() {
  const rank = RANKS.find((r) => r.id === active);
  const rows = data[rank.id];
  const total = rows[0]?.total ?? 0;

  const info = $("#tab-info");
  info.replaceChildren();
  const h = el("h2", "", rank.name);
  h.style.color = rank.color;
  info.append(h, el("span", "range", `${rangeText(rank)} ${LABELS.points} • Top ${TOP} dari ${fmt.format(total)} Valtherians`));

  const board = $("#board");
  board.replaceChildren();
  if (rows.length === 0) {
    board.append(el("li", "empty", "Belum ada Valtherians di rank ini."));
    return;
  }
  for (const p of rows) {
    const li = el("li", "row");
    const nameCell = el("span", "name", p.name);
    nameCell.append(el("span", "uid", p.uid));
    li.append(
      el("span", "pos" + (p.pos <= 3 ? ` top${p.pos}` : ""), String(p.pos)),
      nameCell,
      el("span", "score", fmt.format(p.score))
    );
    board.append(li);
  }
}

async function load() {
  const { data: rows, error } = await sb.rpc("get_leaderboard");
  if (error) {
    console.error(error);
    if (!$("#board").children.length) {
      $("#board").replaceChildren(el("li", "empty", "Gagal memuat data leaderboard."));
    }
    return;
  }
  data = Object.fromEntries(RANKS.map((r) => [r.id, []]));
  for (const row of rows) data[row.rank_id]?.push(row);
  renderBoard();
  $("#updated").textContent = `Diperbarui ${new Date().toLocaleTimeString("id-ID", { timeStyle: "short" })} • otomatis tiap menit`;
}

renderTabs();
renderBoard();
if (configured) {
  load();
  setInterval(load, REFRESH_MS);
} else {
  $("#board").replaceChildren(el("li", "empty", "Database belum dikonfigurasi (lihat README)."));
}

/* ---------------------------------------------------------- Redeem code */

function showRankUp(box, oldScore, newScore) {
  const before = rankFor(oldScore);
  const after = rankFor(newScore);
  if (!after || (before && RANKS.indexOf(after) >= RANKS.indexOf(before))) return;
  const card = el("div", "rankup");
  card.style.setProperty("--c", after.color);
  card.append(el("div", "rankup-title", after.name), el("div", "rankup-text", RANKUP[after.id] || ""));
  box.append(card);
}

const out = $("#redeem-result");

$("#redeem-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  out.replaceChildren();
  const uid = $("#r-uid").value.trim();
  const code = $("#r-code").value.trim();
  if (!uid || !code) return say(out, "error", `Isi ${LABELS.id} dan kode dulu.`);
  if (!configured) return say(out, "error", "Database belum dikonfigurasi (lihat README).");

  const buttons = document.querySelectorAll("#redeem-form button");
  buttons.forEach((b) => (b.disabled = true));

  const { data: res, error } = await sb.rpc("redeem_code", { p_uid: uid, p_code: code });
  if (error) {
    console.error(error);
    say(out, "error", "Terjadi kesalahan, coba lagi nanti.");
  } else {
    const r = res?.[0];
    if (r?.status === "ok") {
      say(out, "ok", `Kode valid! +${fmt.format(r.points_added)} ${LABELS.points}`);
      $("#r-code").value = "";
      showRankUp(out, r.new_score - r.points_added, r.new_score);
      await showStatus(out, uid);
      load();
    } else if (r?.status === "used") say(out, "error", "Kode ini sudah pernah dipakai.");
    else if (r?.status === "self_used") say(out, "error", `${LABELS.id} ini sudah pernah memakai kode tersebut.`);
    else if (r?.status === "batch_used") say(out, "error", `${LABELS.id} ini telah menukar kode dari ${r.batch}.`);
    else if (r?.status === "maintenance") say(out, "error", "Sedang dalam masa maintenance. Redeem ditutup sampai Chronicles berikutnya dimulai.");
    else if (r?.status === "staff") say(out, "error", `${LABELS.id} "${uid}" adalah Triune dan tidak bisa menukar kode.`);
    else if (r?.status === "no_player") say(out, "error", `${LABELS.id} "${uid}" tidak ditemukan.`);
    else say(out, "error", "Kode tidak valid.");
  }
  buttons.forEach((b) => (b.disabled = false));
});
