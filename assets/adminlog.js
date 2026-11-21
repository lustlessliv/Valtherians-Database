import { sb, el } from "./lib.js";

const TABS = ["emblem", "training", "repository", "redeem"];

async function loadTabLog(tab) {
  const list = document.querySelector(`#log-${tab}`);
  if (!list) return;
  const { data, error } = await sb.from("admin_log").select("*").eq("tab", tab).order("id", { ascending: false }).limit(30);
  list.replaceChildren();
  if (error) return list.append(el("li", "empty", "Gagal memuat riwayat. Jalankan SQL admin_log dulu."));
  if (!data.length) return list.append(el("li", "empty", "Belum ada riwayat."));
  for (const r of data) {
    const when = new Date(r.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    const li = el("li", "log-row");
    li.append(el("span", "log-time", when), el("span", "log-text", r.by_name ? `${r.text} · ${r.by_name}` : r.text));
    list.append(li);
  }
}

export async function logAction(tab, text) {
  try {
    const { data } = await sb.auth.getSession();
    const by = data?.session?.user?.email?.split("@")[0] || null;
    await sb.from("admin_log").insert({ tab, text, by_name: by });
  } catch {  }
  loadTabLog(tab);
}

const app = document.querySelector("#app");
const loadAll = () => TABS.forEach(loadTabLog);
new MutationObserver(() => { if (!app.hidden) loadAll(); }).observe(app, { attributes: true, attributeFilter: ["hidden"] });
if (!app.hidden) loadAll();
