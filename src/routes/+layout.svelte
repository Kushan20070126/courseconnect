<script>
	import { page, navigating } from '$app/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();

	// Only the authenticated app pages get the shared navbar. The landing,
	// sign-in and sign-up pages ship their own full-page layouts.
	const navRoutes = ['/dashboard', '/courses', '/me'];
	let showNav = $derived(
		navRoutes.some((r) => $page.url.pathname === r || $page.url.pathname.startsWith(r + '/'))
	);

	// Global top loading bar driven by SvelteKit navigation state.
	let loading = $derived(!!$navigating);
	let barWidth = $state(0);
	let settleTimer;

	$effect(() => {
		if (loading) {
			clearTimeout(settleTimer);
			// Jump to a partial width, then ease toward completion while navigating.
			barWidth = 0;
			requestAnimationFrame(() => (barWidth = 35));
			setTimeout(() => (barWidth = 80), 400);
		} else {
			// Complete, then fade out.
			barWidth = 100;
			settleTimer = setTimeout(() => (barWidth = 0), 450);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="load-bar" class:visible={loading || barWidth > 0} style="width:{barWidth}%"></div>

{#key $page.url.pathname}
	<div class="route-fade">
		{#if showNav}
			<Navbar user={data?.user} />
		{/if}

		{@render children()}
	</div>
{/key}

<style>
	.load-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 3px;
		background: linear-gradient(90deg, #4f46e5, #6d5cf3, #0ea5a0);
		background-size: 200% 100%;
		z-index: 100;
		opacity: 0;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
		box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
		pointer-events: none;
	}
	.load-bar.visible {
		opacity: 1;
		animation: loadShift 1.2s linear infinite;
	}
	@keyframes loadShift {
		to {
			background-position: 200% 0;
		}
	}

	.route-fade {
		animation: routeIn 0.32s cubic-bezier(0.4, 0, 0.2, 1) both;
	}
	@keyframes routeIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.load-bar,
		.route-fade {
			animation: none !important;
			transition: none !important;
		}
	}
</style>

