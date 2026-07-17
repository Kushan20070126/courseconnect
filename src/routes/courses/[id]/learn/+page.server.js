import { redirect, error, fail } from '@sveltejs/kit';

const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';
const AUTH_API = process.env.AUTH_API || 'http://localhost:8081';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, cookies }) {
	const token = cookies.get('session_token');
	if (!token) throw redirect(303, '/signin');

	try {
		const learnRes = await fetch(`${COURSE_API}/req/courses/${params.id}/learn`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});

		if (learnRes.status === 401 || learnRes.status === 403) {
			// Not enrolled (or not active) — send back to the course page.
			throw redirect(303, `/courses/${params.id}`);
		}
		if (learnRes.status === 404) {
			throw error(404, 'Course not found');
		}
		if (!learnRes.ok) {
			throw error(learnRes.status, 'Could not load this course');
		}

		const learn = await learnRes.json();

		// Fetch course title/thumbnail for the header.
		let course = {};
		try {
			const cRes = await fetch(`${COURSE_API}/req/courses/${params.id}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (cRes.ok) course = await cRes.json();
		} catch {
			// header is best-effort
		}

		return {
			courseId: params.id,
			learn,
			course
		};
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('Error loading learn view:', err);
		throw error(500, 'Could not connect to the course service');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	complete: async ({ params, request, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) throw redirect(303, '/signin');

		const fd = await request.formData();
		const lessonId = fd.get('lessonId');

		try {
			const res = await fetch(
				`${COURSE_API}/req/courses/${params.id}/lessons/${lessonId}/complete`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (res.status === 401 || res.status === 403) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/signin');
			}
			if (!res.ok) {
				const t = await res.text();
				let msg = `Could not mark lesson complete (${res.status})`;
				try {
					msg = JSON.parse(t).message || msg;
				} catch {}
				return fail(res.status, { success: false, message: msg });
			}

			const result = await res.json();
			return { success: true, ...result };
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { success: false, message: 'Could not connect to the course service' });
		}
	}
};
