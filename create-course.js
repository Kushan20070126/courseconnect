// Lecturer "Create course" wizard (demo - persists to localStorage via CourseStore).
(function () {
  var CURRENT_LECTURER = 'Dr. Anika Perera';
  var form = document.getElementById('createForm');
  var stepper = document.getElementById('stepper');
  var errorBox = document.getElementById('formError');
  var btnBack = document.getElementById('btnBack');
  var btnNext = document.getElementById('btnNext');
  var btnPublish = document.getElementById('btnPublish');

  var step = 1;
  var totalSteps = 4;
  var selectedGrad = '#4F46E5,#2E1F8F';
  var priceType = 'free';

  // ---------- helpers ----------
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = msg ? 'block' : 'none';
    if (msg) errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function showPanel(n) {
    document.querySelectorAll('.step-panel').forEach(function (p) {
      p.style.display = (parseInt(p.dataset.step, 10) === n) ? 'block' : 'none';
    });
    stepper.querySelectorAll('.step').forEach(function (s) {
      var sn = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
    btnBack.style.visibility = (n === 1) ? 'hidden' : 'visible';
    btnNext.style.display = (n === totalSteps) ? 'none' : 'inline-block';
    btnPublish.style.display = (n === totalSteps) ? 'inline-flex' : 'none';
    if (n === totalSteps) renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- curriculum builder (modern) ----------
  function chevronSVG(){ return '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function playSVG(){ return '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5Z" fill="currentColor"/></svg>'; }
  function trashSVG(){ return '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

  function updateCount(sec){ var n = sec.querySelectorAll('.lesson-item').length; var el = sec.querySelector('.curr-count'); if (el) el.textContent = n + (n === 1 ? ' lesson' : ' lessons'); }
  function renumber(){ document.querySelectorAll('#currBuilder .curr-block').forEach(function (b, i) { var el = b.querySelector('.curr-num'); if (el) el.textContent = (i + 1); }); }

  function lessonRow(sec) {
    var item = document.createElement('div');
    item.className = 'lesson-item';
    item.innerHTML = ''
      + '<button type="button" class="lesson-toggle" aria-label="Collapse lesson">' + chevronSVG() + '</button>'
      + '<span class="lesson-ic">' + playSVG() + '</span>'
      + '<div class="lesson-main">'
      +   '<div class="lesson-row1">'
      +     '<input class="les-title" type="text" placeholder="Lesson title">'
      +     '<input class="les-mins" type="number" min="1" placeholder="min">'
      +     '<button type="button" class="row-remove lesson-del" aria-label="Remove lesson">&times;</button>'
      +   '</div>'
      +   '<div class="lesson-row2">'
      +     '<label class="upload-btn">Upload video<input type="file" accept="video/*" class="les-file" hidden></label>'
      +     '<input class="les-video" type="text" placeholder="…or paste a video URL (YouTube or .mp4)">'
      +     '<span class="les-fname"></span>'
      +   '</div>'
      +   '<textarea class="les-desc" placeholder="Lesson description"></textarea>'
      + '</div>';
    var fileInput = item.querySelector('.les-file');
    var nameEl = item.querySelector('.les-fname');
    fileInput.addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      if (f.size > 1.5 * 1024 * 1024) {
        alert('Demo limit: uploaded video must be under 1.5MB so it can be saved locally. Stored as a reference only.');
        item.dataset.video = ''; item.dataset.vname = f.name;
        nameEl.textContent = f.name + ' (too large to embed)';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) { item.dataset.video = e.target.result; item.dataset.vname = f.name; nameEl.textContent = 'Uploaded: ' + f.name; };
      reader.readAsDataURL(f);
    });
    item.querySelector('.lesson-del').addEventListener('click', function () { item.remove(); updateCount(sec); });
    item.querySelector('.lesson-toggle').addEventListener('click', function () { item.classList.toggle('collapsed'); });
    sec.querySelector('.lesson-list').appendChild(item);
  }
  function addSection() {
    var block = document.createElement('div');
    block.className = 'curr-block';
    block.innerHTML = ''
      + '<div class="curr-head">'
      +   '<button type="button" class="curr-toggle" aria-label="Collapse section">' + chevronSVG() + '</button>'
      +   '<span class="curr-num"></span>'
      +   '<input class="sec-title" type="text" placeholder="Section title (e.g. Getting started)">'
      +   '<span class="curr-count">0 lessons</span>'
      +   '<button type="button" class="row-remove curr-del" aria-label="Remove section">' + trashSVG() + '</button>'
      + '</div>'
      + '<div class="curr-body">'
      +   '<div class="lesson-list"></div>'
      +   '<button type="button" class="lesson-add">+ Add lesson</button>'
      + '</div>';
    block.querySelector('.curr-toggle').addEventListener('click', function () { block.classList.toggle('collapsed'); });
    block.querySelector('.curr-del').addEventListener('click', function () { block.remove(); renumber(); });
    block.querySelector('.lesson-add').addEventListener('click', function () { lessonRow(block); updateCount(block); });
    document.getElementById('currBuilder').appendChild(block);
    lessonRow(block);
    updateCount(block);
    renumber();
    return block;
  }
  function readCurriculum() {
    var sections = [];
    document.querySelectorAll('#currBuilder .curr-block').forEach(function (b) {
      var title = b.querySelector('.sec-title').value.trim();
      var lessons = [];
      b.querySelectorAll('.lesson-item').forEach(function (r) {
        var t = r.querySelector('.les-title').value.trim();
        var m = parseInt(r.querySelector('.les-mins').value, 10);
        var url = r.querySelector('.les-video').value.trim();
        var video = r.dataset.video || url; // uploaded file (data URL) takes priority
        var vname = r.dataset.vname || '';
        var d = r.querySelector('.les-desc').value.trim();
        if (t) lessons.push({ title: t, mins: isNaN(m) ? 5 : m, video: video, vname: vname, desc: d });
      });
      if (title || lessons.length) sections.push({ title: title, lessons: lessons });
    });
    return sections;
  }

  // ---------- list builders (learn / requirements) ----------
  function listRow(container) {
    var row = document.createElement('div');
    row.className = 'list-row';
    row.innerHTML = '<input type="text" placeholder="Type here…"><button type="button" class="row-remove" aria-label="Remove">&times;</button>';
    row.querySelector('.row-remove').addEventListener('click', function () { row.remove(); });
    container.appendChild(row);
  }
  function readList(sel) {
    var out = [];
    document.querySelectorAll(sel + ' .list-row input').forEach(function (i) {
      var v = i.value.trim(); if (v) out.push(v);
    });
    return out;
  }

  // ---------- validation ----------
  function validateStep(n) {
    if (n === 1) {
      if (!val('fTitle')) return 'Please add a course title.';
      if (!val('fSummary')) return 'Please add a subtitle / summary.';
      if (!val('fCategory')) return 'Please choose a category.';
      if (!val('fLevel')) return 'Please choose a level.';
    }
    if (n === 2) {
      var secs = readCurriculum();
      if (!secs.length) return 'Add at least one section with a lesson.';
      for (var i = 0; i < secs.length; i++) {
        if (!secs[i].title) return 'Every section needs a title.';
        if (!secs[i].lessons.length) return 'Add at least one lesson to each section.';
      }
    }
    if (n === 3) {
      if (priceType === 'paid') {
        var p = parseFloat(val('fPrice'));
        if (isNaN(p) || p < 0) return 'Enter a valid price (0 or more).';
      }
      if (!readList('#learnBuilder').length) return 'Add at least one learning outcome.';
    }
    return null;
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  // ---------- review ----------
  function fmtDuration(totalMin) {
    var h = Math.floor(totalMin / 60), m = totalMin % 60;
    if (h && m) return h + 'h ' + m + 'm';
    if (h) return h + 'h';
    return m + 'm';
  }
  function renderReview() {
    var title = val('fTitle') || 'Untitled course';
    var summary = val('fSummary') || '—';
    var category = val('fCategory') || '—';
    var level = val('fLevel') || '—';
    var secs = readCurriculum();
    var lessonCount = secs.reduce(function (s, x) { return s + x.lessons.length; }, 0);
    var totalMin = secs.reduce(function (s, x) { return s + x.lessons.reduce(function (a, l) { return a + (l.mins || 0); }, 0); }, 0);
    var price = priceType === 'free' ? 'Free' : '$' + (parseFloat(val('fPrice')) || 0);
    var learn = readList('#learnBuilder');
    var req = readList('#reqBuilder');

    var secHTML = secs.map(function (s, i) {
      var ls = s.lessons.map(function (l) { return '<li>' + esc(l.title) + (l.vname ? ' <span class="dur">Video: ' + esc(l.vname) + '</span>' : '') + ' <span class="dur">' + l.mins + 'm</span></li>'; }).join('');
      return '<div class="acc-section open"><div class="acc-head"><span class="t">' + esc(s.title || ('Section ' + (i + 1))) + '</span><span class="meta">' + s.lessons.length + ' lessons</span></div><div class="acc-body">' + (ls ? '<ul class="rev-lessons">' + ls + '</ul>' : '') + '</div></div>';
    }).join('');

    document.getElementById('reviewBox').innerHTML = ''
      + '<div class="rev-grid">'
      +   '<div class="rev-thumb" style="background:linear-gradient(135deg,' + selectedGrad.replace(',', ',') + ')"></div>'
      +   '<div class="rev-meta">'
      +     '<span class="pl-cat">' + esc(category) + '</span>'
      +     '<h3 class="pl-title">' + esc(title) + '</h3>'
      +     '<p class="pl-last">' + esc(summary) + '</p>'
      +     '<div class="pl-stats"><span>' + esc(level) + '</span><span>' + secs.length + ' sections</span><span>' + lessonCount + ' lessons · ' + fmtDuration(totalMin) + '</span><span>' + price + '</span></div>'
      +   '</div>'
      + '</div>'
      + '<h4 class="rev-h">Curriculum</h4>' + (secHTML || '<p class="pl-last">No curriculum added.</p>')
      + '<h4 class="rev-h">What students will learn</h4><ul class="bullet-list">' + (learn.length ? learn.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li>—</li>') + '</ul>'
      + (req.length ? '<h4 class="rev-h">Requirements</h4><ul class="bullet-list">' + req.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  // ---------- publish ----------
  function buildCourse() {
    var secs = readCurriculum();
    var lessonCount = secs.reduce(function (s, x) { return s + x.lessons.length; }, 0);
    var totalMin = secs.reduce(function (s, x) { return s + x.lessons.reduce(function (a, l) { return a + (l.mins || 0); }, 0); }, 0);
    var h = Math.floor(totalMin / 60), m = totalMin % 60;
    var duration = (h && m) ? (h + 'h ' + m + 'm') : (h ? h + 'h' : m + 'm');
    var price = priceType === 'free' ? 0 : (parseFloat(val('fPrice')) || 0);
    return {
      id: Math.floor(Date.now() / 1000),
      title: val('fTitle'),
      summary: val('fSummary'),
      instructor: CURRENT_LECTURER,
      category: val('fCategory'),
      level: val('fLevel'),
      language: val('fLang') || 'English',
      duration: duration,
      rating: 0,
      price: price,
      lessons: lessonCount,
      students: 0,
      bestseller: false,
      grad: selectedGrad.split(','),
      learn: readList('#learnBuilder'),
      curriculum: secs.reduce(function (acc, s) { return acc.concat(s.lessons.map(function (l) { return l.title; })); }, []),
      sections: secs,
      created: true
    };
  }

  // ---------- events ----------
  btnNext.addEventListener('click', function () {
    var err = validateStep(step);
    if (err) { showError(err); return; }
    showError('');
    if (step < totalSteps) { step++; showPanel(step); }
  });
  btnBack.addEventListener('click', function () {
    showError('');
    if (step > 1) { step--; showPanel(step); }
  });

  document.getElementById('swatches').querySelectorAll('.swatch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      document.querySelectorAll('.swatch').forEach(function (x) { x.classList.remove('active'); });
      sw.classList.add('active');
      selectedGrad = sw.dataset.grad;
    });
  });

  document.getElementById('priceSeg').querySelectorAll('.seg-opt').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#priceSeg .seg-opt').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      priceType = b.dataset.type;
      document.getElementById('priceField').style.display = (priceType === 'paid') ? 'block' : 'none';
    });
  });

  document.getElementById('addSection').addEventListener('click', addSection);
  document.getElementById('addLearn').addEventListener('click', function () { listRow(document.getElementById('learnBuilder')); });
  document.getElementById('addReq').addEventListener('click', function () { listRow(document.getElementById('reqBuilder')); });

  // Seed one empty section + one outcome so the form isn't blank
  addSection();
  listRow(document.getElementById('learnBuilder'));

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = validateStep(1) || validateStep(2) || validateStep(3);
    if (err) { showError(err); step = (validateStep(1) ? (validateStep(2) ? 3 : 2) : 1); showPanel(step); return; }
    var course = buildCourse();
    window.CourseStore.add(course);
    btnPublish.classList.add('loading');
    btnPublish.disabled = true;
    showError('');
    setTimeout(function () {
      alert('Course published! It now appears in your catalog and dashboard.');
      window.location.href = 'course.html?id=' + course.id;
    }, 800);
  });

  showPanel(1);
})();
