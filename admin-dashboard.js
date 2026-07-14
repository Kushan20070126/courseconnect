/* ============================================================
   CourseConnect — Admin dashboard
   Admin role required. Pulls live data from the auth service:
     GET  /req/admin/stats
     GET  /req/admin/users
     GET  /req/admin/lecturers/pending
     POST /req/admin/lecturers/{id}/approve
     POST /req/admin/lecturers/{id}/reject
   ============================================================ */
(function () {
  'use strict';

  Session.init();
  if (!Session.protect()) return;
  if (Session.role !== 'admin') {
    window.location.href = 'profile.html';
    return;
  }
  Session.renderNavbar('cc-nav');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var statUsers = document.getElementById('statUsers');
  var statStudents = document.getElementById('statStudents');
  var statLecturers = document.getElementById('statLecturers');
  var statCourses = document.getElementById('statCourses');
  var statPending = document.getElementById('statPending');
  var pendingCount = document.getElementById('pendingCount');
  var userRows = document.getElementById('userRows');
  var userEmpty = document.getElementById('userEmpty');
  var approvalList = document.getElementById('approvalList');
  var approvalEmpty = document.getElementById('approvalEmpty');
  var dashError = document.getElementById('dashError');

  function showError(msg) {
    dashError.textContent = msg;
    dashError.style.display = 'block';
  }

  function statusPill(status) {
    var cls = 'ok';
    if (status === 'Pending') cls = 'warn';
    else if (status === 'Rejected') cls = 'bad';
    return '<span class="pill ' + cls + '">' + esc(status) + '</span>';
  }

  function loadStats() {
    return Session.api('/req/admin/stats').then(function (res) {
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    }).then(function (s) {
      statUsers.textContent = s.users;
      statStudents.textContent = s.students;
      statLecturers.textContent = s.lecturers;
      statCourses.textContent = s.courses;
      statPending.textContent = s.pending;
      pendingCount.textContent = s.pending;
    });
  }

  function loadUsers() {
    return Session.api('/req/admin/users').then(function (res) {
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    }).then(function (users) {
      userRows.innerHTML = '';
      if (!users.length) {
        userEmpty.style.display = 'block';
        return;
      }
      userEmpty.style.display = 'none';
      users.forEach(function (u) {
        userRows.insertAdjacentHTML('beforeend',
          '<tr>' +
          '<td>' + esc(u.name) + '</td>' +
          '<td>' + esc(u.email) + '</td>' +
          '<td><span class="pill ' + esc(u.role) + '">' + esc(u.role) + '</span></td>' +
          '<td>' + statusPill(u.status) + '</td>' +
          '</tr>');
      });
    });
  }

  function loadApprovals() {
    return Session.api('/req/admin/lecturers/pending').then(function (res) {
      if (!res.ok) throw new Error('Failed to load approvals');
      return res.json();
    }).then(function (list) {
      approvalList.innerHTML = '';
      if (!list.length) {
        approvalEmpty.style.display = 'block';
        return;
      }
      approvalEmpty.style.display = 'none';
      list.forEach(function (a) {
        approvalList.insertAdjacentHTML('beforeend',
          '<div class="approval" data-id="' + esc(a.id) + '">' +
          '<div class="approval-top">' +
          '<b>' + esc(a.name) + '</b>' +
          (a.title ? ' <span class="approval-title">' + esc(a.title) + '</span>' : '') +
          ' &middot; <span class="approval-area">' + esc(a.area || 'General') + '</span>' +
          '</div>' +
          '<p class="approval-reason">' + esc(a.bio || 'No bio provided.') + '</p>' +
          '<div class="approval-actions">' +
          '<button class="mini approve" data-action="approve" data-id="' + esc(a.id) + '">Approve</button>' +
          '<button class="mini reject" data-action="reject" data-id="' + esc(a.id) + '">Reject</button>' +
          '</div></div>');
      });
    });
  }

  function decide(id, action) {
    var card = approvalList.querySelector('.approval[data-id="' + id + '"]');
    var btn = card ? card.querySelector('[data-action="' + action + '"]') : null;
    if (btn) { btn.disabled = true; }

    Session.api('/req/admin/lecturers/' + id + '/' + action, { method: 'POST' })
      .then(function (res) {
        if (!res.ok) throw new Error('Action failed (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function () {
        if (card) card.remove();
        if (!approvalList.children.length) approvalEmpty.style.display = 'block';
        return loadStats();
      })
      .catch(function (err) {
        if (btn) btn.disabled = false;
        showError(err.message || 'Could not complete the action.');
      });
  }

  approvalList.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    decide(btn.dataset.id, btn.dataset.action);
  });

  Promise.all([loadStats(), loadUsers(), loadApprovals()])
    .catch(function (err) {
      showError(err.message || 'Could not load the admin dashboard.');
    });
})();
