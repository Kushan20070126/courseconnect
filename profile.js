// Student / Lecturer profile dashboard (demo data — wire to your API/auth).
var root = document.getElementById('profileRoot');

// Default role (can be overridden by ?role=lecturer in the URL, or the in-page toggle)
var currentRole = (new URLSearchParams(window.location.search).get('role') === 'lecturer') ? 'lecturer' : 'student';

// Demo profiles
var users = {
  student: { name:'Alex Carter', email:'alex.carter@example.com', headline:'Aspiring full-stack developer', role:'Student', initials:'AC' },
  lecturer:{ name:'Dr. Anika Perera', email:'anika@courseconnect.io', headline:'Data scientist & educator', role:'Lecturer', initials:'AP' }
};

// Student data
var enrolledStudent = [
  { id:1, progress:62, last:'Building the REST API' },
  { id:7, progress:28, last:'Hooks deep dive' },
  { id:11, progress:0, last:null },
  { id:3, progress:100, last:'A mini analysis project' }
];
var wishlistStudent = [5, 8, 10];
var certsStudent = [{ id:3, date:'May 2026' }];

// Lecturer data (lecturers also learn, but primarily teach)
var enrolledLecturer = [
  { id:11, progress:100, last:'Serving models' },
  { id:5, progress:45, last:'Evaluation & fairness' }
];
var teachingLecturer = [21, 22];
var wishlistLecturer = [1, 7];
var certsLecturer = [{ id:11, date:'April 2026' }];

function courseById(id){ return window.CourseStore.getById(id); }
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
function fmt(n){ return n.toLocaleString('en-US'); }
function playSVG(){ return '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5Z" fill="currentColor"/></svg>'; }

function state(){
  return currentRole === 'lecturer'
    ? { user:users.lecturer, enrolled:enrolledLecturer, teaching:teachingLecturer, wishlist:wishlistLecturer, certs:certsLecturer }
    : { user:users.student, enrolled:enrolledStudent, teaching:[], wishlist:wishlistStudent, certs:certsStudent };
}

function enrolledCard(e){
  var c = courseById(e.id);
  if(!c) return '';
  var pct = e.progress;
  var btn = pct === 0 ? 'Start' : (pct === 100 ? 'Review' : 'Resume');
  var lastLine = e.last ? ('Last: ' + e.last) : 'Not started yet';
  return ''
    + '<article class="pl-card reveal">'
    +   '<a class="pl-thumb" href="course.html?id=' + c.id + '" style="background:linear-gradient(135deg,' + c.grad[0] + ',' + c.grad[1] + ')">'
    +     '<svg class="ct-ic" viewBox="0 0 24 24" fill="none">' + catIcon(c.category) + '</svg>'
    +     (pct > 0 && pct < 100 ? '<span class="pl-resume">' + playSVG() + '</span>' : '')
    +   '</a>'
    +   '<div class="pl-body">'
    +     '<span class="pl-cat">' + c.category + '</span>'
    +     '<h3 class="pl-title"><a href="course.html?id=' + c.id + '">' + c.title + '</a></h3>'
    +     '<div class="pl-progress"><span class="track"><span class="fill" style="width:' + pct + '%"></span></span><span class="pct">' + pct + '%</span></div>'
    +     '<p class="pl-last">' + lastLine + '</p>'
    +     '<a class="btn-mini" href="course.html?id=' + c.id + '">' + btn + '</a>'
    +   '</div>'
    + '</article>';
}

function teachingCard(tid){
  var c = courseById(tid);
  if(!c) return '';
  return ''
    + '<article class="pl-card reveal">'
    +   '<a class="pl-thumb" href="course.html?id=' + c.id + '" style="background:linear-gradient(135deg,' + c.grad[0] + ',' + c.grad[1] + ')">'
    +     '<svg class="ct-ic" viewBox="0 0 24 24" fill="none">' + catIcon(c.category) + '</svg>'
    +   '</a>'
    +   '<div class="pl-body">'
    +     '<span class="pl-cat">You teach</span>'
    +     '<h3 class="pl-title"><a href="course.html?id=' + c.id + '">' + c.title + '</a></h3>'
    +     '<div class="pl-stats"><span>' + fmt(c.students) + ' students</span><span>★ ' + c.rating.toFixed(1) + '</span><span>' + c.lessons + ' lessons</span></div>'
    +     '<div class="pl-actions">'
    +       '<a class="btn-mini" href="course.html?id=' + c.id + '">View course</a>'
    +       '<button class="btn-outline sm" type="button" data-act="Edit">Edit</button>'
    +     '</div>'
    +   '</div>'
    + '</article>';
}

