import { fail, redirect } from '@sveltejs/kit';

import { AUTH_API as BACKEND_URL } from '$lib/server/config.js';

/** If already logged in, no need to reset. */
export async function load({ cookies }) {
	if (cookies.get('session_token')) {
		throw redirect(303, '/dashboard');
	}
}

/** @satisfies {import('./$types').Actions} */

export const actions = {
	// Step 1: request a reset code
	forgot: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim() ?? '';

		if (!email) return fail(400, { step: 'email', message: 'Email is required' });

		try {
			const response = await fetch(`${BACKEND_URL}/req/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			// Backend always returns 200 (don't leak existence); respect any error anyway.
			if (!response.ok) {
				const text = await response.text();
				let msg = 'Could not process request';
				try {
					msg = JSON.parse(text).message || msg;
				} catch {}
				return fail(response.status, { step: 'email', message: msg });
			}

			return { step: 'reset', email };
		} catch (error) {
			return fail(500, { step: 'email', message: 'Could not connect to authentication server' });
		}
	},

	// Step 2: verify code + set new password
	reset: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim() ?? '';
		const otp = formData.get('otp')?.toString().trim() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		if (!otp) return fail(400, { step: 'reset', email, message: 'Reset code is required' });
		if (!newPassword) return fail(400, { step: 'reset', email, message: 'New password is required' });
		if (newPassword.length < 6)
			return fail(400, { step: 'reset', email, message: 'Use at least 6 characters' });
		if (newPassword !== confirmPassword)
			return fail(400, { step: 'reset', email, message: 'Passwords do not match' });

		try {
			const response = await fetch(`${BACKEND_URL}/req/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp, newPassword })
			});

			if (!response.ok) {
				const text = await response.text();
				let msg = 'Reset failed';
				try {
					msg = JSON.parse(text).message || msg;
				} catch {}
				return fail(response.status, { step: 'reset', email, message: msg });
			}

			return { step: 'done', email, message: 'Password updated. You can now sign in.' };
		} catch (error) {
			return fail(500, { step: 'reset', email, message: 'Could not connect to authentication server' });
		}
	}
};
