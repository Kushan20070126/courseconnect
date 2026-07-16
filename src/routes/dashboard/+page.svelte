<script>
	import { navigating } from '$app/stores';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let { data } = $props();
	let user = $derived(data?.user);
	let firstName = $derived(user?.firstName || 'there');
	let loading = $derived(!!$navigating || !user);
</script>

<div class="page">
	<header class="page-head">
		<h1>Dashboard</h1>
		{#if loading}
			<div class="head-skel"><Skeleton lines={1} height="16px" /></div>
		{:else}
			<p>Welcome back, {firstName}. Here's what's happening with your learning.</p>
		{/if}
	</header>

	{#if loading}
		<div class="grid">
			{#each Array(2) as _}
				<div class="tile skeleton-tile">
					<Skeleton lines={3} height="14px" />
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid">
			<a class="tile" href="/courses">
				<h2>Browse Courses</h2>
				<p>Explore the catalog and enroll in something new.</p>
			</a>
			<a class="tile" href="/me">
				<h2>My Profile</h2>
				<p>View and update your account details.</p>
			</a>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1180px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.page-head h1 {
		font-family: 'Space Grotesk', 'Inter', sans-serif;
		font-size: 1.9rem;
		margin: 0 0 0.4rem;
	}
	.page-head p {
		color: #5b6072;
		margin: 0 0 2rem;
	}
	.head-skel {
		max-width: 420px;
	}
	.skeleton-tile {
		pointer-events: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.25rem;
	}
	.tile {
		display: block;
		text-decoration: none;
		color: inherit;
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 14px;
		padding: 1.5rem;
		box-shadow: 0 1px 2px rgba(22, 26, 43, 0.04);
		transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
	}
	.tile:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 32px -12px rgba(46, 31, 143, 0.18);
		border-color: transparent;
	}
	.tile h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		margin: 0 0 0.4rem;
	}
	.tile p {
		color: #5b6072;
		font-size: 0.9rem;
		margin: 0;
	}
</style>
