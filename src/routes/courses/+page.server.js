import { error } from '@sveltejs/kit';

const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
	const category = url.searchParams.get('category') ?? '';
	const level = url.searchParams.get('level') ?? '';
	const q = url.searchParams.get('q') ?? '';
	const sort = url.searchParams.get('sort') ?? '';

	const params = new URLSearchParams();
	if (category) params.set('category', category);
	if (level) params.set('level', level);
	if (q) params.set('q', q);
	if (sort) params.set('sort', sort);

	try {
		const response = await fetch(`${COURSE_API}/req/courses?${params.toString()}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			throw error(response.status, 'Could not load the course catalog');
		}

		const courses = await response.json();
		return { courses: Array.isArray(courses) ? courses : [] };
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('Error loading courses:', err);
		throw error(500, 'Could not connect to the course service');
	}
}
