import { redirect, error, fail } from '@sveltejs/kit';

import { AUTH_API, COURSE_API } from '$lib/server/config.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	const token = cookies.get('session_token');
	if (!token) throw redirect(303, '/signin');

	try {
		const meRes = await fetch(`${AUTH_API}/req/me`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});
		if (!meRes.ok) throw redirect(303, '/signin');
		const me = await meRes.json();
		const isLecturer = (me.role ?? '').toUpperCase() === 'LECTURER' || me.title !== undefined;
		if (!isLecturer) throw error(403, 'Lecturer access required');

		const res = await fetch(`${COURSE_API}/req/lecturer/courses`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});
		if (!res.ok) throw error(res.status, 'Could not load your courses');
		const courses = await res.json();
		return { courses: Array.isArray(courses) ? courses : [] };
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('lecturer courses load error:', err);
		throw error(500, 'Could not connect to the course service');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	publish: async ({ request, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) throw redirect(303, '/signin');
		const data = await request.formData();
		const id = data.get('id');
		try {
			const res = await fetch(`${COURSE_API}/req/courses/${id}/publish`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				const t = await res.text();
				let msg = `Publish failed (${res.status})`;
				try { msg = JSON.parse(t).message || msg; } catch {}
				return fail(res.status, { success: false, message: msg });
			}
			return { success: true, message: 'Course published' };
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { success: false, message: 'Could not connect to the course service' });
		}
	},

	delete: async ({ request, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) throw redirect(303, '/signin');
		const data = await request.formData();
		const id = data.get('id');
		try {
			const res = await fetch(`${COURSE_API}/req/courses/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				const t = await res.text();
				let msg = `Delete failed (${res.status})`;
				try { msg = JSON.parse(t).message || msg; } catch {}
				return fail(res.status, { success: false, message: msg });
			}
			return { success: true, message: 'Course deleted' };
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { success: false, message: 'Could not connect to the course service' });
		}
	}
};
