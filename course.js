// Course detail — loads from the course microservice, handles enrollment
// (free instant / paid via Stripe Checkout) and gated lesson viewing.
(function () {
  var root = document.getElementById('detailRoot');

  function getParam(name) { return new URLSearchParams(window.location.search).get(name); }
  var id = parseInt(getParam('id'), 10);
  if (!id) { notFound(); return; }

  // Handle Stripe redirect back from checkout.
  if (getParam('enrolled') === '1' && getParam('session_id')) {
    confirmPayment(getParam('session_id'));
  }

  var course = null;

  function catIcon(cat) {
    switch (cat) {
      case 'Development': return '<path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 7l-2 10" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
      case 'Design': return '<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.3 1.2-2.2-.8-.9-.3-2.1 1-2.1H17a4 4 0 0 0 4-4c0-5-4-9.7-9-9.7Z" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="8.5" cy="10.5" r="1.2" fill="#fff"/>';
      case 'Business': return '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none"/>';
      case 'Data Science': return '<path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none"/>';
      case 'Marketing': return '<path d="M4 12a8 8 0 1 1 16 0M12 4v16M4 12h16" stroke="#fff" stroke-width="1.6" fill="none"/>';
      default: return '<circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="1.7" fill="none"/>';
    }
  }
  function starSVG() { return '<svg class="stars" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" fill="currentColor"/></svg>'; }
  function checkSVG() { return '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function playSVG() { return '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5Z" fill="currentColor"/></svg>'; }
  function fmt(n) { return (n || 0).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function escAttr(s) { return esc(s); }
  function initials(name) { return String(name || '?').replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/, '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function thumbStyle(c) {
    return c.thumbnailUrl ? 'background-image:url(\'' + c.thumbnailUrl + '\');background-size:cover;background-position:center;' : 'background:linear-gradient(135deg,#6A5CF0,#2E1F8F);';
  }

  function notFound() {
    root.innerHTML = '<div class="detail-hero" style="background:linear-gradient(135deg,#6A5CF0,#2E1F8F);"><div class="detail-hero-inner"><h1>Course not found</h1><p>That course doesn’t exist.</p><a class="btn-pill solid" href="courses.html" style="display:inline-block;margin-top:8px;">Back to courses</a></div></div>';
  }

  function confirmPayment(sessionId) {
    CourseConnectAuth.courseFetch('/req/payments/confirm?sessionId=' + encodeURIComponent(sessionId))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function () { window.location.href = 'course.html?id=' + id; })
      .catch(function () { window.location.href = 'course.html?id=' + id; });
  }

  function load() {
    root.innerHTML = '<div class="detail-hero" style="background:linear-gradient(135deg,#6A5CF0,#2E1F8F);min-height:240px;"></div>';
    CourseConnectAuth.courseFetch('/req/courses/' + id)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (c) { course = c; render(c); })
      .catch(function (err) { notFound(); console.error(err); });
  }

  function render(c) {
    document.title = c.title + ' · CourseConnect';
    var price = (c.price === 0) ? 'Free' : '$' + (c.price || 0);
    var sectionsHTML = (c.sections || []).map(function (s, si) {
      var lessonsHTML = (s.lessons || []).map(function (l) {
        var accessible = l.preview || c.enrolled;
        return '<div class="acc-lesson' + (accessible ? '' : ' locked') + '" data-lesson="' + (l.id) + '" data-title="' + escAttr(l.title) + '" data-desc="' + escAttr(l.description) + '" data-video="' + escAttr(l.videoUrl || '') + '">'
          + '<span class="play">' + playSVG() + '</span>'
          + '<span>' + l.title + '</span>'
          + (l.preview ? '<span class="pill ok" style="margin-left:6px;font-size:.62rem;">Preview</span>' : '')
          + '<span class="dur">' + (l.durationMinutes || 0) + ' min</span></div>';
      }).join('');
      return '<div class="acc-section' + (si === 0 ? ' open' : '') + '">'
        + '<div class="acc-head"><span class="t">' + esc(s.title) + '</span><span class="meta">' + (s.lessons ? s.lessons.length : 0) + ' lessons</span></div>'
        + '<div class="acc-body">' + lessonsHTML + '</div></div>';
    }).join('');

    var learnHTML = (c.learn && c.learn.length)
      ? c.learn.map(function (x) { return '<li>' + checkSVG() + '<span>' + esc(x) + '</span></li>'; }).join('')
      : '<li>' + checkSVG() + '<span>Hands-on, project-based lessons</span></li>';
    var reqHTML = (c.requirements && c.requirements.length)
      ? c.requirements.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('')
      : '<li>A computer with internet access</li><li>A willingness to practice</li>';

    var totalLessons = (c.sections || []).reduce(function (a, s) { return a + (s.lessons ? s.lessons.length : 0); }, 0);
    var dur = c.durationMinutes ? (Math.floor(c.durationMinutes / 60) + 'h ' + (c.durationMinutes % 60) + 'm') : '—';

    root.innerHTML = ''
      + '<section class="detail-hero" style="' + thumbStyle(c) + ';">'
      +   '<div class="detail-hero-inner">'
      +     '<a class="crumb" href="courses.html">&larr; All courses</a>'
      +     '<span class="badge">' + esc(c.category || '') + '</span>'
      +     '<h1>' + esc(c.title) + '</h1>'
      +     '<p class="lede">' + esc(c.summary || '') + '</p>'
      +     '<div class="detail-rating"><b>' + (c.rating || 0).toFixed(1) + '</b>' + starSVG() + '<span class="rcount">(' + fmt(c.studentsCount) + ' students)</span></div>'
      +     '<div class="detail-byline"><span>Created by <b>' + esc(c.instructorName || 'CourseConnect') + '</b></span><span>' + esc(c.level || '') + '</span><span>' + totalLessons + ' lessons · ' + dur + '</span></div>'
      +   '</div></section>'

      + '<div class="detail-body">'
      +   '<div class="detail-main reveal">'
      +     '<div class="panel"><h2>What you’ll learn</h2><ul class="learn-list">' + learnHTML + '</ul></div>'
      +     '<div class="panel"><div class="content-head"><h2>Course content</h2><span class="content-meta">' + (c.sections ? c.sections.length : 0) + ' sections · ' + totalLessons + ' lessons · ' + dur + '</span></div>' + sectionsHTML + '</div>'
      +     '<div class="panel"><h2>Requirements</h2><ul class="bullet-list">' + reqHTML + '</ul></div>'
      +     '<div class="panel"><h2>Description</h2><p class="desc">' + esc(c.description || c.summary || '') + '</p></div>'
      +     (c.enrolled ? '<div class="panel"><h2>Your progress</h2><div id="progressWrap"></div></div>' : '')
      +   '</div>'

      +   '<aside class="detail-side reveal d1"><div class="enroll-card">'
      +     '<div class="video-preview" style="' + thumbStyle(c) + ';"><span class="play-btn">' + playSVG() + '</span><span class="vp-dur">Preview</span></div>'
      +     '<div class="price-row"><span class="ec-price">' + price + '</span></div>'
      +     '<div class="enroll-actions"><button class="btn-submit" id="enrollBtn" type="button"><span class="spinner"></span><span class="btn-label">' + enrollLabel(c) + '</span></button></div>'
      +     (c.badge ? '<p class="guarantee" style="color:var(--success);font-weight:700;">🏅 Course completed — badge earned!</p>' : '')
      +     '<p class="guarantee">30-Day Money-Back Guarantee</p>'
      +     '<ul class="includes"><li>' + totalLessons + ' lessons · ' + dur + ' content</li><li>Lifetime access</li><li>Certificate of completion</li><li>Access on mobile & TV</li></ul>'
      +     '<div class="ec-gate" id="enrollGate" style="display:none;"><b>Almost there.</b><span>You need a free CourseConnect account to enroll.</span><a class="btn-pill solid" href="register.html?course=' + c.id + '" style="width:100%;text-align:center;">Create free account</a><a class="ec-link" href="login.html?course=' + c.id + '">Already have an account? Sign in</a></div>'
      +   '</div></aside>'
      + '</div>'

      + '<div class="lesson-modal" id="lessonModal" style="display:none;">'
      +   '<div class="lm-backdrop" id="lmBackdrop"></div>'
      +   '<div class="lm-dialog"><button class="lm-close" id="lmClose" type="button" aria-label="Close">&times;</button>'
      +     '<div class="lm-video" id="lmVideo"></div>'
      +     '<div class="lm-body"><span class="lm-sec" id="lmSec"></span><h3 id="lmTitle"></h3><div class="lm-desc" id="lmDesc"></div>'
      +       '<button class="btn-submit" id="lmComplete" type="button" style="margin-top:14px;display:none;">Mark lesson complete</button>'
      +     '</div>'
      +     '<div class="lm-nav"><button class="btn-pill ghost" id="lmPrev" type="button">← Previous</button><button class="btn-pill solid" id="lmNext" type="button">Next →</button></div>'
      +   '</div></div>';

    wire(c);
    observeReveal();
  }

  function enrollLabel(c) {
    if (c.enrolled) return c.badge ? 'View course' : 'Continue learning';
    return (c.price === 0) ? 'Enroll for free' : 'Enroll now';
  }

  function wire(c) {
    root.querySelectorAll('.acc-head').forEach(function (h) {
      h.addEventListener('click', function () { h.parentElement.classList.toggle('open'); });
    });

    var flat = [];
    (c.sections || []).forEach(function (s) {
      (s.lessons || []).forEach(function (l) {
        flat.push({ sec: s.title, lesson: l });
      });
    });

    function embedVideo(url) {
      if (!url) return '<div class="lm-noVideo">No video attached to this lesson yet.</div>';
      if (/^(blob:|data:video|https?:\/\/.*\.(mp4|webm|ogg))/i.test(url)) return '<video src="' + url + '" controls autoplay></video>';
      return '<div class="lm-noVideo">Video: <a href="' + url + '" target="_blank" rel="noopener">' + url + '</a></div>';
    }
    function openLesson(i) {
      var item = flat[i]; if (!item) return;
      var l = item.lesson;
      document.getElementById('lmSec').textContent = item.sec || '';
      document.getElementById('lmTitle').textContent = l.title;
      document.getElementById('lmDesc').textContent = l.description || '';
      document.getElementById('lmVideo').innerHTML = embedVideo(l.videoUrl);
      document.getElementById('lmPrev').disabled = (i === 0);
      document.getElementById('lmNext').disabled = (i === flat.length - 1);
      var completeBtn = document.getElementById('lmComplete');
      // Only students who are enrolled can mark lessons complete.
      var canComplete = c.enrolled && Session.isLoggedIn() && Session.role === 'student';
      completeBtn.style.display = canComplete ? 'inline-flex' : 'none';
      completeBtn.onclick = function () { markComplete(l.id); };
      document.getElementById('lessonModal').style.display = 'flex';
      document.getElementById('lmPrev').onclick = function () { if (i > 0) openLesson(i - 1); };
      document.getElementById('lmNext').onclick = function () { if (i < flat.length - 1) openLesson(i + 1); };
    }
    function closeLesson() { document.getElementById('lessonModal').style.display = 'none'; }

    root.querySelectorAll('.acc-lesson').forEach(function (el, idx) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () {
        var lesson = flat[idx] && flat[idx].lesson;
        if (lesson && lesson.videoUrl) { openLesson(idx); return; }
        // Locked lesson → enroll / sign in first.
        promptEnroll();
      });
    });

    var lmClose = document.getElementById('lmClose');
    var lmBackdrop = document.getElementById('lmBackdrop');
    if (lmClose) lmClose.onclick = closeLesson;
    if (lmBackdrop) lmBackdrop.onclick = closeLesson;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLesson(); });

    var enrollBtn = document.getElementById('enrollBtn');
    if (enrollBtn) enrollBtn.addEventListener('click', function () {
      if (c.enrolled) { openLesson(0); return; }
      promptEnroll();
    });

    if (c.enrolled) renderProgress(c);
  }

  function renderProgress(c) {
    var wrap = document.getElementById('progressWrap');
    if (!wrap) return;
    var pct = c.progressPercent || 0;
    wrap.innerHTML = '<div class="rv-bar" style="margin:6px 0;"><span class="track" style="display:block;height:10px;background:var(--line);border-radius:999px;"><span class="fill" style="display:block;height:100%;width:' + pct + '%;background:linear-gradient(135deg,var(--violet),var(--teal));border-radius:999px;"></span></span><span style="font-size:.8rem;color:var(--ink-soft);">' + pct + '% complete</span></div>';
  }

  function promptEnroll() {
    var gate = document.getElementById('enrollGate');
    if (!Session.isLoggedIn()) {
      if (gate) gate.style.display = 'flex';
      return;
    }
    if (Session.role !== 'student') {
      alert('Only students can enroll. Lecturers manage courses from their dashboard.');
      return;
    }
    enroll();
  }

  function enroll() {
    var btn = document.getElementById('enrollBtn');
    btn.classList.add('loading'); btn.disabled = true;
    CourseConnectAuth.courseFetch('/req/courses/' + id + '/enroll', { method: 'POST' })
      .then(async function (r) {
        if (!r.ok) { var e = await r.json().catch(function () { return {}; }); throw new Error(e.message || ('HTTP ' + r.status)); }
        return r.json();
      })
      .then(function (data) {
        if (data.status === 'active') {
          alert('🎉 You are enrolled!');
          load();
        } else if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      })
      .catch(function (err) {
        btn.classList.remove('loading'); btn.disabled = false;
        alert('Enrollment failed: ' + err.message);
      });
  }

  function markComplete(lessonId) {
    CourseConnectAuth.courseFetch('/req/courses/' + id + '/lessons/' + lessonId + '/complete', { method: 'POST' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        if (res.badge) { alert('🏅 Course completed! You earned a badge.'); }
        // Refresh detail to reflect new progress / badge.
        load();
      })
      .catch(function (err) { alert('Could not mark complete: ' + err.message); });
  }

  function observeReveal() {
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
      }, { threshold: 0.08 });
      root.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
    } else {
      root.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }
  }
})();
