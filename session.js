/* ============================================================
   CourseConnect — Session engine
   ------------------------------------------------------------
   Builds a client-side "session" on top of the JWT stored in
   localStorage by auth.js. One session spans every frontend
   page: login/register seed it, protected pages require it,
   and all API calls carry the JWT so future student/lecturer/
   admin microservices recognise the user.

   Include order on every page:
     <script src="auth.js"></script>
     <script src="session.js"></script>
   ============================================================ */
(function (global) {
  'use strict';

  var Auth = global.CourseConnectAuth;

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function initials(name) {
    if (!name) return '?';
    var parts = String(name).trim().split(/\s+/);
    return ((parts[0] || '')[0] || '?').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase();
  }

  /* Circular gradient avatar showing the user's initials. */
  function avatarHtml(name, extraClass) {
    return '<a class="cc-avatar ' + (extraClass || '') + '" href="profile.html" title="My profile">' +
      escapeHtml(initials(name)) + '</a>';
  }

  var Session = {
    token: null,
    role: null,
    user: null,
    active: false,

    /* Read + validate the stored JWT. Call once per page load. */
    init: function () {
      if (!Auth.isLoggedIn()) {
        if (Auth.getToken()) Auth.logout();
        this.active = false;
        return false;
      }
      this.token = Auth.getToken();
      this.role = Auth.getRole();
      this.user = Auth.getUser() || {};
      this.active = true;
      this._scheduleExpiryRefresh();
      return true;
    },

    /* Protected pages: bounce to login when there is no session. */
    protect: function () {
      if (!this.init()) {
        global.location.href = 'login.html';
        return false;
      }
      return true;
    },

    /* Public pages (login/register): bounce to profile if already
       logged in, so you never see the auth form while signed in. */
    guardPublic: function () {
      if (this.init()) {
        global.location.href = Auth.profileUrl(this.role);
        return true;
      }
      return false;
    },

    /* API helper: attaches the JWT and auto-logs-out on 401/403
       (token expired server-side). Used by every microservice call. */
    api: function (path, options) {
      return Auth.fetch(path, options).then(function (res) {
        if (res.status === 401 || res.status === 403) {
          Auth.logout();
        }
        return res;
      });
    },

    logout: function () {
      if (global._ccExpiryTimer) clearTimeout(global._ccExpiryTimer);
      Auth.logout();
    },

    /* Renders the sticky top bar (#cc-nav) used by auth/app pages.
       Shows the profile avatar + name + role + logout when signed in. */
    renderNavbar: function (elId) {
      var el = document.getElementById(elId);
      if (!el) return;
      var brand = '<a class="cc-nav-brand" href="' +
        (this.active ? Auth.profileUrl(this.role) : 'login.html') + '">' +
        '<span class="cc-nav-glyph">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none">' +
        '<path d="M12 3 2 8l10 5 10-5-10-5Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M6 12v5c0 1.4 2.7 3 6 3s6-1.6 6-3v-5" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>' +
        '</svg></span>CourseConnect</a>';

      if (!this.active) {
        el.innerHTML = brand +
          '<div class="cc-nav-right">' +
          '<a class="cc-btn" href="login.html">Sign in</a>' +
          '<a class="cc-btn primary" href="register.html">Sign up</a>' +
          '</div>';
        return;
      }

      var name = escapeHtml((this.user && (this.user.name || this.user.email)) || 'User');
      var role = escapeHtml(this.role || '');
      var dash = this.role === 'admin'
        ? '<a class="cc-btn" href="admin-dashboard.html">Dashboard</a>'
        : (this.role === 'lecturer'
        ? '<a class="cc-btn" href="lecturer-dashboard.html">Teach</a>'
        : (this.role === 'student'
        ? '<a class="cc-btn" href="my-courses.html">My courses</a>' : ''));
      el.innerHTML = brand +
        '<div class="cc-nav-right">' +
        avatarHtml((this.user && this.user.name) || (this.user && this.user.email) || 'User') +
        '<span class="cc-nav-user">' + name + '</span>' +
        '<span class="cc-badge">' + role + '</span>' +
        dash +
        '<button class="cc-btn" id="ccLogout">Log out</button>' +
        '</div>';

      var btn = document.getElementById('ccLogout');
      if (btn) btn.addEventListener('click', function () { Session.logout(); });
    },

    /* Renders the session state into the marketing/course pages'
       existing .site-nav .nav-actions area. Guests keep their
       Login/Register buttons; signed-in users get a profile
       avatar icon (+ Dashboard for admins) and a Log out button. */
    renderSiteNav: function (slot) {
      var el = (typeof slot === 'string') ? document.querySelector(slot) : slot;
      if (!el) el = document.querySelector('.nav-actions');
      if (!el) return;
      if (!this.active) return; // leave guest Login/Register as-is

      var name = (this.user && (this.user.name || this.user.email)) || 'User';
      var dash = this.role === 'admin'
        ? '<a class="btn-pill ghost" href="admin-dashboard.html">Dashboard</a>'
        : (this.role === 'lecturer'
        ? '<a class="btn-pill ghost" href="lecturer-dashboard.html">Teach</a>'
        : (this.role === 'student'
        ? '<a class="btn-pill ghost" href="my-courses.html">My courses</a>' : ''));
      el.innerHTML =
        avatarHtml(name) +
        dash +
        '<button class="btn-pill ghost" id="ccLogout">Log out</button>';

      var btn = document.getElementById('ccLogout');
      if (btn) btn.addEventListener('click', function () { Session.logout(); });
    },

    /* Auto-redirect a few seconds before the token expires so the
       user is never left with a dead session. */
    _scheduleExpiryRefresh: function () {
      var secs = Auth.secondsUntilExpiry();
      if (!secs || secs <= 0) return;
      var ms = Math.max(1000, (secs - 3) * 1000);
      global._ccExpiryTimer = setTimeout(function () {
        Auth.logout(); // token expired -> end session cleanly
      }, ms);
    }
  };

  global.Session = Session;
})(window);
