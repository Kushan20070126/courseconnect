<script>
	import { enhance } from '$app/forms';

	let { form } = $props();

	let isSubmitting = $state(false);
	let showPassword = $state(false);
	let email = $state('');
	let password = $state('');
</script>

<svelte:head>
	<title>Sign in · CourseConnect</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="stage">
	<!-- Brand panel -->
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
			<h1>Welcome back to your learning journey.</h1>
			<p>
				Sign in to pick up where you left off — your courses, progress and community are
				waiting.
			</p>

			<div class="stat-row">
				<div class="stat"><b>1,200+</b><span>Courses</span></div>
				<div class="stat"><b>45k</b><span>Learners</span></div>
				<div class="stat"><b>98%</b><span>Satisfaction</span></div>
			</div>
		</div>

		<p class="quote">
			<strong>“Learning without walls.”</strong> Access world-class instruction anywhere,
			anytime — on any device.
		</p>
	</aside>

	<!-- Form panel -->
	<main class="form-panel">
		<div class="form-card">
			<p class="eyebrow">Account access</p>
			<h2>Sign in</h2>
			<p class="sub">Enter your credentials to continue to your dashboard.</p>

			{#if form?.message}
				<div class="alert" class:error={!form.success} class:success={form.success} role="alert">
					<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>{form.message}</span>
				</div>
			{/if}

			<form
				method="POST"
				action="?/signin"
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
							<path
								d="M2.5 5.5h15v9h-15v-9Z"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linejoin="round"
							/>
							<path
								d="m3 6 7 5 7-5"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
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

				<div class="field">
					<label for="password">Password</label>
					<div class="input-wrap">
						<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<rect
								x="4"
								y="9"
								width="12"
								height="8"
								rx="2"
								stroke="currentColor"
								stroke-width="1.5"
							/>
							<path
								d="M7 9V6.5a3 3 0 016 0V9"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
							/>
						</svg>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							name="password"
							placeholder="Enter your password"
							autocomplete="current-password"
							bind:value={password}
							required
							disabled={isSubmitting}
						/>
						<button
							type="button"
							class="pass-toggle"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							tabindex="-1"
						>
							{#if showPassword}
								<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<path
										d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linejoin="round"
									/>
									<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
									<path d="m4 4 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
								</svg>
							{:else}
								<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<path
										d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linejoin="round"
									/>
									<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<div class="form-util">
					<label class="check">
						<input type="checkbox" name="remember" disabled={isSubmitting} />
						<span>Remember me</span>
					</label>
					<a href="/forgot-password" class="util-link">Forgot password?</a>
				</div>

				<button type="submit" class="btn-submit" class:loading={isSubmitting} disabled={isSubmitting}>
					<span class="spinner"></span>
					<span class="btn-label">{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
				</button>
			</form>

			<p class="signup-line">
				New to CourseConnect? <a href="/signup">Create an account</a>
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

	/* ---------- Brand panel ---------- */
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

	.stat-row {
		display: flex;
		gap: 28px;
		margin-top: 34px;
	}
	.stat-row .stat b {
		display: block;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
	}
	.stat-row .stat span {
		font-size: 0.76rem;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.06em;
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

	/* ---------- Form panel ---------- */
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

	/* Alert */
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
	.alert svg {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.alert.error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}
	.alert.success {
		background: #f0fdf4;
		color: #166534;
		border: 1px solid #86efac;
	}

	/* Fields */
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
	.input-wrap input {
		width: 100%;
		font-family: 'Inter', sans-serif;
		font-size: 0.92rem;
		color: #161a2b;
		background: #fbfbfe;
		border: 1.5px solid #e7e8f2;
		border-radius: 10px;
		padding: 12px 14px 12px 40px;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
	}
	.input-wrap input::placeholder {
		color: #a3a8ba;
	}
	.input-wrap input:focus {
		border-color: #4f46e5;
		background: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
	}
	.input-wrap:focus-within .lead-ic {
		color: #4f46e5;
	}
	.input-wrap input:disabled {
		opacity: 0.7;
		cursor: not-allowed;
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

	/* Util row */
	.form-util {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 4px 0 22px;
	}
	.form-util .check {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.83rem;
		color: #5b6072;
		cursor: pointer;
	}
	.form-util .check input {
		width: 16px;
		height: 16px;
		accent-color: #4f46e5;
		cursor: pointer;
	}
	.util-link {
		font-size: 0.83rem;
		font-weight: 600;
		color: #4f46e5;
		text-decoration: none;
	}
	.util-link:hover {
		text-decoration: underline;
	}

	/* Submit */
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
	}
	.btn-submit:hover:not(:disabled) {
		background: linear-gradient(135deg, #4338ca, #5b53e0);
		box-shadow: 0 14px 28px -10px rgba(79, 70, 229, 0.6);
	}
	.btn-submit:active:not(:disabled) {
		background: linear-gradient(135deg, #3b30b8, #4f46e5);
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

	/* ---------- Responsive ---------- */
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
