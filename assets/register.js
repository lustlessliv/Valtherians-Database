// Halaman Daftar (tersembunyi): nama + Emblem -> ID otomatis, kartu sambutan, dan ganti nama.
import "./layout.js";
import { configured, el, sb } from "./lib.js";
import { LABELS, WELCOME, TRAINING, SITE } from "./config.js";
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
/* ---------------------------------------------------------- menu (tab) */

const MODES = ["register", "resume", "rename"];
let mode = null;

function setMode(next) {
  mode = next;
  const tabs = $("#mode-tabs");
  tabs.replaceChildren();
  for (const m of MODES) {
    const b = el("button", "tab" + (m === mode ? " active" : ""), TRAINING.tabs[m]);
    b.type = "button";
    b.role = "tab";
    b.style.setProperty("--c", "var(--gold)");
    b.addEventListener("click", () => setMode(m));
    tabs.append(b);
  }
  for (const m of MODES) $(`#${m}-card`).hidden = m !== mode;
  $("#mode-hint").textContent = mode ? "" : TRAINING.tabsHint;
}
setMode(new URLSearchParams(location.search).get("tab") === "resume" ? "resume" : null);

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

// Layar akhir: kartu sambutan + ID card + tautan. later = member menunda memilih jadwal.
async function showDone(uid, name, later = false) {
  const done = $("#done");
  done.replaceChildren();
  setMode(null);
  $("#mode-tabs").style.display = "none"; // layar akhir tanpa menu
  $("#mode-hint").textContent = "";
  const hero = document.querySelector(".hero");
  if (hero) hero.style.display = "none"; // hero tidak dibawa lagi setelah alur dimulai

  const welcome = el("section", "card welcome highlight");
  welcome.append(
    crest(),
    el("h2", "sec-title", TRAINING.doneTitle),
    el("div", "hl-rule"),
    el("p", "welcome-name", name),
    el("p", "sec-sub", WELCOME.doneText)
  );
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

  done.hidden = false;
  done.scrollIntoView({ behavior: "smooth" });
}

/* ---------------------------------------------------------- training */

// Logo kecil di kotak sambutan
function crest() {
  const img = new Image();
  img.className = "hl-logo";
  img.alt = "";
  img.src = new URL("../" + SITE.logo, import.meta.url).href;
  img.addEventListener("error", () => img.remove());
  return img;
}

const TR_MSG = {
  invalid: `${LABELS.id} atau ${LABELS.pin} tidak cocok.`,
  not_member: `${LABELS.id} tidak ditemukan.`,
  locked: "Terlalu banyak percobaan salah. Coba lagi beberapa menit lagi.",
  already: "Arbiter sudah dipilih sebelumnya. Hanya Triune yang bisa mengubahnya.",
  bad_arbiter: "Arbiter itu tidak tersedia.",
  no_session: "Ada sesi yang sudah tidak tersedia. Muat ulang jadwal lalu pilih lagi.",
  need_both: "Kamu harus mengambil kedua jenis sesi.",
  too_many: "Pilih tepat 1 sesi untuk tiap jenis.",
  conflict: "Dua sesi yang kamu pilih punya tanggal dan jam yang sama.",
  need_arbiter: "Minimal satu sesi harus dipandu Arbiter pilihanmu.",
};

function fmtWhen(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long" });
  const hm = d.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  return `${day}, ${hm} WIB`;
}

