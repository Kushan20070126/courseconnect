import { redirect, error, fail } from '@sveltejs/kit';

const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';
const AUTH_API = process.env.AUTH_API || 'http://localhost:8081';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, url, cookies }) {
	const token = cookies.get('session_token');
	const headers = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;

	// Stripe redirects back here with ?enrolled=1&session_id=... — confirm payment
	// server-side so the enrollment is activated, then drop the query params.
	const sessionId = url.searchParams.get('session_id');
	const justEnrolled = url.searchParams.get('enrolled') === '1' || url.searchParams.get('enrolled') === 'true';
	if (justEnrolled && sessionId) {
		if (!token) {
			// Not authenticated on this cross-site redirect (e.g. stale cookie).
			// Send the user to sign in, preserving the Stripe params so confirm
			// runs automatically once they're logged back in.
			const back = `/courses/${params.id}?enrolled=1&session_id=${encodeURIComponent(sessionId)}`;
			throw redirect(303, `/signin?redirect=${encodeURIComponent(back)}`);
		}
		try {
			await fetch(`${COURSE_API}/req/payments/confirm?sessionId=${encodeURIComponent(sessionId)}`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});
		} catch {
			// best-effort; enrollment status is re-checked below regardless
		}
		throw redirect(303, `/courses/${params.id}`);
	}

	try {
		const response = await fetch(`${COURSE_API}/req/courses/${params.id}`, {
			method: 'GET',
			headers
		});

		if (response.status === 404) {
			throw error(404, 'Course not found');
		}
		if (!response.ok) {
			throw error(response.status, 'Could not load this course');
		}

		const course = await response.json();

		// Reviews + forum (MongoDB-backed) — best-effort, public.
		let reviews = { summary: { count: 0, average: 0 }, items: [] };
		let forum = [];
		try {
			const revRes = await fetch(`${COURSE_API}/req/courses/${params.id}/reviews`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (revRes.ok) reviews = await revRes.json();
			const fRes = await fetch(`${COURSE_API}/req/courses/${params.id}/forum`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (fRes.ok) forum = await fRes.json();
		} catch {
			// reviews/forum are best-effort
		}

		// If the viewer is a student, check enrollment status + Stripe confirm fallback.
		let enrollment = null;
		if (token) {
			try {
				const meRes = await fetch(`${AUTH_API}/req/me`, {
					method: 'GET',
					headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
				});
				if (meRes.ok) {
					const me = await meRes.json();
					const isStudent = (me.role ?? '').toUpperCase() === 'STUDENT' || me.educationLevel !== undefined;
					if (isStudent) {
						const learnRes = await fetch(`${COURSE_API}/req/courses/${params.id}/learn`, {
							method: 'GET',
							headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
						});
						if (learnRes.ok) enrollment = await learnRes.json();
					}
				}
			} catch {
				// enrollment check is best-effort
			}
		}

		return { course, enrollment, reviews, forum };
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('Error loading course detail:', err);
		throw error(500, 'Could not connect to the course service');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	enroll: async ({ params, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) {
			throw redirect(303, '/signin');
		}

		try {
			const response = await fetch(`${COURSE_API}/req/courses/${params.id}/enroll`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.status === 401 || response.status === 403) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/signin');
			}

			const text = await response.text();
			const result = text ? JSON.parse(text) : {};

			if (response.status === 409) {
				return fail(409, { success: false, message: result.message || 'Already enrolled' });
			}
			if (!response.ok) {
				return fail(response.status, {
					success: false,
					message: result.message || `Enrollment failed (${response.status})`
				});
			}

			// Free course -> already active, reload the page.
			if (result.status === 'active') {
				return { success: true, status: 'active' };
			}
			// Paid course -> redirect to Stripe Checkout.
			const checkoutUrl = result.url || result.checkoutUrl;
			if (checkoutUrl) {
				throw redirect(303, checkoutUrl);
			}
			return { success: true, status: result.status };
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			console.error('Enroll error:', err);
			return fail(500, { success: false, message: 'Could not connect to the course service' });
		}
	}
};
