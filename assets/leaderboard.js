import { R as RANKS, c as configured, e as el, T as TOP, r as rangeText, f as fmt, s as sb } from "./shared-BhyKLrjU.js";

const $ = (q) => document.querySelector(q);
const REFRESH_MS = 60000;

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
  info.append(h, el("span", "range", `Poin ${rangeText(rank)} • Top ${TOP} dari ${fmt.format(total)} Valtherians`));

  const board = $("#board");
  board.replaceChildren();
  if (rows.length === 0) {
    board.append(el("li", "empty", "Belum ada Valtherians di rank ini."));
    return;
  }
  for (const p of rows) {
    const li = el("li", "row");
    li.append(
      el("span", "pos" + (p.pos <= 3 ? ` top${p.pos}` : ""), String(p.pos)),
      el("span", "name", p.name),
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
