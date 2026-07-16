<script>
	/** @type {{ lines?: number, height?: string }} */
	let { lines = 3, height = '14px' } = $props();
</script>

<div class="skeleton" aria-hidden="true">
	{#each Array(lines) as _, i}
		<div
			class="sk-line"
			style="height:{height}; width:{i === lines - 1 ? '60%' : i === 0 ? '90%' : '100%'}; animation-delay:{i * 0.08}s"
		></div>
	{/each}
</div>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.sk-line {
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
		.sk-line {
			animation: none;
		}
	}
</style>
