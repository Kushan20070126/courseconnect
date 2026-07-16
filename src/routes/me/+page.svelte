<script>
	import { enhance } from '$app/forms';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let { data, form } = $props();

	let user = $derived(form?.action === 'update' && form?.success ? form.user : data?.user);

	let isStudent = $derived(
		(user?.role ?? '').toLowerCase() === 'student' || user?.educationLevel !== undefined
	);

	let editing = $state(false);
	let isSubmitting = $state(false);
	let confirmingDelete = $state(false);

	let showDob = false;

	let initials = $derived(
		((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() ||
			(user?.email?.[0] ?? 'U').toUpperCase()
	);
	let displayName = $derived(
		[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Member'
	);
	let roleLabel = $derived(
		isStudent ? 'Student' : (user?.title ? user.title + ' ' : '') + (user?.firstName ?? '')
	);
</script>

<svelte:head>
	<title>My Profile · CourseConnect</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	{#if user}
		<!-- Header / cover -->
		<header class="cover">
			<div class="cover-bg"></div>
			<div class="cover-inner">
				<div class="avatar">{initials}</div>
				<div class="id-block">
					<div class="name-row">
						<h1>{displayName}</h1>
						<span class="role-badge" class:student={isStudent}>
							{isStudent ? 'Student' : 'Lecturer'}
						</span>
					</div>
					<p class="subtitle">{user.email}</p>
				</div>
				{#if !editing}
					<button type="button" class="btn-edit" onclick={() => (editing = true)}>
						<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="M13.5 3.5l3 3L7 16l-3.5.5L4 13l9.5-9.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
							<path d="M11.5 5.5l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
						</svg>
						Edit profile
					</button>
				{/if}
			</div>
		</header>

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

		<!-- Quick stats -->
		<section class="stats">
			<div class="stat">
				<span class="stat-val">{isStudent ? (user.educationLevel ?? '—') : (user.experience ?? 0) + 'y'}</span>
				<span class="stat-key">{isStudent ? 'Education' : 'Experience'}</span>
			</div>
			<div class="stat">
				<span class="stat-val">{user.age ?? '—'}</span>
				<span class="stat-key">Age</span>
			</div>
			<div class="stat">
				<span class="stat-val">{isStudent ? (user.interest ? user.interest.split(',').length : 0) : (user.area ? user.area.split(',').length : 0)}</span>
				<span class="stat-key">{isStudent ? 'Interests' : 'Areas'}</span>
			</div>
			<div class="stat">
				<span class="stat-val">{user.id ? '#' + String(user.id).slice(-4) : '—'}</span>
				<span class="stat-key">Member ID</span>
			</div>
		</section>

		<div class="grid">
			<!-- Primary info -->
			<section class="card">
				<div class="card-head">
					<h2>Account details</h2>
				</div>
				<dl class="info-list">
					<div class="info-row">
						<dt>Full name</dt>
						<dd>{user.firstName ?? ''} {user.lastName ?? ''}</dd>
					</div>
					<div class="info-row">
						<dt>Email</dt>
						<dd>{user.email}</dd>
					</div>
					<div class="info-row">
						<dt>Age</dt>
						<dd>{user.age ? user.age + ' years old' : '—'}</dd>
					</div>
					<div class="info-row">
						<dt>Account type</dt>
						<dd><span class="pill">{user.role}</span></dd>
					</div>
				</dl>
			</section>

			<!-- Role-specific -->
			<section class="card">
				<div class="card-head">
					<h2>{isStudent ? 'Learning profile' : 'Teaching profile'}</h2>
					<span class="accent-dot" class:student={isStudent}></span>
				</div>
				{#if isStudent}
					<dl class="info-list">
						<div class="info-row">
							<dt>Education level</dt>
							<dd>{user.educationLevel ?? 'Not specified'}</dd>
						</div>
						<div class="info-row">
							<dt>Interests</dt>
							<dd>
								{#if user.interest}
									<div class="chips">
										{#each user.interest.split(',').map((s) => s.trim()).filter(Boolean) as tag}
											<span class="chip">{tag}</span>
										{/each}
									</div>
								{:else}
									<span class="muted">None added</span>
								{/if}
							</dd>
						</div>
						<div class="info-row">
							<dt>Career goal</dt>
							<dd>{user.goal ?? 'None added'}</dd>
						</div>
					</dl>
				{:else}
					<dl class="info-list">
						<div class="info-row">
							<dt>Title</dt>
							<dd>{user.title ?? 'N/A'}</dd>
						</div>
						<div class="info-row">
							<dt>Experience</dt>
							<dd>{user.experience ?? 0} years</dd>
						</div>
						<div class="info-row">
							<dt>Specialized areas</dt>
							<dd>
								{#if user.area}
									<div class="chips">
										{#each user.area.split(',').map((s) => s.trim()).filter(Boolean) as tag}
											<span class="chip">{tag}</span>
										{/each}
									</div>
								{:else}
									<span class="muted">N/A</span>
								{/if}
							</dd>
						</div>
						{#if user.bio}
							<div class="info-row bio">
								<dt>Biography</dt>
								<dd class="bio-text">{user.bio}</dd>
							</div>
						{/if}
					</dl>
				{/if}
			</section>
		</div>

		<!-- Edit form -->
		{#if editing}
			<section class="card edit-card">
				<div class="card-head">
					<h2>Edit profile</h2>
					<button type="button" class="x-close" onclick={() => (editing = false)} aria-label="Close">×</button>
				</div>
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update, result }) => {
							await update();
							isSubmitting = false;
							if (result.type === 'success') editing = false;
						};
					}}
				>
					<input type="hidden" name="role" value={isStudent ? 'student' : 'lecturer'} />

					<div class="form-grid">
						<label class="field">
							<span>First name</span>
							<input type="text" name="firstName" value={user.firstName ?? ''} disabled={isSubmitting} />
						</label>
						<label class="field">
							<span>Last name</span>
							<input type="text" name="lastName" value={user.lastName ?? ''} disabled={isSubmitting} />
						</label>
						<label class="field">
							<span>Age</span>
							<input type="number" name="age" value={user.age ?? ''} min="0" disabled={isSubmitting} />
						</label>

						{#if isStudent}
							<label class="field">
								<span>Education level</span>
								<input type="text" name="educationLevel" value={user.educationLevel ?? ''} disabled={isSubmitting} />
							</label>
							<label class="field full">
								<span>Interests <em>(comma separated)</em></span>
								<input type="text" name="interest" value={user.interest ?? ''} disabled={isSubmitting} />
							</label>
							<label class="field full">
								<span>Career goal</span>
								<input type="text" name="goal" value={user.goal ?? ''} disabled={isSubmitting} />
							</label>
						{:else}
							<label class="field">
								<span>Title</span>
								<input type="text" name="title" value={user.title ?? ''} disabled={isSubmitting} />
							</label>
							<label class="field">
								<span>Years of experience</span>
								<input type="number" name="experience" value={user.experience ?? ''} min="0" disabled={isSubmitting} />
							</label>
							<label class="field full">
								<span>Specialized areas <em>(comma separated)</em></span>
								<input type="text" name="area" value={user.area ?? ''} disabled={isSubmitting} />
							</label>
							<label class="field full">
								<span>Biography</span>
								<textarea name="bio" rows="4" disabled={isSubmitting}>{user.bio ?? ''}</textarea>
							</label>
						{/if}
					</div>

					<div class="form-actions">
						<button type="submit" class="btn primary" disabled={isSubmitting}>
							{isSubmitting ? 'Saving…' : 'Save changes'}
						</button>
						<button type="button" class="btn ghost" disabled={isSubmitting} onclick={() => (editing = false)}>
							Cancel
						</button>
					</div>
				</form>
			</section>
		{/if}

		<!-- Danger zone -->
		<section class="card danger-card">
			<div class="card-head">
				<h2>Danger zone</h2>
			</div>
			<div class="danger-body">
				<div>
					<p class="danger-title">Delete account</p>
					<p class="danger-sub">Permanently remove your account and all associated data. This cannot be undone.</p>
				</div>
				{#if !confirmingDelete}
					<button type="button" class="btn danger" onclick={() => (confirmingDelete = true)}>Delete account</button>
				{:else}
					<div class="confirm-actions">
						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								isSubmitting = true;
								return async ({ update }) => {
									await update();
									isSubmitting = false;
								};
							}}
						>
							<button type="submit" class="btn danger" disabled={isSubmitting}>
								{isSubmitting ? 'Deleting…' : 'Yes, delete'}
							</button>
						</form>
						<button type="button" class="btn ghost" disabled={isSubmitting} onclick={() => (confirmingDelete = false)}>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		</section>
	{:else}
		<div class="cover skeleton-cover"><div class="cover-bg"></div></div>
		<div class="stats">
			{#each Array(4) as _}
				<div class="stat"><span class="sk-block"></span></div>
			{/each}
		</div>
		<div class="grid">
			<div class="card"><Skeleton lines={4} height="14px" /></div>
			<div class="card"><Skeleton lines={4} height="14px" /></div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f6fb;
	}
	.page {
		max-width: 980px;
		margin: 0 auto;
		padding: 28px 24px 64px;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}

	/* Cover */
	.cover {
		position: relative;
		border-radius: 20px;
		overflow: hidden;
		background: #fff;
		border: 1px solid #e7e8f2;
		box-shadow: 0 18px 40px -28px rgba(46, 31, 143, 0.4);
		margin-bottom: 22px;
	}
	.cover-bg {
		position: absolute;
		inset: 0 0 auto 0;
		height: 148px;
		background: radial-gradient(120% 160% at 12% 0%, #6a5cf0 0%, #4f46e5 45%, #2e1f8f 100%);
	}
	.cover-bg::after {
		content: '';
		position: absolute;
		right: -60px;
		top: -60px;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		border: 1px dashed rgba(255, 255, 255, 0.25);
	}
	.cover-inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		gap: 20px;
		padding: 100px 28px 24px;
		flex-wrap: wrap;
	}
	.avatar {
		width: 96px;
		height: 96px;
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		color: #fff;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 2rem;
		border: 4px solid #fff;
		box-shadow: 0 14px 30px -12px rgba(79, 70, 229, 0.6);
		flex-shrink: 0;
	}
	.id-block {
		flex: 1;
		min-width: 200px;
		padding-bottom: 4px;
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.name-row h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.6rem;
		margin: 0;
		font-weight: 700;
	}
	.role-badge {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 4px 10px;
		border-radius: 999px;
		background: rgba(14, 165, 160, 0.12);
		color: #0b7d79;
	}
	.role-badge.student {
		background: rgba(79, 70, 229, 0.12);
		color: #4338ca;
	}
	.subtitle {
		margin: 6px 0 0;
		color: #5b6072;
		font-size: 0.92rem;
	}
	.btn-edit {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		border: 1.5px solid #e7e8f2;
		background: #fff;
		color: #161a2b;
		font-weight: 600;
		font-size: 0.88rem;
		padding: 10px 16px;
		border-radius: 11px;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s, transform 0.15s;
		margin-bottom: 4px;
	}
	.btn-edit svg {
		width: 16px;
		height: 16px;
	}
	.btn-edit:hover {
		border-color: #c5c8ee;
		background: #f5f6fb;
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

	/* Stats */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 14px;
		margin-bottom: 22px;
	}
	.stat {
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 14px;
		padding: 16px;
		text-align: center;
		box-shadow: 0 8px 22px -20px rgba(46, 31, 143, 0.4);
	}
	.stat-val {
		display: block;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 1.25rem;
		color: #4f46e5;
		word-break: break-word;
	}
	.stat-key {
		display: block;
		margin-top: 4px;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9aa0b4;
	}

	/* Grid + cards */
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 18px;
		margin-bottom: 22px;
	}
	.card {
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 16px;
		padding: 22px;
		box-shadow: 0 10px 28px -24px rgba(46, 31, 143, 0.45);
	}
	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}
	.card-head h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		margin: 0;
		font-weight: 700;
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

	/* Info list */
	.info-list {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		padding-bottom: 14px;
		border-bottom: 1px solid #f0f1f7;
	}
	.info-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.info-row dt {
		font-size: 0.82rem;
		color: #9aa0b4;
		font-weight: 600;
		flex-shrink: 0;
		padding-top: 2px;
	}
	.info-row dd {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 600;
		color: #161a2b;
		text-align: right;
	}
	.info-row.bio {
		flex-direction: column;
		align-items: stretch;
	}
	.info-row.bio dt {
		margin-bottom: 6px;
	}
	.info-row.bio dd {
		text-align: left;
		font-weight: 400;
		color: #4a5568;
		line-height: 1.6;
	}
	.pill {
		display: inline-block;
		background: #edf2f7;
		color: #4a5568;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: 0.74rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.bio-text {
		font-style: normal;
		background: #f7fafc;
		padding: 12px 14px;
		border-radius: 10px;
		color: #4a5568;
	}
	.muted {
		color: #a3a8ba;
		font-weight: 500;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		justify-content: flex-end;
	}
	.chip {
		background: #eef0ff;
		color: #4338ca;
		border: 1px solid #dcdcfb;
		border-radius: 99px;
		padding: 3px 10px;
		font-size: 0.74rem;
		font-weight: 600;
	}

	/* Edit form */
	.edit-card {
		margin-bottom: 22px;
		animation: slideIn 0.28s cubic-bezier(0.4, 0, 0.2, 1) both;
	}
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
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
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
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
	.field span em {
		font-style: normal;
		font-weight: 400;
		color: #a3a8ba;
	}
	.field input,
	.field textarea {
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
	.field input:focus,
	.field textarea:focus {
		border-color: #4f46e5;
		background: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
	}
	.field textarea {
		resize: vertical;
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
		font-size: 0.92rem;
		font-family: 'Inter', sans-serif;
		transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s, background 0.2s;
	}
	.btn:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}
	.btn.primary {
		color: #fff;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		box-shadow: 0 10px 24px -10px rgba(79, 70, 229, 0.55);
	}
	.btn.primary:hover:not(:disabled) {
		transform: translateY(-2px);
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
	.btn.danger {
		color: #fff;
		background: #dc2626;
	}
	.btn.danger:hover:not(:disabled) {
		background: #c1272d;
	}

	/* Danger zone */
	.danger-card {
		border-color: #fad2d2;
	}
	.danger-body {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
	}
	.danger-title {
		margin: 0;
		font-weight: 700;
		color: #b91c1c;
	}
	.danger-sub {
		margin: 6px 0 0;
		font-size: 0.85rem;
		color: #8a8fa3;
		max-width: 480px;
		line-height: 1.5;
	}
	.confirm-actions {
		display: flex;
		gap: 10px;
	}

	/* Loading skeleton */
	.skeleton-cover {
		height: 200px;
		margin-bottom: 22px;
	}
	.sk-block {
		display: block;
		height: 16px;
		border-radius: 8px;
		background: linear-gradient(90deg, #eef0f7 25%, #f6f7fb 37%, #eef0f7 63%);
		background-size: 400% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}
	@keyframes shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: 0 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sk-block,
		.sk-thumb {
			animation: none;
		}
	}

	/* Empty state (kept for no-data fallback) */
	.empty {
		text-align: center;
		padding: 80px 0;
		color: #5b6072;
	}
	.spinner-lg {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 3px solid #e7e8f2;
		border-top-color: #4f46e5;
		margin: 0 auto 16px;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 760px) {
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
		.grid,
		.form-grid {
			grid-template-columns: 1fr;
		}
		.chips {
			justify-content: flex-start;
		}
		.info-row dd {
			text-align: left;
		}
	}
</style>
