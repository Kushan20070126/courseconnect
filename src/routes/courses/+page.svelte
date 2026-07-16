<script>
	import { navigating } from '$app/stores';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let loading = $derived(!!$navigating);
</script>

<div class="page">
	<header class="page-head">
		<h1>Courses</h1>
		<p>Browse the CourseConnect catalog.</p>
	</header>

	{#if loading}
		<div class="course-grid">
			{#each Array(6) as _}
				<div class="course-card skeleton-card">
					<div class="sk-thumb"></div>
					<div class="sk-body">
						<Skeleton lines={3} height="13px" />
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<b>No courses yet</b>
			<span>Courses will appear here once they are published.</span>
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
	.empty {
		text-align: center;
		padding: 3.5rem 1.25rem;
		color: #5b6072;
		border: 1.5px dashed #e7e8f2;
		border-radius: 14px;
		background: #fafafd;
	}
	.empty b {
		display: block;
		color: #161a2b;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		margin-bottom: 0.4rem;
	}

	/* Skeleton */
	.skeleton-card {
		padding: 0;
		overflow: hidden;
	}
	.sk-thumb {
		height: 150px;
		background: linear-gradient(90deg, #eef0f7 25%, #f6f7fb 37%, #eef0f7 63%);
		background-size: 400% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}
	.sk-body {
		padding: 16px 18px 18px;
	}
	.skeleton-card * {
		pointer-events: none;
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
		.sk-thumb {
			animation: none;
		}
	}
</style>
