import { fail, redirect, error } from '@sveltejs/kit';

import { AUTH_API as BACKEND_URL } from '$lib/server/config.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, fetch }) {
	const token = cookies.get('session_token');
	if (!token) throw redirect(303, '/admin');

	try {
		const [statsRes, pendingRes] = await Promise.all([
			fetch(`${BACKEND_URL}/req/admin/stats`, {
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			}),
			fetch(`${BACKEND_URL}/req/admin/lecturers/pending`, {
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			})
		]);

		if (statsRes.status === 401) {
			cookies.delete('session_token', { path: '/' });
			throw redirect(303, '/admin');
		}
		if (!statsRes.ok) throw error(statsRes.status, 'Failed to load stats');
		if (!pendingRes.ok) throw error(pendingRes.status, 'Failed to load pending lecturers');

		const stats = await statsRes.json();
		const pending = await pendingRes.json();

		return { stats, pending: Array.isArray(pending) ? pending : pending.lecturers ?? [] };
	} catch (err) {
		if (err && (err.status || err.location)) throw err;
		console.error('Admin dashboard load error:', err);
		throw error(500, 'Internal server error');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	approve: async ({ request, cookies, fetch }) => {
		const token = cookies.get('session_token');
		if (!token) throw redirect(303, '/admin');

		const data = await request.formData();
		const id = data.get('id');

		if (!id) return fail(400, { message: 'Missing lecturer id' });

		try {
			const response = await fetch(`${BACKEND_URL}/req/admin/lecturers/${id}/approve`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});

			if (response.status === 401) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/admin');
			}
			if (!response.ok) {
				const text = await response.text();
				let msg = 'Approval failed';
				try {
					msg = JSON.parse(text).message || msg;
				} catch {}
				return fail(response.status, { message: msg });
			}
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { message: 'Could not connect to server' });
		}

		return { success: true, message: 'Lecturer approved' };
	},

	reject: async ({ request, cookies, fetch }) => {
		const token = cookies.get('session_token');
		if (!token) throw redirect(303, '/admin');

		const data = await request.formData();
		const id = data.get('id');

		if (!id) return fail(400, { message: 'Missing lecturer id' });

		try {
			const response = await fetch(`${BACKEND_URL}/req/admin/lecturers/${id}/reject`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});

			if (response.status === 401) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/admin');
			}
			if (!response.ok) {
				const text = await response.text();
				let msg = 'Rejection failed';
				try {
					msg = JSON.parse(text).message || msg;
				} catch {}
				return fail(response.status, { message: msg });
			}
		} catch (err) {
			if (err && (err.status || err.location)) throw err;
			return fail(500, { message: 'Could not connect to server' });
		}

		return { success: true, message: 'Lecturer rejected' };
	}
};
