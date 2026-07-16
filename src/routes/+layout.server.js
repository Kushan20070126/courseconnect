const BACKEND_URL = 'http://localhost:8081';

/**
 * Loads the currently authenticated user (if any) so the shared navbar can
 * render the logged-in state. This never throws/redirects — pages that require
 * auth handle that themselves.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export async function load({ cookies, url }) {
	const token = cookies.get('session_token');

	if (!token) {
		return { user: null, pathname: url.pathname };
	}

	try {
		const response = await fetch(`${BACKEND_URL}/req/me`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			return { user: null, pathname: url.pathname };
		}

		const user = await response.json();
		return { user, pathname: url.pathname };
	} catch {
		return { user: null, pathname: url.pathname };
	}
}