function wishCard(id){
  var c = courseById(id);
  if(!c) return '';
  var price = c.price === 0 ? 'Free' : '$' + c.price;
  return ''
    + '<article class="pl-card reveal">'
    +   '<a class="pl-thumb" href="course.html?id=' + c.id + '" style="background:linear-gradient(135deg,' + c.grad[0] + ',' + c.grad[1] + ')">'
    +     '<svg class="ct-ic" viewBox="0 0 24 24" fill="none">' + catIcon(c.category) + '</svg>'
    +   '</a>'
    +   '<div class="pl-body">'
    +     '<span class="pl-cat">' + c.category + '</span>'
    +     '<h3 class="pl-title"><a href="course.html?id=' + c.id + '">' + c.title + '</a></h3>'
    +     '<p class="pl-last">by ' + c.instructor + '</p>'
    +     '<div class="pl-actions">'
    +       '<a class="btn-mini" href="course.html?id=' + c.id + '">View</a>'
    +       '<span class="pl-price">' + price + '</span>'
    +     '</div>'
    +   '</div>'
    + '</article>';
}

function certCard(cert){
  var c = courseById(cert.id);
  if(!c) return '';
  return ''
    + '<div class="cert-card reveal">'
    +   '<div class="cert-badge"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 13l-1.5 8 5-3 5 3-1.5-8" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></div>'
    +   '<div class="cert-body"><b>' + c.title + '</b><p>Completed ' + cert.date + ' · CourseConnect</p></div>'
    +   '<button class="btn-outline sm" type="button" data-act="Download">Download</button>'
    + '</div>';
}

function settingsForm(u){
  return ''
    + '<form class="settings-form" id="settingsForm">'
    +   '<div class="field"><label for="setName">Full name</label><input type="text" id="setName" value="' + u.name + '"></div>'
    +   '<div class="field"><label for="setEmail">Email</label><input type="email" id="setEmail" value="' + u.email + '"></div>'
    +   '<div class="field"><label for="setHeadline">Headline</label><input type="text" id="setHeadline" value="' + u.headline + '"></div>'
    +   (currentRole === 'lecturer'
        ? '<div class="field"><label for="setTitle">Title shown on courses</label><input type="text" id="setTitle" value="Dr."></div>'
        : '')
    +   '<div class="field"><label for="setPass">New password</label><input type="password" id="setPass" placeholder="Leave blank to keep current"></div>'
    +   '<div class="form-util"><label class="check"><input type="checkbox" id="setNotif" checked> Email me about course updates and offers</label></div>'
    +   '<button class="btn-submit" type="submit"><span class="spinner"></span><span class="btn-label">Save changes</span></button>'
    + '</form>';
}

function emptyState(title, sub){
  return '<div class="courses-empty"><b>' + title + '</b>' + sub + '</div>';
}

