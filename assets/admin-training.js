import { sb, el } from "./lib.js";
import { LABELS, TRAINING } from "./config.js";
import { logAction } from "./adminlog.js";

const $ = (q) => document.querySelector(q);
let tm;

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(tm);
  tm = setTimeout(() => (t.className = "toast"), 3500);
}

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) + " WIB";

let staff = [];

function fillSelect(sel, rows, placeholder) {
  const keep = sel.value;
  sel.replaceChildren();
  if (placeholder) sel.append(new Option(placeholder, ""));
  for (const r of rows) sel.append(new Option(`${r.name} (${r.uid})`, r.uid));
  if ([...sel.options].some((o) => o.value === keep)) sel.value = keep;
}

async function load() {
  const [st, se] = await Promise.all([
    sb.from("staff").select("uid,name,role,division,active").eq("active", true).order("name"),
    sb.from("training_sessions").select("id,kind,trainer_uid,starts_at,note,training_signups(uid,score)")
      .order("starts_at", { ascending: false }).limit(80),
  ]);
  if (st.error || se.error) {
    $("#train-note").textContent = "Tabel Training belum ada. Jalankan supabase-training.sql dulu.";
    return;
  }
  staff = st.data;
  fillSelect($("#train-trainer"), staff, "Pilih Triune");
  fillSelect($("#arb-select"), staff.filter((s) => s.division === "Arbiter" || s.role === "Marshal"), "Pilih Arbiter");

  const names = new Map(staff.map((s) => [s.uid, s.name]));
  const body = $("#train-body");
  body.replaceChildren();
  const now = Date.now();
  for (const s of se.data) {
    const signups = s.training_signups || [];
    const people = signups.map((x) => x.uid);
    const tr = el("tr");
    if (new Date(s.starts_at) < now) tr.className = "past";
    const del = el("button", "btn small danger", "Hapus");
    del.type = "button";
    del.addEventListener("click", async () => {
      const msg = people.length
        ? `Hapus sesi ini? ${people.length} peserta akan terlepas dari sesi (tidak ada pemberitahuan otomatis, hubungi mereka langsung).`
        : "Hapus sesi ini?";
      if (!confirm(msg)) return;
      const { error } = await sb.from("training_sessions").delete().eq("id", s.id);
      if (error) return toast(error.message, true);
      toast("Sesi dihapus.");
      logAction("training", `Hapus sesi ${TRAINING.kinds[s.kind] || s.kind} (${new Date(s.starts_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })})`);
      load();
    });
    const act = el("td");
    if (people.length) {
      const grade = el("button", "btn small", "Skor");
      grade.type = "button";
      grade.addEventListener("click", () => openScores(s, signups));
      act.append(grade, " ");
    }
    act.append(del);
    tr.append(
      el("td", "", fmtWhen(s.starts_at)),
      el("td", "", TRAINING.kinds[s.kind] || s.kind),
      el("td", "", names.get(s.trainer_uid) || s.trainer_uid),
      el("td", "", s.note || ""),
      el("td", "", people.length ? `${people.length}: ${people.join(", ")}` : "-"),
      act
    );
    body.append(tr);
  }
  $("#train-note").textContent = se.data.length ? "Sesi yang sudah lewat tampil redup." : "Belum ada sesi.";
}


async function openScores(session, signups) {
  const panel = $("#score-panel");
  panel.hidden = false;
  panel.replaceChildren(el("h3", "", `Skor sesi ${TRAINING.kinds[session.kind] || session.kind} · ${fmtWhen(session.starts_at)}`));
  const { data: names } = await sb.from("players").select("uid,name").in("uid", signups.map((x) => x.uid));
  const nameOf = new Map((names || []).map((n) => [n.uid, n.name]));
  const inputs = [];
  for (const sg of signups) {
    const row = el("div", "score-row");
    const inp = el("input");
    inp.type = "number"; inp.min = 0; inp.max = 100; inp.inputMode = "numeric";
    inp.value = sg.score ?? "";
    inp.placeholder = "0-100";
    inputs.push([sg.uid, inp]);
    row.append(el("span", "", `${sg.uid} · ${nameOf.get(sg.uid) || "?"}`), inp);
    panel.append(row);
  }
  const save = el("button", "btn primary", "Simpan skor");
  save.type = "button";
  save.addEventListener("click", async () => {
    save.disabled = true;
    let failed = null;
    for (const [uid, inp] of inputs) {
      const v = inp.value.trim() === "" ? null : Number(inp.value);
      if (v !== null && !(v >= 0 && v <= 100)) { failed = `Skor ${uid} harus 0 sampai 100.`; break; }
      const { error } = await sb.from("training_signups").update({ score: v }).eq("session_id", session.id).eq("uid", uid);
      if (error) { failed = error.message; break; }
    }
    save.disabled = false;
    if (failed) return toast(failed, true);
    toast("Skor disimpan.");
    logAction("training", `Ubah skor sesi ${TRAINING.kinds[session.kind] || session.kind || ""}`.trim());
    panel.hidden = true;
    load();
  });
  panel.append(save);
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

$("#train-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const kind = $("#train-kind").value;
  const trainer = $("#train-trainer").value;
  const when = $("#train-when").value; // WIB
  if (!trainer || !when) return toast("Isi Triune pemandu dan waktu dulu.", true);
  const { error } = await sb.from("training_sessions").insert({
    kind,
    trainer_uid: trainer,
    starts_at: new Date(`${when}:00+07:00`).toISOString(),
    note: $("#train-text").value.trim() || null,
  });
  if (error) return toast(error.message, true);
  $("#train-text").value = "";
  toast("Sesi ditambahkan.");
  logAction("training", `Tambah sesi ${TRAINING.kinds[kind] || kind} (${when.replace("T", " ")} WIB)`);
  load();
});

// Arbiter //
$("#arb-show").addEventListener("click", async () => {
  const uid = $("#arb-uid").value.trim();
  const out = $("#arb-out");
  if (!uid) return;
  const { data, error } = await sb.from("trainee_arbiter").select("arbiter_uid").eq("uid", uid).maybeSingle();
  if (error) return toast(error.message, true);
  const name = data ? staff.find((s) => s.uid === data.arbiter_uid)?.name || data.arbiter_uid : null;
  out.textContent = name ? `Arbiter ${LABELS.id} ${uid}: ${name}` : `${LABELS.id} ${uid} belum memilih Arbiter.`;
});

$("#arb-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const uid = $("#arb-uid").value.trim();
  const arb = $("#arb-select").value;
  if (!uid || !arb) return toast(`Isi ${LABELS.id} dan Arbiter dulu.`, true);
  const { error } = await sb.from("trainee_arbiter").upsert({ uid, arbiter_uid: arb, chosen_at: new Date().toISOString() });
  if (error) return toast(error.code === "23503" ? `${LABELS.id} ${uid} tidak ditemukan sebagai member.` : error.message, true);
  $("#arb-out").textContent = `Arbiter ${LABELS.id} ${uid} diubah.`;
  toast("Arbiter diubah.");
  logAction("training", `Ubah Arbiter ${LABELS.id} ${uid}`);
});

const app = $("#app");
new MutationObserver(() => { if (!app.hidden) load(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) load();
