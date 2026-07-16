import { fail, redirect } from '@sveltejs/kit';

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
  if (cookies.get('session_token')) {
    throw redirect(303, '/dashboard');
  }
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
  initiate: async ({ request }) => {
    const formData = await request.formData();
    const role = formData.get('role');

    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    const payload = {
      role: role,
      email: formData.get('email'),
      password: password,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      age: formData.get('age') ? parseInt(formData.get('age').toString(), 10) : null
    };

    if (role === 'student') {
      payload.educationLevel = formData.get('educationLevel');
      payload.interest = formData.get('interest');
      payload.goal = formData.get('goal');
    } else if (role === 'lecturer') {
      payload.title = formData.get('title');
      payload.experience = formData.get('experience')
        ? parseInt(formData.get('experience').toString(), 10)
        : null;
      payload.area = formData.get('area');
      payload.bio = formData.get('bio');
    }

    if (!payload.email || !payload.password) {
      return fail(400, {
        step: 'initiate',
        message: 'Email and password are required'
      });
    }

    if (confirmPassword !== undefined && confirmPassword !== null && confirmPassword !== password) {
      return fail(400, {
        step: 'initiate',
        message: 'Passwords do not match'
      });
    }

    try {
      const response = await fetch(`${BACKEND_URL}/req/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      
      const responseText = await response.text();
      const result = responseText ? tryParseJson(responseText) : {};

      if (!response.ok) {
        
        const errorMsg =
          result.message ||
          result.error ||
          `Request failed with status ${response.status} (${response.statusText})`;
        console.error('Signup initiation failed:', errorMsg);
        return fail(response.status, {
          step: 'initiate',
          message: errorMsg
        });
      }

      
      return {
        success: true,
        step: 'verify',
        email: result.email || payload.email,
        message: result.message || 'Verification code sent!'
      };
    } catch (error) {
      console.error('Network/server error during signup initiation:', error);
      return fail(500, {
        step: 'initiate',
        message: 'Could not connect to authentication server'
      });
    }
  },

  verify: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const otp = formData.get('otp');

    if (!email || !otp) {
      return fail(400, {
        step: 'verify',
        message: 'OTP token is required'
      });
    }

    try {
      const response = await fetch(`${BACKEND_URL}/req/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const responseText = await response.text();
      const result = responseText ? tryParseJson(responseText) : {};


      if (result.pendingApproval) {
        return {
          success: true,
          step: 'pending-approval',
          message:
            result.message ||
            'Your lecturer account was created and is awaiting administrator approval.'
        };
      }

      if (!response.ok) {
        const errorMsg =
          result.message ||
          result.error ||
          `Verification failed (${response.status})`;
        return fail(response.status, {
          step: 'verify',
          email,
          message: errorMsg
        });
      }

      if (!result.token) {
        console.error('Verification succeeded but no token was returned');
        return fail(500, {
          step: 'verify',
          email,
          message: 'Server configuration error – missing token'
        });
      }

      cookies.set('session_token', result.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 1 day
      });

    } catch (error) {
      console.error('Error during OTP verification:', error);
      return fail(500, {
        step: 'verify',
        email,
        message: 'Server communication error'
      });
    }

    throw redirect(303, '/dashboard');
  },

  resend: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email');

    if (!email) {
      return fail(400, {
        step: 'verify',
        message: 'Email address is missing'
      });
    }

    try {
      const response = await fetch(`${BACKEND_URL}/req/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const responseText = await response.text();
      const result = responseText ? tryParseJson(responseText) : {};

      return {
        success: response.ok,
        step: 'verify',
        email,
        message: result.message || (response.ok ? 'OTP resent successfully.' : 'Failed to resend OTP.')
      };
    } catch (error) {
      console.error('Error during OTP resend:', error);
      return fail(500, {
        step: 'verify',
        email,
        message: 'Failed to request new code'
      });
    }
  }
};