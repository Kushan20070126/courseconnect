<script>
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { mediaUrl, courseApi } from '$lib/api.js';

	/**
	 * Reusable course create/edit form.
	 * @type {{
	 *   mode: 'create' | 'edit',
	 *   action: string,
	 *   initial?: any,
	 *   submitLabel?: string
	 * }}
	 */
	let { mode = 'create', action = '?/save', initial = null, submitLabel = 'Save course' } = $props();

	// Snapshot the incoming props exactly once. `initial` is a reactive prop, so
	// we read it inside untrack() to make it explicit that this form intentionally
	// seeds its editable state from the initial value and does NOT re-sync when
	// the prop later changes (which silences `state_referenced_locally`).
	const seed = untrack(() => $state.snapshot(initial)) ?? {};
	const seedSectionsSrc = seed.sections ?? [];

	let title = $state(seed.title ?? '');
	let summary = $state(seed.summary ?? '');
	let description = $state(seed.description ?? '');
	let category = $state(seed.category ?? '');
	let level = $state(seed.level ?? '');
	let language = $state(seed.language ?? 'English');
	let price = $state(seed.price ?? '');
	let instructorName = $state(seed.instructorName ?? '');
	let learnText = $state((seed.learn ?? []).join('\n'));
	let requirementsText = $state((seed.requirements ?? []).join('\n'));
	let thumbnailUrl = $state(mediaUrl(seed.thumbnailUrl) ?? '');

	// Build sections/lessons state from the snapshotted initial data (nested).
	// On edit we also seed existing media (videoUrl, materials, notes) so the
	// lecturer can preview what's already uploaded.
	function seedSections(src) {
		return src.map((s) => ({
			id: s.id,
			title: s.title ?? '',
			lessons: (s.lessons ?? []).map((l) => ({
				id: l.id,
				title: l.title ?? '',
				description: l.description ?? '',
				durationMinutes: l.durationMinutes != null ? String(l.durationMinutes) : '',
				preview: !!l.preview,
				notes:
					typeof l.notes === 'string'
						? l.notes
						: Array.isArray(l.notes)
							? l.notes.map((n) => n.body ?? n.title ?? '').filter(Boolean).join('\n\n')
							: '',
				videoFile: null,
				videoUrl: l.videoUrl ? mediaUrl(l.videoUrl) : '',
				materials: (l.materials ?? []).map((m) => ({
					id: m.id,
					url: mediaUrl(m.url),
					title: m.title || m.fileName || 'Material',
					fileName: m.fileName || '',
					sizeBytes: m.sizeBytes || 0,
					file: null
				}))
			}))
		}));
	}
	let sections = $state(seedSections(seedSectionsSrc));
	let thumbnailFile = $state(null);

	function addSection() {
		sections = [...sections, { title: '', lessons: [] }];
	}
	function removeSection(i) {
		sections = sections.filter((_, idx) => idx !== i);
	}
	function addLesson(i) {
		const next = sections.slice();
		next[i].lessons = [
			...next[i].lessons,
			{ title: '', description: '', durationMinutes: '', preview: false, notes: '', videoFile: null, materials: [] }
		];
		sections = next;
	}
	function removeLesson(i, j) {
		const next = sections.slice();
		next[i].lessons = next[i].lessons.filter((_, idx) => idx !== j);
		sections = next;
	}

	let saving = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

