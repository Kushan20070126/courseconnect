<script>
	import { enhance } from '$app/forms';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let { data, form } = $props();

	let user = $derived(data?.user);
	let sessions = $derived(data?.sessions ?? []);
	let currentJti = $derived(data?.currentJti);

	let isStudent = $derived((user?.role ?? '').toLowerCase() === 'student' || user?.educationLevel !== undefined);

	let changingPassword = $state(false);
	let pwSubmitting = $state(false);
	let loggingOut = $state(false);

	/** @param {any} s */
	function fmtDate(s) {
		if (!s?.lastSeen) return '—';
		try {
			return new Date(s.lastSeen).toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return String(s.lastSeen);
		}
	}

	let initials = $derived(
		((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() ||
			(user?.email?.[0] ?? 'U').toUpperCase()
	);
	let displayName = $derived(
		[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Member'
	);
</script>

<svelte:head>
	<title>Settings · CourseConnect</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	<div class="topbar">
		<a href="/me" class="back">
			<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			Back to profile
		</a>
		<h1>Settings</h1>
		<div class="who">
			<div class="avatar sm">{initials}</div>
			<span>{displayName}</span>
		</div>
	</div>

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

	{#if user}
		<!-- Devices / sessions -->
		<section class="card">
			<div class="card-head">
				<div>
					<h2>Logged-in devices</h2>
					<p class="card-sub">Devices currently signed in to your account.</p>
				</div>
				<form
					method="POST"
					action="?/logoutOthers"
					use:enhance={() => {
						loggingOut = true;
						return async ({ update }) => {
							await update();
							loggingOut = false;
						};
					}}
				>
					<button type="submit" class="btn ghost danger-text" disabled={loggingOut || sessions.length <= 1}>
						{loggingOut ? 'Signing out…' : 'Log out other devices'}
					</button>
				</form>
			</div>

			<div class="device-list">
				{#each sessions as s (s.id)}
					<div class="device" class:current={s.current}>
						<div class="dev-ic">
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								{#if (s.device ?? '').includes('phone')}
									<rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" stroke-width="1.6" />
									<path d="M11 18h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
								{:else if (s.device ?? '').includes('tablet') || (s.device ?? '').includes('iPad')}
									<rect x="5" y="3" width="14" height="18" rx="2.5" stroke="currentColor" stroke-width="1.6" />
									<path d="M11 18h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
								{:else}
									<rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6" />
									<path d="M2 20h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
								{/if}
							</svg>
						</div>
						<div class="dev-info">
							<div class="dev-title">
								{s.device || 'Unknown device'}
								{#if s.current}
									<span class="badge-current">This device</span>
								{/if}
							</div>
							<div class="dev-meta">
								{s.os || 'Unknown OS'} · {s.browser || 'Unknown browser'}
							</div>
							<div class="dev-meta muted">
								IP {s.ip || '—'} · Active {fmtDate(s)}
							</div>
						</div>
					</div>
				{:else}
					<p class="empty">No active devices found.</p>
				{/each}
			</div>
		</section>

		<!-- Security / reset password -->
		{#if changingPassword}
			<section class="card security-card">
				<div class="card-head">
					<h2>Reset password</h2>
					<button type="button" class="x-close" onclick={() => (changingPassword = false)} aria-label="Close">×</button>
				</div>
				<form
					method="POST"
					action="?/changePassword"
					use:enhance={() => {
						pwSubmitting = true;
						return async ({ update, result }) => {
							await update();
							pwSubmitting = false;
							if (result.type === 'success') changingPassword = false;
						};
					}}
				>
					<div class="form-grid">
						<label class="field full">
							<span>Current password</span>
							<input
								type="password"
								name="currentPassword"
								autocomplete="current-password"
								placeholder="Enter your current password"
								disabled={pwSubmitting}
							/>
						</label>
						<label class="field full">
							<span>New password</span>
							<input
								type="password"
								name="newPassword"
								autocomplete="new-password"
								placeholder="At least 6 characters"
								disabled={pwSubmitting}
							/>
						</label>
						<label class="field full">
							<span>Confirm new password</span>
							<input
								type="password"
								name="confirmPassword"
								autocomplete="new-password"
								placeholder="Re-enter new password"
								disabled={pwSubmitting}
							/>
						</label>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn primary" disabled={pwSubmitting}>
							{pwSubmitting ? 'Updating…' : 'Update password'}
						</button>
						<button type="button" class="btn ghost" disabled={pwSubmitting} onclick={() => (changingPassword = false)}>
							Cancel
						</button>
					</div>
				</form>
			</section>
		{:else}
			<section class="card security-card">
				<div class="card-head">
					<h2>Password &amp; security</h2>
					<span class="accent-dot" class:student={isStudent}></span>
				</div>
				<div class="security-body">
					<div>
						<p class="security-title">Reset your password</p>
						<p class="security-sub">
							Keep your account secure by updating your password regularly. You'll need your current password to confirm.
						</p>
					</div>
					<button type="button" class="btn ghost" onclick={() => (changingPassword = true)}>Reset password</button>
				</div>
			</section>
		{/if}
	{:else}
		<div class="card"><Skeleton lines={4} height="14px" /></div>
		<div class="card"><Skeleton lines={3} height="14px" /></div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f6fb;
	}
	.page {
		max-width: 860px;
		margin: 0 auto;
		padding: 28px 24px 64px;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.topbar {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 22px;
		flex-wrap: wrap;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.84rem;
		font-weight: 600;
		color: #5b6072;
		text-decoration: none;
	}
	.back svg {
		width: 18px;
		height: 18px;
	}
	.back:hover {
		color: #4f46e5;
	}
	.topbar h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.6rem;
		margin: 0;
		font-weight: 700;
		flex: 1;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 0.86rem;
		font-weight: 600;
		color: #5b6072;
	}
	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		color: #fff;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 0.95rem;
	}
	.avatar.sm {
		width: 32px;
		height: 32px;
		border-radius: 9px;
		font-size: 0.8rem;
	}

	/* Alert */
	.alert {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-radius: 12px;
		font-size: 0.9rem;
		margin-bottom: 22px;
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

	/* Cards */
	.card {
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 16px;
		padding: 22px;
		box-shadow: 0 10px 28px -24px rgba(46, 31, 143, 0.45);
		margin-bottom: 20px;
	}
	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}
	.card-head h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		margin: 0;
		font-weight: 700;
	}
	.card-sub {
		margin: 4px 0 0;
		font-size: 0.84rem;
		color: #9aa0b4;
	}
	.accent-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #0ea5a0;
		box-shadow: 0 0 0 4px rgba(14, 165, 160, 0.15);
	}
	.accent-dot.student {
		background: #4f46e5;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
	}

	/* Device list */
	.device-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.device {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px;
		border: 1px solid #f0f1f7;
		border-radius: 12px;
		background: #fcfcff;
	}
	.device.current {
		border-color: #c7d2fe;
		background: #f5f7ff;
	}
	.dev-ic {
		width: 42px;
		height: 42px;
		border-radius: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #eef0ff;
		color: #4338ca;
		flex-shrink: 0;
	}
	.dev-ic svg {
		width: 22px;
		height: 22px;
	}
	.dev-info {
		flex: 1;
		min-width: 0;
	}
	.dev-title {
		font-weight: 600;
		font-size: 0.94rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.badge-current {
		font-size: 0.66rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 2px 8px;
		border-radius: 999px;
		background: #4f46e5;
		color: #fff;
	}
	.dev-meta {
		font-size: 0.82rem;
		color: #5b6072;
		margin-top: 3px;
	}
	.dev-meta.muted {
		color: #a3a8ba;
	}
	.empty {
		color: #9aa0b4;
		font-size: 0.9rem;
		text-align: center;
		padding: 16px 0;
		margin: 0;
	}

	/* Security */
	.security-body {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
	}
	.security-title {
		margin: 0;
		font-weight: 700;
		font-size: 0.96rem;
	}
	.security-sub {
		margin: 6px 0 0;
		font-size: 0.85rem;
		color: #8a8fa3;
		max-width: 520px;
		line-height: 1.5;
	}
	.x-close {
		background: none;
		border: none;
		font-size: 1.4rem;
		line-height: 1;
		color: #9aa0b4;
		cursor: pointer;
		padding: 0 4px;
	}
	.x-close:hover {
		color: #161a2b;
	}

	/* Forms */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.field.full {
		grid-column: 1 / -1;
	}
	.field span {
		font-size: 0.78rem;
		font-weight: 600;
		color: #5b6072;
	}
	.field input {
		font-family: 'Inter', sans-serif;
		font-size: 0.92rem;
		color: #161a2b;
		background: #fbfbfe;
		border: 1.5px solid #e7e8f2;
		border-radius: 10px;
		padding: 11px 13px;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
	}
	.field input:focus {
		border-color: #4f46e5;
		background: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
	}
	.form-actions {
		display: flex;
		gap: 12px;
		margin-top: 20px;
	}

	/* Buttons */
	.btn {
		padding: 11px 20px;
		border-radius: 11px;
		border: none;
		font-weight: 700;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: 'Inter', sans-serif;
		transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s, background 0.2s, color 0.2s;
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.btn.primary {
		color: #fff;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		box-shadow: 0 10px 24px -10px rgba(79, 70, 229, 0.55);
	}
	.btn.primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #4338ca, #5b53e0);
	}
	.btn.ghost {
		background: #fff;
		color: #5b6072;
		border: 1.5px solid #e7e8f2;
	}
	.btn.ghost:hover:not(:disabled) {
		border-color: #c5c8ee;
		color: #161a2b;
	}
	.btn.danger-text {
		color: #b91c1c;
		border-color: #fad2d2;
	}
	.btn.danger-text:hover:not(:disabled) {
		background: #fef2f2;
		color: #991b1b;
	}

	@media (max-width: 600px) {
		.form-actions {
			flex-direction: column;
		}
		.btn {
			width: 100%;
		}
	}
</style>
