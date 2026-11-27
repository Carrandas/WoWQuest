// Small helpers used everywhere: random picks, escaping, number and money formatting.
"use strict";
const VERSION = "1.1.1";

// ---------- tiny helpers ----------
const R = n => Math.floor(Math.random() * n);
const pick = a => a[R(a.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const article = s => (/^[aeiou]/i.test(s) ? "an " : "a ") + s;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const MIN = 60000, HOUR = 3600000, DAY = 86400000, WEEK = 7 * DAY;
const fmtTime = ms => { const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60;
  return (d ? d + "d " : "") + (d || h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const fmtPlayed = ms => { const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
  return `${d} days, ${h} hours, ${m} minutes`; };
const money = c => { c = Math.max(0, Math.floor(c)); const g = Math.floor(c / 10000), s = Math.floor(c / 100) % 100, k = c % 100;
  return `<span class="money">${g ? `<span class="g">${g.toLocaleString()}g</span> ` : ""}${g || s ? `<span class="s">${s}s</span> ` : ""}<span class="c">${k}c</span></span>`; };
const moneyTxt = c => { c = Math.max(0, Math.floor(c)); const g = Math.floor(c / 10000), s = Math.floor(c / 100) % 100, k = c % 100;
  return [g ? g + "g" : "", s ? s + "s" : "", k || (!g && !s) ? k + "c" : ""].filter(Boolean).join(" "); };

const $ = id => document.getElementById(id);
// a click on any (enabled) button inside an element calls fn with that button
const onButton = (id, fn) => $(id).addEventListener("click", e => { const b = e.target.closest("button"); if (b && !b.disabled) fn(b); });
