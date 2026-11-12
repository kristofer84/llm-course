<script>
/* ================= i18n (i18next + keyed DOM application) =================
   Sources carry keys, not text: `<p data-i18n="p3.rmsnorm.2"></p>`.
   Swedish lives in src/i18n/sv/*.json, English in src/i18n/en/*.json, both
   flat {key: value}. build.py inlines them as window.I18N_DATA and fills the
   base language (Swedish) into the HTML statically, so the shipped file is
   readable without JavaScript and a missing translation can never blank a
   paragraph — the runtime only overwrites what it actually has.

   Runtime API (global L):
     L.t(key, vars)      translated string, {{var}} interpolation; for a key
                         without translation the Swedish base language wins
     L.num(n, digits)    locale-aware number formatting
     L.lang              active locale
     L.setLang(lng)      persist choice and reload
     L.apply(root)       translate the rendered DOM ([data-i18n] elements,
                         [data-i18n-<attr>] attributes, title, description)
     L.collect(root)     [{key, tag, html, ...}] for content and browser checks
     L.missing           keys that fell back to the base language at runtime
*/
(function () {
  "use strict";
  var DATA = window.I18N_DATA || {};
  var SRC = "sv";
  // Keep established switch positions stable; append further locales by code.
  var AVAIL = [SRC].concat(DATA.en ? ['en'] : []).concat(
    Object.keys(DATA).filter(function (l) { return l !== SRC && l !== 'en'; }).sort()
  );
  var KEY = "llm-kurs-lang";

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function param() { var m = /[?&]lang=([A-Za-z_-]+)/.exec(location.search); return m ? m[1].toLowerCase() : null; }
  function supported(value) {
    var candidate = String(value || '').toLowerCase().replace(/_/g, '-');
    if (AVAIL.indexOf(candidate) >= 0) return candidate;
    var base = candidate.split('-')[0];
    return AVAIL.indexOf(base) >= 0 ? base : null;
  }
  function detect() {
    var q = supported(param()); if (q) return q;
    var s = supported(stored()); if (s) return s;
    var preferences = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < preferences.length; i++) {
      var match = supported(preferences[i]); if (match) return match;
    }
    return AVAIL.indexOf('en') >= 0 ? 'en' : SRC;
  }

  var lng = detect();
  var EXAMPLE_VARS = ((window.EXAMPLE_DATA || {})[lng] || {}).vars || {};
  var resources = {};
  AVAIL.forEach(function (l) { resources[l] = { translation: DATA[l] || {} }; });
  i18next.init({
    lng: lng, fallbackLng: false, keySeparator: false, nsSeparator: false,
    initImmediate: false, returnEmptyString: false, interpolation: { escapeValue: false },
    resources: resources
  });

  // A string that is already a translated value is not a missing key: some call
  // sites pass L.t(...) output through L.t() a second time, and that must not
  // pollute the missing list (it is what we watch when adding a language).
  var VALUES = {};
  Object.keys(resources[lng] ? resources[lng].translation : {}).forEach(function (k) {
    VALUES[resources[lng].translation[k]] = 1;
  });
  var missing = [];
  function t(key, vars) {
    if (key == null) return key;
    key = String(key);
    var s = i18next.t(key);
    if (s === key && lng !== SRC && !VALUES[key]) { if (missing.indexOf(key) < 0) missing.push(key); }
    vars = Object.assign({}, EXAMPLE_VARS, vars || {});
    for (var k in vars) {
      var v = vars[k];
      if (typeof v === "string" && v.charAt(0) === "#") v = t(v.slice(1));   // value is itself a key
      s = s.split("{{" + k + "}}").join(v);
    }
    return s;
  }
  function num(n, d) {
    var loc = lng === "sv" ? "sv-SE" : (lng === "en" ? "en-US" : lng);
    return Number(n).toLocaleString(loc, { maximumFractionDigits: d, minimumFractionDigits: d });
  }
  function norm(html) { return html.replace(/\s+/g, " ").trim(); }

  /* ---------- DOM application ---------- */
  var ATTRS = ["aria-label", "placeholder", "alt", "title"];
  function varsOf(el) {
    var raw = el.getAttribute("data-i18n-vars");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function apply(root) {
    root = root || document.body;
    document.documentElement.lang = lng;
    if (!root.querySelectorAll) return 0;
    if (lng === SRC) return 0;            // base language is already in the HTML
    var n = 0;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n"), out = t(key, varsOf(el));
      if (out && out !== key && norm(el.innerHTML) !== norm(out)) { el.innerHTML = out; n++; }
    });
    ATTRS.forEach(function (a) {
      var sel = "[data-i18n-" + a + "]";
      root.querySelectorAll(sel).forEach(function (el) {
        var key = el.getAttribute("data-i18n-" + a), out = t(key, varsOf(el));
        if (out && out !== key) { el.setAttribute(a, out); n++; }
      });
    });
    applyDoc();
    return n;
  }

  function applyDoc() {
    var dt = t("doc.title");
    if (dt && dt !== "doc.title" && document.title) document.title = dt;
    var md = document.querySelector('meta[name="description"]');
    var ds = t("doc.description");
    if (md && ds && ds !== "doc.description") md.setAttribute("content", ds);
  }

  function collect(root) {
    root = root || document.body;
    var out = [];
    if (!root.querySelectorAll) return out;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var slide = el.closest ? el.closest(".slide") : null;
      out.push({
        key: el.getAttribute("data-i18n"),
        tag: el.tagName.toLowerCase(),
        html: norm(el.innerHTML),
        text: norm(el.textContent),
        mod: slide ? (slide.dataset.mod || "") : "",
        slide: slide ? (slide.dataset.title || "") : "",
        vars: el.getAttribute("data-i18n-vars")
      });
    });
    ATTRS.forEach(function (a) {
      root.querySelectorAll("[data-i18n-" + a + "]").forEach(function (el) {
        out.push({ key: el.getAttribute("data-i18n-" + a), tag: el.tagName.toLowerCase(),
                   attr: a, html: norm(el.getAttribute(a) || ""), text: "", mod: "", slide: "" });
      });
    });
    return out;
  }

  /* ---------- language switch ---------- */
  var NAMES = { sv: "SV", en: "EN", de: "DE", fr: "FR", es: "ES", fi: "FI", no: "NO", da: "DA" };
  var LANGUAGE_NAMES = { sv: 'Svenska', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', fi: 'Suomi', no: 'Norsk', da: 'Dansk' };
  function label(l) { return NAMES[l] || l.toUpperCase(); }
  function setLang(l) {
    if (AVAIL.indexOf(l) < 0) return;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    var u;
    try { u = new URL(location.href); u.searchParams.set("lang", l); location.replace(u.toString()); }
    catch (e) { location.replace(location.pathname + "?lang=" + l + (location.hash || "")); }
  }
  function buildSwitch() {
    var box = document.getElementById("langsw");
    if (!box) return;
    box.innerHTML = "";
    AVAIL.forEach(function (l) {
      var b = document.createElement("button");
      b.className = "lg"; b.type = "button"; b.textContent = label(l);
      b.setAttribute("aria-pressed", String(l === lng));
      b.title = LANGUAGE_NAMES[l] || l;
      b.setAttribute('aria-label', LANGUAGE_NAMES[l] || l);
      b.addEventListener("click", function () { if (l !== lng) setLang(l); });
      box.appendChild(b);
    });
  }
  buildSwitch();

  window.L = {
    t: t, num: num, apply: apply, collect: collect, setLang: setLang,
    lang: lng, languages: AVAIL, missing: missing, norm: norm
  };
})();
</script>
