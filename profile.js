/* ============================================================
   CourseConnect — profile page logic
   Loads the logged-in user's own data from /req/me using the
   JWT stored in localStorage, then renders role-specific info.
   ============================================================ */
(function () {
  'use strict';

  // Build the session from the stored JWT and protect this page.
  Session.init();
  Session.renderNavbar('cc-nav');
  if (!Session.protect()) return;

  var $ = function (id) { return document.getElementById(id); };

  function showExtras(role) {
    var map = {
      student: ['studentExtras', 'rowAge'],
      lecturer: ['lecturerExtras', 'rowAge'],
      admin: ['adminExtras']
    };
    var ids = map[role] || [];
    ids.forEach(function (id) {
      var el = $(id);
      if (el) el.style.display = 'block';
    });
  }

  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = (value === undefined || value === null || value === '') ? '—' : value;
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    return ((parts[0] || '')[0] || '?').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase();
  }

  function render(me) {
    var role = me.role;
    var name = me.name || (me.firstName ? (me.firstName + ' ' + (me.lastName || '')) : (me.email || ''));

    setText('pName', name.trim() || me.email);
    setText('pRole', role);
    setText('pId', me.id);
    setText('pEmail', me.email);
    setText('pAge', me.age);

    var av = $('avatar');
    if (av) av.textContent = initials(name);

    if (role === 'student') {
      setText('pEdu', me.educationLevel);
      setText('pInterest', me.interest);
      setText('pGoal', me.goal);
    } else if (role === 'lecturer') {
      setText('pTitle', me.title);
      setText('pExp', me.experience);
      setText('pArea', me.area);
    }

    showExtras(role);
  }

  Session.api('/req/me')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    })
    .then(render)
    .catch(function (err) {
      console.error(err);
      // Token invalid/expired — clear and send back to login.
      Session.logout();
    });

  $('logoutBtn').addEventListener('click', function () {
    Session.logout();
  });

  $('homeBtn').addEventListener('click', function () {
    window.location.href = 'login.html';
  });
})();
