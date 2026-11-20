// Boot: load the save (or show character creation) and start. Loaded last.
"use strict";

// ---------- boot ----------
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
window.addEventListener("beforeunload", save);
try { const h = window.claude && window.claude.hot; if (h && typeof h.snapshot === "function") h.snapshot(() => ({ S, draft })); } catch (e) {}

function boot(data) {
  data = data || {};
  S = data.S || load();
  draft = data.draft || null;
  if (S) migrate();
  if (S && !data.S && S.savedAt) catchUp(Date.now() - S.savedAt);
  if (S) startGame(); else showCreate();
}
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
