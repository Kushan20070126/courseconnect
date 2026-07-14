/* ============================================================
   CourseConnect — shared auth helpers (JWT in localStorage)
   ------------------------------------------------------------
   Low-level storage of the JWT returned by the auth service.
   Session.js builds the higher-level session on top of this.
   ============================================================ */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'cc_token';
  var ROLE_KEY = 'cc_role';
  var USER_KEY = 'cc_user';

  var PROFILE_BY_ROLE = {
    student: 'profile.html',
    lecturer: 'profile.html',
    admin: 'profile.html'
  };

  var API_BASE = 'http://localhost:8080';

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var bin = atob(str);
    var res = '';
    for (var i = 0; i < bin.length; i++) {
      res += '%' + ('00' + bin.charCodeAt(i).toString(16)).slice(-2);
    }
    return decodeURIComponent(res);
  }

  function getPayload(token) {
    if (!token) return null;
    try {
      var parts = token.split('.');
      if (parts.length < 2) return null;
      return JSON.parse(b64urlDecode(parts[1]));
    } catch (e) {
      return null;
    }
  }

  function isTokenValid(token) {
    var p = getPayload(token);
    if (!p) return false;
    // exp is in seconds; require at least a 5s grace margin.
    if (!p.exp) return true;
    return (p.exp * 1000) > (Date.now() + 5000);
  }

  var CourseConnectAuth = {
    apiBase: API_BASE,

    store: function (authResponse) {
      if (!authResponse) return;
      safeSet(TOKEN_KEY, authResponse.token || '');
      safeSet(ROLE_KEY, authResponse.role || '');
      var user = {
        userId: authResponse.userId,
        email: authResponse.email,
        name: authResponse.name
      };
      safeSet(USER_KEY, JSON.stringify(user));
    },

    getToken: function () { return safeGet(TOKEN_KEY); },
    getRole: function () { return safeGet(ROLE_KEY); },
    getUser: function () {
      var raw = safeGet(USER_KEY);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) { return null; }
    },

    // True only when a non-expired JWT is present.
    isLoggedIn: function () {
      var t = safeGet(TOKEN_KEY);
      return !!t && isTokenValid(t);
    },

    // Seconds until the token expires (negative if already expired).
    secondsUntilExpiry: function () {
      var p = getPayload(safeGet(TOKEN_KEY));
      if (!p || !p.exp) return 0;
      return Math.floor((p.exp * 1000 - Date.now()) / 1000);
    },

    authHeader: function () {
      var t = safeGet(TOKEN_KEY);
      return t ? ('Bearer ' + t) : '';
    },

    profileUrl: function (role) {
      return PROFILE_BY_ROLE[role] || 'login.html';
    },

    redirectToProfile: function () {
      window.location.href = this.profileUrl(safeGet(ROLE_KEY));
    },

    /* JSON fetch wrapper that attaches the JWT automatically. */
    fetch: function (path, options) {
      options = options || {};
      options.headers = options.headers || {};
      var token = safeGet(TOKEN_KEY);
      if (token) options.headers['Authorization'] = 'Bearer ' + token;
      if (!options.headers['Content-Type'] && options.body) {
        options.headers['Content-Type'] = 'application/json';
      }
      return global.fetch(API_BASE + path, options);
    },

    logout: function () {
      safeRemove(TOKEN_KEY);
      safeRemove(ROLE_KEY);
      safeRemove(USER_KEY);
      window.location.href = 'login.html';
    },

    /* Guard a profile page: kick out anyone without a valid token. */
    requireAuth: function () {
      if (!this.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    }
  };

  global.CourseConnectAuth = CourseConnectAuth;
})(window);