// Layar Training: kotak atas (sambutan + ID, dibuat lebih terang) dan kartu Arbiter + jadwal.
async function startTraining(me) {
  const box = $("#done");
  for (const m of MODES) $(`#${m}-card`).hidden = true;
  $("#mode-tabs").style.display = "none";
  $("#mode-hint").textContent = "";
  box.hidden = false;

  const [mine, arbs, sess] = await Promise.all([
    sb.rpc("my_training", { p_uid: me.uid, p_pin: me.pin }),
    sb.rpc("get_arbiters"),
    sb.rpc("get_training_sessions"),
  ]);
  const m = mine.data?.[0];
  if (mine.error || m?.status !== "ok") {
    box.replaceChildren(el("div", "notice error", TR_MSG[m?.status] || "Terjadi kesalahan, coba lagi nanti."));
    $("#mode-tabs").style.display = "";
    setMode("resume");
    return;
  }

  const heroEl = document.querySelector(".hero");
  if (heroEl) heroEl.style.display = "none"; // hero hilang setelah ID + Emblem berhasil dimasukkan
  const head = el("section", "card welcome highlight");
  head.append(
    crest(),
    el("h2", "sec-title", me.fresh ? TRAINING.doneTitle : "Lanjutkan Training"),
    el("div", "hl-rule"),
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
  head.append(copy, el("p", "sec-sub", WELCOME.doneText), el("p", "sec-sub", TRAINING.intro));

  const step = el("section", "card");
  box.replaceChildren(head, step);
  box.scrollIntoView({ behavior: "smooth" });
  renderTraining(step, me, m, arbs.data || [], sess.data || []);
}

// Satu layar: pilih Arbiter + jadwal, lalu "Ajukan status Trainee".
// Aturan: tepat 1 sesi tiap jenis, salah satunya dipandu Arbiter pilihan, dan tanggal & jam tidak boleh sama.
function renderTraining(step, me, m, arbiters, sessions) {
  const joined = new Set(m.session_ids || []);
  const chosen = { sistem: null, ekspedisi: null }; // satu sesi per jenis (belum disimpan)
  const have = { sistem: !!m.has_sistem, ekspedisi: !!m.has_ekspedisi }; // jenis yang sudah terdaftar
  let arb = m.arbiter_uid || null;
  const out = el("div");

  const byId = new Map(sessions.map((s) => [s.id, s]));
  // waktu mulai semua sesi yang sudah dipilih / sudah terdaftar (untuk blokir bentrok)
  const takenTimes = (exceptKind) => {
    const times = [];
    for (const id of joined) { const s = byId.get(id); if (s) times.push(s.starts_at); }
    for (const k of Object.keys(chosen)) if (k !== exceptKind && chosen[k]) times.push(byId.get(chosen[k])?.starts_at);
    return times.map((x) => new Date(x).getTime());
  };

  function draw() {
    step.replaceChildren(el("h2", "sec-title", TRAINING.title), el("p", "sec-sub", TRAINING.rules));

    // --- Arbiter
    step.append(el("h3", "sub-title", TRAINING.arbiterLabel));
    if (m.arbiter_uid) {
      step.append(el("p", "sec-sub", `${TRAINING.arbiterFixed}: ${m.arbiter_name}`));
    } else if (!arbiters.length) {
      step.append(el("div", "notice error", TRAINING.arbiterEmpty));
    } else {
      const list = el("div", "pick-list");
      for (const a of arbiters) {
        const n = sessions.filter((s) => s.trainer_uid === a.uid).length;
        const b = el("button", "pick-item" + (arb === a.uid ? " on" : ""));
        b.type = "button";
        b.append(el("span", "pick-name", a.name), el("span", "pick-sub", `${n} sesi terjadwal`));
        b.addEventListener("click", () => { arb = a.uid; draw(); });
        list.append(b);
      }
      step.append(list, el("p", "muted small-text", TRAINING.arbiterWarn));
    }

    // --- Jadwal
    step.append(el("p", "muted small-text", TRAINING.tip));
    if (!sessions.length) step.append(el("div", "notice", TRAINING.noSessions));
    for (const kind of Object.keys(TRAINING.kinds)) {
      const rows = sessions.filter((s) => s.kind === kind);
      if (!rows.length) continue;
      step.append(el("h3", "sub-title", TRAINING.kinds[kind]));
      const blocked = takenTimes(kind);
      for (const s of rows) {
        const isJoined = joined.has(s.id);
        const isOn = chosen[kind] === s.id;
        const clash = !isJoined && !isOn && blocked.includes(new Date(s.starts_at).getTime());
        const kindFull = !isJoined && !isOn && have[kind]; // jenis ini sudah terdaftar
        const card = el("div", "session" + (isOn || isJoined ? " picked" : "") + (clash || kindFull ? " blocked" : ""));
        const top = el("div", "session-top");
        top.append(el("strong", "", fmtWhen(s.starts_at)));
        if (arb && s.trainer_uid === arb) top.append(el("span", "badge-mine", TRAINING.mineBadge));
        card.append(top, el("div", "session-sub", `Dipandu ${s.trainer_name}${s.note ? ` • ${s.note}` : ""}`));
        const people = s.participants || [];
        card.append(el("div", "session-sub", people.length ? `Peserta (${people.length}): ${people.join(", ")}` : "Belum ada peserta"));
        const label = isJoined ? "Sudah terdaftar" : isOn ? "Batal pilih" : clash ? TRAINING.clashLabel : kindFull ? TRAINING.kindDoneLabel : "Pilih sesi ini";
        const btn = el("button", "btn-gold small" + (isOn ? " on" : ""), label);
        btn.type = "button";
        btn.disabled = isJoined || clash || kindFull;
        btn.addEventListener("click", () => { chosen[kind] = isOn ? null : s.id; draw(); });
        card.append(btn);
        step.append(card);
      }
    }

    // --- Syarat
    const picked = Object.values(chosen).filter(Boolean).map((id) => byId.get(id));
    const ok = {
      arbiter: !!arb,
      sistem: have.sistem || !!chosen.sistem,
      ekspedisi: have.ekspedisi || !!chosen.ekspedisi,
      mine: !!arb && (m.has_arbiter_session || picked.some((s) => s.trainer_uid === arb)),
    };
    const list = el("ul", "checklist");
    for (const k of Object.keys(TRAINING.checks)) list.append(el("li", ok[k] ? "yes" : "no", `${ok[k] ? "✓" : "○"} ${TRAINING.checks[k]}`));
    step.append(list);

    const all = Object.values(ok).every(Boolean);
    const submit = el("button", "btn-gold", m.arbiter_uid ? TRAINING.saveLabel : TRAINING.submitLabel);
    submit.type = "button";
    submit.disabled = !all;
    submit.addEventListener("click", async () => {
      submit.disabled = true;
      const { data, error } = await sb.rpc("apply_trainee", { p_uid: me.uid, p_pin: me.pin, p_arbiter: arb, p_sessions: picked.map((s) => s.id) });
      if (error || data !== "ok") {
        submit.disabled = false;
        return say(out, "error", TR_MSG[data] || "Terjadi kesalahan, coba lagi nanti.");
      }
      showDone(me.uid, me.name, false);
    });
    const later = el("button", "btn-ghost small", TRAINING.laterLabel);
    later.type = "button";
    later.addEventListener("click", () => showDone(me.uid, me.name, true));
    const actions = el("div", "redeem-actions");
    actions.append(submit, later);
    step.append(actions, out);
  }
  draw();
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
