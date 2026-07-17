<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
	let isSubmitting = $state(false);
</script>

<div class="wrap">
	<h1>Admin Login</h1>
	<p class="sub">Sign in with your administrator credentials.</p>

	{#if form?.message}
		<div class="alert">{form.message}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
		<label>
			Email
			<input type="email" name="email" placeholder="admin@courseconnect.io" required disabled={isSubmitting} />
		</label>
		<label>
			Password
			<input type="password" name="password" placeholder="Password" required disabled={isSubmitting} />
		</label>
		<button type="submit" disabled={isSubmitting}>
			{isSubmitting ? 'Signing in…' : 'Sign in'}
		</button>
	</form>

	<p class="back"><a href="/signin">User sign in</a></p>
</div>

<style>
	.wrap {
		max-width: 380px;
		margin: 6rem auto;
		padding: 2rem;
		font-family: 'Inter', system-ui, sans-serif;
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 14px;
	}
	h1 {
		margin: 0 0 4px;
		font-family: 'Space Grotesk', sans-serif;
	}
	.sub {
		color: #5b6072;
		margin: 0 0 1.5rem;
		font-size: 0.9rem;
	}
	.alert {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fca5a5;
		padding: 0.7rem 0.9rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.88rem;
	}
	label {
		display: block;
		font-size: 0.82rem;
		font-weight: 600;
		color: #5b6072;
		margin-bottom: 0.9rem;
	}
	input {
		display: block;
		width: 100%;
		margin-top: 5px;
		padding: 0.65rem 0.8rem;
		border: 1.5px solid #e7e8f2;
		border-radius: 9px;
		font-size: 0.92rem;
		box-sizing: border-box;
	}
	button {
		width: 100%;
		border: none;
		border-radius: 10px;
		padding: 0.8rem;
		font-weight: 700;
		color: #fff;
		background: #4f46e5;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.7;
	}
	.back {
		text-align: center;
		margin-top: 1rem;
		font-size: 0.85rem;
	}
	.back a {
		color: #4f46e5;
	}
</style>
