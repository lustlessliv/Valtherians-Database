import { sb, el } from "./lib.js";
import { UNIFORMS } from "./config.js";
import { logAction } from "./adminlog.js";

const $ = (q) => document.querySelector(q);
const MAX_BYTES = 8 * 1024 * 1024;
let tm;

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(tm);
  tm = setTimeout(() => (t.className = "toast"), 3500);
}

const fmtDate = (iso) => new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function load() {
  const { data, error } = await sb.from("uniform_files").select("id,min_level,file_name,updated_at").order("sort");
  if (error) {
    $("#uniform-note").textContent = "Tabel Uniform belum ada. Jalankan supabase-v6.sql dulu.";
    return;
  }
  const list = $("#uniform-list");
  list.replaceChildren();
  for (const row of data) {
    const meta = UNIFORMS.find((u) => u.id === row.id) || { rank: row.id, name: "" };
    const box = el("div", "uniform-admin");
    box.append(el("strong", "", `${meta.rank}${meta.name ? ` · ${meta.name}` : ""}`));
    box.append(el("div", "muted small-text", row.file_name ? `File: ${row.file_name} (${fmtDate(row.updated_at)})` : "Belum ada file"));
    const inp = el("input");
    inp.type = "file";
    inp.accept = "application/pdf";
    const up = el("button", "btn primary small", row.file_name ? "Ganti file" : "Unggah");
    up.type = "button";
    up.addEventListener("click", async () => {
      const f = inp.files?.[0];
      if (!f) return toast("Pilih file PDF dulu.", true);
      if (f.type !== "application/pdf") return toast("File harus PDF.", true);
      if (f.size > MAX_BYTES) return toast("Ukuran file maksimal 8 MB.", true);
      up.disabled = true;
      try {
        const b64 = await readBase64(f);
        const { error: e } = await sb.from("uniform_files")
          .update({ file_name: f.name, file_b64: b64, updated_at: new Date().toISOString() }).eq("id", row.id);
        if (e) throw e;
        toast("File diunggah.");
        logAction("repository", `Unggah uniform ${meta.rank}: ${f.name}`);
        load();
      } catch (e) {
        toast(e.message || "Gagal mengunggah.", true);
      }
      up.disabled = false;
    });
    const actions = el("div", "uniform-admin-actions");
    actions.append(inp, up);
    if (row.file_name) {
      const del = el("button", "btn small danger", "Hapus file");
      del.type = "button";
      del.addEventListener("click", async () => {
        if (!confirm("Hapus file uniform ini?")) return;
        const { error: e } = await sb.from("uniform_files").update({ file_name: null, file_b64: null, updated_at: null }).eq("id", row.id);
        if (e) return toast(e.message, true);
        toast("File dihapus.");
        logAction("repository", `Hapus file uniform ${meta.rank}`);
        load();
      });
      actions.append(del);
    }
    box.append(actions);
    list.append(box);
  }
  $("#uniform-note").textContent = "Akses kumulatif: Knight bisa membuka Aspirant + Knight, dan seterusnya. Triune bisa membuka semuanya.";
}

const app = $("#app");
new MutationObserver(() => { if (!app.hidden) load(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) load();
