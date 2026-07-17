import { redirect, error, fail } from '@sveltejs/kit';

const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, cookies }) {
	const token = cookies.get('session_token');
	if (!token) throw redirect(303, '/signin');

	try {
		const meRes = await fetch(`${process.env.AUTH_API || 'http://localhost:8081'}/req/me`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});
		if (!meRes.ok) throw redirect(303, '/signin');
		const me = await meRes.json();
		const isLecturer = (me.role ?? '').toUpperCase() === 'LECTURER' || me.title !== undefined;
		if (!isLecturer) throw error(403, 'Lecturer access required');

		const res = await fetch(`${COURSE_API}/req/courses/${params.id}`, {
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		});
		if (res.status === 404) throw error(404, 'Course not found');
		if (!res.ok) throw error(res.status, 'Could not load this course');
		const course = await res.json();
		return { course };
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('edit load error:', err);
		throw error(500, 'Could not connect to the course service');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	save: async ({ params, request, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) throw redirect(303, '/signin');

		const fd = await request.formData();
		const toList = (v) =>
			String(v ?? '')
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean);

		const priceRaw = String(fd.get('price') ?? '').trim();
		const price = priceRaw === '' ? null : Number(priceRaw);
		if (price !== null && Number.isNaN(price)) {
			return fail(400, { success: false, message: 'Price must be a number' });
		}

		const sectionsRaw = fd.get('sections');
		let sections = [];
		if (sectionsRaw) {
			try {
				const parsed = JSON.parse(String(sectionsRaw));
				if (Array.isArray(parsed)) sections = parsed;
			} catch {
				sections = [];
			}
		}

		const body = {
			title: fd.get('title'),
			summary: fd.get('summary') ?? '',
			description: fd.get('description') ?? '',
			category: fd.get('category') ?? '',
			level: fd.get('level') ?? '',
			language: fd.get('language') ?? 'English',
			price,
			instructorName: fd.get('instructorName') ?? '',
			learn: toList(fd.get('learn')),
			requirements: toList(fd.get('requirements')),
			sections
		};

		try {
			const res = await fetch(`${COURSE_API}/req/courses/${params.id}`, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const t = await res.text();
				let msg = `Could not update course (${res.status})`;
				try { msg = JSON.parse(t).message || msg; } catch {}
				return fail(res.status, { success: false, message: msg });
			}
			return { success: true };
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { success: false, message: 'Could not connect to the course service' });
		}
	}
};
