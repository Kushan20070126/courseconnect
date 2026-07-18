<script>
	import { enhance } from '$app/forms';
	import { mediaUrl } from '$lib/api.js';

	let { data, form } = $props();

	let learn = $derived(data?.learn ?? {});
	let course = $derived(data?.course ?? {});
	let sections = $derived(learn?.sections ?? []);

	let progress = $derived(learn?.progressPercent ?? 0);
	let completed = $derived(learn?.completed === true);

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

	let selectedLesson = $state(null);
	let selectedSection = $state(null);

	$effect(() => {
		if (sections.length === 0) return;
		let found = false;
		for (const s of sections) {
			for (const l of s.lessons ?? []) {
				if (!doneMap[l.id] && l.videoUrl) {
					selectedLesson = l;
					selectedSection = s;
					found = true;
					break;
				}
			}
			if (found) break;
		}
		if (!found) {
			for (const s of sections) {
				for (const l of s.lessons ?? []) {
					if (!doneMap[l.id]) {
						selectedLesson = l;
						selectedSection = s;
						found = true;
						break;
					}
				}
				if (found) break;
			}
		}
		if (!found) {
			const lastSec = sections[sections.length - 1];
			const lastLes = lastSec?.lessons?.[lastSec.lessons.length - 1];
			selectedLesson = lastLes ?? null;
			selectedSection = lastSec ?? null;
		}
	});

	let totalLessons = $derived(
		sections.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0)
	);
	let doneCount = $derived(Object.values(doneMap).filter(Boolean).length);

	function selectLesson(lesson, section) {
		selectedLesson = lesson;
		selectedSection = section;
	}

	function onComplete(lessonId) {
		return async ({ result, update }) => {
			if (result.type === 'success') {
				doneMap[lessonId] = true;
				if (result.data?.progressPercent != null) {
					progress = result.data.progressPercent;
				}
				if (result.data?.completed) {
					completed = true;
				}
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
		<div class="layout">
			<div class="main">
				{#if selectedLesson}
					<div class="player-wrap">
						{#if selectedLesson.videoUrl}
						<video
							class="player"
							src={mediaUrl(selectedLesson.videoUrl)}
							controls
							playsinline
						>
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
						{:else}
							<div class="player ph">
								<span>No video available for this lesson</span>
							</div>
						{/if}
					</div>

					<div class="lesson-detail">
						<div class="ld-head">
							<h2 class="ld-title">{selectedLesson.title}</h2>
							<div class="ld-meta">
								{#if selectedLesson.preview}
									<span class="tag preview">Preview</span>
								{/if}
								{#if doneMap[selectedLesson.id]}
									<span class="tag ok">Done</span>
								{/if}
								<span class="dur">{selectedLesson.durationMinutes ?? 0} min</span>
							</div>
						</div>

						{#if selectedLesson.description}
							<p class="ld-desc">{selectedLesson.description}</p>
						{/if}

						{#if selectedLesson.materials && selectedLesson.materials.length}
							<div class="ld-materials">
								<div class="ld-section-title">📎 Materials</div>
								<ul>
									{#each selectedLesson.materials as mat (mat.id)}
										<li>
											<a href={mediaUrl(mat.url)} target="_blank" rel="noreferrer" class="mat-link">
												{mat.title || mat.fileName || 'Material'}
											</a>
											{#if mat.sizeBytes}
												<span class="mat-size">({Math.round(mat.sizeBytes / 1024)} KB)</span>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if selectedLesson.notes && selectedLesson.notes.length}
							<div class="ld-notes">
								<div class="ld-section-title">📝 Lecture notes</div>
								{#each selectedLesson.notes as n (n.id)}
									<div class="note">
										{#if n.title}<div class="note-title">{n.title}</div>{/if}
										<p class="note-body">{n.body}</p>
									</div>
								{/each}
							</div>
						{/if}

						<div class="ld-actions">
							<form method="POST" action="?/complete" use:enhance={onComplete(selectedLesson.id)}>
								<input type="hidden" name="lessonId" value={selectedLesson.id} />
								<button
									class="btn complete"
									class:on={doneMap[selectedLesson.id]}
									type="submit"
								>
									{doneMap[selectedLesson.id] ? '✓ Completed' : 'Mark as complete'}
								</button>
							</form>
						</div>
					</div>
				{/if}
			</div>

			<aside class="sidebar">
				<h3 class="sb-title">Course content</h3>
				<div class="sb-list">
					{#each sections as section, si (section.id)}
						<div class="sb-section">
							<div class="sb-sec-title">
								<span class="sb-sec-num">{si + 1}</span>
								{section.title}
							</div>
							<ul class="sb-lessons">
								{#each section.lessons ?? [] as lesson (lesson.id)}
									<li>
										<button
											class="sb-lesson"
											class:active={selectedLesson?.id === lesson.id}
											class:done={doneMap[lesson.id]}
											onclick={() => selectLesson(lesson, section)}
											onkeydown={(e) => e.key === 'Enter' && selectLesson(lesson, section)}
										>
											<span class="sb-play">{doneMap[lesson.id] ? '✓' : '▶'}</span>
											<span class="sb-ltitle">{lesson.title}</span>
											{#if lesson.preview}
												<span class="tag preview">Preview</span>
											{/if}
											<span class="sb-dur">{lesson.durationMinutes ?? 0} min</span>
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</aside>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 4rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.back {
		display: inline-block;
		margin-bottom: 0.8rem;
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
		font-size: 1.6rem;
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
		margin-top: 0.8rem;
		display: flex;
		align-items: center;
		gap: 12px;
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

	.layout {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 1.5rem;
		margin-top: 1.4rem;
		align-items: start;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.player-wrap {
		background: #000;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 12px 32px rgba(20, 26, 43, 0.15);
	}
	.player {
		width: 100%;
		display: block;
		max-height: 70vh;
		background: #000;
	}
	.player.ph {
		aspect-ratio: 16 / 9;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #c8cbe0;
		font-size: 1rem;
	}

	.lesson-detail {
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 14px;
		padding: 1.2rem 1.4rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.05);
	}
	.ld-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.ld-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.15rem;
		margin: 0;
		flex: 1;
	}
	.ld-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
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
	.dur {
		font-size: 0.8rem;
		color: #8a90a0;
	}
	.ld-desc {
		margin: 0.8rem 0 0;
		color: #3a3f52;
		font-size: 0.95rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.ld-section-title {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7180;
		margin-bottom: 0.5rem;
	}
	.ld-materials {
		margin-top: 1rem;
		padding: 0.8rem 1rem;
		background: #f8f9fc;
		border: 1px solid #eef0f5;
		border-radius: 10px;
	}
	.ld-materials ul { list-style: none; margin: 0; padding: 0; }
	.ld-materials li { padding: 4px 0; }
	.mat-link { color: #4f46e5; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
	.mat-link:hover { text-decoration: underline; }
	.mat-size { font-size: 0.78rem; color: #9aa0b4; margin-left: 4px; }

	.ld-notes {
		margin-top: 1rem;
		padding: 0.8rem 1rem;
		background: #fffdf5;
		border: 1px solid #f3ecd6;
		border-radius: 10px;
	}
	.note { margin-bottom: 0.6rem; }
	.note:last-child { margin-bottom: 0; }
	.note-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 2px; }
	.note-body { margin: 0; color: #5b6072; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; }

	.ld-actions {
		margin-top: 1rem;
	}
	.btn {
		display: inline-block;
		text-align: center;
		padding: 0.55rem 1.1rem;
		border-radius: 9px;
		font-weight: 600;
		font-size: 0.9rem;
		border: 1.5px solid transparent;
		cursor: pointer;
		text-decoration: none;
		appearance: none;
		-webkit-appearance: none;
	}
	.btn.complete {
		background: #4f46e5;
		color: #fff;
		border-color: #4f46e5;
	}
	.btn.complete:hover {
		background: #4338ca;
		border-color: #4338ca;
	}
	.btn.complete.on {
		background: #eafaf0;
		color: #1f9d55;
		border-color: #1f9d55;
	}
	.btn.complete.on:hover {
		background: #d0f0de;
	}

	/* Sidebar */
	.sidebar {
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 14px;
		padding: 1rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.05);
		max-height: calc(100vh - 120px);
		overflow-y: auto;
		position: sticky;
		top: 1.5rem;
	}
	.sb-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1rem;
		margin: 0 0 0.8rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid #f1f2f7;
	}
	.sb-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.sb-section {
		border: 1px solid #eef0f5;
		border-radius: 10px;
		overflow: hidden;
	}
	.sb-sec-title {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0.6rem 0.8rem;
		background: #fafbff;
		font-weight: 600;
		font-size: 0.85rem;
	}
	.sb-sec-num {
		width: 20px;
		height: 20px;
		border-radius: 5px;
		background: #161a2b;
		color: #fff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		flex-shrink: 0;
	}
	.sb-lessons {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.sb-lesson {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 0.55rem 0.8rem;
		border-top: 1px solid #f4f5fa;
		background: transparent;
		font-size: 0.85rem;
		color: #3a3f52;
		transition: background 0.15s ease;
		cursor: pointer;
		border: none;
		text-align: left;
		font-family: inherit;
	}
	.sb-lesson:hover {
		background: #f5f6fb;
	}
	.sb-lesson.active {
		background: #eef2ff;
		color: #4338ca;
	}
	.sb-lesson.done {
		color: #1f9d55;
	}
	.sb-play {
		font-size: 0.65rem;
		width: 18px;
		text-align: center;
		flex-shrink: 0;
	}
	.sb-ltitle {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sb-dur {
		font-size: 0.75rem;
		color: #8a90a0;
		flex-shrink: 0;
	}

	@media (max-width: 860px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.sidebar {
			position: static;
			max-height: none;
		}
		.player {
			max-height: 50vh;
		}
	}
</style>
