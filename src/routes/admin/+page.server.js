import { fail, redirect } from '@sveltejs/kit';

const ADMIN_API = 'http://localhost:8081/req/admin/login';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	if (cookies.get('session_token')) {
		throw redirect(303, '/admindash');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		try {
			const response = await fetch(ADMIN_API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!response.headers.get('content-type')?.includes('application/json')) {
				return fail(500, { message: 'Server sent an invalid format response' });
			}

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, { message: result.message || 'Invalid admin credentials' });
			}

			cookies.set('session_token', result.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 2
			});
		} catch (error) {
			return fail(500, { message: 'Could not connect to authentication server' });
		}

		throw redirect(303, '/admindash');
	}
};
