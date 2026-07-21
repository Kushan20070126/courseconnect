<script>
	import { mediaUrl } from '$lib/api.js';

	let { data } = $props();
	let courses = $derived(data?.courses ?? []);

	let active = $derived(courses.filter((c) => c.status !== 'COMPLETED'));
	let completed = $derived(courses.filter((c) => c.status === 'COMPLETED'));
</script>

<svelte:head>
	<title>My Learning · CourseConnect</title>
</svelte:head>

<div class="page">
	<header class="head">
		<h1>My Learning</h1>
		<p>Courses you're enrolled in.</p>
	</header>

	{#if courses.length === 0}
		<div class="empty">
			<b>You're not enrolled in any courses yet</b>
			<span>Browse the <a href="/courses">catalog</a> and enroll to start learning.</span>
		</div>
	{:else}
		{#if active.length}
			<h2 class="group">In progress</h2>
			<div class="grid">
				{#each active as c (c.id)}
					<a class="card" href={`/courses/${c.id}/learn`}>
						<div class="thumb">
							{#if c.thumbnailUrl}
								<img src={mediaUrl(c.thumbnailUrl)} alt={c.title ?? ''} loading="lazy" />
							{:else}
								<div class="ph"></div>
							{/if}
						</div>
						<div class="body">
							<h3>{c.title ?? 'Untitled'}</h3>
							<p>{c.summary ?? ''}</p>
							<div class="meta">
								<span>{c.instructorName ?? 'Instructor'}</span>
								<span class="dot">•</span>
								<span>{c.level ?? 'All levels'}</span>
							</div>
							<div class="progress">
								<div class="bar"><div class="fill" style="width:{c.progressPercent ?? 0}%"></div></div>
								<span>{c.progressPercent ?? 0}%</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		{#if completed.length}
			<h2 class="group">Completed</h2>
			<div class="grid">
				{#each completed as c (c.id)}
					<a class="card" href={`/courses/${c.id}/learn`}>
						<div class="thumb">
							{#if c.thumbnailUrl}
								<img src={mediaUrl(c.thumbnailUrl)} alt={c.title ?? ''} loading="lazy" />
							{:else}
								<div class="ph"></div>
							{/if}
							<span class="badge">Completed 🏆</span>
						</div>
						<div class="body">
							<h3>{c.title ?? 'Untitled'}</h3>
							<p>{c.summary ?? ''}</p>
							<div class="meta">
								<span>{c.instructorName ?? 'Instructor'}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2.2rem 1.5rem 4rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.head h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.9rem;
		margin: 0 0 0.3rem;
	}
	.head p {
		color: #5b6072;
		margin: 0 0 1.6rem;
	}
	.group {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.15rem;
		margin: 1.8rem 0 1rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.4rem;
	}
	.card {
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 14px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.card:hover {
		box-shadow: 0 12px 30px rgba(20, 26, 43, 0.1);
	}
	.thumb {
		position: relative;
		height: 150px;
		background: #eef0f7;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.ph {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #e9ecf5, #f6f7fb);
	}
	.badge {
		position: absolute;
		top: 10px;
		left: 10px;
		background: #eafaf0;
		color: #1f9d55;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 3px 9px;
		border-radius: 999px;
	}
	.body {
		padding: 14px 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}
	.body h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.02rem;
		margin: 0;
	}
	.body p {
		font-size: 0.85rem;
		color: #5b6072;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta {
		display: flex;
		gap: 6px;
		font-size: 0.8rem;
		color: #6b7180;
	}
	.dot {
		color: #c4c8d4;
	}
	.progress {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}
	.bar {
		flex: 1;
		height: 8px;
		background: #eef0f5;
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: linear-gradient(90deg, #4f46e5, #0ea5a0);
		border-radius: 999px;
	}
	.progress span {
		font-size: 0.78rem;
		color: #6b7180;
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
	.empty a {
		color: #4f46e5;
	}
</style>
