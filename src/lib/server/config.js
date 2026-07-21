/**
 * Centralized server-only backend base URLs.
 *
 * IMPORTANT: files under `$lib/server/` are never shipped to the browser, so it
 * is safe to read process.env here.
 *
 * Why 127.0.0.1 instead of localhost?
 *   On many Linux setups `localhost` resolves to ::1 (IPv6) *before* 127.0.0.1.
 *   The Spring Boot services (aut-svc :8081, cource-svc :8082) bind to IPv4
 *   (0.0.0.0), so Node's server-side fetch() tries ::1 first and throws
 *   `AggregateError [ECONNREFUSED]`. Pinning the IPv4 loopback removes that
 *   resolution-order race entirely. Override via .env if the backend moves.
 */

const stripTrailingSlash = (u) => (u ? u.replace(/\/+$/, '') : u);

/** Auth service (aut-svc) base URL, e.g. http://127.0.0.1:8081 */
export const AUTH_API = stripTrailingSlash(process.env.AUTH_API || 'http://127.0.0.1:8081');

/** Course service (cource-svc) base URL, e.g. http://127.0.0.1:8082 */
export const COURSE_API = stripTrailingSlash(process.env.COURSE_API || 'http://127.0.0.1:8082');

/** Full login endpoint on the auth service. */
export const AUTH_LOGIN_API = process.env.SPRING_BOOT_API || `${AUTH_API}/req/login`;

/** Full admin login endpoint on the auth service. */
export const ADMIN_LOGIN_API = `${AUTH_API}/req/admin/login`;