// Post a multipart upload through our same-origin /api/media proxy so the
// session cookie is forwarded (the backend rejects cross-origin fetches).
	async function uploadTo(path, fields) {
		const fd = new FormData();
		for (const [k, v] of Object.entries(fields)) fd.append(k, v);
		const res = await fetch(`/api/media?u=${encodeURIComponent(path)}`, { method: 'POST', body: fd });
		if (!res.ok) {
			const txt = await res.text().catch(() => '');
			throw new Error(`Upload failed (${res.status}): ${txt || path}`);
		}
		return res;
	}

	async function uploadThumbnail(id) {
		if (!thumbnailFile) return;
		const res = await uploadTo(`/req/courses/${id}/thumbnail`, { file: thumbnailFile });
		if (!res.ok) {
			throw new Error('Thumbnail upload failed');
		}
		// The backend populates course.thumbnailUrl with a presigned URL; the
		// local object-URL preview stays in place until the page reloads.
	}

	// Resolve section/lesson ids for the just-saved course.
	// Always fetch fresh course detail to get authoritative IDs, because the
	// backend recreates all sections/lessons on every update (no IDs sent from
	// the form), so previously-cached IDs become stale after save.
	async function resolveSavedSections(courseId) {
		try {
			const res = await fetch(`${courseApi()}/req/courses/${courseId}`, {
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) return null;
			const detail = await res.json();
			const secs = detail?.sections ?? [];
			return secs.map((s) => ({
				id: s.id,
				lessons: (s.lessons ?? []).map((l) => ({ id: l.id }))
			}));
		} catch {
			return null;
		}
	}

	// Upload per-lesson video + materials + notes, matched by returned lesson id.
	async function uploadLessonContent(id, savedSections) {
		if (!savedSections) return;
		for (let i = 0; i < sections.length; i++) {
			const savedSec = savedSections[i];
			if (!savedSec) continue;
			const savedLessons = savedSec.lessons || [];
			for (let j = 0; j < sections[i].lessons.length; j++) {
				const lesson = sections[i].lessons[j];
				const savedLesson = savedLessons[j];
				if (!savedLesson?.id) continue;
				const lessonId = savedLesson.id;

				if (lesson.videoFile) {
					const res = await uploadTo(`/req/lessons/${lessonId}/video`, { file: lesson.videoFile });
					const data = await res.json().catch(() => ({}));
					if (data.key) {
						lesson.videoUrl = `/api/media?u=${encodeURIComponent(`/req/media/${data.key}`)}`;
					} else {
						throw new Error(`Video upload for lesson "${lesson.title || lessonId}" returned no key`);
					}
				}
				for (const m of lesson.materials || []) {
					if (!m.file) continue;
					await uploadTo(`/req/lessons/${lessonId}/materials`, {
						file: m.file,
						title: m.title || m.file.name
					});
				}
				if (lesson.notes && lesson.notes.trim()) {
					const noteRes = await fetch(`/api/media?u=${encodeURIComponent(`/req/courses/${id}/notes`)}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ lessonId, title: lesson.title || 'Lesson note', body: lesson.notes })
					});
					if (!noteRes.ok) {
						const noteTxt = await noteRes.text().catch(() => '');
						throw new Error(`Note upload failed (${noteRes.status}): ${noteTxt}`);
					}
				}
			}
		}
	}

	async function handleSubmit(input) {
		const { result, update } = input;
		if (result.type === 'success') {
			const data = result.data || {};
			// `courseId` is the created id on create; on edit the response has no id,
			// so fall back to the id seeded from `initial` (the existing course).
			const courseId = data.id ?? seed.id;
			try {
				if (courseId && thumbnailFile) await uploadThumbnail(courseId);
				// Resolve section/lesson ids (from seed on edit, or by fetching the
				// freshly created course on create) and upload lesson media.
				const savedSections = await resolveSavedSections(courseId);
				if (courseId && savedSections) await uploadLessonContent(courseId, savedSections);
				successMessage = 'Saved';
				if (mode === 'create' && courseId) {
					window.location.href = `/lecturer/courses/${courseId}/edit`;
					return;
				}
			} catch (e) {
				errorMessage = e.message || 'Some files failed to upload';
			}
			await update();
			saving = false;
			return;
		}
		if (result.type === 'failure') {
			errorMessage = result.data?.message || 'Could not save the course';
			successMessage = '';
			await update();
			saving = false;
			return;
		}
		await update();
		saving = false;
	}
</script>

<form
	class="form"
	method="POST"
	{action}
	enctype="multipart/form-data"
	use:enhance={() => {
		saving = true;
		errorMessage = '';
		successMessage = '';
		return async (input) => {
			await handleSubmit(input);
		};
	}}
>
	{#if errorMessage}
		<div class="alert err">{errorMessage}</div>
	{/if}
	{#if successMessage}
		<div class="alert ok">{successMessage}</div>
	{/if}

	<div class="row">
		<label class="full">
			Title
			<input name="title" bind:value={title} required placeholder="e.g. Intro to Machine Learning" />
		</label>
	</div>

	<div class="row">
		<label class="full">
			Summary
			<input name="summary" bind:value={summary} placeholder="One-line pitch shown on cards" />
		</label>
	</div>

	<div class="row">
		<label class="full">
			Description
			<textarea name="description" bind:value={description} rows="5" placeholder="Full course description"></textarea>
		</label>
	</div>

	<div class="row">
		<label>
			Category
			<input name="category" bind:value={category} placeholder="e.g. Programming" />
		</label>
		<label>
			Level
			<select name="level" bind:value={level}>
				<option value="">Select…</option>
				<option value="Beginner">Beginner</option>
				<option value="Intermediate">Intermediate</option>
				<option value="Advanced">Advanced</option>
			</select>
		</label>
		<label>
			Language
			<input name="language" bind:value={language} placeholder="English" />
		</label>
	</div>

	<div class="row">
		<label>
			Price (0 or empty = free)
			<input name="price" bind:value={price} type="number" min="0" step="0.01" placeholder="0" />
		</label>
		<label>
			Instructor name
			<input name="instructorName" bind:value={instructorName} placeholder="Display name" />
		</label>
	</div>

	<div class="row">
		<label class="full">
			What you'll learn (one per line)
			<textarea name="learn" bind:value={learnText} rows="4" placeholder={'Point 1\nPoint 2'}></textarea>
		</label>
	</div>

	<div class="row">
		<label class="full">
			Requirements (one per line)
			<textarea name="requirements" bind:value={requirementsText} rows="3" placeholder={'Basic HTML\nNo experience needed'}></textarea>
		</label>
	</div>

	<div class="row">
		<label class="full">
			Thumbnail image
			<div class="thumb-drop">
				{#if thumbnailUrl}
					<img class="thumb-prev" src={thumbnailUrl} alt="thumbnail preview" />
				{:else}
					<div class="thumb-ph">No thumbnail yet</div>
				{/if}
				<div class="thumb-actions">
					<input type="file" name="thumbnail" id="thumb-input" accept="image/*" onchange={(e) => {
						const f = e.currentTarget.files?.[0] ?? null;
						thumbnailFile = f;
						thumbnailUrl = f ? URL.createObjectURL(f) : '';
					}} hidden />
					<label for="thumb-input" class="btn ghost sm">Choose image</label>
					{#if thumbnailUrl}
						<button type="button" class="btn ghost sm danger" onclick={() => { thumbnailUrl = ''; thumbnailFile = null; }}>Remove</button>
					{/if}
				</div>
			</div>
		</label>
	</div>

	<!-- Curriculum editor -->
	<div class="curriculum">
		<div class="cur-head">
			<h3>Curriculum</h3>
			<button type="button" class="btn ghost sm" onclick={addSection}>+ Add section</button>
		</div>

		{#if sections.length === 0}
			<p class="hint">No sections yet. Add a section and lessons to build your course content.</p>
		{/if}

		{#each sections as section, i (i)}
			<div class="section-box">
				<div class="section-top">
					<input class="sec-title" placeholder="Section title" bind:value={section.title} />
					<button type="button" class="btn ghost sm danger" onclick={() => removeSection(i)}>Remove</button>
				</div>

				{#each section.lessons as lesson, j (j)}
					<div class="lesson-box">
						<input class="ls-title" placeholder="Lesson title" bind:value={lesson.title} />
						<textarea class="ls-desc" placeholder="Lesson description" rows="2" bind:value={lesson.description}></textarea>

						<label class="full">
							Lesson video
							<input type="file" accept="video/*" onchange={(e) => (lesson.videoFile = e.currentTarget.files?.[0] ?? null)} />
							{#if lesson.videoUrl}
								<div class="ls-video">
									<video src={lesson.videoUrl} controls preload="metadata">
										<!-- Lecturer-uploaded preview has no caption file; an empty
										     captions track satisfies a11y requirements. Replace src
										     with a real .vtt file when captions are available. -->
										<track kind="captions" />
									</video>
									<button type="button" class="btn ghost sm danger" onclick={() => (lesson.videoUrl = '')}>Remove existing video</button>
								</div>
							{:else if lesson.videoFile}
								<span class="ls-filetag">New: {lesson.videoFile.name}</span>
							{/if}
						</label>

						<div class="materials">
							<div class="mat-head">Materials (PDF, slides, datasets…)</div>
							{#each lesson.materials as m, k (k)}
								<div class="mat-row">
									<input class="mat-title" placeholder="Title" bind:value={m.title} />
									<span class="mat-name">{m.file?.name ?? m.fileName ?? 'file'}</span>
									{#if m.url}
										<a class="mat-view" href={m.url} target="_blank" rel="noreferrer">View</a>
									{/if}
									<button type="button" class="btn ghost sm danger" onclick={() => (lesson.materials = lesson.materials.filter((_, idx) => idx !== k))}>x</button>
								</div>
							{/each}
							<input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,image/*" onchange={(e) => {
								const f = e.currentTarget.files?.[0];
								if (f) lesson.materials = [...lesson.materials, { file: f, title: '', url: '', fileName: f.name }];
								e.currentTarget.value = '';
							}} />
						</div>

						<label class="full">
							Lecture notes
							<textarea class="ls-notes" placeholder="Markdown / plain notes shown to students" rows="3" bind:value={lesson.notes}></textarea>
						</label>

						<div class="ls-row">
							<label class="mini">
								Duration (min)
								<input type="number" min="0" bind:value={lesson.durationMinutes} placeholder="0" />
							</label>
							<label class="mini check">
								<input type="checkbox" bind:checked={lesson.preview} /> Preview
							</label>
							<button type="button" class="btn ghost sm danger" onclick={() => removeLesson(i, j)}>Remove lesson</button>
						</div>
					</div>
				{/each}

				<button type="button" class="btn ghost sm" onclick={() => addLesson(i)}>+ Add lesson</button>
			</div>
		{/each}

		<!-- Hidden field carrying the structured curriculum as JSON. -->
		<input type="hidden" name="sections" value={JSON.stringify(
			sections
				.filter((s) => s.title?.trim())
				.map((s) => ({
					title: s.title,
					lessons: (s.lessons ?? [])
						.filter((l) => l.title?.trim())
						.map((l) => ({
							title: l.title,
							description: l.description ?? '',
							durationMinutes: l.durationMinutes ? Number(l.durationMinutes) : 0,
							preview: !!l.preview
						}))
				}))
		)} />
	</div>

	<div class="actions">
		<button class="btn solid" type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
		<a class="btn ghost" href="/lecturer/courses">Cancel</a>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		color: #3a3f52;
		flex: 1;
		min-width: 160px;
	}
	label.full { flex-basis: 100%; }
	input, textarea, select {
		font: inherit;
		font-weight: 400;
		padding: 0.65rem 0.8rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 10px;
		color: #161a2b;
		background: #fff;
	}
	input:focus, textarea:focus, select:focus {
		outline: none;
		border-color: #4f46e5;
		box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
	}
	textarea { resize: vertical; }
	.alert {
		padding: 0.7rem 1rem;
		border-radius: 10px;
		font-size: 0.88rem;
	}
	.alert.err { background: #fdecec; color: #c1272d; }
	.alert.ok { background: #eafaf0; color: #1f9d55; }
	.actions { display: flex; gap: 10px; margin-top: 0.5rem; }
	.btn {
		display: inline-block;
		text-align: center;
		padding: 0.7rem 1.3rem;
		border-radius: 10px;
		font-weight: 600;
		border: 1.5px solid transparent;
		cursor: pointer;
		text-decoration: none;
	}
	.btn.solid { background: #161a2b; color: #fff; }
	.btn.solid:hover { background: #232a44; }
	.btn.ghost { background: #f5f6fb; color: #161a2b; border-color: #e7e8f2; }
	.btn:disabled { opacity: 0.6; cursor: default; }

	/* Curriculum editor */
	.curriculum {
		border-top: 1px solid #eef0f5;
		padding-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.cur-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.cur-head h3 {
		font-family: 'Space Grotesk', sans-serif;
		margin: 0;
		font-size: 1.05rem;
	}
	.hint {
		color: #8a90a0;
		font-size: 0.85rem;
		margin: 0;
	}
	.section-box {
		border: 1px solid #e9ebf2;
		border-radius: 12px;
		padding: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		background: #fafbff;
	}
	.section-top {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}
	.sec-title {
		flex: 1;
		font-weight: 600;
		font: inherit;
		font-weight: 600;
		padding: 0.6rem 0.8rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 10px;
	}
	.lesson-box {
		border: 1px dashed #e0e2ec;
		border-radius: 10px;
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: #fff;
	}
	.ls-title {
		font: inherit;
		font-weight: 600;
		padding: 0.55rem 0.75rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 9px;
	}
	.ls-desc, .ls-notes {
		font: inherit;
		padding: 0.55rem 0.75rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 9px;
		resize: vertical;
	}
	.materials {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.6rem;
		border: 1px solid #eef0f5;
		border-radius: 9px;
		background: #fafbff;
	}
	.mat-head { font-size: 0.78rem; font-weight: 600; color: #5b6072; }
	.mat-row { display: flex; gap: 0.5rem; align-items: center; }
	.mat-title { flex: 1; padding: 0.4rem 0.6rem; border: 1.5px solid #e0e2ec; border-radius: 8px; font: inherit; font-weight: 400; }
	.mat-name { font-size: 0.78rem; color: #8a90a0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.ls-row {
		display: flex;
		gap: 0.8rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}
	.mini {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.78rem;
		font-weight: 600;
		color: #3a3f52;
	}
	.mini.check {
		flex-direction: row;
		align-items: center;
		gap: 6px;
	}
	.mini input[type='number'] {
		font: inherit;
		font-weight: 400;
		padding: 0.5rem 0.7rem;
		border: 1.5px solid #e0e2ec;
		border-radius: 9px;
		width: 110px;
	}
	.thumb-prev {
		width: 100%;
		max-width: 280px;
		height: 158px;
		border-radius: 10px;
		object-fit: cover;
		display: block;
	}
	.thumb-drop {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.thumb-ph {
		width: 100%;
		max-width: 280px;
		height: 158px;
		border-radius: 10px;
		border: 1.5px dashed #e0e2ec;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #8a90a0;
		font-size: 0.85rem;
		background: #fafbff;
	}
	.thumb-actions { display: flex; gap: 0.5rem; }
	.ls-video { margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem; }
	.ls-video video {
		width: 100%;
		max-height: 240px;
		border-radius: 10px;
		background: #000;
	}
	.ls-filetag {
		display: inline-block;
		margin-top: 0.4rem;
		font-size: 0.8rem;
		color: #1f9d55;
		background: #eafaf0;
		padding: 3px 9px;
		border-radius: 999px;
	}
	.mat-view {
		font-size: 0.78rem;
		color: #4f46e5;
		text-decoration: none;
		font-weight: 600;
	}
	.mat-view:hover { text-decoration: underline; }
	.btn.sm {
		padding: 0.45rem 0.8rem;
		font-size: 0.82rem;
	}
	.btn.danger {
		background: #fdecec;
		color: #c1272d;
		border-color: #f6d2d4;
	}
	.btn.danger:hover {
		background: #f9dada;
	}
</style>
