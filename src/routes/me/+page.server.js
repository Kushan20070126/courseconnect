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
		const response = await fetch(`${BACKEND_URL}/req/me`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 401 || response.status === 403) {
			cookies.delete('session_token', { path: '/' });
			throw redirect(303, '/signin');
		}

		if (!response.ok) {
			throw error(response.status, 'Could not fetch profile details');
		}

		const userProfile = await response.json();

		return {
			user: userProfile
		};
	} catch (err) {
		
		if (err && (err.status || err.location)) {
			throw err;
		}
		console.error('Error fetching user profile:', err);
		throw error(500, 'Internal Authentication Server Error');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	
	update: async ({ request, cookies }) => {
		const token = cookies.get('session_token');
		if (!token) {
			throw redirect(303, '/signin');
		}

		const formData = await request.formData();
		const role = formData.get('role');

		/** @param {string} name */
		const str = (name) => {
			const v = formData.get(name);
			return v === null ? undefined : v.toString();
		};
		/** @param {string} name */
		const num = (name) => {
			const v = formData.get(name);
			if (v === null || v.toString().trim() === '') return undefined;
			const n = parseInt(v.toString(), 10);
			return Number.isNaN(n) ? undefined : n;
		};

		/** @type {Record<string, unknown>} */
		const payload = {
			firstName: str('firstName'),
			lastName: str('lastName'),
			age: num('age')
		};

		if (role === 'lecturer') {
			payload.title = str('title');
			payload.experience = num('experience');
			payload.area = str('area');
			payload.bio = str('bio');
		} else {
			payload.educationLevel = str('educationLevel');
			payload.interest = str('interest');
			payload.goal = str('goal');
		}

		try {
			const response = await fetch(`${BACKEND_URL}/req/me`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (response.status === 401) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/signin');
			}

			const text = await response.text();
			const result = text ? tryParseJson(text) : {};

			if (!response.ok) {
				return fail(response.status, {
					action: 'update',
					success: false,
					message: result.message || result.error || `Update failed (${response.status})`
				});
			}

			return {
				action: 'update',
				success: true,
				message: 'Profile updated successfully.',
				user: result
			};
		} catch (err) {
			if (err && (err.status || err.location)) {
				throw err;
			}
			console.error('Error updating profile:', err);
			return fail(500, {
				action: 'update',
				success: false,
				message: 'Could not connect to the server'
			});
		}
	},

	
	delete: async ({ cookies }) => {
		const token = cookies.get('session_token');
		if (!token) {
			throw redirect(303, '/signin');
		}

		try {
			const response = await fetch(`${BACKEND_URL}/req/me`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.status === 401) {
				cookies.delete('session_token', { path: '/' });
				throw redirect(303, '/signin');
			}

			if (!response.ok) {
				const text = await response.text();
				const result = text ? tryParseJson(text) : {};
				return fail(response.status, {
					action: 'delete',
					success: false,
					message: result.message || result.error || `Delete failed (${response.status})`
				});
			}

			
			cookies.delete('session_token', { path: '/' });
		} catch (err) {
			if (err && (err.status || err.location)) {
				throw err;
			}
			console.error('Error deleting account:', err);
			return fail(500, {
				action: 'delete',
				success: false,
				message: 'Could not connect to the server'
			});
		}

		throw redirect(303, '/signup');
	}
};
