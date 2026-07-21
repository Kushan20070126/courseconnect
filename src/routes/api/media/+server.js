import { error } from '@sveltejs/kit';

import { COURSE_API } from '$lib/server/config.js';

/**
 * Same-origin media proxy. The course backend serves thumbnails, lesson videos
 * and materials from a different origin and requires a Bearer token, which
 * <img>/<video>/<a> tags and cross-origin fetch calls cannot send reliably.
 *
 * GET  ?u=<path>            -> streams a media file (thumbnail/video/material)
 * POST/PUT ?u=<path>        -> forwards a multipart upload to the backend
 *
 * The SvelteKit server forwards the user's session cookie, so auth works.
 */
export async function GET({ url, cookies, request }) {
	const target = url.searchParams.get('u');
	if (!target || !target.startsWith('/req/')) throw error(400, 'Invalid media path');

	const token = cookies.get('session_token');
	const headers = {};
	if (token) headers.Authorization = `Bearer ${token}`;

	// Forward Range header for video streaming support
	const range = request.headers.get('range');
	if (range) headers.Range = range;

	try {
		// Use the global (undici) fetch, NOT SvelteKit's event.fetch: the event
		// fetch injects an `Origin` header derived from the incoming browser
		// request, which the backend's CORS filter rejects. This is a
		// server-to-server call and must not look cross-origin.
		const res = await globalThis.fetch(`${COURSE_API}${target}`, { headers });
		if (!res.ok) throw error(res.status, 'Media not available');

		// Forward relevant headers from backend response
		const responseHeaders = new Headers();
		responseHeaders.set('content-type', res.headers.get('content-type') || 'application/octet-stream');
		responseHeaders.set('cache-control', 'private, max-age=300');
		responseHeaders.set('accept-ranges', 'bytes');

		// Forward Content-Range and Content-Length for range responses
		const contentRange = res.headers.get('content-range');
		if (contentRange) responseHeaders.set('content-range', contentRange);
		const contentLength = res.headers.get('content-length');
		if (contentLength) responseHeaders.set('content-length', contentLength);

		// Stream the response body directly for better memory efficiency
		return new Response(res.body, {
			status: res.status,
			headers: responseHeaders
		});
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		throw error(502, 'Could not reach media service');
	}
}

async function forwardUpload({ request, url, cookies }, method) {
	const target = url.searchParams.get('u');
	if (!target || !target.startsWith('/req/')) throw error(400, 'Invalid media path');

	const token = cookies.get('session_token');
	const headers = {};
	if (token) headers.Authorization = `Bearer ${token}`;

	// Buffer the incoming multipart body and forward it (event.fetch does not
	// reliably support streaming the raw request stream with duplex).
	const buf = new Uint8Array(await request.arrayBuffer());
	const contentType = request.headers.get('content-type') || 'application/octet-stream';
	headers['content-type'] = contentType;

	try {
		// Use the global (undici) fetch, NOT SvelteKit's event.fetch: the event
		// fetch injects an `Origin` header (e.g. http://127.0.0.1:5173) that the
		// backend's CORS filter rejects with 403 "Invalid CORS request", which
		// silently breaks uploads. This is a server-to-server call and must not
		// carry a browser Origin.
		const res = await globalThis.fetch(`${COURSE_API}${target}`, { method, headers, body: buf });
		const text = await res.text();
		return new Response(text, {
			status: res.status,
			headers: { 'content-type': res.headers.get('content-type') || 'application/json' }
		});
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		throw error(502, 'Could not reach media service');
	}
}

export async function POST({ request, url, cookies }) {
	return forwardUpload({ request, url, cookies }, 'POST');
}

export async function PUT({ request, url, cookies }) {
	return forwardUpload({ request, url, cookies }, 'PUT');
}
