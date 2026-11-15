import { R as RANKS, c as configured, e as el, f as fmt, s as sb, g as rankFor } from "./shared-BhyKLrjU.js";

const $ = (q) => document.querySelector(q);
const KNIGHT = RANKS[RANKS.length - 1];
const out = $("#redeem-result");

function notice(kind, text) {
  out.append(el("div", `notice ${kind}`, text));
}

// Rank sekarang + rank berikutnya (null kalau sudah Praefect)
function progressInfo(score) {
  const cur = rankFor(score);
  if (!cur) return { cur: null, next: KNIGHT, from: 0 };
  const i = RANKS.indexOf(cur);
  return { cur, next: i > 0 ? RANKS[i - 1] : null, from: cur.min };
}

function statusCard(p, uid) {
  const { cur, next, from } = progressInfo(p.score);
  const color = cur ? cur.color : "#aab2c8";
  const card = el("div", "status-card");
  card.style.setProperty("--c", color);

  const top = el("div", "status-top");
  const who = el("div", "");
  who.append(el("div", "status-name", p.name), el("div", "id-uid", `UID ${uid}`));
  top.append(who, el("span", "id-rank", cur ? cur.name : "Aspirant"));

  const pts = el("div", "status-points");
  pts.append(el("span", "status-num", fmt.format(p.score)), el("span", "status-unit", "poin"));

  card.append(top, pts);

  if (next) {
    const pct = Math.max(0, Math.min(100, ((p.score - from) / (next.min - from)) * 100));
    const bar = el("div", "bar");
    const fill = el("div", "bar-fill");
    fill.style.width = `${pct}%`;
    bar.append(fill);
    card.append(
      bar,
      el("div", "status-next", `${fmt.format(next.min - p.score)} poin lagi menuju ${next.name}`)
    );
  } else {
    card.append(el("div", "status-next", "Kamu sudah berada di rank tertinggi. 👑"));
  }
  return card;
}

async function lookup(uid) {
  const { data, error } = await sb.rpc("lookup_player", { p_uid: uid });
  return { p: data?.[0], error };
}

function setBusy(busy) {
  for (const b of document.querySelectorAll("#redeem-form button")) b.disabled = busy;
}

async function showStatus(uid) {
  const { p, error } = await lookup(uid);
  if (error) {
    console.error(error);
    notice("error", "Terjadi kesalahan, coba lagi nanti.");
    return;
  }
  if (!p) {
    notice("error", `UID "${uid}" tidak ditemukan.`);
    return;
  }
  out.append(statusCard(p, uid));
}

$("#check-btn").addEventListener("click", async () => {
  out.replaceChildren();
  const uid = $("#r-uid").value.trim();
  if (!uid) return notice("error", "Isi UID dulu.");
  if (!configured) return notice("error", "Database belum dikonfigurasi (lihat README).");
  setBusy(true);
  await showStatus(uid);
  setBusy(false);
});

$("#redeem-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  out.replaceChildren();
  const uid = $("#r-uid").value.trim();
  const code = $("#r-code").value.trim();
  if (!uid || !code) return notice("error", "Isi UID dan kode dulu.");
  if (!configured) return notice("error", "Database belum dikonfigurasi (lihat README).");

  setBusy(true);
  const { data, error } = await sb.rpc("redeem_code", { p_uid: uid, p_code: code });
  if (error) {
    console.error(error);
    notice("error", "Terjadi kesalahan, coba lagi nanti.");
    setBusy(false);
    return;
  }
  const r = data?.[0];
  if (r?.status === "ok") {
    notice("ok", `Kode valid! +${fmt.format(r.points_added)} poin`);
    $("#r-code").value = "";
    await showStatus(uid);
  } else if (r?.status === "used") {
    notice("error", "Kode ini sudah pernah dipakai.");
  } else if (r?.status === "no_player") {
    notice("error", `UID "${uid}" tidak ditemukan.`);
  } else {
    notice("error", "Kode tidak valid.");
  }
  setBusy(false);
});
