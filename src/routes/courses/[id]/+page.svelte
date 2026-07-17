<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let course = $derived(data?.course ?? {});
	let enrollment = $derived(data?.enrollment ?? null);
	let enrolling = $state(false);
	let enrollError = $derived(form?.success === false ? form.message : null);
	let loggedIn = $derived(!!data?.user);

	let reviews = $derived(data?.reviews ?? { summary: { count: 0, average: 0 }, items: [] });
	let forum = $derived(data?.forum ?? []);

	let newReview = $state({ rating: 5, title: '', body: '' });
	let reviewMsg = $state('');

	let newThread = $state({ title: '', body: '' });
	let threadMsg = $state('');
	let replyText = $state({});

	async function submitReview() {
		reviewMsg = '';
		try {
			const res = await fetch(`${COURSE_API || 'http://localhost:8082'}/req/courses/${course.id}/reviews`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
				body: JSON.stringify(newReview)
			});
			if (res.ok) { newReview = { rating: 5, title: '', body: '' }; reviewMsg = 'Thanks for your review!'; location.reload(); }
			else reviewMsg = 'Could not submit review.';
		} catch { reviewMsg = 'Could not submit review.'; }
	}

	async function submitThread() {
		threadMsg = '';
		try {
			const res = await fetch(`${COURSE_API || 'http://localhost:8082'}/req/courses/${course.id}/forum`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
				body: JSON.stringify(newThread)
			});
			if (res.ok) { newThread = { title: '', body: '' }; threadMsg = 'Posted!'; location.reload(); }
			else threadMsg = 'Could not post.';
		} catch { threadMsg = 'Could not post.'; }
	}

	async function submitReply(threadId) {
		try {
			await fetch(`${COURSE_API || 'http://localhost:8082'}/req/forum/${threadId}/posts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
				body: JSON.stringify({ body: replyText[threadId] || '' })
			});
			replyText[threadId] = '';
			location.reload();
		} catch {}
	}

	function getToken() {
		return document.cookie.replace(/(?:(?:^|.*;\s*)session_token\s*\=\s*((?:[^;](?!;))*[^;]?)?);.*$/, '$1');
	}
	const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';

	let isEnrolled = $derived(
		enrollment != null &&
			(enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED' || enrollment.status == null)
	);
	let isPending = $derived(enrollment?.status === 'PENDING');

	/** @param {{ result: any, update: any }} ev */
	function handleEnroll(ev) {
		const { result, update } = ev;
		enrolling = false;
		const checkoutUrl = result?.data?.url || result?.data?.checkoutUrl;
		if (result.type === 'redirect') {
			window.location.href = result.location;
			return;
		}
		if (result.type === 'success' && checkoutUrl) {
			window.location.href = checkoutUrl;
			return;
		}
		update();
	}

	/** Set loading state on submit. */
	function onEnrollSubmit() {
		enrolling = true;
		return async ({ result, update }) => {
			enrolling = false;
			const checkoutUrl = result?.data?.url || result?.data?.checkoutUrl;
			if (result.type === 'redirect') {
				window.location.href = result.location;
				return;
			}
			if (result.type === 'success' && checkoutUrl) {
				window.location.href = checkoutUrl;
				return;
			}
			update();
		};
	}
</script>

<svelte:head>
	<title>{course.title ?? 'Course'} · CourseConnect</title>
</svelte:head>

<div class="page">
	<a class="back" href="/courses">← Back to courses</a>

	<div class="layout">
		<main class="content">
			<header class="hero">
				<h1>{course.title ?? 'Untitled course'}</h1>
				<p class="summary">{course.summary ?? ''}</p>
				<div class="meta">
					<span>{course.instructorName ?? 'Instructor'}</span>
					<span class="dot">•</span>
					<span>{course.level ?? 'All levels'}</span>
					{#if course.category}
						<span class="dot">•</span>
						<span>{course.category}</span>
					{/if}
				</div>
			</header>

			{#if course.description}
				<section class="block">
					<h2>About this course</h2>
					<p>{course.description}</p>
				</section>
			{/if}

			{#if course.learn?.length}
				<section class="block">
					<h2>What you'll learn</h2>
					<ul class="learn">
						{#each course.learn as item}
							<li>{item}</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if course.sections?.length}
				<section class="block">
					<h2>Curriculum</h2>
					{#each course.sections as section, i}
						<div class="section">
							<div class="section-title">{i + 1}. {section.title}</div>
							{#if section.lessons?.length}
								<ul class="lessons">
									{#each section.lessons as lesson}
										<li>{lesson.title}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/each}
				</section>
			{/if}
		</main>

		<aside class="sidebar">
			<div class="card">
				{#if course.thumbnailUrl}
					<img class="cover" src={course.thumbnailUrl} alt={course.title ?? 'Course'} />
				{:else}
					<div class="cover ph"></div>
				{/if}

				<div class="price-row">
					{#if course.price}
						<span class="price">{course.currency === 'lkr' ? 'LKR ' : '$'}{course.price}</span>
					{:else}
						<span class="price free">Free</span>
					{/if}
				</div>

				<div class="stats">
					{#if reviews.summary.average}<span>★ {reviews.summary.average}{reviews.summary.count ? ` (${reviews.summary.count})` : ''}</span>{/if}
					{#if course.studentsCount}<span>{course.studentsCount} students</span>{/if}
					{#if course.durationMinutes}<span>{Math.round(course.durationMinutes / 60)}h {course.durationMinutes % 60}m</span>{/if}
				</div>

				{#if isEnrolled}
					<a class="btn solid" href={`/courses/${course.id}/learn`}>Go to course</a>
				{:else if isPending}
					<p class="pending">Payment pending — finish checkout to activate.</p>
				{:else if loggedIn}
					<form
						method="POST"
						action="?/enroll"
						use:enhance={onEnrollSubmit}
					>
						<button class="btn solid" type="submit" disabled={enrolling}>
							{enrolling ? 'Enrolling…' : course.price ? 'Enroll & pay' : 'Enroll for free'}
						</button>
					</form>
				{:else}
					<a class="btn solid" href={`/signin?redirect=/courses/${course.id}`}>Sign in to enroll</a>
				{/if}

				{#if enrollError}
					<p class="err">{enrollError}</p>
				{/if}

				{#if !data && false}{/if}
			</div>
		</aside>

		<!-- Reviews & ratings -->
		<section class="engage">
			<h2>Reviews</h2>
			{#if loggedIn}
				<form class="review-form" onsubmit={(e) => { e.preventDefault(); submitReview(); }}>
					<div class="stars">
						{#each [5,4,3,2,1] as n}
							<label>
								<input type="radio" name="rating" value={n} bind:group={newReview.rating} />
								{'★'.repeat(n)}
							</label>
						{/each}
					</div>
					<input class="rf-title" placeholder="Title (optional)" bind:value={newReview.title} />
					<textarea class="rf-body" rows="3" placeholder="Share your experience…" bind:value={newReview.body}></textarea>
					<button class="btn solid sm" type="submit">Submit review</button>
					{#if reviewMsg}<span class="rf-msg">{reviewMsg}</span>{/if}
				</form>
			{/if}

			{#if reviews.items.length === 0}
				<p class="muted">No reviews yet. Be the first to review this course.</p>
			{:else}
				<ul class="review-list">
					{#each reviews.items as r (r.id)}
						<li class="review">
							<div class="r-head"><b>{r.studentName}</b><span class="r-stars">{'★'.repeat(r.rating)}</span></div>
							{#if r.title}<div class="r-title">{r.title}</div>{/if}
							{#if r.body}<p class="r-body">{r.body}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<!-- Discussion forum / Q&A -->
		<section class="engage">
			<h2>Discussion & Q&A</h2>
			{#if loggedIn}
				<form class="thread-form" onsubmit={(e) => { e.preventDefault(); submitThread(); }}>
					<input class="tf-title" placeholder="Ask a question or start a topic" bind:value={newThread.title} />
					<textarea class="tf-body" rows="2" placeholder="Details…" bind:value={newThread.body}></textarea>
					<button class="btn solid sm" type="submit">Post</button>
					{#if threadMsg}<span class="rf-msg">{threadMsg}</span>{/if}
				</form>
			{/if}

			{#if forum.length === 0}
				<p class="muted">No discussions yet. Start the conversation.</p>
			{:else}
				<ul class="thread-list">
					{#each forum as t (t.id)}
						<li class="thread">
							<div class="t-head"><b>{t.title}</b><span class="t-author">{t.authorName}</span></div>
							{#if t.body}<p class="t-body">{t.body}</p>{/if}
							{#if t.posts?.length}
								<ul class="post-list">
									{#each t.posts as p (p.id)}
										<li class="post" class:inst={p.isInstructor}>
											<b>{p.authorName}</b>{#if p.isInstructor}<span class="inst-tag">Instructor</span>{/if}: {p.body}
										</li>
									{/each}
								</ul>
							{/if}
							{#if loggedIn}
								<div class="reply">
									<input placeholder="Reply…" bind:value={replyText[t.id]} />
									<button class="btn ghost sm" type="button" onclick={() => submitReply(t.id)}>Reply</button>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.back {
		display: inline-block;
		margin-bottom: 1.2rem;
		color: #5b6072;
		text-decoration: none;
		font-size: 0.9rem;
	}
	.back:hover { color: #161a2b; }
	.layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 2rem;
		align-items: start;
	}
	.hero h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 2rem;
		margin: 0 0 0.5rem;
	}
	.summary {
		color: #5b6072;
		font-size: 1.02rem;
		margin: 0 0 0.8rem;
	}
	.meta {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		color: #6b7180;
		font-size: 0.88rem;
	}
	.dot { color: #c4c8d4; }
	.block {
		margin-top: 2rem;
	}
	.block h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.25rem;
		margin: 0 0 0.7rem;
	}
	.learn, .lessons {
		margin: 0;
		padding-left: 1.1rem;
		color: #3a3f52;
		line-height: 1.7;
	}
	.section {
		padding: 0.7rem 0;
		border-bottom: 1px solid #eef0f5;
	}
	.section-title {
		font-weight: 600;
	}
	.lessons {
		margin-top: 0.4rem;
		color: #5b6072;
	}
	.sidebar {
		position: sticky;
		top: 1.5rem;
	}
	.card {
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 16px;
		padding: 1rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.06);
	}
	.cover {
		width: 100%;
		height: 160px;
		object-fit: cover;
		border-radius: 10px;
		background: #eef0f7;
	}
	.cover.ph {
		background: linear-gradient(135deg, #e9ecf5, #f6f7fb);
	}
	.price-row {
		margin: 0.9rem 0 0.4rem;
	}
	.price {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
	}
	.price.free {
		color: #1f9d55;
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		color: #6b7180;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}
	.btn {
		display: block;
		width: 100%;
		text-align: center;
		padding: 0.8rem 1rem;
		border-radius: 10px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		text-decoration: none;
	}
	.btn.solid {
		background: #161a2b;
		color: #fff;
	}
	.btn.solid:hover { background: #232a44; }
	.btn:disabled { opacity: 0.6; cursor: default; }
	.pending {
		color: #a06a00;
		background: #fff6e0;
		padding: 0.7rem;
		border-radius: 10px;
		font-size: 0.88rem;
		text-align: center;
	}
	.err {
		color: #c0392b;
		font-size: 0.85rem;
		margin: 0.6rem 0 0;
	}
	.engage {
		margin-top: 2.4rem;
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 16px;
		padding: 1.4rem 1.5rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.05);
	}
	.engage h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.25rem;
		margin: 0 0 1rem;
	}
	.muted { color: #8a90a0; font-size: 0.88rem; margin: 0.4rem 0; }
	.review-form, .thread-form { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.2rem; }
	.stars { display: flex; gap: 0.5rem; }
	.stars label { cursor: pointer; color: #f0a500; font-size: 1.1rem; }
	.rf-title, .tf-title, .reply input, .rf-body, .tf-body {
		font: inherit; padding: 0.6rem 0.8rem; border: 1.5px solid #e0e2ec; border-radius: 10px; width: 100%;
	}
	.rf-body, .tf-body { resize: vertical; }
	.btn.solid.sm, .btn.ghost.sm { padding: 0.45rem 0.9rem; font-size: 0.85rem; width: fit-content; }
	.rf-msg { color: #1f9d55; font-size: 0.85rem; }
	.review-list, .thread-list { list-style: none; margin: 0; padding: 0; }
	.review { padding: 0.8rem 0; border-top: 1px solid #f1f2f7; }
	.review:first-child { border-top: none; }
	.r-head { display: flex; gap: 0.6rem; align-items: center; }
	.r-stars { color: #f0a500; font-size: 0.9rem; }
	.r-title { font-weight: 600; margin-top: 0.2rem; }
	.r-body { margin: 0.3rem 0 0; color: #5b6072; font-size: 0.9rem; line-height: 1.5; }
	.thread { padding: 0.9rem 0; border-top: 1px solid #f1f2f7; }
	.thread:first-child { border-top: none; }
	.t-head { display: flex; gap: 0.6rem; align-items: baseline; }
	.t-author { font-size: 0.8rem; color: #8a90a0; }
	.t-body { margin: 0.3rem 0 0; color: #5b6072; font-size: 0.9rem; line-height: 1.5; }
	.post-list { list-style: none; margin: 0.6rem 0 0 1rem; padding: 0; }
	.post { padding: 0.4rem 0; font-size: 0.88rem; color: #3a3f52; }
	.post.inst { background: #f3f1ff; border-radius: 8px; padding: 0.5rem 0.7rem; }
	.inst-tag { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; color: #4338ca; background: #e0e0ff; padding: 1px 6px; border-radius: 999px; margin-left: 6px; }
	.reply { display: flex; gap: 0.5rem; margin-top: 0.6rem; }
	@media (max-width: 820px) {
		.layout { grid-template-columns: 1fr; }
		.sidebar { position: static; }
	}
</style>
