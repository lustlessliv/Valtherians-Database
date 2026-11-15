// Halaman Daftar (tersembunyi): nama + Emblem -> ID otomatis, kartu sambutan, dan ganti nama.
import "./layout.js";
import { configured, el, sb } from "./lib.js";
import { LABELS, WELCOME, TRAINING } from "./config.js";
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

async function showDone(uid, name, later = false) {
  const done = $("#done");
  done.replaceChildren();
  $("#resume-card").hidden = false;
  $("#rename-card").hidden = false;

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
  if (later) welcome.append(el("p", "sec-sub", TRAINING.laterText));
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


/* ---------------------------------------------------------- training */

const TR_MSG = {
  invalid: `${LABELS.id} atau ${LABELS.pin} tidak cocok.`,
  not_member: `${LABELS.id} tidak ditemukan.`,
  locked: "Terlalu banyak percobaan salah. Coba lagi beberapa menit lagi.",
  already: "Arbiter sudah dipilih. Hanya Triune yang bisa mengubahnya.",
  bad_arbiter: "Arbiter itu tidak tersedia.",
  no_arbiter: "Pilih Arbiter dulu.",
  no_session: "Sesi itu sudah tidak tersedia.",
};

function fmtWhen(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long" });
  const hm = d.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  return `${day}, ${hm} WIB`;
}

// Alur Training setelah ID jadi: pilih Arbiter -> pilih sesi -> kartu sambutan.
async function startTraining(me) {
  const box = $("#done");
  $("#register-card").hidden = true;
  $("#resume-card").hidden = true;
  $("#rename-card").hidden = true;
  box.hidden = false;

  const [mine, arbs, sess] = await Promise.all([
    sb.rpc("my_training", { p_uid: me.uid, p_pin: me.pin }),
    sb.rpc("get_arbiters"),
    sb.rpc("get_training_sessions"),
  ]);
  const m = mine.data?.[0];
  if (mine.error || m?.status !== "ok") {
    box.replaceChildren(el("div", "notice error", TR_MSG[m?.status] || "Terjadi kesalahan, coba lagi nanti."));
    $("#resume-card").hidden = false;
    return;
  }

  const head = el("section", "card welcome");
  head.append(
    el("h2", "sec-title", me.fresh ? "ID kamu sudah jadi" : "Lanjutkan Training"),
    el("p", "welcome-name", me.name || ""),
    el("div", "reg-id-label", `${LABELS.id} kamu`),
    el("div", "reg-id", me.uid)
  );
  const copy = el("button", "btn-gold small", `Salin ${LABELS.id}`);
  copy.type = "button";
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(me.uid); copy.textContent = "Tersalin"; }
    catch { copy.textContent = `${LABELS.id}: ${me.uid}`; }
  });
  head.append(copy, el("p", "sec-sub", TRAINING.intro));

  const step = el("section", "card");
  box.replaceChildren(head, step);
  box.scrollIntoView({ behavior: "smooth" });

  const finish = (later) => showDone(me.uid, me.name, later);

  if (!m.arbiter_uid) return renderArbiter(step, me, arbs.data || [], finish);
  renderSessions(step, me, m, sess.data || [], finish);
}

function renderArbiter(step, me, arbiters, finish) {
  step.replaceChildren(el("h2", "sec-title", TRAINING.arbiterTitle), el("p", "sec-sub", TRAINING.arbiterText));
  if (!arbiters.length) {
    step.append(el("div", "notice error", TRAINING.arbiterEmpty));
    const later = el("button", "btn-gold small", TRAINING.laterLabel);
    later.type = "button";
    later.addEventListener("click", () => finish(true));
    step.append(later);
    return;
  }
  let picked = null;
  const list = el("div", "pick-list");
  const submit = el("button", "btn-gold", "Ajukan sebagai Trainee");
  submit.type = "button";
  submit.disabled = true;
  const out = el("div");
  for (const a of arbiters) {
    const b = el("button", "pick-item");
    b.type = "button";
    b.append(el("span", "pick-name", a.name), el("span", "pick-sub", `${LABELS.id}: ${a.uid}`));
    b.addEventListener("click", () => {
      picked = a.uid;
      for (const x of list.children) x.classList.toggle("on", x === b);
      submit.disabled = false;
    });
    list.append(b);
  }
  submit.addEventListener("click", async () => {
    submit.disabled = true;
    const { data, error } = await sb.rpc("choose_arbiter", { p_uid: me.uid, p_pin: me.pin, p_arbiter: picked });
    if (error || data !== "ok") {
      submit.disabled = false;
      return say(out, "error", TR_MSG[data] || "Terjadi kesalahan, coba lagi nanti.");
    }
    startTraining({ ...me, fresh: me.fresh });
  });
  step.append(list, el("p", "muted small-text", TRAINING.arbiterWarn), submit, out);
}

