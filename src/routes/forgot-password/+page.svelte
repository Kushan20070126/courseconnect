<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
	let isSubmitting = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);

	let step = $derived(form?.step ?? 'email');
	let trackingEmail = $derived(form?.email ?? '');

	// Keep email available across steps (hidden input carries it in reset form)
	let email = $state('');
</script>

<svelte:head>
	<title>Forgot Password · CourseConnect</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="stage">
	<aside class="brand-panel">
		<a href="/" class="brand-mark">
			<span class="glyph">
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M12 3 3 8l9 5 7.5-4.17V15h1.5V8L12 3Zm-6 8.13V15l6 3.33L18 15v-3.87l-6 3.33-6-3.33Z"
						fill="currentColor"
					/>
				</svg>
			</span>
			CourseConnect
		</a>

		<div class="ring-orbit"><span class="dot"></span></div>

		<div class="brand-copy">
			<h1>Regain access in a minute.</h1>
			<p>We'll email you a secure code to reset your password and get you back to learning.</p>
		</div>

		<p class="quote">
			<strong>“Learning without walls.”</strong> Your account stays safe with verified resets.
		</p>
	</aside>

	<main class="form-panel">
		<div class="form-card">
			<p class="eyebrow">Account recovery</p>

			{#if step === 'email'}
				<h2>Forgot password</h2>
				<p class="sub">Enter the email linked to your account and we'll send a reset code.</p>

				{#if form?.message}
					<div class="alert" class:error={!form.success} role="alert">{form.message}</div>
				{/if}

				<form
					method="POST"
					action="?/forgot"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<div class="field">
						<label for="email">Email address</label>
						<div class="input-wrap">
							<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
								<path d="M2.5 5.5h15v9h-15v-9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
								<path d="m3 6 7 5 7-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<input
								id="email"
								type="email"
								name="email"
								placeholder="you@example.com"
								autocomplete="email"
								bind:value={email}
								required
								disabled={isSubmitting}
							/>
						</div>
					</div>

					<button type="submit" class="btn-submit" class:loading={isSubmitting} disabled={isSubmitting}>
						<span class="spinner"></span>
						<span class="btn-label">{isSubmitting ? 'Sending code…' : 'Send reset code'}</span>
					</button>
				</form>
			{:else if step === 'reset'}
				<h2>Reset password</h2>
				<p class="sub">We sent a 6-digit code to <strong>{trackingEmail}</strong>. Enter it below with your new password.</p>

				{#if form?.message}
					<div class="alert" class:error={!form.success} role="alert">{form.message}</div>
				{/if}

				<form
					method="POST"
					action="?/reset"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<input type="hidden" name="email" value={trackingEmail || email} />

					<div class="field">
						<label for="otp">Reset code</label>
						<input id="otp" type="text" name="otp" placeholder="123456" maxlength="6" autocomplete="one-time-code" required disabled={isSubmitting} class="otp-input" />
					</div>

					<div class="field">
						<label for="newPassword">New password</label>
						<div class="input-wrap">
							<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
								<rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
								<path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
							<input
								id="newPassword"
								type={showPassword ? 'text' : 'password'}
								name="newPassword"
								placeholder="New password"
								autocomplete="new-password"
								required
								disabled={isSubmitting}
							/>
							<button type="button" class="pass-toggle" onclick={() => (showPassword = !showPassword)} aria-label="Toggle password" tabindex="-1">
								{#if showPassword}
									<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
										<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
										<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
										<path d="m4 4 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
									</svg>
								{:else}
									<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
										<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
										<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<div class="field">
						<label for="confirmPassword">Confirm new password</label>
						<div class="input-wrap">
							<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
								<rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
								<path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
							</svg>
							<input
								id="confirmPassword"
								type={showConfirm ? 'text' : 'password'}
								name="confirmPassword"
								placeholder="Confirm new password"
								autocomplete="new-password"
								required
								disabled={isSubmitting}
							/>
							<button type="button" class="pass-toggle" onclick={() => (showConfirm = !showConfirm)} aria-label="Toggle confirm password" tabindex="-1">
								{#if showConfirm}
									<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
										<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
										<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
										<path d="m4 4 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
									</svg>
								{:else}
									<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
										<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
										<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<button type="submit" class="btn-submit" class:loading={isSubmitting} disabled={isSubmitting}>
						<span class="spinner"></span>
						<span class="btn-label">{isSubmitting ? 'Resetting…' : 'Reset password'}</span>
					</button>
				</form>
			{:else if step === 'done'}
				<div class="approval-card">
					<div class="approval-badge">✓</div>
					<h2>Password updated</h2>
					<p>{form?.message}</p>
					<a href="/signin" class="btn-submit inline">Back to sign in</a>
				</div>
			{/if}

			<p class="signup-line">
				Remembered it? <a href="/signin">Sign in</a>
			</p>
		</div>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
	}
	.stage {
		min-height: 100vh;
		display: flex;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
		background: #f5f6fb;
	}
	.brand-panel {
		position: relative;
		flex: 0 0 44%;
		max-width: 580px;
		background: radial-gradient(120% 140% at 15% 0%, #6a5cf0 0%, #4f46e5 42%, #2e1f8f 100%);
		color: #fff;
		padding: 56px 52px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
	}
	.brand-panel::before,
	.brand-panel::after {
		content: '';
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.14);
	}
	.brand-panel::before {
		width: 520px;
		height: 520px;
		right: -220px;
		top: -160px;
	}
	.brand-panel::after {
		width: 340px;
		height: 340px;
		right: -140px;
		bottom: -120px;
		border-color: rgba(255, 255, 255, 0.1);
	}
	.ring-orbit {
		position: absolute;
		width: 230px;
		height: 230px;
		border-radius: 50%;
		border: 1px dashed rgba(255, 255, 255, 0.22);
		right: 60px;
		top: 40%;
	}
	.ring-orbit .dot {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #f2a93b;
		top: -5px;
		left: calc(50% - 5px);
		box-shadow: 0 0 0 6px rgba(242, 169, 59, 0.18);
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.brand-mark {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 1.05rem;
		position: relative;
		z-index: 1;
		color: #fff;
		text-decoration: none;
	}
	.brand-mark .glyph {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(2px);
	}
	.brand-mark .glyph svg {
		width: 20px;
		height: 20px;
	}
	.brand-copy {
		position: relative;
		z-index: 1;
		max-width: 400px;
	}
	.brand-copy h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.7rem, 2.6vw, 2.15rem);
		line-height: 1.18;
		font-weight: 700;
		margin: 0 0 14px;
	}
	.brand-copy p {
		color: rgba(255, 255, 255, 0.78);
		font-size: 0.94rem;
		line-height: 1.6;
		margin: 0;
	}
	.quote {
		position: relative;
		z-index: 1;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
		padding-top: 20px;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.72);
		line-height: 1.6;
		margin: 0;
	}
	.quote strong {
		color: #fff;
		font-weight: 600;
	}
	.form-panel {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
	}
	.form-card {
		width: 100%;
		max-width: 420px;
	}
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: #0ea5a0;
		margin: 0 0 8px;
	}
	.form-card h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 1.75rem;
		margin: 0 0 6px;
	}
	.form-card .sub {
		color: #5b6072;
		font-size: 0.92rem;
		margin: 0 0 26px;
	}
	.alert {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-radius: 10px;
		font-size: 0.88rem;
		margin-bottom: 20px;
		line-height: 1.4;
	}
	.alert.error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}
	.field {
		margin-bottom: 18px;
	}
	.field label {
		display: block;
		font-size: 0.78rem;
		font-weight: 600;
		color: #5b6072;
		margin-bottom: 7px;
	}
	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}
	.lead-ic {
		position: absolute;
		left: 13px;
		width: 18px;
		height: 18px;
		color: #9aa0b4;
		pointer-events: none;
	}
	.input-wrap input,
	.field input {
		width: 100%;
		font-family: 'Inter', sans-serif;
		font-size: 0.92rem;
		color: #161a2b;
		background: #fbfbfe;
		border: 1.5px solid #e7e8f2;
		border-radius: 10px;
		padding: 12px 14px 12px 40px;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
	}
	.field input:not(.input-wrap input) {
		padding-left: 14px;
	}
	.input-wrap input::placeholder {
		color: #a3a8ba;
	}
	.input-wrap input:focus,
	.field input:focus {
		border-color: #4f46e5;
		background: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
	}
	.input-wrap:focus-within .lead-ic {
		color: #4f46e5;
	}
	.input-wrap input:disabled,
	.field input:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	.otp-input {
		text-align: center;
		font-size: 1.4rem;
		letter-spacing: 0.35rem;
		font-weight: 600;
		padding-left: 14px !important;
	}
	.pass-toggle {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		padding: 5px;
		color: #9aa0b4;
		cursor: pointer;
		display: flex;
		align-items: center;
		border-radius: 6px;
		transition: color 0.2s;
	}
	.pass-toggle:hover {
		color: #4f46e5;
	}
	.pass-toggle svg {
		width: 18px;
		height: 18px;
	}
	.btn-submit {
		position: relative;
		width: 100%;
		border: none;
		border-radius: 11px;
		padding: 14px;
		font-family: 'Inter', sans-serif;
		font-weight: 700;
		font-size: 0.94rem;
		color: #fff;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		box-shadow: 0 10px 24px -10px rgba(79, 70, 229, 0.55);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		overflow: hidden;
		transition: box-shadow 0.18s, background 0.18s, opacity 0.18s;
		text-decoration: none;
	}
	.btn-submit.inline {
		display: inline-flex;
		width: auto;
		padding: 12px 22px;
		margin-top: 6px;
	}
	.btn-submit:hover:not(:disabled) {
		background: linear-gradient(135deg, #4338ca, #5b53e0);
		box-shadow: 0 14px 28px -10px rgba(79, 70, 229, 0.6);
	}
	.btn-submit:disabled {
		opacity: 0.85;
		cursor: default;
	}
	.spinner {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		animation: spin 0.7s linear infinite;
		display: none;
	}
	.btn-submit.loading .spinner {
		display: inline-block;
	}
	.signup-line {
		text-align: center;
		margin-top: 22px;
		font-size: 0.86rem;
		color: #5b6072;
	}
	.signup-line a {
		color: #4f46e5;
		font-weight: 700;
		text-decoration: none;
	}
	.signup-line a:hover {
		text-decoration: underline;
	}
	.approval-card {
		text-align: center;
	}
	.approval-badge {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		color: #fff;
		font-size: 1.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 18px;
	}
	.approval-card p {
		color: #5b6072;
		font-size: 0.92rem;
		line-height: 1.6;
	}
	@media (max-width: 900px) {
		.brand-panel {
			display: none;
		}
		.form-panel {
			padding: 40px 20px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		*,
		.ring-orbit,
		.form-card {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
