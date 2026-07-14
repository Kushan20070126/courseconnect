/* ============================================================
   CourseConnect — runtime env loader
   ------------------------------------------------------------
   Reads the project .env file and exposes its values on
   window.__ENV so the static frontend can pick up config
   (e.g. BACKEND_API_GATEWAY_URL) without a build step.

   Include this BEFORE auth.js on every page:
     <script src="env.js"></script>
     <script src="auth.js"></script>
   ============================================================ */
(function (global) {
  'use strict';

  function applyEnv(text) {
    var env = global.__ENV || {};
    (text || '').split(/\r?\n/).forEach(function (line) {
      // Skip blank lines and # comments.
      if (!line.trim() || line.trim().indexOf('#') === 0) return;
      var m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m) {
        var value = m[2].replace(/^["']|["']$/g, '');
        env[m[1]] = value;
      }
    });
    global.__ENV = env;
  }

  // Expose an initial (empty) object so readers never crash.
  global.__ENV = global.__ENV || {};

  if (global.fetch) {
    fetch('.env')
      .then(function (res) { return res.ok ? res.text() : ''; })
      .then(function (text) { if (text) applyEnv(text); })
      .catch(function () { /* .env unavailable — fall back to defaults */ });
  }
})(window);
