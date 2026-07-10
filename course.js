// Renders a course detail page from ?id= and wires the Enroll action.
var root = document.getElementById('detailRoot');

function getParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

var id = parseInt(getParam('id'), 10);
var course = window.CourseStore.getById(id);

function catIcon(cat){
  switch(cat){
    case 'Development': return '<path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 7l-2 10" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'Design': return '<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.3 1.2-2.2-.8-.9-.3-2.1 1-2.1H17a4 4 0 0 0 4-4c0-5-4-9.7-9-9.7Z" stroke="#fff" stroke-width="1.6" fill="none"/><circle cx="8.5" cy="10.5" r="1.2" fill="#fff"/>';
    case 'Business': return '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none"/>';
    case 'Data Science': return '<path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none"/>';
    case 'Marketing': return '<path d="M4 12a8 8 0 1 1 16 0M12 4v16M4 12h16" stroke="#fff" stroke-width="1.6" fill="none"/>';
    default: return '<circle cx="12" cy="12" r="8" stroke="#fff" stroke-width="1.7" fill="none"/>';
  }
}

function starSVG(){
  return '<svg class="stars" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" fill="currentColor"/></svg>';
}
function checkSVG(){
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function fmt(n){ return n.toLocaleString('en-US'); }
function escAttr(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
function initials(name){
  return name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/,'').split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase();
}

// Build curriculum sections (grouped, with per-lesson durations + video/desc)
function buildSections(c){
  if (c.sections && c.sections.length) {
    return c.sections.map(function (s) {
      return { title: s.title, lessons: (s.lessons || []).map(function (l) {
        return { title: l.title, mins: l.mins, video: l.video, desc: l.desc };
      }) };
    });
  }
  var names = ['Getting started', 'Core concepts', 'Putting it into practice', 'Going further'];
  var sections = [];
  var per = 3;
  for (var i = 0; i < c.curriculum.length; i += per) {
    var lessons = c.curriculum.slice(i, i + per).map(function (title, j) {
      var d = 6 + ((i + j) % 5) * 4;
      return { title: title, mins: d };
    });
    sections.push({ title: names[Math.floor(i / per)] || ('Section ' + (Math.floor(i / per) + 1)), lessons: lessons });
  }
  return sections;
}

function notFound(){
  root.innerHTML = ''
    + '<div class="detail-hero" style="background:linear-gradient(135deg,#6A5CF0,#2E1F8F);">'
    +   '<div class="detail-hero-inner"><h1>Course not found</h1>'
    +   '<p>That course doesn’t exist. Browse the full catalog instead.</p>'
    +   '<a class="btn-pill solid" href="courses.html" style="display:inline-block;margin-top:8px;">Back to courses</a></div>'
    + '</div>';
}

function render(c){
  document.title = c.title + ' · CourseConnect';
  var price = c.price === 0 ? 'Free' : '$' + c.price;
  var old = c.price === 0 ? '' : '$' + Math.round(c.price * 1.6);
  var sections = buildSections(c);
  var totalLessons = c.curriculum.length;
  var secCount = sections.length;

  // Curriculum HTML
  var sectionsHTML = sections.map(function (s, si) {
    var lessonsHTML = s.lessons.map(function (l) {
      return '<div class="acc-lesson" data-video="' + escAttr(l.video || '') + '" data-desc="' + escAttr(l.desc || '') + '">'
        + '<span class="play">' + playSVG() + '</span>'
        + '<span>' + escapeHtml(l.title) + '</span>'
        + '<span class="dur">' + l.mins + ' min</span></div>';
    }).join('');
    return ''
      + '<div class="acc-section' + (si === 0 ? ' open' : '') + '">'
      +   '<div class="acc-head"><span class="t">' + escapeHtml(s.title) + '</span><span class="meta">' + s.lessons.length + ' lessons</span></div>'
      +   '<div class="acc-body">' + lessonsHTML + '</div>'
      + '</div>';
  }).join('');

  // Sample reviews
  var reviews = [
    { name:'Leslie A.', r:5, t:'"' + escapeHtml(c.title) + ' was exactly what I needed. Clear, practical, and I finished feeling confident."' },
    { name:'Mohamed K.', r:4, t:'"Great structure and the projects really helped it click. Would love even more advanced examples."' },
    { name:'Priya S.', r:5, t:'"' + escapeHtml(c.instructor) + ' explains things beautifully. Worth every minute — highly recommended."' }
  ];
  var reviewsHTML = reviews.map(function (rv) {
    return '<div class="rv-item"><div class="rv-ava">' + initials(rv.name) + '</div>'
      + '<div class="rv-body"><div class="rv-top"><span class="rv-name">' + escapeHtml(rv.name) + '</span><span class="rv-stars">' + starSVG() + ' ' + rv.r + '.0</span></div>'
      + '<p>' + escapeHtml(rv.t) + '</p></div></div>';
  }).join('');

  var includes = [
    c.lessons + ' lessons · ' + c.duration + ' of on-demand content',
    'Lifetime access',
    'Access on mobile and TV',
    'Certificate of completion',
    'Hands-on assignments & projects'
  ];
  var includesHTML = includes.map(function (x) {
    return '<li>' + inclSVG() + '<span>' + x + '</span></li>';
  }).join('');

  var reqs = [
    'A computer with internet access',
    c.level === 'Beginner' ? 'No prior experience required — we start from the basics' : 'Some foundational knowledge in the topic area',
    'A willingness to practice as you go'
  ];
  var reqsHTML = reqs.map(function (x) { return '<li>' + x + '</li>'; }).join('');

  root.innerHTML = ''
  // ===== HERO =====
  + '<section class="detail-hero" style="background:linear-gradient(135deg,' + escAttr(c.grad[0]) + ',' + escAttr(c.grad[1]) + ');">'
  +   '<div class="detail-hero-inner">'
  +     '<a class="crumb" href="courses.html">&larr; All courses</a>'
  +     '<span class="badge">' + escapeHtml(c.category) + '</span>'
  +     '<h1>' + escapeHtml(c.title) + '</h1>'
  +     '<p class="lede">' + escapeHtml(c.summary) + '</p>'
  +     '<div class="detail-rating">'
  +       '<b>' + c.rating.toFixed(1) + '</b>' + starSVG()
  +       '<span class="rcount">(' + fmt(c.students) + ' ratings)</span>'
  +       '<span class="rcount">· ' + fmt(c.students) + ' students</span>'
  +     '</div>'
  +     '<div class="detail-byline">'
  +       '<span>Created by <b>' + escapeHtml(c.instructor) + '</b></span>'
  +       '<span>' + escapeHtml(c.level) + '</span>'
  +       '<span>' + totalLessons + ' lessons · ' + escapeHtml(c.duration) + '</span>'
  +       '<span>English</span>'
  +       '<span>Last updated June 2026</span>'
  +     '</div>'
  +   '</div>'
  + '</section>'

  // ===== BODY =====
  + '<div class="detail-body">'
  +   '<div class="detail-main reveal">'

  +     '<div class="panel">'
  +       '<h2>What you'll learn</h2>'
  +       '<ul class="learn-list">' + c.learn.map(function (x) { return '<li>' + checkSVG() + '<span>' + escapeHtml(x) + '</span></li>'; }).join('') + '</ul>'
  +     '</div>'

  +     '<div class="panel">'
  +       '<div class="content-head"><h2>Course content</h2><span class="content-meta">' + secCount + ' sections · ' + totalLessons + ' lessons · ' + c.duration + ' total</span></div>'
  +       sectionsHTML
  +     '</div>'

  +     '<div class="panel">'
  +       '<h2>Requirements</h2>'
  +       '<ul class="bullet-list">' + reqsHTML + '</ul>'
  +     '</div>'

  +     '<div class="panel">'
  +       '<h2>Description</h2>'
  +       '<p class="desc">' + escapeHtml(c.summary) + '</p>'
  +       '<p class="desc">This course is built around hands-on practice. You'll work through real examples, build a portfolio-ready project, and learn the patterns that professionals use — all at your own pace, with lifetime access.</p>'
  +     '</div>'

  +     '<div class="panel">'
  +       '<h2>Instructor</h2>'
  +       '<div class="instructor">'
  +         '<div class="inst-ava">' + initials(c.instructor) + '</div>'
  +         '<div class="inst-body">'
  +           '<b class="inst-name">' + escapeHtml(c.instructor) + '</b>'
  +           '<span class="inst-title">' + escapeHtml(c.category) + ' Instructor · ' + escapeHtml(c.level) + '</span>'
  +           '<p class="inst-bio">An experienced educator who has helped thousands of learners master ' + escapeHtml(c.category.toLowerCase()) + '. Known for clear explanations and project-based teaching.</p>'
  +         '</div>'
  +       '</div>'
  +     '</div>'

  +     '<div class="panel">'
  +       '<h2>Student feedback</h2>'
  +       '<div class="rv-summary">'
  +         '<div class="rv-big"><b>' + c.rating.toFixed(1) + '</b><div class="rv-stars">' + starSVG() + '</div><span class="rcount">' + fmt(c.students) + ' ratings</span></div>'
  +         '<div class="rv-bars">'
  +           bar(5, 72) + bar(4, 18) + bar(3, 6) + bar(2, 3) + bar(1, 1)
  +         '</div>'
  +       '</div>'
  +       reviewsHTML
  +     '</div>'

  +   '</div>'

  // ===== SIDEBAR =====
  +   '<aside class="detail-side reveal d1">'
  +     '<div class="enroll-card">'
  +       '<div class="video-preview" style="background:linear-gradient(135deg,' + escAttr(c.grad[0]) + ',' + escAttr(c.grad[1]) + ');">'
  +         '<span class="play-btn">' + playSVG() + '</span>'
  +         '<span class="vp-dur">Preview</span>'
  +       '</div>'
  +       '<div class="price-row"><span class="ec-price">' + price + '</span>' + (old ? '<span class="ec-old">' + old + '</span>' : '') + '</div>'
  +       '<div class="enroll-actions">'
  +         '<button class="btn-submit" id="enrollBtn" type="button"><span class="spinner"></span><span class="btn-label">' + (c.price === 0 ? 'Enroll for free' : 'Enroll now') + '</span></button>'
  +         '<button class="btn-outline" id="cartBtn" type="button">' + (c.price === 0 ? 'Add to library' : 'Add to cart') + '</button>'
  +       '</div>'
  +       '<p class="guarantee">30-Day Money-Back Guarantee</p>'
  +       '<p class="ec-label">This course includes</p>'
  +       '<ul class="includes">' + includesHTML + '</ul>'
  +       '<div class="ec-gate" id="enrollGate" style="display:none;">'
  +         '<b>Almost there.</b>'
  +         '<span>You need a free CourseConnect account to enroll. Create one in seconds.</span>'
  +         '<a class="btn-pill solid" href="register.html?course=' + c.id + '" style="width:100%;text-align:center;">Create free account</a>'
  +         '<a class="ec-link" href="login.html?course=' + c.id + '">Already have an account? Sign in</a>'
  +       '</div>'
  +       '<div class="ec-actions-row">'
  +         '<a href="#" id="shareBtn"><svg viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" stroke="currentColor" stroke-width="1.6"/></svg>Share</a>'
  +         '<a href="#" id="giftBtn"><svg viewBox="0 0 24 24" fill="none"><path d="M4 11h16v9H4z" stroke="currentColor" stroke-width="1.6"/><path d="M2 7h20v4H2zM12 7v13" stroke="currentColor" stroke-width="1.6"/></svg>Gift</a>'
  +       '</div>'
  +     '</div>'
    +   '</aside>'
    + '</div>'

    // ===== Lesson viewer modal =====
    + '<div class="lesson-modal" id="lessonModal" style="display:none;">'
    +   '<div class="lm-backdrop" id="lmBackdrop"></div>'
    +   '<div class="lm-dialog">'
    +     '<button class="lm-close" id="lmClose" type="button" aria-label="Close">&times;</button>'
    +     '<div class="lm-video" id="lmVideo"></div>'
    +     '<div class="lm-body">'
    +       '<span class="lm-sec" id="lmSec"></span>'
    +       '<h3 id="lmTitle"></h3>'
    +       '<div class="lm-desc" id="lmDesc"></div>'
    +     '</div>'
    +     '<div class="lm-nav">'
    +       '<button class="btn-pill ghost" id="lmPrev" type="button">← Previous</button>'
    +       '<button class="btn-pill solid" id="lmNext" type="button">Next →</button>'
    +     '</div>'
    +   '</div>'
    + '</div>';

  wireInteractions();
  observeReveal();
}

function playSVG(){
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5Z" fill="currentColor"/></svg>';
}
function inclSVG(){
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function bar(stars, pct){
  return '<div class="rv-bar"><span class="lab">' + stars + ' ' + starSVG() + '</span><span class="track"><span class="fill" style="width:' + pct + '%"></span></span><span>' + pct + '%</span></div>';
}

function wireInteractions(){
  // Accordion
  root.querySelectorAll('.acc-head').forEach(function (h) {
    h.addEventListener('click', function () { h.parentElement.classList.toggle('open'); });
  });

  // Lesson viewer
  var flat = [];
  root.querySelectorAll('.acc-section').forEach(function (sec) {
    var secName = sec.querySelector('.acc-head .t') ? sec.querySelector('.acc-head .t').textContent : '';
    sec.querySelectorAll('.acc-lesson').forEach(function (el) {
      var title = el.querySelector('span:nth-child(2)') ? el.querySelector('span:nth-child(2)').textContent : el.textContent;
      flat.push({
        sec: secName,
        lesson: { title: title, video: el.dataset.video || '', desc: el.dataset.desc || '' }
      });
    });
  });

  function embedVideo(url){
    if (!url) return '<div class="lm-noVideo">No video attached to this lesson yet.</div>';
    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (yt) return '<iframe src="https://www.youtube.com/embed/' + escAttr(yt[1]) + '" frameborder="0" allowfullscreen></iframe>';
    if (/^(blob:|data:video|https?:\/\/.*\.(mp4|webm|ogg))/.test(url)) return '<video src="' + escAttr(url) + '" controls></video>';
    // Validate URL scheme for fallback link
    if (/^https?:\/\//.test(url)) {
      return '<div class="lm-noVideo">Video: <a href="' + escAttr(url) + '" target="_blank" rel="noopener">' + escapeHtml(url) + '</a></div>';
    }
    return '<div class="lm-noVideo">Invalid video URL provided.</div>';
  }
  function openLesson(i){
    var item = flat[i]; if (!item) return;
    var l = item.lesson;
    document.getElementById('lmSec').textContent = item.sec;
    document.getElementById('lmTitle').textContent = l.title;
    document.getElementById('lmDesc').textContent = l.desc || 'No description provided for this lesson.';
    document.getElementById('lmVideo').innerHTML = embedVideo(l.video);
    document.getElementById('lmPrev').disabled = (i === 0);
    document.getElementById('lmNext').disabled = (i === flat.length - 1);
    document.getElementById('lessonModal').style.display = 'flex';
    document.getElementById('lmPrev').onclick = function () { if (i > 0) openLesson(i - 1); };
    document.getElementById('lmNext').onclick = function () { if (i < flat.length - 1) openLesson(i + 1); };
  }
  function closeLesson(){ document.getElementById('lessonModal').style.display = 'none'; }
  root.querySelectorAll('.acc-lesson').forEach(function (el, idx) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function (e) { e.stopPropagation(); openLesson(idx); });
  });
  var lmClose = document.getElementById('lmClose');
  var lmBackdrop = document.getElementById('lmBackdrop');
  if (lmClose) lmClose.onclick = closeLesson;
  if (lmBackdrop) lmBackdrop.onclick = closeLesson;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLesson(); });

  // Enroll / cart -> show account gate
  var gate = document.getElementById('enrollGate');
  function showGate(btn){
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove('loading'); btn.disabled = false;
      gate.style.display = 'flex';
      gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 650);
  }
  var enrollBtn = document.getElementById('enrollBtn');
  var cartBtn = document.getElementById('cartBtn');
  if (enrollBtn) enrollBtn.addEventListener('click', function(){ showGate(enrollBtn); });
  if (cartBtn) cartBtn.addEventListener('click', function(){ showGate(cartBtn); });

  var share = document.getElementById('shareBtn');
  if (share) share.addEventListener('click', function(e){ e.preventDefault(); alert('Share link copied to clipboard!'); });
  var gift = document.getElementById('giftBtn');
  if (gift) gift.addEventListener('click', function(e){ e.preventDefault(); alert('Gift this course to a friend.'); });
}

function observeReveal(){
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    root.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  } else {
    root.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
}

if (!course) {
  notFound();
} else {
  render(course);
}
