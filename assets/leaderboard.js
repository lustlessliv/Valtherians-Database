// Halaman utama: Cari ID  >  Leaderboard  >  Redeem code
import "./layout.js";
import { RANKS, TOP, configured, el, fmt, rangeText, rankFor, sb } from "./lib.js";
import { LABELS, RANKUP } from "./config.js";
import { lookupMember } from "./api.js";
import { statusCard } from "./idcard.js";

const $ = (q) => document.querySelector(q);
const REFRESH_MS = 60000;

/* ---------------------------------------------------------- 1. Cari ID */

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

/* ---------------------------------------------------------- 2. Leaderboard */

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
