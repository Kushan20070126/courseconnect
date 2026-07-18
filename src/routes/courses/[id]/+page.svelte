<script>
	import { enhance } from '$app/forms';
	import { courseApi, mediaUrl } from '$lib/api.js';

	let { data, form } = $props();

	let course = $derived(data?.course ?? {});
	let enrollment = $derived(data?.enrollment ?? null);
	let enrolling = $state(false);
	let enrollError = $derived(form?.success === false ? form.message : null);
	let loggedIn = $derived(!!data?.user);

	let reviews = $derived(data?.reviews ?? { summary: { count: 0, average: 0 }, items: [] });
	let forum = $derived(data?.forum ?? []);

	let totalLessons = $derived(
		(course.sections ?? []).reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0)
	);

		let newReview = $state({ rating: 5, title: '', body: '' });
		let reviewMsg = $state('');

		let newThread = $state({ title: '', body: '' });
		let threadMsg = $state('');
		let replyText = $state({});
		let replyMsg = $state({});

		function onReviewSubmit() {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					newReview = { rating: 5, title: '', body: '' };
					reviewMsg = 'Thanks for your review!';
					location.reload();
				} else if (result.type === 'failure') {
					reviewMsg = result.data?.message || 'Could not submit review.';
				}
				await update();
			};
		}

		function onCreateThread() {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					newThread = { title: '', body: '' };
					threadMsg = 'Posted!';
					location.reload();
				} else if (result.type === 'failure') {
					threadMsg = result.data?.message || 'Could not post.';
				}
				await update();
			};
		}

		function replyEnhance() {
			return async ({ result, update }) => {
				const form = document.activeElement?.closest('form');
				const threadId = form?.querySelector('input[name="threadId"]')?.value;
				replyMsg[threadId] = '';
				if (result.type === 'success') {
					if (threadId) replyText[threadId] = '';
					location.reload();
				} else if (result.type === 'failure') {
					if (threadId) replyMsg[threadId] = result.data?.message || 'Could not post reply.';
				}
				await update();
			};
		}

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

	<header class="hero">
		<div class="hero-main">
			<div class="crumbs">{course.category || 'Course'}{course.level ? ` · ${course.level}` : ''}</div>
			<h1>{course.title ?? 'Untitled course'}</h1>
			<p class="summary">{course.summary ?? ''}</p>
			<div class="meta">
				{#if reviews.summary.average}<span class="stars">★ {reviews.summary.average}{reviews.summary.count ? ` (${reviews.summary.count})` : ''}</span>{/if}
				{#if course.studentsCount}<span>{course.studentsCount} students</span>{/if}
				{#if course.durationMinutes}<span>{Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m</span>{/if}
				<span>By {course.instructorName ?? 'Instructor'}</span>
			</div>
		</div>
		<div class="hero-card">
			{#if course.thumbnailUrl}
				<img class="cover" src={mediaUrl(course.thumbnailUrl)} alt={course.title ?? 'Course'} />
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
			{#if isEnrolled}
				<a class="btn solid" href={`/courses/${course.id}/learn`}>Go to course</a>
			{:else if isPending}
				<p class="pending">Payment pending — finish checkout to activate.</p>
			{:else if loggedIn}
				<form method="POST" action="?/enroll" use:enhance={onEnrollSubmit}>
					<button class="btn solid" type="submit" disabled={enrolling}>
						{enrolling ? 'Enrolling…' : course.price ? 'Enroll & pay' : 'Enroll for free'}
					</button>
				</form>
			{:else}
				<a class="btn solid" href={`/signin?redirect=/courses/${course.id}`}>Sign in to enroll</a>
			{/if}
			{#if enrollError}<p class="err">{enrollError}</p>{/if}
			<div class="includes">
				<div class="inc"><span>🎬</span> On-demand video</div>
				<div class="inc"><span>📚</span> Course materials</div>
				<div class="inc"><span>♾️</span> Full lifetime access</div>
			</div>
		</div>
	</header>

	<div class="layout">
		<main class="content">
			{#if course.description}
				<section class="block">
					<h2>About this course</h2>
					<p class="desc">{course.description}</p>
				</section>
			{/if}

			{#if course.learn?.length}
				<section class="block">
					<h2>What you'll learn</h2>
					<div class="learn-grid">
						{#each course.learn as item}
							<div class="learn-item">✓ {item}</div>
						{/each}
					</div>
				</section>
			{/if}

			{#if course.sections?.length}
				<section class="block">
					<div class="cur-head">
						<h2>Curriculum</h2>
						<span class="cur-meta">{course.sections.length} sections · {totalLessons} lessons</span>
					</div>
					<div class="cur-list">
						{#each course.sections as section, i}
							<details class="sec" open={i === 0}>
								<summary>
									<span class="sec-num">{i + 1}</span>
									<span class="sec-title">{section.title}</span>
									<span class="sec-count">{section.lessons?.length ?? 0} lessons</span>
								</summary>
								<ul class="lessons">
									{#each section.lessons ?? [] as lesson}
										<li>
											<span class="play">▶</span>
											<span class="ls-title">{lesson.title}</span>
											{#if lesson.preview}<span class="tag preview">Preview</span>{/if}
											{#if lesson.durationMinutes}<span class="dur">{lesson.durationMinutes} min</span>{/if}
										</li>
									{/each}
								</ul>
							</details>
						{/each}
					</div>
				</section>
			{/if}

		<!-- Reviews & ratings -->
		<section class="engage">
			<h2>Reviews</h2>
			{#if loggedIn}
				<form class="review-form" method="POST" action="?/submitReview" use:enhance={onReviewSubmit}>
					<div class="stars">
						{#each [5,4,3,2,1] as n}
							<label>
								<input type="radio" name="rating" value={n} bind:group={newReview.rating} />
								{'★'.repeat(n)}
							</label>
						{/each}
					</div>
					<input class="rf-title" placeholder="Title (optional)" name="title" bind:value={newReview.title} />
					<textarea class="rf-body" rows="3" placeholder="Share your experience…" name="body" bind:value={newReview.body}></textarea>
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
				<form class="thread-form" method="POST" action="?/createThread" use:enhance={onCreateThread}>
					<input class="tf-title" placeholder="Ask a question or start a topic" name="title" bind:value={newThread.title} />
					<textarea class="tf-body" rows="2" placeholder="Details…" name="body" bind:value={newThread.body}></textarea>
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
								<form class="reply" method="POST" action="?/submitReply" use:enhance={replyEnhance}>
									<input type="hidden" name="threadId" value={t.id} />
									<input placeholder="Reply…" name="body" bind:value={replyText[t.id]} />
									<button class="btn ghost sm" type="submit">Reply</button>
								</form>
								{#if replyMsg[t.id]}
									<div class="reply-err">{replyMsg[t.id]}</div>
								{/if}
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
		</main>
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

	/* Hero */
	.hero {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 2rem;
		align-items: start;
		padding: 2rem;
		background: #1d2030;
		background: linear-gradient(135deg, #20243a, #2c2150);
		border-radius: 18px;
		color: #fff;
	}
	.hero-main { min-width: 0; }
	.crumbs { font-size: 0.8rem; color: #c8cbe0; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.6rem; }
	.hero h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 2.1rem;
		line-height: 1.15;
		margin: 0 0 0.7rem;
	}
	.summary { color: #d7d9ea; font-size: 1.02rem; margin: 0 0 1rem; }
	.meta { display: flex; gap: 10px; flex-wrap: wrap; color: #c8cbe0; font-size: 0.88rem; }
	.meta .stars { color: #ffc107; font-weight: 600; }
	.hero-card {
		background: #fff;
		border-radius: 14px;
		padding: 0.9rem;
		color: #161a2b;
		box-shadow: 0 18px 40px rgba(0,0,0,0.25);
		position: sticky;
		top: 1.5rem;
	}
	.cover { width: 100%; height: 180px; object-fit: cover; border-radius: 10px; background: #eef0f7; display: block; }
	.cover.ph { background: linear-gradient(135deg, #e9ecf5, #f6f7fb); }
	.price-row { margin: 0.9rem 0 0.4rem; }
	.price { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 700; }
	.price.free { color: #1f9d55; }
	.includes { margin-top: 1rem; border-top: 1px solid #f0f1f6; padding-top: 0.8rem; display: flex; flex-direction: column; gap: 0.45rem; }
	.inc { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #3a3f52; }

	/* Layout */
	.layout { margin-top: 2rem; }
	.block { margin-top: 2rem; }
	.block h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; margin: 0 0 0.9rem; }
	.desc { color: #3a3f52; line-height: 1.7; white-space: pre-wrap; }

	/* What you'll learn */
	.learn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 1.4rem; }
	.learn-item { display: flex; gap: 8px; color: #3a3f52; font-size: 0.92rem; line-height: 1.5; }
	.learn-item::before { content: '✓'; color: #1f9d55; font-weight: 700; }

	/* Curriculum */
	.cur-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.cur-meta { color: #8a90a0; font-size: 0.85rem; }
	.cur-list { margin-top: 1rem; border: 1px solid #ecedf3; border-radius: 14px; overflow: hidden; }
	.sec { border-top: 1px solid #eef0f5; }
	.sec:first-child { border-top: none; }
	.sec > summary {
		display: flex; align-items: center; gap: 10px;
		padding: 0.9rem 1.1rem; cursor: pointer; list-style: none;
		background: #fafbff; font-weight: 600;
	}
	.sec > summary::-webkit-details-marker { display: none; }
	.sec-num {
		width: 24px; height: 24px; border-radius: 6px; background: #161a2b; color: #fff;
		display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; flex-shrink: 0;
	}
	.sec-title { flex: 1; }
	.sec-count { font-size: 0.8rem; color: #8a90a0; font-weight: 500; }
	.lessons { list-style: none; margin: 0; padding: 0; }
	.lessons li { display: flex; align-items: center; gap: 10px; padding: 0.7rem 1.1rem 0.7rem 3rem; border-top: 1px solid #f4f5fa; font-size: 0.9rem; }
	.lessons li .play { color: #4f46e5; font-size: 0.7rem; }
	.ls-title { flex: 1; color: #3a3f52; }
	.tag { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 999px; }
	.tag.preview { background: #eef2ff; color: #4338ca; }
	.dur { font-size: 0.78rem; color: #8a90a0; }

	.btn {
		display: block;
		width: 100%;
		box-sizing: border-box;
		text-align: center;
		padding: 0.8rem 1rem;
		border-radius: 10px;
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.2;
		border: none;
		cursor: pointer;
		text-decoration: none;
		appearance: none;
		-webkit-appearance: none;
	}
	.btn.solid { background: #4f46e5; color: #fff; }
	.btn.solid:hover { background: #4338ca; }
	.btn:disabled { opacity: 0.6; cursor: default; }
	.pending { color: #a06a00; background: #fff6e0; padding: 0.7rem; border-radius: 10px; font-size: 0.88rem; text-align: center; }
	.err { color: #c0392b; font-size: 0.85rem; margin: 0.6rem 0 0; }

	.engage {
		margin-top: 2.4rem;
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 16px;
		padding: 1.4rem 1.5rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.05);
	}
	.engage h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; margin: 0 0 1rem; }
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
	.reply-err { color: #c0392b; font-size: 0.82rem; margin-top: 0.3rem; }
	@media (max-width: 860px) {
		.hero { grid-template-columns: 1fr; }
		.hero-card { position: static; }
		.learn-grid { grid-template-columns: 1fr; }
	}
</style>
