import { redirect } from '@sveltejs/kit';

/** @satisfies {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies }) => {
		cookies.delete('session_token', { path: '/' });
		throw redirect(303, '/signin');
	}
};
