/* =====================================================================
   wm-consent.js · Consentimiento de cookies · wendymolinares.com
   ---------------------------------------------------------------------
   ESTE ES EL ÚNICO LUGAR DONDE VAN LOS IDs. Todas las páginas cargan
   este archivo: https://wendymolinares.com/wm-consent.js

   Para activar un píxel: reemplaza las X por el ID real y guarda.
   - Mientras un ID tenga X (o esté vacío), se ignora.
   - Si NINGÚN ID está puesto: no aparece banner y no se carga nada de
     terceros. La página de cookies muestra todo como "Aún no".
   - Con al menos un ID: aparece el banner y nada se carga hasta que la
     persona acepte. "Rechazar" pesa lo mismo que "Aceptar".
   - Se respeta Global Privacy Control (GPC).
   - Conversión (p. ej. clic en "Escríbeme"): window.wmTrack('lead')
   - Categorías: Necesarias (siempre), Funcionales, Analítica y Publicidad.
     Funcionales: sin permiso se bloquea la consulta de contacto de PayMeGPT
     (?contact_id=...), así ningún dato sale de la página sin aceptar.
   - Coincidencia avanzada de Meta/OpenAI: puede quedar activa; solo opera si
     la persona acepta Publicidad, y la política de cookies ya lo explica.
   - ?contact_id= se borra de la barra de direcciones al cargar, para que no
     quede en marcadores, capturas, enlaces compartidos ni en Google Analytics.
   ===================================================================== */
