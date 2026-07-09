// Shared course store: merges the static catalog (data.js) with courses
// created at runtime (saved in localStorage) so they appear everywhere.
(function () {
  var KEY = 'cc_created_courses';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  window.CourseStore = {
    getAll: function () { return COURSES.concat(load()); },
    getById: function (id) {
      return window.CourseStore.getAll().filter(function (c) { return c.id === id; })[0];
    },
    add: function (course) {
      var list = load();
      list.push(course);
      save(list);
    }
  };
})();
