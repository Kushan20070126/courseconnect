<script>
	import { navigating } from '$app/stores';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { mediaUrl } from '$lib/api.js';

	let { data } = $props();
	let courses = $derived(data?.courses ?? []);
	let loading = $derived(!!$navigating);

	let q = $state($page.url.searchParams.get('q') ?? '');
	let category = $state($page.url.searchParams.get('category') ?? '');
	let level = $state($page.url.searchParams.get('level') ?? '');
	let sort = $state($page.url.searchParams.get('sort') ?? '');

	const categories = ['Programming', 'Design', 'Business', 'Data Science', 'Marketing', 'Language'];

	function applyFilters() {
		const params = new URLSearchParams();
		if (q.trim()) params.set('q', q.trim());
		if (category) params.set('category', category);
		if (level) params.set('level', level);
		if (sort) params.set('sort', sort);
		const qs = params.toString();
		goto(qs ? `/courses?${qs}` : '/courses');
	}

	function resetFilters() {
		q = '';
		category = '';
		level = '';
		sort = '';
		goto('/courses');
	}
</script>

<div class="page">
	<header class="page-head">
		<h1>Courses</h1>
		<p>Browse the CourseConnect catalog.</p>
	</header>

	<form class="filters" onsubmit={(e) => { e.preventDefault(); applyFilters(); }}>
		<input class="search" type="search" placeholder="Search courses…" bind:value={q} />
		<select bind:value={category}>
			<option value="">All categories</option>
			{#each categories as c}
				<option value={c}>{c}</option>
			{/each}
		</select>
		<select bind:value={level}>
			<option value="">All levels</option>
			<option value="Beginner">Beginner</option>
			<option value="Intermediate">Intermediate</option>
			<option value="Advanced">Advanced</option>
		</select>
		<select bind:value={sort}>
			<option value="">Sort: default</option>
			<option value="rating">Top rated</option>
			<option value="students">Most enrolled</option>
			<option value="price-asc">Price: low to high</option>
			<option value="price-desc">Price: high to low</option>
		</select>
		<button class="btn solid" type="submit">Apply</button>
		<button class="btn ghost" type="button" onclick={resetFilters}>Clear</button>
	</form>

	{#if loading}
		<div class="course-grid">
			{#each Array(6) as _}
				<div class="course-card skeleton-card">
					<div class="sk-thumb"></div>
					<div class="sk-body">
						<div class="sk-line w70"></div>
						<div class="sk-line w90"></div>
						<div class="sk-line w50"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if courses.length === 0}
		<div class="empty">
			<b>No courses yet</b>
			<span>Courses will appear here once they are published.</span>
		</div>
	{:else}
		<div class="course-grid">
			{#each courses as course (course.id)}
				<a class="course-card" href={`/courses/${course.id}`}>
					<div class="thumb">
						{#if course.thumbnailUrl}
							<img src={mediaUrl(course.thumbnailUrl)} alt={course.title ?? 'Course'} loading="lazy" />
						{:else}
							<div class="thumb-ph"></div>
						{/if}
						{#if course.price}
							<span class="price">
								{course.currency === 'lkr' ? 'LKR ' : '$'}{course.price}
							</span>
						{:else}
							<span class="price free">Free</span>
						{/if}
					</div>
					<div class="card-body">
						<h3>{course.title ?? 'Untitled course'}</h3>
						<p class="summary">{course.summary ?? ''}</p>
						<div class="meta">
							<span>{course.instructorName ?? 'Instructor'}</span>
							<span class="dot">•</span>
							<span>{course.level ?? 'All levels'}</span>
						</div>
						<div class="meta sub">
							{#if course.rating}
								<span>★ {course.rating}{course.ratingsCount ? ` (${course.ratingsCount})` : ''}</span>
							{/if}
							{#if course.studentsCount}
								<span>{course.studentsCount} students</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
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
	.course-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
		gap: 1.4rem;
	}
	.course-card {
		display: flex;
		flex-direction: column;
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 14px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.course-card:hover {
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
	.thumb-ph {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #e9ecf5, #f6f7fb);
	}
	.price {
		position: absolute;
		right: 10px;
		bottom: 10px;
		background: #161a2b;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 9px;
		border-radius: 999px;
	}
	.price.free {
		background: #1f9d55;
	}
	.card-body {
		padding: 14px 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card-body h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.02rem;
		margin: 0;
	}
	.summary {
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
	.meta.sub {
		color: #8a90a0;
	}
	.dot {
		color: #c4c8d4;
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

	/* Filter bar */
	.filters {
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-bottom: 2rem;
		align-items: center;
	}
	.filters .search {
		flex: 1;
		min-width: 200px;
		font: inherit;
		padding: 0.65rem 0.9rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 10px;
	}
	.filters select {
		font: inherit;
		padding: 0.65rem 0.9rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 10px;
		background: #fff;
		color: #161a2b;
	}
	.filters input:focus, .filters select:focus {
		outline: none;
		border-color: #4f46e5;
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
	}
	.btn {
		display: inline-block;
		text-align: center;
		padding: 0.65rem 1.1rem;
		border-radius: 10px;
		font-weight: 600;
		border: 1.5px solid transparent;
		cursor: pointer;
		font-size: 0.88rem;
	}
	.btn.solid { background: #161a2b; color: #fff; }
	.btn.solid:hover { background: #232a44; }
	.btn.ghost { background: #f5f6fb; color: #161a2b; border-color: #e7e8f2; }
	.btn.ghost:hover { background: #eceef5; }

	/* Skeleton */
	.skeleton-card {
		padding: 0;
	}
	.sk-thumb {
		height: 150px;
		background: linear-gradient(90deg, #eef0f7 25%, #f6f7fb 37%, #eef0f7 63%);
		background-size: 400% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}
	.sk-body {
		padding: 14px 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.sk-line {
		height: 12px;
		border-radius: 6px;
		background: linear-gradient(90deg, #eef0f7 25%, #f6f7fb 37%, #eef0f7 63%);
		background-size: 400% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}
	.w70 { width: 70%; }
	.w90 { width: 90%; }
	.w50 { width: 50%; }
	.skeleton-card * {
		pointer-events: none;
	}
	@keyframes shimmer {
		0% { background-position: 100% 0; }
		100% { background-position: 0 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.sk-thumb, .sk-line { animation: none; }
	}
</style>
