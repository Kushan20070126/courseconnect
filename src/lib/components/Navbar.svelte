<script>
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	/**
	 * @typedef {Object} NavUser
	 * @property {string} [firstName]
	 * @property {string} [lastName]
	 * @property {string} [email]
	 * @property {string} [role]
	 */

	/** @type {{ user?: NavUser | null }} */
	let { user = null } = $props();

	let mobileOpen = $state(false);
	let menuOpen = $state(false);

	const links = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/courses', label: 'Courses' },
		{ href: '/me', label: 'My Profile' }
	];

	let currentPath = $derived($page.url.pathname);

	/** @param {string} href */
	function isActive(href) {
		return currentPath === href || currentPath.startsWith(href + '/');
	}

	let initials = $derived(
		((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() ||
			(user?.email?.[0] ?? 'U').toUpperCase()
	);

	let displayName = $derived(
		[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account'
	);

	/** @param {MouseEvent} e */
	function closeMenusOnOutside(e) {
		const target = /** @type {HTMLElement} */ (e.target);
		if (!target.closest('.nav-user')) menuOpen = false;
	}
</script>

<svelte:window onclick={closeMenusOnOutside} />

<nav class="cc-nav">
	<div class="cc-nav-inner">
		<!-- Brand -->
		<a href="/dashboard" class="cc-brand" aria-label="CourseConnect home">
			<span class="cc-glyph">
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M12 3 3 8l9 5 7.5-4.17V15h1.5V8L12 3Zm-6 8.13V15l6 3.33L18 15v-3.87l-6 3.33-6-3.33Z"
						fill="currentColor"
					/>
				</svg>
			</span>
			<span class="cc-brand-name">CourseConnect</span>
		</a>

		<!-- Desktop links -->
		<div class="cc-links" class:open={mobileOpen}>
			{#each links as link}
				<a
					href={link.href}
					class="cc-link"
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
					onclick={() => (mobileOpen = false)}
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Right side -->
		<div class="cc-actions">
			{#if user}
				<div class="nav-user">
					<button
						type="button"
						class="cc-avatar-btn"
						aria-haspopup="menu"
						aria-expanded={menuOpen}
						onclick={() => (menuOpen = !menuOpen)}
					>
						<span class="cc-avatar">{initials}</span>
						<span class="cc-username">{displayName}</span>
						<svg class="cc-caret" viewBox="0 0 12 8" aria-hidden="true">
							<path
								d="M1 1l5 5 5-5"
								stroke="currentColor"
								stroke-width="1.6"
								fill="none"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					{#if menuOpen}
						<div class="cc-menu" role="menu">
							<div class="cc-menu-head">
								<b>{displayName}</b>
								{#if user.email}<span>{user.email}</span>{/if}
								{#if user.role}<span class="cc-role">{user.role}</span>{/if}
							</div>
							<a href="/me" class="cc-menu-item" role="menuitem" onclick={() => (menuOpen = false)}>
								My Profile
							</a>
							<a href="/dashboard" class="cc-menu-item" role="menuitem" onclick={() => (menuOpen = false)}>
								Dashboard
							</a>
							<form method="POST" action="/logout" use:enhance class="cc-logout-form">
								<button type="submit" class="cc-menu-item danger" role="menuitem">Log out</button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/signin" class="cc-btn ghost">Log in</a>
				<a href="/signup" class="cc-btn solid">Sign up</a>
			{/if}

			<!-- Mobile hamburger -->
			<button
				type="button"
				class="cc-burger"
				aria-label="Toggle navigation"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				<span></span><span></span><span></span>
			</button>
		</div>
	</div>
</nav>

<style>
	.cc-nav {
		position: sticky;
		top: 0;
		z-index: 40;
		background: rgba(255, 255, 255, 0.86);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid #e7e8f2;
		font-family: 'Inter', system-ui, sans-serif;
	}
	.cc-nav-inner {
		max-width: 1180px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 12px 24px;
	}

	/* Brand */
	.cc-brand {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: #161a2b;
		font-family: 'Space Grotesk', 'Inter', sans-serif;
		font-weight: 700;
		font-size: 1.05rem;
		flex-shrink: 0;
	}
	.cc-glyph {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		box-shadow: 0 8px 18px -8px rgba(79, 70, 229, 0.6);
	}
	.cc-glyph svg {
		width: 20px;
		height: 20px;
	}

	/* Links */
	.cc-links {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: 12px;
	}
	.cc-link {
		position: relative;
		color: #5b6072;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 8px 14px;
		border-radius: 9px;
		transition: color 0.2s, background 0.2s;
	}
	.cc-link:hover {
		color: #161a2b;
		background: #f5f6fb;
	}
	.cc-link.active {
		color: #4f46e5;
		background: rgba(79, 70, 229, 0.08);
	}
	.cc-link.active::after {
		content: '';
		position: absolute;
		left: 14px;
		right: 14px;
		bottom: 3px;
		height: 2px;
		border-radius: 2px;
		background: #4f46e5;
	}

	/* Right actions */
	.cc-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-left: auto;
	}

	.cc-btn {
		font-weight: 600;
		font-size: 0.86rem;
		border-radius: 10px;
		padding: 9px 16px;
		text-decoration: none;
		cursor: pointer;
		border: 1.5px solid #4f46e5;
		transition: transform 0.18s, background 0.2s, color 0.2s;
	}
	.cc-btn.ghost {
		background: transparent;
		color: #4f46e5;
	}
	.cc-btn.ghost:hover {
		background: rgba(79, 70, 229, 0.08);
	}
	.cc-btn.solid {
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		color: #fff;
		border-color: transparent;
		box-shadow: 0 10px 24px -10px rgba(79, 70, 229, 0.55);
	}
	.cc-btn.solid:hover {
		transform: translateY(-2px);
	}

	/* User menu */
	.nav-user {
		position: relative;
	}
	.cc-avatar-btn {
		display: flex;
		align-items: center;
		gap: 9px;
		background: transparent;
		border: 1.5px solid #e7e8f2;
		border-radius: 999px;
		padding: 5px 12px 5px 5px;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s;
	}
	.cc-avatar-btn:hover {
		border-color: #c7c9de;
		background: #f5f6fb;
	}
	.cc-avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		color: #fff;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 0.78rem;
		flex-shrink: 0;
	}
	.cc-username {
		font-size: 0.85rem;
		font-weight: 600;
		color: #161a2b;
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cc-caret {
		width: 11px;
		height: 8px;
		color: #5b6072;
	}

	.cc-menu {
		position: absolute;
		top: calc(100% + 10px);
		right: 0;
		min-width: 220px;
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 12px;
		box-shadow: 0 20px 48px -18px rgba(46, 31, 143, 0.28);
		padding: 6px;
		z-index: 50;
		animation: cc-pop 0.16s ease;
	}
	@keyframes cc-pop {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.cc-menu-head {
		padding: 10px 12px;
		border-bottom: 1px solid #f0f1f7;
		margin-bottom: 4px;
	}
	.cc-menu-head b {
		display: block;
		font-size: 0.9rem;
		color: #161a2b;
	}
	.cc-menu-head span {
		display: block;
		font-size: 0.76rem;
		color: #5b6072;
		margin-top: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.cc-role {
		display: inline-block !important;
		margin-top: 6px !important;
		background: #edf2f7;
		color: #4a5568;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.66rem !important;
	}
	.cc-menu-item {
		display: block;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		font-family: inherit;
		font-size: 0.86rem;
		font-weight: 500;
		color: #3a3f52;
		padding: 9px 12px;
		border-radius: 8px;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.cc-menu-item:hover {
		background: #f5f6fb;
		color: #161a2b;
	}
	.cc-menu-item.danger {
		color: #e5484d;
	}
	.cc-menu-item.danger:hover {
		background: rgba(229, 72, 77, 0.08);
		color: #c1272d;
	}
	.cc-logout-form {
		margin: 0;
	}

	/* Hamburger */
	.cc-burger {
		display: none;
		flex-direction: column;
		gap: 4px;
		width: 40px;
		height: 40px;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1.5px solid #e7e8f2;
		border-radius: 10px;
		cursor: pointer;
	}
	.cc-burger span {
		display: block;
		width: 18px;
		height: 2px;
		border-radius: 2px;
		background: #161a2b;
	}

	@media (max-width: 820px) {
		.cc-links {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			gap: 2px;
			margin: 0;
			padding: 10px 16px 16px;
			background: #fff;
			border-bottom: 1px solid #e7e8f2;
			box-shadow: 0 14px 30px -18px rgba(22, 26, 43, 0.3);
			display: none;
		}
		.cc-links.open {
			display: flex;
		}
		.cc-link.active::after {
			display: none;
		}
		.cc-burger {
			display: flex;
		}
		.cc-username {
			display: none;
		}
	}
</style>