function renderSessions(step, me, m, sessions, finish) {
  const joined = new Set(m.session_ids || []);
  const hasRequired = sessions.some((s) => joined.has(s.id) && s.trainer_uid === m.arbiter_uid);
  step.replaceChildren(
    el("h2", "sec-title", TRAINING.sessionsTitle),
    el("p", "sec-sub", `Arbiter-mu: ${m.arbiter_name}. ${TRAINING.sessionsText}`),
    el("p", "muted small-text", TRAINING.tip)
  );
  const out = el("div");

  if (!sessions.length) step.append(el("div", "notice", TRAINING.noSessions));
  for (const kind of Object.keys(TRAINING.kinds)) {
    const rows = sessions.filter((s) => s.kind === kind);
    if (!rows.length) continue;
    step.append(el("h3", "sub-title", TRAINING.kinds[kind]));
    for (const s of rows) {
      const card = el("div", "session");
      const top = el("div", "session-top");
      top.append(el("strong", "", fmtWhen(s.starts_at)));
      if (s.trainer_uid === m.arbiter_uid) top.append(el("span", "badge-mine", TRAINING.mineBadge));
      card.append(top, el("div", "session-sub", `Dipandu ${s.trainer_name}${s.note ? ` • ${s.note}` : ""}`));
      const people = s.participants || [];
      card.append(el("div", "session-sub", people.length ? `Peserta (${people.length}): ${people.join(", ")}` : "Belum ada peserta"));
      const btn = el("button", joined.has(s.id) ? "btn-gold small done" : "btn-gold small", joined.has(s.id) ? "Sudah terdaftar" : "Ikut sesi ini");
      btn.type = "button";
      btn.disabled = joined.has(s.id);
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const { data, error } = await sb.rpc("join_session", { p_uid: me.uid, p_pin: me.pin, p_session: s.id });
        if (error || data !== "ok") {
          btn.disabled = false;
          return say(out, "error", TR_MSG[data] || "Terjadi kesalahan, coba lagi nanti.");
        }
        startTraining(me);
      });
      card.append(btn);
      step.append(card);
    }
  }

  step.append(el("div", `notice ${hasRequired ? "ok" : "error"}`, hasRequired ? TRAINING.requiredOk : TRAINING.requiredNo));
  const done = el("button", "btn-gold", TRAINING.finishLabel);
  done.type = "button";
  done.disabled = !hasRequired;
  done.addEventListener("click", () => finish(false));
  const later = el("button", "btn-ghost small", TRAINING.laterLabel);
  later.type = "button";
  later.addEventListener("click", () => finish(true));
  step.append(el("div", "redeem-actions"), out);
  step.lastChild.previousSibling.append(done, later);
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
    return startTraining({ uid: r.out_uid, name: r.out_name, pin, fresh: true });
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

/* ---------------------------------------------------------- lanjutkan training */

$("#res-pin").addEventListener("input", (ev) => { ev.target.value = ev.target.value.toUpperCase(); });
$("#res-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const out = $("#res-result");
  const uid = $("#res-uid").value.trim();
  const pin = $("#res-pin").value.trim();
  if (!uid || !pin) return say(out, "error", `Isi ${LABELS.id} dan ${LABELS.pin} dulu.`);
  if (!configured) return say(out, "error", "Database belum dikonfigurasi (lihat README).");
  const btn = ev.target.querySelector("button");
  btn.disabled = true;
  const { data, error } = await sb.rpc("my_training", { p_uid: uid, p_pin: pin });
  btn.disabled = false;
  const r = data?.[0];
  if (error || r?.status !== "ok") return say(out, "error", TR_MSG[r?.status] || "Terjadi kesalahan, coba lagi nanti.");
  out.replaceChildren();
  $("#res-pin").value = "";
  const { member } = await lookupMember(uid);
  startTraining({ uid, pin, name: member?.name || "", fresh: false });
});
