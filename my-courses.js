// Student "My courses" — lists enrollments with progress + completion badge.
(function () {
  Session.init();
  if (!Session.protect()) return;
  if (Session.role !== 'student') { window.location.href = 'profile.html'; return; }
  Session.renderNavbar('cc-nav');

  var grid = document.getElementById('myCourses');
  var emptyState = document.getElementById('emptyState');
  var dashError = document.getElementById('dashError');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('en-US'); }
  function thumbStyle(c) { return c.thumbnailUrl ? 'background-image:url(\'' + c.thumbnailUrl + '\');background-size:cover;background-position:center;' : 'background:linear-gradient(135deg,#6A5CF0,#2E1F8F);'; }

  function card(c) {
    var pct = c.progressPercent || 0;
    var badge = c.completed
      ? '<span class="pill ok" style="margin-left:8px;">🏅 Badge earned</span>'
      : '';
    return ''
      + '<article class="course-card reveal">'
      +   '<a class="course-thumb" href="course.html?id=' + c.id + '" ' + thumbStyle(c) + '>'
      +     '<span class="badge">' + esc(c.level || '') + '</span>'
      +   '</a>'
      +   '<div class="course-body">'
      +     '<span class="course-cat">' + esc(c.category || '') + '</span>'
      +     '<h3 class="course-title"><a href="course.html?id=' + c.id + '">' + esc(c.title) + '</a>' + badge + '</h3>'
      +     '<p class="course-instructor">by ' + esc(c.instructorName || 'CourseConnect') + '</p>'
      +     '<div class="rv-bar" style="margin:8px 0 4px;"><span class="track" style="display:block;height:9px;background:var(--line);border-radius:999px;"><span class="fill" style="display:block;height:100%;width:' + pct + '%;background:linear-gradient(135deg,var(--violet),var(--teal));border-radius:999px;"></span></span></div>'
      +     '<div style="display:flex;justify-content:space-between;align-items:center;">'
      +       '<span style="font-size:.8rem;color:var(--ink-soft);">' + pct + '% complete</span>'
      +       '<a class="btn-mini" href="course.html?id=' + c.id + '">' + (pct > 0 ? 'Continue' : 'Start') + '</a>'
      +     '</div>'
      +   '</div>'
      + '</article>';
  }

  CourseConnectAuth.courseFetch('/req/my-courses')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (list) {
      if (!list.length) { emptyState.style.display = 'block'; return; }
      grid.innerHTML = list.map(card).join('');
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } }); }, { threshold: 0.1 });
        grid.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
      }
    })
    .catch(function (err) {
      dashError.textContent = 'Could not load your courses: ' + err.message;
      dashError.style.display = 'block';
    });
})();
