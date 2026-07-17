/**
 * Browser/server-safe read of the course API base URL.
 *
 * In the browser `process` is not defined, so we avoid referencing it directly
 * and fall back to a hardcoded default. Use `import.meta.env` for any PUBLIC_*
 * overrides if configured.
 */
export function courseApi() {
	const fromEnv =
		(typeof process !== 'undefined' && process.env && process.env.COURSE_API) ||
		(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.COURSE_API) ||
		'http://127.0.0.1:8082';
	return fromEnv;
}

export function authApi() {
	const fromEnv =
		(typeof process !== 'undefined' && process.env && process.env.AUTH_API) ||
		(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.AUTH_API) ||
		'http://127.0.0.1:8081';
	return fromEnv;
}

/**
 * Convert an absolute backend media URL (e.g. thumbnails, lesson videos,
 * materials) into a same-origin path served by our /api/media proxy, which
 * forwards the session cookie. This is required because those endpoints need
 * auth and <img>/<video>/<a> tags cannot send Bearer tokens.
 *
 * Absolute URLs from the backend look like:
 *   http://localhost:8082/req/courses/1/thumbnail?k=abc
 * We turn them into:
 *   /api/media?u=%2Freq%2Fcourses%2F1%2Fthumbnail%3Fk%3Dabc
 */
export function mediaUrl(input) {
	if (!input) return '';
	const path = String(input);

	// Presigned S3/MinIO URLs (e.g. http://localhost:9000/...) are publicly
	// accessible cross-origin and must be used as-is. Only media served from the
	// course API needs to go through our authenticated same-origin proxy.
	const asUrl = tryParseUrl(path);
	if (asUrl) {
		const base = tryParseUrl(courseApi());
		// Treat localhost and 127.0.0.1 as the same host so a mismatch between
		// how the backend emits URLs and how the frontend is configured does not
		// break media proxying.
		if (base && sameHost(asUrl, base) && asUrl.port === base.port) {
			const rel = asUrl.pathname + asUrl.search;
			return `/api/media?u=${encodeURIComponent(rel.startsWith('/') ? rel : '/' + rel)}`;
		}
		// The backend returns a presigned MinIO URL (http://localhost:9000/...).
		// The pathname is /<bucket>/<key>. Strip the bucket and route the key
		// through our same-origin /api/media proxy so the browser never talks
		// to MinIO directly.
		const key = asUrl.pathname.split('/').slice(2).join('/');
		return `/api/media?u=${encodeURIComponent(`/req/media/${key}`)}`;
	}

	// Relative path returned by the backend (e.g. "/req/courses/1/thumbnail").
	if (path.startsWith('/req/')) {
		return `/api/media?u=${encodeURIComponent(path)}`;
	}
	return path;
}

/** @param {string} value */
function tryParseUrl(value) {
	try {
		return new URL(value);
	} catch {
		return null;
	}
}

const loopback = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
/** @param {URL} a @param {URL} b */
function sameHost(a, b) {
	if (a.hostname === b.hostname) return true;
	return loopback.has(a.hostname) && loopback.has(b.hostname);
}

/**
 * Build a same-origin media URL for a freshly uploaded asset using a backend
 * path (used when the upload response returns a `key`).
 */
export function mediaPath(path) {
	return `/api/media?u=${encodeURIComponent(path.startsWith('/') ? path : '/' + path)}`;
}
