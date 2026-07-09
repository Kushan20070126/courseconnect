// Renders a course detail page from ?id= and wires the Enroll action.
var root = document.getElementById('detailRoot');

function getParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

var id = parseInt(getParam('id'), 10);
var course = COURSES.filter(function (c) { return c.id === id; })[0];

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

  var learnList = c.learn.map(function (x) {
    return '<li><svg viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + x + '</li>';
  }).join('');

  var currList = c.curriculum.map(function (x, i) {
    return '<li><span class="num">' + (i + 1) + '</span><span>' + x + '</span></li>';
  }).join('');

  root.innerHTML = ''
  + '<section class="detail-hero" style="background:linear-gradient(135deg,' + c.grad[0] + ',' + c.grad[1] + ');">'
  +   '<div class="detail-hero-inner">'
  +     '<a class="crumb" href="courses.html">&larr; All courses</a>'
  +     '<span class="badge">' + c.level + ' · ' + c.category + '</span>'
  +     '<h1>' + c.title + '</h1>'
  +     '<p class="lede">' + c.summary + '</p>'
  +     '<div class="detail-meta">'
  +       '<span class="m"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' + c.duration + '</span>'
  +       '<span class="m"><svg viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' + c.lessons + ' lessons</span>'
  +       '<span class="m rating"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" fill="currentColor"/></svg>' + c.rating.toFixed(1) + '</span>'
  +     '</div>'
  +   '</div>'
  + '</section>'

  + '<div class="detail-body">'
  +   '<div class="detail-main reveal">'
  +     '<h2>What you’ll learn</h2>'
  +     '<ul class="learn-list">' + learnList + '</ul>'

  +     '<h2>Curriculum</h2>'
  +     '<ul class="curr-list">' + currList + '</ul>'
  +   '</div>'

  +   '<aside class="detail-side reveal d1">'
  +     '<div class="enroll-card">'
  +       '<div class="ec-thumb" style="background:linear-gradient(135deg,' + c.grad[0] + ',' + c.grad[1] + ');">'
  +         '<svg class="ct-ic" viewBox="0 0 24 24" fill="none">' + catIcon(c.category) + '</svg>'
  +       '</div>'
  +       '<div class="ec-price">' + price + '</div>'
  +       '<button class="btn-submit" id="enrollBtn" type="button">'
  +         '<span class="spinner"></span><span class="btn-label">' + (c.price === 0 ? 'Enroll for free' : 'Enroll now') + '</span>'
  +       '</button>'
  +       '<p class="ec-note">Full lifetime access · Learn at your own pace</p>'

  +       '<div class="ec-gate" id="enrollGate" style="display:none;">'
  +         '<b>Almost there.</b>'
  +         '<span>You need a free CourseConnect account to enroll. Create one in seconds.</span>'
  +         '<a class="btn-pill solid" href="register.html?course=' + c.id + '" style="width:100%;text-align:center;">Create free account</a>'
  +         '<a class="ec-link" href="login.html?course=' + c.id + '">Already have an account? Sign in</a>'
  +       '</div>'

  +       '<div class="ec-info">'
  +         '<div class="ei"><span>Instructor</span><b>' + c.instructor + '</b></div>'
  +         '<div class="ei"><span>Level</span><b>' + c.level + '</b></div>'
  +         '<div class="ei"><span>Category</span><b>' + c.category + '</b></div>'
  +         '<div class="ei"><span>Duration</span><b>' + c.duration + '</b></div>'
  +       '</div>'
  +     '</div>'
  +   '</aside>'
  + '</div>';

  // Enroll flow: there is no auth backend, so we guide the user to create an account.
  var enrollBtn = document.getElementById('enrollBtn');
  var gate = document.getElementById('enrollGate');
  enrollBtn.addEventListener('click', function () {
    enrollBtn.classList.add('loading');
    enrollBtn.disabled = true;
    setTimeout(function () {
      enrollBtn.classList.remove('loading');
      enrollBtn.disabled = false;
      gate.style.display = 'flex';
      gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 700);
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
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
