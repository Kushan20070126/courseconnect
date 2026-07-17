<script>
	import { page } from '$app/stores';
	import Navbar from '$lib/components/Navbar.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children, data } = $props();

	// Only the authenticated app pages get the shared navbar. The landing,
	// sign-in, sign-up and admin pages ship their own full-page layouts.
	const navRoutes = ['/dashboard', '/courses', '/me', '/my-courses', '/lecturer'];
	let showNav = $derived(
		navRoutes.some((r) => $page.url.pathname === r || $page.url.pathname.startsWith(r + '/'))
	);
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

{#if showNav}
	<Navbar user={data?.user} />
{/if}

{@render children()}

