/* ============================================================
   CourseConnect — runtime env loader
   ------------------------------------------------------------
   Decoupled setup: the frontend talks DIRECTLY to each
   microservice (no API gateway in the path). aut-svc and
   course-svc are CORS-enabled so the browser can call them
   cross-origin from the static dev server.
   ============================================================ */
(function (global) {
  'use strict';

  // Direct service URLs (no API gateway / no /aut-svc prefix).
  global.__ENV = {
    BACKEND_API_GATEWAY_URL: 'http://localhost:8080/',
    BACKEND_COURSE_GATEWAY_URL: 'http://localhost:8082/'
  };
})(window);