function render(){
  var s = state();
  var u = s.user;
  var enrolledCount = s.enrolled.length;
  var hours = s.enrolled.reduce(function(acc, e){ var c = courseById(e.id); return acc + (c ? Math.round(parseInt(c.duration) * e.progress / 100) : 0); }, 0);

  // Build tabs based on role
  var tabs = [{ id:'learning', label:'My learning' }];
  if (currentRole === 'lecturer') tabs.push({ id:'teaching', label:'My courses' });
  tabs.push({ id:'wishlist', label:'Wishlist' });
  tabs.push({ id:'certs', label:'Certificates' });
  tabs.push({ id:'settings', label:'Settings' });
  var tabsHTML = tabs.map(function(t, i){ return '<button class="ptab' + (i === 0 ? ' active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>'; }).join('');

  var teachingPanel = currentRole === 'lecturer'
    ? '<div class="ptab-panel" id="tab-teaching" style="display:none;">'
      + '<div class="panel-head-row"><h3 class="ph-sub">Courses you teach</h3>'
      +   '<a class="btn-mini" href="create-course.html">+ New course</a></div>'
      + (s.teaching.length ? '<div class="pl-grid">' + s.teaching.map(teachingCard).join('') + '</div>' : emptyState('Nothing here yet', 'Publish a course to see it listed.'))
      + '</div>'
    : '';

  root.innerHTML = ''
  // ===== Header =====
  + '<section class="profile-hero">'
  +   '<div class="profile-hero-inner">'
  +     '<div class="ph-avatar">' + u.initials + '</div>'
  +     '<div class="ph-info">'
  +       '<div class="ph-top"><h1>' + u.name + '</h1><span class="ph-role">' + u.role + '</span></div>'
  +       '<p class="ph-head">' + u.headline + '</p>'
  +       '<p class="ph-mail">' + u.email + '</p>'
  +     '</div>'
  +     '<div class="ph-controls">'
  +       '<div class="role-switch" id="roleSwitch">'
  +         '<button data-role="student"' + (currentRole === 'student' ? ' class="active"' : '') + '>Student</button>'
  +         '<button data-role="lecturer"' + (currentRole === 'lecturer' ? ' class="active"' : '') + '>Lecturer</button>'
  +       '</div>'
  +       '<button class="btn-pill ghost ph-edit" id="editProfile" type="button">Edit profile</button>'
  +     '</div>'
  +   '</div>'
  +   '<div class="ph-stats">'
  +     '<div class="ph-stat"><b>' + enrolledCount + '</b><span>Courses enrolled</span></div>'
  +     '<div class="ph-stat"><b>' + hours + 'h</b><span>Hours learned</span></div>'
  +     '<div class="ph-stat"><b>' + s.certs.length + '</b><span>Certificates</span></div>'
  +   '</div>'
  + '</section>'

  // ===== Tabs + panels =====
  + '<div class="profile-wrap">'
  +   '<div class="profile-tabs" id="profileTabs">' + tabsHTML + '</div>'

  +   '<div class="ptab-panel" id="tab-learning">'
  +     (s.enrolled.length ? '<div class="pl-grid">' + s.enrolled.map(enrolledCard).join('') + '</div>' : emptyState('No courses yet', 'Enroll in a course to start learning.'))
  +   '</div>'

  +   teachingPanel

  +   '<div class="ptab-panel" id="tab-wishlist" style="display:none;">'
  +     (s.wishlist.length ? '<div class="pl-grid">' + s.wishlist.map(wishCard).join('') + '</div>' : emptyState('Wishlist is empty', 'Save courses you want to take later.'))
  +   '</div>'

  +   '<div class="ptab-panel" id="tab-certs" style="display:none;">'
  +     (s.certs.length ? '<div class="cert-list">' + s.certs.map(certCard).join('') + '</div>' : emptyState('No certificates yet', 'Finish a course to earn one.'))
  +   '</div>'

  +   '<div class="ptab-panel" id="tab-settings" style="display:none;">'
  +     '<div class="settings-card">' + settingsForm(u) + '</div>'
  +   '</div>'
  + '</div>';

  wire();
  observeReveal();
}

function wire(){
  // Tabs
  root.querySelectorAll('.ptab').forEach(function (t) {
    t.addEventListener('click', function () {
      root.querySelectorAll('.ptab').forEach(function (x) { x.classList.remove('active'); });
      t.classList.add('active');
      root.querySelectorAll('.ptab-panel').forEach(function (p) { p.style.display = 'none'; });
      var panel = document.getElementById('tab-' + t.dataset.tab);
      if (panel) panel.style.display = 'block';
      observeReveal();
    });
  });

  // Role switch (demo)
  var rs = document.getElementById('roleSwitch');
  if (rs) rs.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      currentRole = b.dataset.role;
      rs.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      render();
    });
  });

  // Edit profile -> settings
  var edit = document.getElementById('editProfile');
  if (edit) edit.addEventListener('click', function () {
    root.querySelector('.ptab[data-tab="settings"]').click();
    document.getElementById('tab-settings').scrollIntoView({ behavior:'smooth', block:'start' });
  });

  // Settings submit
  var sf = document.getElementById('settingsForm');
  if (sf) sf.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = sf.querySelector('.btn-submit');
    btn.classList.add('loading'); btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove('loading'); btn.disabled = false;
      alert('Profile updated!');
    }, 700);
  });

  // Edit / Download buttons
  root.querySelectorAll('[data-act]').forEach(function (b) {
    b.addEventListener('click', function () { alert(b.dataset.act + ' — demo action'); });
  });
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

render();
