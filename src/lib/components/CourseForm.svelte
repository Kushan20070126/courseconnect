<script>
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

	let title = $state(initial?.title ?? '');
	let summary = $state(initial?.summary ?? '');
	let description = $state(initial?.description ?? '');
	let category = $state(initial?.category ?? '');
	let level = $state(initial?.level ?? '');
	let language = $state(initial?.language ?? 'English');
	let price = $state(initial?.price ?? '');
	let instructorName = $state(initial?.instructorName ?? '');
	let learnText = $state((initial?.learn ?? []).join('\n'));
	let requirementsText = $state((initial?.requirements ?? []).join('\n'));
	let thumbnailUrl = $state(initial?.thumbnailUrl ?? '');

	// Build sections/lessons state from initial (nested).
	function seedSections(src) {
		const arr = Array.isArray(src) ? src : initial?.sections ?? [];
		return arr.map((s) => ({
			id: s.id,
			title: s.title ?? '',
			lessons: (s.lessons ?? []).map((l) => ({
				id: l.id,
				title: l.title ?? '',
				description: l.description ?? '',
				durationMinutes: l.durationMinutes != null ? String(l.durationMinutes) : '',
				preview: !!l.preview,
				notes: l.notes ?? '',
				videoFile: null,
				materials: [] // { file, title }
			}))
		}));
	}
	let sections = $state(seedSections());
	let thumbnailFile = $state(null);

	function addSection() {
		sections = [...sections, { title: '', lessons: [] }];
	}
	function removeSection(i) {
		sections = sections.filter((_, idx) => idx !== i);
	}
	function addLesson(i) {
		const next = sections.slice();
		next[i].lessons = [...next[i].lessons, { title: '', description: '', durationMinutes: '', preview: false, notes: '', videoFile: null, materials: [] }];
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

	function authHeader() {
		return {
			Authorization: `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)session_token\s*\=\s*((?:[^;](?!;))*[^;]?)?);.*$/, '$1')}`
		};
	}
	const COURSE_API = process.env.COURSE_API || 'http://localhost:8082';

	async function uploadThumbnail(id) {
		if (!thumbnailFile) return;
		const fd = new FormData();
		fd.append('file', thumbnailFile);
		const res = await fetch(`${COURSE_API}/req/courses/${id}/thumbnail`, {
			method: 'POST',
			headers: authHeader(),
			body: fd
		});
		if (res.ok) {
			const data = await res.json().catch(() => ({}));
			if (data.key) thumbnailUrl = `${COURSE_API}/req/courses/${id}/thumbnail?k=${encodeURIComponent(data.key)}`;
		} else {
			throw new Error('Thumbnail upload failed');
		}
	}

	// Upload per-lesson video + materials + notes, matched by returned lesson id.
	async function uploadLessonContent(id, savedSections) {
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
					const fd = new FormData();
					fd.append('file', lesson.videoFile);
					await fetch(`${COURSE_API}/req/lessons/${lessonId}/video`, {
						method: 'POST', headers: authHeader(), body: fd
					});
				}
				for (const m of lesson.materials || []) {
					if (!m.file) continue;
					const fd = new FormData();
					fd.append('file', m.file);
					fd.append('title', m.title || m.file.name);
					await fetch(`${COURSE_API}/req/lessons/${lessonId}/materials`, {
						method: 'POST', headers: authHeader(), body: fd
					});
				}
				if (lesson.notes && lesson.notes.trim()) {
					await fetch(`${COURSE_API}/req/courses/${id}/notes`, {
						method: 'POST',
						headers: { ...authHeader(), 'Content-Type': 'application/json' },
						body: JSON.stringify({ lessonId, title: lesson.title || 'Lesson note', body: lesson.notes })
					});
				}
			}
		}
	}

	async function handleSubmit(ev) {
		const { result, update } = ev;
		saving = false;
		if (result.type === 'success') {
			errorMessage = '';
			const data = result.data || {};
			try {
				if (data.id && thumbnailFile) await uploadThumbnail(data.id);
				// On create the response includes sections+lesson ids; on edit it
				// does not, so fall back to the ids seeded from `initial`.
				let savedSections = data.sections;
				if ((!savedSections || savedSections.length === 0) && mode === 'edit') {
					savedSections = sections.map((s) => ({
						id: s.id,
						lessons: (s.lessons ?? []).map((l) => ({ id: l.id }))
					}));
				}
				if (data.id && savedSections) await uploadLessonContent(data.id, savedSections);
				successMessage = 'Saved';
				if (mode === 'create' && data.id) {
					window.location.href = `/lecturer/courses/${data.id}/edit`;
					return;
				}
			} catch (e) {
				errorMessage = e.message || 'Some files failed to upload';
			}
			await update();
			return;
		}
		if (result.type === 'failure') {
			errorMessage = result.data?.message || 'Could not save the course';
			successMessage = '';
			await update();
			return;
		}
		await update();
	}
</script>

<form
	class="form"
	method="POST"
	{action}
	use:enhance={handleSubmit}
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
			<input type="file" name="thumbnail" accept="image/*" onchange={(e) => (thumbnailFile = e.currentTarget.files?.[0] ?? null)} />
			{#if thumbnailUrl}
				<div class="thumb-prev"><img src={thumbnailUrl} alt="thumbnail" /></div>
			{/if}
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
						</label>

						<div class="materials">
							<div class="mat-head">Materials (PDF, slides, datasets…)</div>
							{#each lesson.materials as m, k (k)}
								<div class="mat-row">
									<input class="mat-title" placeholder="Title" bind:value={m.title} />
									<span class="mat-name">{m.file?.name ?? 'file'}</span>
									<button type="button" class="btn ghost sm danger" onclick={() => (lesson.materials = lesson.materials.filter((_, idx) => idx !== k))}>x</button>
								</div>
							{/each}
							<input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,image/*" onchange={(e) => {
								const f = e.currentTarget.files?.[0];
								if (f) lesson.materials = [...lesson.materials, { file: f, title: '' }];
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
		margin-top: 0.6rem;
		width: 160px;
		height: 90px;
		border-radius: 10px;
		overflow: hidden;
	}
	.thumb-prev img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
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