window.WM_TRACKING = window.WM_TRACKING || {
  ga4:         "G-XXXXXXXXXX",      // Google Analytics 4         → Analítica
  googleAds:   "AW-XXXXXXXXXX",     // Google Ads                 → Publicidad
  metaPixel:   "XXXXXXXXXXXXXXX",   // Píxel de Meta (15-16 dígitos) → Publicidad
  openaiPixel: "XXXXXXXXXXXX"       // Píxel de OpenAI (Pixel ID de ChatGPT Ads) → Publicidad
};
(function () {
  "use strict";
  var RAW = window.WM_TRACKING, KEY = "wm-consent", VERSION = 1, POLICY = "https://wendymolinares.com/legal/cookies/";
  function real(v) { v = (v || "").trim(); return v && !/X{8,}/.test(v) ? v : ""; }
  var CFG = { ga4: real(RAW.ga4), googleAds: real(RAW.googleAds), metaPixel: real(RAW.metaPixel), openaiPixel: real(RAW.openaiPixel) };
  var hasAnalytics = !!CFG.ga4;
  var hasMarketing = !!(CFG.googleAds || CFG.metaPixel || CFG.openaiPixel);
  var anyTracker = hasAnalytics || hasMarketing;
  var gpc = navigator.globalPrivacyControl === true;
  var loaded = { google: false, meta: false, openai: false };

  var T = {
    es: {
      title: "Tú decides qué se mide",
      body: "Este sitio puede usar cookies para personalizar la página, medir qué contenido sirve y mostrarte anuncios de mi trabajo en Google, Meta y ChatGPT. Nada de eso se activa sin tu permiso. Si rechazas, puedes ver el sitio completo igual.",
      accept: "Aceptar todo", reject: "Rechazar todo", choose: "Elegir", save: "Guardar mi elección",
      prefsTitle: "Preferencias de cookies",
      nec: "Necesarias", necD: "Guardan tu idioma, tus ajustes de accesibilidad y esta elección. Siempre activas; no rastrean.",
      fun: "Funcionales", funD: "Personalizan la página cuando llegas desde un enlace mío, por ejemplo de un correo.",
      ana: "Analítica", anaD: "Google Analytics: cuántas personas visitan cada página y desde dónde llegan.",
      mkt: "Publicidad", mktD: "Google Ads, Meta y OpenAI (ChatGPT): medir si un anuncio funcionó y mostrar anuncios de mi trabajo.",
      off: "No se usa por ahora", always: "Siempre activas",
      gpc: "Tu navegador envía la señal Global Privacy Control, así que dejé todo desactivado.",
      none: "Hoy este sitio no usa analítica ni publicidad. Si algún día las activo, te pediré permiso aquí.",
      more: "Política de cookies", close: "Cerrar"
    },
    en: {
      title: "You decide what gets measured",
      body: "This site can use cookies to personalize the page, see which content is useful and show you ads for my work on Google, Meta and ChatGPT. None of it turns on without your permission. If you decline, you still get the full site.",
      accept: "Accept all", reject: "Reject all", choose: "Choose", save: "Save my choice",
      prefsTitle: "Cookie preferences",
      nec: "Necessary", necD: "They remember your language, your accessibility settings and this choice. Always on; they don't track you.",
      fun: "Functional", funD: "They personalize the page when you arrive from a link I sent you, for example from an email.",
      ana: "Analytics", anaD: "Google Analytics: how many people visit each page and where they come from.",
      mkt: "Advertising", mktD: "Google Ads, Meta and OpenAI (ChatGPT): measuring whether an ad worked and showing ads for my work.",
      off: "Not in use for now", always: "Always on",
      gpc: "Your browser sends the Global Privacy Control signal, so I left everything off.",
      none: "This site doesn't use analytics or advertising today. If I ever turn them on, I'll ask for your permission here.",
      more: "Cookie policy", close: "Close"
    }
  };
  function lang() { return (document.documentElement.lang || "es").slice(0, 2) === "en" ? "en" : "es"; }
  function t(k) { return T[lang()][k]; }

  /* ---------- almacenamiento de la elección ---------- */
  function read() {
    try { var c = JSON.parse(localStorage.getItem(KEY)); if (c && c.v === VERSION) return c; } catch (e) {}
    return null;
  }
  function write(functional, analytics, marketing, source) {
    var c = { v: VERSION, functional: !!functional, analytics: !!analytics, marketing: !!marketing, gpc: gpc, source: source, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  /* ---------- Funcionales: ningún dato sale sin permiso ----------
     PayMeGPT inyecta un script que, si la URL trae ?contact_id=, consulta ese contacto.
     Sin permiso funcional, esa petición se bloquea antes de salir. */
  var GUARDED = /\/api\/landing\/context\//;
  /* El script de PayMeGPT ya leyó la URL antes que este archivo, así que aquí se puede
     quitar contact_id sin romper nada. Se guarda la URL original por si la persona
     acepta las funcionales y hay que recargar con ella. */
  var ORIGINAL_URL = location.href, HAS_CONTACT = /[?&]contact_id=/.test(location.search);
  if (HAS_CONTACT) {
    try {
      var u = new URL(location.href); u.searchParams.delete("contact_id");
      history.replaceState(history.state, "", u.pathname + (u.search ? u.search : "") + u.hash);
    } catch (e) {}
  }
  function functionalOK() { var c = read(); return !!(c && c.functional); }
  (function guard() {
    var X = window.XMLHttpRequest;
    if (X && !X.prototype.__wmGuard) {
      var open = X.prototype.open, send = X.prototype.send;
      X.prototype.open = function (m, u) { this.__wmUrl = u; return open.apply(this, arguments); };
      X.prototype.send = function () {
        if (GUARDED.test(String(this.__wmUrl || "")) && !functionalOK()) return;
        return send.apply(this, arguments);
      };
      X.prototype.__wmGuard = true;
    }
    if (window.fetch && !window.fetch.__wmGuard) {
      var f = window.fetch;
      window.fetch = function (input) {
        var u = typeof input === "string" ? input : (input && input.url) || "";
        if (GUARDED.test(String(u)) && !functionalOK()) return Promise.reject(new Error("blocked: functional cookies not accepted"));
        return f.apply(this, arguments);
      };
      window.fetch.__wmGuard = true;
    }
  })();

  /* ---------- carga de terceros (solo con permiso) ---------- */
  function addScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }

  function loadGoogle(c) {
    var wantGA = c.analytics && CFG.ga4, wantAds = c.marketing && CFG.googleAds;
    if (!wantGA && !wantAds) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!loaded.google) {
      gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
      addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(wantGA ? CFG.ga4 : CFG.googleAds));
      gtag("js", new Date());
    }
    gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied"
    });
    if (wantGA && !loaded.ga) { gtag("config", CFG.ga4); loaded.ga = true; }
    if (wantAds && !loaded.ads) { gtag("config", CFG.googleAds); loaded.ads = true; }
    loaded.google = true;
  }

  function loadMeta() {
    if (!CFG.metaPixel || loaded.meta) return;
    /* Código base oficial del píxel de Meta */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("consent", "grant");
    fbq("init", CFG.metaPixel);
    fbq("track", "PageView");
    loaded.meta = true;
  }

  function loadOpenAI() {
    if (!CFG.openaiPixel || loaded.openai) return;
    /* Código base del píxel de medición de OpenAI (oaiq) */
    (function (w, d, s, u) { if (w.oaiq) return; var q = function () { q.q.push(arguments); }; q.q = []; w.oaiq = q;
      var js = d.createElement(s); js.async = true; js.src = u; var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(js, f);
    })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
    oaiq("consent", true);
    oaiq("init", { pixelId: CFG.openaiPixel });
    oaiq("measure", "page_viewed");
    loaded.openai = true;
  }

  function apply(c) {
    if (!c) return;
    loadGoogle(c);
    if (c.marketing) { loadMeta(); loadOpenAI(); }
  }

  /* ---------- retirar el permiso ---------- */
  var TRACK_COOKIES = /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc|__oppref|__obref)/;
  function wipeCookies() {
    var host = location.hostname, parts = host.split("."), domains = ["", host];
    for (var i = 1; i < parts.length - 1; i++) domains.push("." + parts.slice(i).join("."));
    document.cookie.split(";").forEach(function (raw) {
      var name = raw.split("=")[0].trim();
      if (!TRACK_COOKIES.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }
  function revoke(prev, next) {
    var lostAna = prev.analytics && !next.analytics, lostMkt = prev.marketing && !next.marketing, lostFun = prev.functional && !next.functional;
    if (!lostAna && !lostMkt && !lostFun) return false;
    try { if (window.gtag) gtag("consent", "update", { analytics_storage: next.analytics ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }); } catch (e) {}
    if (lostMkt) {
      try { if (window.fbq) fbq("consent", "revoke"); } catch (e) {}
      try { if (window.oaiq) oaiq("consent", false); } catch (e) {}
    }
    wipeCookies();
    return true;
  }

  /* ---------- interfaz ---------- */
  var css = ".wmc{position:fixed;z-index:90;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));margin:0 auto;max-width:560px;background:#0A0A0B;color:#F5F5F7;border:1px solid #2C2C2E;border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.35);font:15px/1.55 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif}" +
    ".wmc h2{font:700 20px/1.2 'Bricolage Grotesque',system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 8px}.wmc p{margin:0 0 14px;color:#C7C7CC}.wmc a{color:#F5F5F7;text-underline-offset:3px}" +
    ".wmc-row{display:flex;flex-wrap:wrap;gap:10px}.wmc button{font:600 14px 'Plus Jakarta Sans',system-ui,sans-serif;border-radius:99px;padding:11px 18px;cursor:pointer;border:1px solid #F5F5F7;background:#F5F5F7;color:#000;flex:1 1 auto}" +
    ".wmc button.wmc-alt{background:transparent;color:#F5F5F7;border-color:#48484A}.wmc button.wmc-x{position:absolute;top:12px;right:12px;flex:none;width:34px;height:34px;padding:0;border-radius:50%;background:transparent;color:#F5F5F7;border-color:#2C2C2E;font-size:18px;line-height:1}" +
    ".wmc-cat{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:12px 0;border-top:1px solid #2C2C2E}.wmc-cat b{display:block;color:#F5F5F7}.wmc-cat small{display:block;color:#A1A1A6;font-size:13px;margin-top:2px}" +
    ".wmc-tag{flex:none;font-size:12px;color:#A1A1A6;padding-top:3px;white-space:nowrap}.wmc .wmc-sw{flex:none;position:relative;width:46px;height:28px;padding:0;border-radius:99px;border:0;background:#3A3A3C}.wmc .wmc-sw::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#F5F5F7;transition:transform .2s}" +
    ".wmc .wmc-sw[aria-checked=true]{background:#02C4B6}.wmc .wmc-sw[aria-checked=true]::after{transform:translateX(18px)}.wmc .wmc-sw:disabled{opacity:.45;cursor:not-allowed}.wmc-note{font-size:13px;color:#A1A1A6;margin:4px 0 14px}" +
    "@media (prefers-reduced-motion:reduce){.wmc *{transition:none!important}}";

  var box = null, mode = null, draft = null;
  function ensureStyle() {
    if (document.getElementById("wmc-style")) return;
    var st = document.createElement("style"); st.id = "wmc-style"; st.textContent = css; document.head.appendChild(st);
  }
  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs) { if (k === "on") e.addEventListener("click", attrs.on); else e.setAttribute(k, attrs[k]); }
    if (text != null) e.textContent = text;
    return e;
  }
  function close() { if (box) { box.remove(); box = null; mode = null; } }
  function decide(functional, analytics, marketing, source) {
    var prev = read() || { functional: false, analytics: false, marketing: false };
    var next = write(functional, analytics && hasAnalytics, marketing && hasMarketing, source);
    var gainedFun = next.functional && !prev.functional && HAS_CONTACT;
    close();
    if (gainedFun) { location.replace(ORIGINAL_URL); return; }
    if (revoke(prev, next)) { location.reload(); return; }
    apply(next);
  }
  function sw(id, checked, enabled, label) {
    var b = el("button", { type: "button", role: "switch", "class": "wmc-sw", id: id, "aria-checked": String(!!checked), "aria-label": label });
    if (!enabled) b.disabled = true;
    b.addEventListener("click", function () { var on = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(on)); draft[{ "wmc-fun": "functional", "wmc-ana": "analytics", "wmc-mkt": "marketing" }[id]] = on; });
    return b;
  }
  function cat(name, desc, right) {
    var row = el("div", { "class": "wmc-cat" }), txt = el("div");
    txt.appendChild(el("b", {}, name)); txt.appendChild(el("small", {}, desc));
    row.appendChild(txt); row.appendChild(right); return row;
  }
  function render(m) {
    ensureStyle(); close(); mode = m;
    box = el("section", { "class": "wmc", role: "dialog", "aria-labelledby": "wmc-t", lang: lang() });
    if (m === "banner") {
      box.appendChild(el("h2", { id: "wmc-t" }, t("title")));
      var p = el("p", {}, t("body") + " ");
      p.appendChild(el("a", { href: POLICY }, t("more"))); box.appendChild(p);
      var row = el("div", { "class": "wmc-row" });
      row.appendChild(el("button", { type: "button", on: function () { decide(true, true, true, "accept"); } }, t("accept")));
      row.appendChild(el("button", { type: "button", on: function () { decide(false, false, false, "reject"); } }, t("reject")));
      row.appendChild(el("button", { type: "button", "class": "wmc-alt", on: function () { render("prefs"); } }, t("choose")));
      box.appendChild(row);
    } else {
      var cur = read() || { functional: false, analytics: false, marketing: false };
      draft = { functional: !!cur.functional, analytics: cur.analytics, marketing: cur.marketing };
      box.appendChild(el("button", { type: "button", "class": "wmc-x", "aria-label": t("close"), on: close }, "×"));
      box.appendChild(el("h2", { id: "wmc-t" }, t("prefsTitle")));
      if (!anyTracker) box.appendChild(el("p", { "class": "wmc-note" }, t("none")));
      else if (gpc && cur.source === "gpc") box.appendChild(el("p", { "class": "wmc-note" }, t("gpc")));
      box.appendChild(cat(t("nec"), t("necD"), el("span", { "class": "wmc-tag" }, t("always"))));
      box.appendChild(cat(t("fun"), t("funD"), sw("wmc-fun", cur.functional, true, t("fun"))));
      box.appendChild(cat(t("ana"), t("anaD"), hasAnalytics ? sw("wmc-ana", cur.analytics, true, t("ana")) : el("span", { "class": "wmc-tag" }, t("off"))));
      box.appendChild(cat(t("mkt"), t("mktD"), hasMarketing ? sw("wmc-mkt", cur.marketing, true, t("mkt")) : el("span", { "class": "wmc-tag" }, t("off"))));
      var r2 = el("div", { "class": "wmc-row" });
      r2.appendChild(el("button", { type: "button", on: function () { decide(draft.functional, draft.analytics, draft.marketing, "custom"); } }, t("save")));
      r2.appendChild(el("button", { type: "button", "class": "wmc-alt", on: function () { decide(false, false, false, "reject"); } }, t("reject")));
      box.appendChild(r2);
    }
    document.body.appendChild(box);
    var first = box.querySelector("button:not([disabled])"); if (first && m === "prefs") first.focus();
  }
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && mode === "prefs") close(); });
  /* Estados en la página de cookies: [data-wm-on="ga4"] se muestra si el ID está puesto; [data-wm-off="ga4"] si no.
     Claves: ga4, googleAds, metaPixel, openaiPixel, any (alguno), none (ninguno) */
  function flag(k) { return k === "any" ? anyTracker : k === "none" ? !anyTracker : !!CFG[k]; }
  function statuses() {
    document.querySelectorAll("[data-wm-on]").forEach(function (e) { e.hidden = !flag(e.getAttribute("data-wm-on")); });
    document.querySelectorAll("[data-wm-off]").forEach(function (e) { e.hidden = flag(e.getAttribute("data-wm-off")); });
  }
  /* Si la persona cambia de idioma con el selector del sitio, el banner y los estados se actualizan */
  new MutationObserver(function () { statuses(); if (mode) render(mode); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ---------- API pública ---------- */
  window.wmConsent = { open: function () { render("prefs"); }, get: read, active: CFG };
  /* Conversiones: solo se envían a las plataformas que la persona aceptó */
  window.wmTrack = function (name, data) {
    var c = read(); if (!c || !c.marketing) return;
    var map = { lead: ["Lead", "generate_lead", "lead_created"], contact: ["Contact", "contact", "custom"], schedule: ["Schedule", "book_appointment", "appointment_scheduled"] }[name];
    if (!map) return;
    try { if (window.fbq && loaded.meta) fbq("track", map[0], data || {}); } catch (e) {}
    try { if (window.gtag && CFG.googleAds) gtag("event", map[1], data || {}); } catch (e) {}
    try { if (window.oaiq && loaded.openai) { if (map[2] === "custom") oaiq("measure", "custom", { custom_event_name: name }); else oaiq("measure", map[2], data || {}); } } catch (e) {}
  };

  function boot() {
    statuses();
    /* Delegado: sigue funcionando aunque el selector de idioma reemplace el HTML */
    document.addEventListener("click", function (ev) {
      var tgt = ev.target.closest && ev.target.closest("[data-wm-consent-open],[data-prefs-btn]");
      if (!tgt) return;
      ev.preventDefault(); ev.stopPropagation(); window.wmConsent.open();
    });
    var needsAsk = anyTracker || HAS_CONTACT;
    var c = read();
    if (c) { apply(c); return; }
    if (!needsAsk) return;
    if (gpc) { write(false, false, false, "gpc"); return; }
    render("banner");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
