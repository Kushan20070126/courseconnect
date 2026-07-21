<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { mediaUrl } from '$lib/api.js';

	let { data, form } = $props();
	let courses = $derived(data?.courses ?? []);

	let busy = $state(false);

	function onSubmit() {
		busy = true;
		return async ({ update }) => {
			await update();
			busy = false;
		};
	}

	function goCreate() {
		goto('/lecturer/courses/new');
	}
</script>

<svelte:head>
	<title>My Courses · CourseConnect</title>
</svelte:head>

<div class="page">
	<header class="head">
		<div>
			<h1>My Courses</h1>
			<p>Create, edit, publish and manage your courses.</p>
		</div>
		<button class="btn solid" onclick={goCreate} disabled={busy}>＋ New course</button>
	</header>

	{#if form?.message}
		<div class="alert" class:ok={form.success}>{form.message}</div>
	{/if}

	{#if courses.length === 0}
		<div class="empty">
			<b>No courses yet</b>
			<span>Create your first course to start teaching.</span>
		</div>
	{:else}
		<div class="grid">
			{#each courses as c (c.id)}
				<div class="card">
					<div class="thumb">
						{#if c.thumbnailUrl}
							<img src={mediaUrl(c.thumbnailUrl)} alt={c.title ?? ''} loading="lazy" />
						{:else}
							<div class="ph"></div>
						{/if}
						<span class="status {c.status?.toLowerCase()}">{c.status ?? 'DRAFT'}</span>
					</div>
					<div class="body">
						<h3>{c.title ?? 'Untitled'}</h3>
						<p>{c.summary ?? ''}</p>
						<div class="meta">
							{#if c.price}<span>{c.currency === 'lkr' ? 'LKR ' : '$'}{c.price}</span>{/if}
							{#if c.studentsCount != null}<span>{c.studentsCount} students</span>{/if}
						</div>
					</div>
					<div class="actions">
						<a class="btn ghost" href={`/lecturer/courses/${c.id}/edit`}>Edit</a>
						{#if c.status !== 'PUBLISHED'}
							<form method="POST" action="?/publish" use:enhance={onSubmit}>
								<input type="hidden" name="id" value={c.id} />
								<button class="btn solid" type="submit" disabled={busy}>Publish</button>
							</form>
						{/if}
						<form method="POST" action="?/delete" use:enhance={onSubmit}>
							<input type="hidden" name="id" value={c.id} />
							<button class="btn danger" type="submit" disabled={busy}
								onclick={(e) => !confirm(`Delete "${c.title ?? 'this course'}"? This cannot be undone.`) && e.preventDefault()}>
								Delete
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
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
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.6rem;
	}
	.head h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.9rem;
		margin: 0 0 0.3rem;
	}
	.head p { color: #5b6072; margin: 0; }
	.alert {
		padding: 0.8rem 1rem;
		border-radius: 10px;
		background: #fdecec;
		color: #c1272d;
		margin-bottom: 1.2rem;
		font-size: 0.9rem;
	}
	.alert.ok { background: #eafaf0; color: #1f9d55; }
	.empty {
		text-align: center;
		padding: 3.5rem 1.25rem;
		color: #5b6072;
		border: 1.5px dashed #e7e8f2;
		border-radius: 14px;
		background: #fafafd;
	}
	.empty b { display: block; color: #161a2b; font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; margin-bottom: 0.4rem; }
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
		display: flex;
		flex-direction: column;
	}
	.thumb {
		position: relative;
		height: 150px;
		background: #eef0f7;
	}
	.thumb img { width: 100%; height: 100%; object-fit: cover; }
	.ph { width: 100%; height: 100%; background: linear-gradient(135deg, #e9ecf5, #f6f7fb); }
	.status {
		position: absolute;
		top: 10px; left: 10px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 3px 9px;
		border-radius: 999px;
		background: #edeff5;
		color: #4a5568;
	}
	.status.published { background: #eafaf0; color: #1f9d55; }
	.status.draft { background: #fff4e0; color: #a06a00; }
	.body { padding: 14px 16px; flex: 1; }
	.body h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.02rem; margin: 0 0 6px; }
	.body p { font-size: 0.85rem; color: #5b6072; margin: 0 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.meta { display: flex; gap: 10px; font-size: 0.82rem; color: #6b7180; }
	.actions {
		display: flex;
		gap: 8px;
		padding: 0 16px 16px;
		flex-wrap: wrap;
	}
	.actions form { margin: 0; }
	.btn {
		display: inline-block;
		text-align: center;
		padding: 0.55rem 0.9rem;
		border-radius: 9px;
		font-weight: 600;
		font-size: 0.85rem;
		border: 1.5px solid transparent;
		cursor: pointer;
		text-decoration: none;
	}
	.btn.solid { background: #161a2b; color: #fff; }
	.btn.solid:hover { background: #232a44; }
	.btn.ghost { background: #f5f6fb; color: #161a2b; border-color: #e7e8f2; }
	.btn.ghost:hover { background: #eceef5; }
	.btn.danger { background: #fdecec; color: #c1272d; border-color: #f6d2d4; }
	.btn.danger:hover { background: #f9dada; }
	.btn:disabled { opacity: 0.6; cursor: default; }
</style>
