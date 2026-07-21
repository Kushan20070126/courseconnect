import { redirect, error } from '@sveltejs/kit';

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
		const isStudent = (me.role ?? '').toUpperCase() === 'STUDENT' || me.educationLevel !== undefined;
		if (!isStudent) throw redirect(303, '/courses');

		const res = await fetch(`${COURSE_API}/req/my-courses`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});
		if (!res.ok) throw error(res.status, 'Could not load your courses');

		const courses = await res.json();
		return { courses: Array.isArray(courses) ? courses : [] };
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('my-courses load error:', err);
		throw error(500, 'Could not connect to the course service');
	}
}
