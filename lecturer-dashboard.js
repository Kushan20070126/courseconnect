// Lecturer dashboard — stats + monitoring of own courses.
(function () {
  Session.init();
  if (!Session.protect()) return;
  if (Session.role !== 'lecturer') { window.location.href = 'profile.html'; return; }
  Session.renderNavbar('cc-nav');

  var statCourses = document.getElementById('statCourses');
  var statStudents = document.getElementById('statStudents');
  var statPaid = document.getElementById('statPaid');
  var statRevenue = document.getElementById('statRevenue');
  var courseCount = document.getElementById('courseCount');
  var rows = document.getElementById('courseRows');
  var emptyState = document.getElementById('emptyState');
  var dashError = document.getElementById('dashError');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function statusPill(status) {
    var cls = status === 'PUBLISHED' ? 'ok' : 'warn';
    return '<span class="pill ' + cls + '">' + esc(status) + '</span>';
  }

  Promise.all([
    CourseConnectAuth.courseFetch('/req/lecturer/stats'),
    CourseConnectAuth.courseFetch('/req/lecturer/courses')
  ])
    .then(function (resps) { return Promise.all(resps.map(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })); })
    .then(function (data) {
      var stats = data[0], courses = data[1];
      statCourses.textContent = stats.totalCourses;
      statStudents.textContent = stats.totalStudents;
      statPaid.textContent = stats.paidCourses;
      statRevenue.textContent = '$' + (stats.revenue || 0);
      courseCount.textContent = courses.length;

      if (!courses.length) { emptyState.style.display = 'block'; return; }
      rows.innerHTML = courses.map(function (c) {
        var price = (c.price === 0) ? 'Free' : '$' + (c.price || 0);
        return '<tr>'
          + '<td><a href="course.html?id=' + c.id + '" style="color:var(--ink);font-weight:600;text-decoration:none;">' + esc(c.title) + '</a></td>'
          + '<td>' + statusPill(c.status) + '</td>'
          + '<td>' + (c.studentsCount || 0) + '</td>'
          + '<td>' + price + '</td>'
          + '<td>' + (c.rating || 0).toFixed(1) + '</td>'
          + '<td><a class="btn-mini" href="course.html?id=' + c.id + '">View</a></td>'
          + '</tr>';
      }).join('');
    })
    .catch(function (err) {
      dashError.textContent = 'Could not load dashboard: ' + err.message;
      dashError.style.display = 'block';
    });
})();
