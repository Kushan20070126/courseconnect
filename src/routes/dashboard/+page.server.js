import { redirect, error } from '@sveltejs/kit';

const AUTH_API = process.env.AUTH_API || 'http://localhost:8081';
const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, url }) {
	const token = cookies.get('session_token');
	if (!token) throw redirect(303, '/signin');

	try {
		const meRes = await fetch(`${AUTH_API}/req/me`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});
		if (!meRes.ok) {
			cookies.delete('session_token', { path: '/' });
			throw redirect(303, '/signin');
		}
		const me = await meRes.json();
		const isLecturer = (me.role ?? '').toUpperCase() === 'LECTURER' || me.title !== undefined;

		// Published catalog is useful for both roles.
		const catalogRes = await fetch(`${COURSE_API}/req/courses`, {
			headers: { 'Content-Type': 'application/json' }
		});
		const published = catalogRes.ok ? await catalogRes.json() : [];
		const publishedCourses = Array.isArray(published) ? published : [];

		if (!isLecturer) {
			return { user: me, role: 'student', publishedCourses };
		}

		// Lecturer: own courses + stats.
		const [mineRes, statsRes] = await Promise.all([
			fetch(`${COURSE_API}/req/lecturer/courses`, {
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			}),
			fetch(`${COURSE_API}/req/lecturer/stats`, {
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			})
		]);

		if (!mineRes.ok) throw error(mineRes.status, 'Could not load your courses');
		const myCourses = mineRes.ok ? await mineRes.json() : [];
		const stats = statsRes.ok ? await statsRes.json() : {};

		return {
			user: me,
			role: 'lecturer',
			myCourses: Array.isArray(myCourses) ? myCourses : [],
			stats,
			publishedCourses
		};
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('dashboard load error:', err);
		throw error(500, 'Could not connect to the services');
	}
}
