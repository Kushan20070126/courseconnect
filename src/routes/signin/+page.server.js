import { fail, redirect } from '@sveltejs/kit';

const SPRING_BOOT_API = 'http://localhost:8081/req/login';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	if (cookies.get('session_token')) {
		throw redirect(303, '/dashboard');
	}
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	signin: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const remember = data.get('remember') === 'on'; 


		if (!email || !password) {
			return fail(400, { message: 'Missing email or password' });
		}

		try {

			const response = await fetch(SPRING_BOOT_API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, remember })
			});


			if (!response.headers.get('content-type')?.includes('application/json')) {
				return fail(500, { message: 'Server sent an invalid format response' });
			}

			const result = await response.json();

			if (!response.ok) {
				return fail(response.status, { message: result.message || 'Invalid credentials' });
			}


			const cookieMaxAge = remember 
				? 60 * 60 * 24 * 30  
				: 60 * 60 * 2;       

			cookies.set('session_token', result.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production', 
				maxAge: cookieMaxAge
			});

		} catch (error) {
			return fail(500, { message: 'Could not connect to authentication server' });
		}


		throw redirect(303, '/dashboard');
	}
};
