import { el, fmt } from "./lib.js";
import { SITE, LABELS, STAFF_COLOR } from "./config.js";
import { KNIGHT, rankOf, staffTag } from "./api.js";
import { RANKS } from "./lib.js";

const ROOT = new URL("../", import.meta.url);

function field(label, value) {
  const f = el("div", "id-field");
  f.append(el("div", "id-label", label), el("div", "id-value", value));
  return f;
}

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", { dateStyle: "long" });

/* ---------------------------------------------------------- ID card */

export function buildIdCard(m) {
  const isStaff = m.kind === "staff";
  const rank = isStaff ? null : rankOf(m.rank_id);
  const color = isStaff ? STAFF_COLOR : rank.color;

  const card = el("div", "idcard");
  card.style.setProperty("--c", color);

  const head = el("div", "id-head");
  const logo = el("img", "id-logo");
  logo.src = new URL(SITE.logo, ROOT).href;
  logo.alt = "";
  head.append(logo, el("span", "id-org", SITE.idCardTitle), el("span", "id-kind", "ID Card"));

  const body = el("div", "id-body");
  body.append(el("div", "id-avatar", (m.name || "?").trim().charAt(0).toUpperCase()));
  const main = el("div", "id-main");
  main.append(el("div", "id-name", m.name), el("div", "id-uid", `${LABELS.id} ${m.uid}`));
  const badges = el("div", "id-badges");
  badges.append(el("span", "id-rank", isStaff ? staffTag(m) : rank.name));
  main.append(badges);
  if (m.title) main.append(el("div", "id-title", `✦ ${m.title}`));
  body.append(main);

  const grid = el("div", "id-grid");
  if (isStaff) {
    grid.append(field("Status", m.active ? "Active" : "Deactive"));
  } else {
    grid.append(field(LABELS.points, fmt.format(m.score)));
    if (m.rank_id) {
      const overall = m.overall_pos != null ? `#${fmt.format(m.overall_pos)} dari ${fmt.format(m.overall_total)}` : `#${m.pos} dari ${fmt.format(m.total)}`;
      grid.append(field("Posisi", overall));
    } else {
      grid.append(field("Status", LABELS.unranked));
    }
  }
  if (m.joined_at) grid.append(field("Bergabung", fmtDate(m.joined_at)));

  card.append(head, body, grid);

  if (!isStaff && !m.rank_id) {
    const need = Math.max(0, KNIGHT.min - m.score);
    card.append(el("div", "id-progress", `${fmt.format(need)} ${LABELS.points} lagi untuk dinobatkan sebagai ${KNIGHT.name}.`));
  }

  if (m.achievements?.length) {
    const extra = el("div", "id-extra");
    extra.append(el("div", "id-label", "Insignia"));
    const chips = el("div", "chips");
    for (const a of m.achievements) chips.append(el("span", "chip", a));
    extra.append(chips);
    card.append(extra);
  }
  card.append(el("div", "id-foot", SITE.idCardFooter));
  return card;
}

/* ---------------------------------------------------------- cek Sigil */

function progressInfo(score) {
  const i = RANKS.findIndex((r) => score >= r.min);
  if (i === -1) return { next: KNIGHT, from: 0 };
  return { next: i > 0 ? RANKS[i - 1] : null, from: RANKS[i].min };
}

export function statusCard(m) {
  const isStaff = m.kind === "staff";
  const card = el("div", "status-card");
  card.style.setProperty("--c", isStaff ? STAFF_COLOR : rankOf(m.rank_id).color);

  const top = el("div", "status-top");
  const who = el("div", "");
  who.append(el("div", "status-name", m.name), el("div", "id-uid", `${LABELS.id} ${m.uid}`));
  top.append(who, el("span", "id-rank", isStaff ? staffTag(m) : rankOf(m.rank_id).name));
  card.append(top);

  if (isStaff) {
    card.append(el("div", "status-next", "Staff Triune tidak masuk leaderboard dan tidak memiliki Sigil."));
    return card;
  }

  const pts = el("div", "status-points");
  pts.append(el("span", "status-num", fmt.format(m.score)), el("span", "status-unit", LABELS.points));
  card.append(pts);

  const ranks = el("div", "status-ranks");
  if (m.rank_id && m.pos != null) {
    ranks.append(field(`Peringkat di ${rankOf(m.rank_id).short}`, `#${fmt.format(m.pos)} dari ${fmt.format(m.total)}`));
  }
  if (m.overall_pos != null) {
    ranks.append(field("Peringkat keseluruhan", `#${fmt.format(m.overall_pos)} dari ${fmt.format(m.overall_total)}`));
  }
  if (ranks.children.length) card.append(ranks);

  const { next, from } = progressInfo(m.score);
  if (next) {
    const pct = Math.max(0, Math.min(100, ((m.score - from) / (next.min - from)) * 100));
    const bar = el("div", "bar");
    const fill = el("div", "bar-fill");
    fill.style.width = `${pct}%`;
    bar.append(fill);
    card.append(bar, el("div", "status-next", `${fmt.format(next.min - m.score)} ${LABELS.points} lagi menuju ${next.name}`));
  } else {
    card.append(el("div", "status-next", "Euge! Sudah berada di rank tertinggi."));
  }
  return card;
}
