// Menyusun navbar, hero (logo + banner), dan footer untuk semua halaman.
// Isi & gambarnya diatur di config.js. Halaman cukup memakai <body data-page="...">.
import { SITE, NAV, PAGES } from "./config.js";

const ROOT = new URL("../", import.meta.url); // folder utama website
const url = (p) => new URL(p || "./", ROOT).href; // "" = halaman utama

function make(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
function img(cls, src, alt = "") {
  const n = document.createElement("img");
  if (cls) n.className = cls;
  n.src = url(src);
  n.alt = alt;
  return n;
}

function buildNav(page) {
  const nav = make("nav", "site-nav");
  nav.setAttribute("aria-label", "Navigasi utama");
  const brand = make("a", "brand");
  brand.href = url("");
  brand.append(img("", SITE.logo), make("span", "", SITE.brand));
  const links = make("div", "nav-links");
  for (const n of NAV) {
    if (n.hidden && n.key !== page) continue;
    const a = make("a");
    a.href = url(n.href);
    a.textContent = n.label;
    if (n.key === page) { a.className = "active"; a.setAttribute("aria-current", "page"); }
    links.append(a);
  }
  nav.append(brand, links);
  return nav;
}

function buildHero(info) {
  const hero = make("header", "hero" + (info.small ? " small" : ""));
  if (info.small) {
    hero.append(make("h1", "", info.title), make("p", "sub", info.sub));
    return hero;
  }
  const card = make("div", "hero-card");
  if (SITE.bannerLeft) card.append(img("banner left", SITE.bannerLeft));
  if (SITE.bannerRight) card.append(img("banner right", SITE.bannerRight));
