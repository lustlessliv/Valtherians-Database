// Halaman Daftar (tersembunyi): nama + Emblem -> ID otomatis, kartu sambutan, dan ganti nama.
import "./layout.js";
import { configured, el, sb } from "./lib.js";
import { LABELS, WELCOME } from "./config.js";
import { lookupMember } from "./api.js";
import { buildIdCard } from "./idcard.js";

const $ = (q) => document.querySelector(q);
const ROOT = new URL("../", import.meta.url);

function say(box, kind, text) {
  box.replaceChildren(el("div", `notice ${kind}`, text));
}

// Emblem otomatis huruf besar
for (const sel of ["#reg-pin", "#ren-pin"]) {
  $(sel).addEventListener("input", (ev) => { ev.target.value = ev.target.value.toUpperCase(); });
}
$("#rename-sub").textContent = `Pakai ${LABELS.id} dan ${LABELS.pin}-mu. ${WELCOME.renameCooldownText}`;

/* ---------------------------------------------------------- kartu sambutan */

function linkButton(item) {
  const a = el("a", "link-btn");
  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener";
  a.append(el("span", "link-label", item.label));
  if (item.desc) a.append(el("span", "link-desc", item.desc));
  return a;
}

function linkSection(title, links) {
  const items = links.filter((l) => l.url);
  if (!items.length) return null;
  const box = el("div", "link-section");
  box.append(el("h3", "sub-title", title));
  const grid = el("div", "link-grid");
  grid.append(...items.map(linkButton));
  box.append(grid);
  return box;
}

async function showDone(uid, name) {
  const done = $("#done");
  done.replaceChildren();

  const welcome = el("section", "card welcome");
  welcome.append(
    el("h2", "sec-title", WELCOME.doneTitle),
    el("p", "welcome-name", name),
    el("div", "reg-id-label", `${LABELS.id} kamu`),
    el("div", "reg-id", uid)
  );
  const copy = el("button", "btn-gold small", `Salin ${LABELS.id}`);
  copy.type = "button";
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(uid); copy.textContent = "Tersalin"; }
    catch { copy.textContent = `${LABELS.id}: ${uid}`; }
  });
  welcome.append(copy, el("p", "sec-sub", WELCOME.doneText));
  done.append(welcome);

  // ID card pertama kali
  const { member } = await lookupMember(uid);
  if (member) {
    const card = el("section", "card");
    card.append(buildIdCard(member));
    done.append(card);
  }

  const extras = [
    linkSection(WELCOME.joinTitle, WELCOME.joinLinks || []),
    linkSection(WELCOME.infoTitle, WELCOME.infoLinks || []),
  ].filter(Boolean);
  if (WELCOME.repositoryUrl) {
    const repo = el("a", "btn-gold repo-btn", WELCOME.repositoryLabel);
    repo.href = new URL(WELCOME.repositoryUrl, ROOT).href;
    extras.push(repo);
  }
  if (extras.length) {
    const card = el("section", "card");
    card.append(...extras);
    done.append(card);
  }

  $("#register-card").hidden = true;
  done.hidden = false;
  done.scrollIntoView({ behavior: "smooth" });
}

/* ---------------------------------------------------------- registrasi */

const REG_MSG = {
  invalid: `${LABELS.pin} tidak valid. Periksa lagi atau minta ke Triune.`,
  used: `${LABELS.pin} ini sudah dipakai.`,
  bad_name: "Nama harus 2 sampai 30 karakter.",
  name_taken: "Nama itu tidak bisa dipakai. Pilih nama lain.",
  locked: "Terlalu banyak percobaan salah. Coba lagi beberapa menit lagi.",
};

$("#reg-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const out = $("#reg-result");
  const name = $("#reg-name").value.trim();
  const pin = $("#reg-pin").value.trim();
  if (!name || !pin) return say(out, "error", `Isi nama dan ${LABELS.pin} dulu.`);
  if (!configured) return say(out, "error", "Database belum dikonfigurasi (lihat README).");

  const btn = ev.target.querySelector("button");
  btn.disabled = true;
  const { data, error } = await sb.rpc("register_member", { p_pin: pin, p_name: name });
  btn.disabled = false;
  if (error) {
    console.error(error);
    return say(out, "error", "Terjadi kesalahan, coba lagi nanti.");
  }
  const r = data?.[0];
  if (r?.status === "ok") {
    out.replaceChildren();
    $("#reg-pin").value = "";
    return showDone(r.out_uid, r.out_name);
  }
  say(out, "error", REG_MSG[r?.status] || "Pendaftaran gagal, coba lagi.");
});

/* ---------------------------------------------------------- ganti nama */

const REN_MSG = {
  invalid: `${LABELS.id} atau ${LABELS.pin} tidak cocok.`,
  not_found: `${LABELS.id} tidak ditemukan.`,
  bad_name: "Nama harus 2 sampai 30 karakter.",
  name_taken: "Nama itu tidak bisa dipakai. Pilih nama lain.",
  locked: "Terlalu banyak percobaan salah. Coba lagi beberapa menit lagi.",
  same: "Itu sudah nama kamu sekarang.",
};

$("#ren-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const out = $("#ren-result");
  const uid = $("#ren-uid").value.trim();
  const pin = $("#ren-pin").value.trim();
  const name = $("#ren-name").value.trim();
  if (!uid || !pin || !name) return say(out, "error", `Isi ${LABELS.id}, ${LABELS.pin}, dan nama baru dulu.`);
  if (!configured) return say(out, "error", "Database belum dikonfigurasi (lihat README).");

  const btn = ev.target.querySelector("button");
  btn.disabled = true;
  const { data, error } = await sb.rpc("rename_member", { p_uid: uid, p_pin: pin, p_name: name });
  btn.disabled = false;
  if (error) {
    console.error(error);
    return say(out, "error", "Terjadi kesalahan, coba lagi nanti.");
  }
  const r = data?.[0];
  if (r?.status === "ok") {
    $("#ren-pin").value = "";
    return say(out, "ok", `Nama berhasil diganti menjadi ${r.out_name}.`);
  }
  if (r?.status === "cooldown") {
    const when = new Date(r.next_allowed).toLocaleDateString("id-ID", { dateStyle: "long" });
    return say(out, "error", `Nama baru bisa diganti lagi mulai ${when}.`);
  }
  say(out, "error", REN_MSG[r?.status] || "Gagal mengganti nama, coba lagi.");
});
