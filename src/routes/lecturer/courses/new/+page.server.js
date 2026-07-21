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
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		throw error(500, 'Could not connect to the auth service');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	save: async ({ request, cookies }) => {
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
			const res = await fetch(`${COURSE_API}/req/courses`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const t = await res.text();
				let msg = `Could not create course (${res.status})`;
				try { msg = JSON.parse(t).message || msg; } catch {}
				return fail(res.status, { success: false, message: msg });
			}
			const created = await res.json();
			return { success: true, id: created?.id };
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { success: false, message: 'Could not connect to the course service' });
		}
	}
};
