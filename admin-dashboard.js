/* ============================================================
   CourseConnect — Admin dashboard (frontend only)
   Admin role required. Data below is placeholder; swap the
   static arrays for Session.api('/admin/...') calls once the
   admin microservice exists.
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

  // ---- Placeholder stats (replace with Session.api later) ----
  var stats = { users: 1280, students: 1184, lecturers: 96, courses: 412, pending: 7 };
  document.getElementById('statUsers').textContent = stats.users;
  document.getElementById('statStudents').textContent = stats.students;
  document.getElementById('statLecturers').textContent = stats.lecturers;
  document.getElementById('statCourses').textContent = stats.courses;
  document.getElementById('statPending').textContent = stats.pending;

  // ---- Placeholder recent users ----
  var users = [
    { name: 'Ann Student',   email: 'ann.student@x.com',     role: 'student',  status: 'Active' },
    { name: 'Prof. Daniel',  email: 'daniel@x.com',          role: 'lecturer', status: 'Active' },
    { name: 'Mira Fernando', email: 'mira.f@x.com',          role: 'student',  status: 'Active' },
    { name: 'Dr. Lee',       email: 'lee@x.com',             role: 'lecturer', status: 'Pending' },
    { name: 'Kavi Perera',   email: 'kavi@x.com',            role: 'student',  status: 'Active' }
  ];
  var tbody = document.getElementById('userRows');
  users.forEach(function (u) {
    tbody.insertAdjacentHTML('beforeend',
      '<tr>' +
      '<td>' + esc(u.name) + '</td>' +
      '<td>' + esc(u.email) + '</td>' +
      '<td><span class="pill ' + esc(u.role) + '">' + esc(u.role) + '</span></td>' +
      '<td><span class="pill ok">' + esc(u.status) + '</span></td>' +
      '</tr>');
  });

  // ---- Placeholder lecturer approvals ----
  var approvals = [
    { name: 'Dr. Lee',     area: 'Machine Learning', reason: 'PhD in ML, 8 years teaching.' },
    { name: 'Sara Nair',   area: 'Data Science',     reason: 'Lead data scientist, bootcamp instructor.' },
    { name: 'Tom Whitfield', area: 'UX Design',      reason: '12 years product design experience.' }
  ];
  var list = document.getElementById('approvalList');
  approvals.forEach(function (a) {
    list.insertAdjacentHTML('beforeend',
      '<div class="approval">' +
      '<b>' + esc(a.name) + '</b> &middot; <span style="color:var(--ink-soft)">' + esc(a.area) + '</span>' +
      '<p>' + esc(a.reason) + '</p>' +
      '<div class="approval-actions">' +
      '<button class="mini approve" disabled title="Available when the admin service is connected">Approve</button>' +
      '<button class="mini" disabled title="Available when the admin service is connected">Reject</button>' +
      '</div></div>');
  });
})();
