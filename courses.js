// COURSES is provided by data.js

var grid = document.getElementById('courseGrid');
var countEl = document.getElementById('coursesCount');
var searchInput = document.getElementById('searchInput');
var searchForm = document.getElementById('searchForm');
var catChips = document.getElementById('catChips');
var levelFilter = document.getElementById('levelFilter');
var sortBy = document.getElementById('sortBy');

var activeCat = '';

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

function starsSVG(){
  return '<svg class="stars" viewBox="0 0 24 24" fill="none">'
    + '<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" fill="currentColor"/></svg>';
}

function fmt(n){ return n.toLocaleString('en-US'); }

function cardHTML(c){
  var price = c.price === 0
    ? '<span class="course-price free">Free</span>'
    : '<span class="course-price">$' + c.price + '</span>';
  var best = c.bestseller ? '<span class="badge best">Bestseller</span>' : '';
  return ''
    + '<article class="course-card reveal">'
    +   '<a class="course-thumb" href="course.html?id=' + c.id + '" style="background:linear-gradient(135deg,' + c.grad[0] + ',' + c.grad[1] + ')">'
    +     '<span class="badge">' + c.level + '</span>' + best
    +     '<svg class="ct-ic" viewBox="0 0 24 24" fill="none">' + catIcon(c.category) + '</svg>'
    +   '</a>'
    +   '<div class="course-body">'
    +     '<span class="course-cat">' + c.category + '</span>'
    +     '<h3 class="course-title"><a href="course.html?id=' + c.id + '">' + c.title + '</a></h3>'
    +     '<p class="course-instructor">' + c.instructor + '</p>'
    +     '<div class="course-rating">'
    +       '<b>' + c.rating.toFixed(1) + '</b>' + starsSVG()
    +       '<span class="rcount">(' + fmt(c.students) + ')</span>'
    +     '</div>'
    +     '<div class="course-meta">'
    +       '<span class="m"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' + c.duration + '</span>'
    +       '<span class="m"><svg viewBox="0 0 24 24" fill="none"><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' + c.lessons + ' lessons</span>'
    +     '</div>'
    +     '<div class="course-foot">' + price
    +       '<a class="btn-mini" href="course.html?id=' + c.id + '">View course</a>'
    +     '</div>'
    +   '</div>'
    + '</article>';
}

function applyFilters(){
  var q = searchInput.value.trim().toLowerCase();
  var lvl = levelFilter.value;
  var sort = sortBy.value;

  var list = COURSES.filter(function(c){
    var matchQ = !q || (c.title + ' ' + c.instructor + ' ' + c.category).toLowerCase().indexOf(q) !== -1;
    var matchCat = !activeCat || c.category === activeCat;
    var matchLvl = !lvl || c.level === lvl;
    return matchQ && matchCat && matchLvl;
  });

  list.sort(function(a, b){
    if(sort === 'rating') return b.rating - a.rating;
    if(sort === 'price-asc') return a.price - b.price;
    if(sort === 'price-desc') return b.price - a.price;
    return b.students - a.students; // popular
  });

  render(list);
}

function render(list){
  countEl.innerHTML = 'Showing <b>' + list.length + '</b> of ' + COURSES.length + ' courses';
  if(!list.length){
    grid.innerHTML = '<div class="courses-empty"><b>No courses found</b>Try a different keyword or clear your filters.</div>';
    return;
  }
  grid.innerHTML = list.map(cardHTML).join('');
  // Trigger reveal for freshly rendered cards
  if('IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold:0.1 });
    grid.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });
  } else {
    grid.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }
}

// Live search + select filters
[searchInput, levelFilter, sortBy].forEach(function(el){
  el.addEventListener('input', applyFilters);
  el.addEventListener('change', applyFilters);
});

// Hero search form (submit should not reload the page)
if(searchForm){
  searchForm.addEventListener('submit', function(e){ e.preventDefault(); applyFilters(); });
}

// Category chips
if(catChips){
  catChips.querySelectorAll('.chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      catChips.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
      activeCat = chip.dataset.cat || '';
      applyFilters();
    });
  });
}

applyFilters();
