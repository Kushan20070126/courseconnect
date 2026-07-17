import { redirect, error, fail } from '@sveltejs/kit';

const BACKEND_URL = 'http://localhost:8081';

/** @param {string} text */
function tryParseJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return { message: text };
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	const token = cookies.get('session_token');

	if (!token) {
		throw redirect(303, '/signin');
	}

	try {
		const [meRes, sessRes] = await Promise.all([
			fetch(`${BACKEND_URL}/req/me`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			}),
			fetch(`${BACKEND_URL}/req/sessions`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			})
		]);

		if (meRes.status === 401 || meRes.status === 403) {
			cookies.delete('session_token', { path: '/' });
			throw redirect(303, '/signin');
		}

		if (sessRes.status === 401) {
			cookies.delete('session_token', { path: '/' });
			throw redirect(303, '/signin');
		}

		if (!meRes.ok) {
			throw error(meRes.status, 'Could not fetch profile details');
		}

		const user = await meRes.json();
		let sessions = [];
		let currentJti = null;
		if (sessRes.ok) {
			const data = await sessRes.json();
			sessions = data.sessions ?? [];
			currentJti = data.currentJti ?? null;
		}

		return { user, sessions, currentJti };
	} catch (err) {
		if (err && (err.status || err.location)) {
			throw err;
		}
		console.error('Error loading settings:', err);
		throw error(500, 'Internal Authentication Server Error');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	logoutOthers: async ({ cookies }) => {
		const token = cookies.get('session_token');
		if (!token) {
			throw redirect(303, '/signin');
		}

		try {
			const response = await fetch(`${BACKEND_URL}/req/sessions/logout-others`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
			});

			if (response.status === 401) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/signin');
			}

			const text = await response.text();
			const result = text ? tryParseJson(text) : {};

			if (!response.ok) {
				return fail(response.status, {
					action: 'logoutOthers',
					success: false,
					message: result.message || result.error || `Request failed (${response.status})`
				});
			}

			return {
				action: 'logoutOthers',
				success: true,
				message: result.message || 'Signed out of other devices.'
			};
		} catch (err) {
			if (err && (err.status || err.location)) {
				throw err;
			}
			console.error('Error logging out other devices:', err);
			return fail(500, {
				action: 'logoutOthers',
				success: false,
				message: 'Could not connect to the server'
			});
		}
	},

	changePassword: async ({ request, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) {
			throw redirect(303, '/signin');
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		if (!currentPassword || !newPassword) {
			return fail(400, {
				action: 'changePassword',
				success: false,
				message: 'Both current and new password are required.'
			});
		}
		if (newPassword.length < 6) {
			return fail(400, {
				action: 'changePassword',
				success: false,
				message: 'New password must be at least 6 characters.'
			});
		}
		if (newPassword !== confirmPassword) {
			return fail(400, {
				action: 'changePassword',
				success: false,
				message: 'New passwords do not match.'
			});
		}

		try {
			const response = await fetch(`${BACKEND_URL}/req/me/password`, {
				method: 'PUT',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			});

			if (response.status === 401) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/signin');
			}

			const text = await response.text();
			const result = text ? tryParseJson(text) : {};

			if (!response.ok) {
				return fail(response.status, {
					action: 'changePassword',
					success: false,
					message: result.message || result.error || `Password change failed (${response.status})`
				});
			}

			return {
				action: 'changePassword',
				success: true,
				message: result.message || 'Password changed successfully.'
			};
		} catch (err) {
			if (err && (err.status || err.location)) {
				throw err;
			}
			console.error('Error changing password:', err);
			return fail(500, {
				action: 'changePassword',
				success: false,
				message: 'Could not connect to the server'
			});
		}
	}
};
