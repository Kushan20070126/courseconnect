<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let learn = $derived(data?.learn ?? {});
	let course = $derived(data?.course ?? {});
	let sections = $derived(learn?.sections ?? []);

	let progress = $derived(learn?.progressPercent ?? 0);
	let completed = $derived(learn?.completed === true);

	// Local optimistic completion state, keyed by lesson id.
	let doneMap = $state({});

	$effect(() => {
		const m = {};
		for (const s of sections) {
			for (const l of s.lessons ?? []) {
				m[l.id] = l.completed === true;
			}
		}
		doneMap = m;
	});

	let totalLessons = $derived(
		sections.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0)
	);
	let doneCount = $derived(Object.values(doneMap).filter(Boolean).length);

	function onComplete(lessonId) {
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.progressPercent != null) {
				progress = result.data.progressPercent;
				if (result.data.completed) completed = true;
			}
			await update();
		};
	}

	function toggle(lessonId) {
		doneMap[lessonId] = !doneMap[lessonId];
	}
</script>

<svelte:head>
	<title>{learn?.title ?? 'Learn'} · CourseConnect</title>
</svelte:head>

<div class="page">
	<header class="head">
		<a class="back" href={`/courses/${data.courseId}`}>← Back to course</a>
		<div class="title-row">
			<h1>{learn?.title ?? course?.title ?? 'Course'}</h1>
			{#if completed}
				<span class="badge done">Completed 🏆</span>
			{/if}
		</div>

		<div class="progress">
			<div class="bar"><div class="fill" style="width:{progress}%"></div></div>
			<span class="pct">{progress}% · {doneCount}/{totalLessons} lessons</span>
		</div>
	</header>

	{#if form?.message}
		<div class="alert err">{form.message}</div>
	{/if}

	{#if sections.length === 0}
		<div class="empty">No lessons available for this course yet.</div>
	{:else}
		<div class="sections">
			{#each sections as section, i (section.id)}
				<section class="card">
					<h2 class="sec-title">{i + 1}. {section.title}</h2>
					<ul class="lessons">
						{#each section.lessons ?? [] as lesson (lesson.id)}
							<li class="lesson" class:done={doneMap[lesson.id]}>
								<div class="l-main">
									<div class="l-head">
										<span class="l-title">{lesson.title}</span>
										{#if lesson.preview}
											<span class="tag preview">Preview</span>
										{/if}
										{#if doneMap[lesson.id]}
											<span class="tag ok">Done</span>
										{/if}
									</div>
									{#if lesson.description}
										<p class="l-desc">{lesson.description}</p>
									{/if}
									<div class="l-actions">
										{#if lesson.videoUrl}
											<a class="btn ghost" href={lesson.videoUrl} target="_blank" rel="noreferrer">
												Watch video
											</a>
										{/if}
										<span class="dur">{lesson.durationMinutes ?? 0} min</span>
									</div>

									{#if lesson.materials && lesson.materials.length}
										<div class="materials">
											<div class="mat-label">Materials</div>
											<ul>
												{#each lesson.materials as mat (mat.id)}
													<li>
														<a href={mat.url} target="_blank" rel="noreferrer" class="mat-link">
															📎 {mat.title || mat.fileName || 'Material'}
														</a>
														{#if mat.sizeBytes}
															<span class="mat-size">({Math.round(mat.sizeBytes / 1024)} KB)</span>
														{/if}
													</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if lesson.notes && lesson.notes.length}
										<div class="notes">
											<div class="notes-label">Lecture notes</div>
											{#each lesson.notes as n (n.id)}
												{#if n.title}<div class="note-title">{n.title}</div>{/if}
												<p class="note-body">{n.body}</p>
											{/each}
										</div>
									{/if}
								</div>

								<div class="check">
									<form method="POST" action="?/complete" use:enhance={onComplete(lesson.id)}>
										<input type="hidden" name="lessonId" value={lesson.id} />
										<button
											class="circle"
											class:on={doneMap[lesson.id]}
											type="submit"
											aria-label={doneMap[lesson.id] ? 'Mark incomplete' : 'Mark complete'}
											title={doneMap[lesson.id] ? 'Mark incomplete' : 'Mark complete'}
											onclick={(e) => {
												// Optimistic toggle; server is the source of truth.
												e.preventDefault();
												toggle(lesson.id);
												e.currentTarget.form.requestSubmit();
											}}
										>
											{#if doneMap[lesson.id]}✓{:else}○{/if}
										</button>
									</form>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 880px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.back {
		display: inline-block;
		margin-bottom: 1rem;
		color: #5b6072;
		text-decoration: none;
		font-size: 0.9rem;
	}
	.back:hover {
		color: #161a2b;
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.head h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.8rem;
		margin: 0;
	}
	.badge.done {
		background: #eafaf0;
		color: #1f9d55;
		font-size: 0.78rem;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 999px;
	}
	.progress {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.bar {
		flex: 1;
		height: 10px;
		background: #eef0f5;
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: linear-gradient(90deg, #4f46e5, #0ea5a0);
		border-radius: 999px;
		transition: width 0.4s ease;
	}
	.pct {
		font-size: 0.82rem;
		color: #6b7180;
		white-space: nowrap;
	}
	.alert.err {
		background: #fdecec;
		color: #c1272d;
		padding: 0.7rem 1rem;
		border-radius: 10px;
		margin-bottom: 1rem;
		font-size: 0.88rem;
	}
	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: #5b6072;
		border: 1.5px dashed #e7e8f2;
		border-radius: 14px;
	}
	.sections {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		margin-top: 1.6rem;
	}
	.card {
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 16px;
		padding: 1.2rem 1.4rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.05);
	}
	.sec-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.15rem;
		margin: 0 0 0.8rem;
	}
	.lessons {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.lesson {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 0.85rem 0;
		border-top: 1px solid #f1f2f7;
	}
	.lesson:first-child {
		border-top: none;
	}
	.l-main {
		flex: 1;
		min-width: 0;
	}
	.l-head {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.l-title {
		font-weight: 600;
	}
	.tag {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: 999px;
	}
	.tag.preview {
		background: #eef2ff;
		color: #4338ca;
	}
	.tag.ok {
		background: #eafaf0;
		color: #1f9d55;
	}
	.l-desc {
		margin: 0.35rem 0 0.5rem;
		color: #5b6072;
		font-size: 0.88rem;
		line-height: 1.5;
	}
	.l-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.dur {
		font-size: 0.8rem;
		color: #8a90a0;
	}
	.materials {
		margin-top: 0.7rem;
		padding: 0.7rem 0.85rem;
		background: #f8f9fc;
		border: 1px solid #eef0f5;
		border-radius: 10px;
	}
	.mat-label, .notes-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7180;
		margin-bottom: 0.4rem;
	}
	.materials ul { list-style: none; margin: 0; padding: 0; }
	.materials li { padding: 3px 0; }
	.mat-link { color: #4f46e5; text-decoration: none; font-size: 0.86rem; font-weight: 500; }
	.mat-link:hover { text-decoration: underline; }
	.mat-size { font-size: 0.74rem; color: #9aa0b4; margin-left: 4px; }
	.notes {
		margin-top: 0.7rem;
		padding: 0.7rem 0.85rem;
		background: #fffdf5;
		border: 1px solid #f3ecd6;
		border-radius: 10px;
	}
	.note-title { font-weight: 600; font-size: 0.86rem; margin-bottom: 2px; }
	.note-body { margin: 0; color: #5b6072; font-size: 0.86rem; line-height: 1.5; white-space: pre-wrap; }
	.btn {
		display: inline-block;
		text-align: center;
		padding: 0.45rem 0.9rem;
		border-radius: 9px;
		font-weight: 600;
		font-size: 0.85rem;
		border: 1.5px solid transparent;
		cursor: pointer;
		text-decoration: none;
	}
	.btn.ghost {
		background: #f5f6fb;
		color: #161a2b;
		border-color: #e7e8f2;
	}
	.btn.ghost:hover {
		background: #eceef5;
	}
	.check {
		flex-shrink: 0;
	}
	.circle {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 2px solid #c7cbd8;
		background: #fff;
		color: #9aa0b4;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.18s ease;
	}
	.circle.on {
		border-color: #1f9d55;
		background: #1f9d55;
		color: #fff;
	}
	@media (max-width: 600px) {
		.head h1 {
			font-size: 1.4rem;
		}
	}
</style>
