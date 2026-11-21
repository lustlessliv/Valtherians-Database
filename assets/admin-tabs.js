const TABS = [
  { id: "valtherians", label: "Valtherians" },
  { id: "emblem", label: "Emblem" },
  { id: "training", label: "Training" },
  { id: "repository", label: "Repository" },
  { id: "redeem", label: "Kode Redeem" },
];
const KEY = "vla_admin_tab";

const $ = (q) => document.querySelector(q);
const bar = $("#admin-tabs");

function saved() {
  const fromHash = location.hash.replace("#", "");
  if (TABS.some((t) => t.id === fromHash)) return fromHash;
  try {
    const v = sessionStorage.getItem(KEY);
    if (TABS.some((t) => t.id === v)) return v;
  } catch {  }
  return TABS[0].id;
}

function show(id) {
  for (const b of bar.children) {
    const on = b.dataset.tab === id;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on);
  }
  for (const s of document.querySelectorAll("[data-tab]")) {
    if (s.parentElement === bar) continue;
    s.classList.toggle("tab-hidden", s.dataset.tab !== id);
  }
  try { sessionStorage.setItem(KEY, id); } catch {  }
  history.replaceState(null, "", `#${id}`);
}

for (const t of TABS) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tab";
  b.role = "tab";
  b.dataset.tab = t.id;
  b.style.setProperty("--c", "var(--gold)");
  b.textContent = t.label;
  b.addEventListener("click", () => { show(t.id); window.scrollTo({ top: 0 }); });
  bar.append(b);
}
show(saved());
