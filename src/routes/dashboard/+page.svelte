<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { mediaUrl } from '$lib/api.js';

	let { data, form } = $props();

	let user = $derived(data?.user ?? {});
	let role = $derived(data?.role ?? 'student');
	let firstName = $derived(user?.firstName || user?.email || 'there');
	let isLecturer = $derived(role === 'lecturer');

	let myCourses = $derived(data?.myCourses ?? []);
	let stats = $derived(data?.stats ?? {});
	let published = $derived(data?.publishedCourses ?? []);
	let enrolledCourses = $derived(data?.enrolledCourses ?? []);

	let busy = $state(false);

	/** @param {string} name */
	function onSubmit(name) {
		return () => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		};
	}

	function fmtMoney(v, currency) {
		if (v == null) return '0';
		const sym = currency === 'lkr' ? 'LKR ' : '$';
		return sym + Number(v).toLocaleString();
	}

	function goCreate() {
		goto('/lecturer/courses/new');
	}
</script>

<svelte:head>
	<title>Dashboard · CourseConnect</title>
</svelte:head>

<div class="page">
	<header class="page-head">
		<h1>{isLecturer ? 'Lecturer Dashboard' : 'Dashboard'}</h1>
		<p>Welcome back, {firstName}.{isLecturer ? ' Manage and track your courses.' : ' Here’s what’s happening with your learning.'}</p>
	</header>

	{#if form?.message}
		<div class="alert" class:ok={form.success}>{form.message}</div>
	{/if}

	{#if isLecturer}
		<!-- Stat cards -->
		<section class="stats">
			<div class="stat">
				<span class="stat-num">{stats.totalCourses ?? myCourses.length}</span>
				<span class="stat-label">Courses</span>
			</div>
			<div class="stat">
				<span class="stat-num">{stats.totalStudents ?? 0}</span>
				<span class="stat-label">Students</span>
			</div>
			<div class="stat">
				<span class="stat-num">{stats.paidCourses ?? 0}</span>
				<span class="stat-label">Paid courses</span>
			</div>
			<div class="stat">
				<span class="stat-num">{fmtMoney(stats.revenue, 'usd')}</span>
				<span class="stat-label">Est. revenue</span>
			</div>
		</section>

		<!-- My courses -->
		<section class="block">
			<div class="block-head">
				<h2>My Courses</h2>
				<button class="btn solid sm" onclick={goCreate} disabled={busy}>＋ New course</button>
			</div>

			{#if myCourses.length === 0}
				<div class="empty">
					<b>No courses yet</b>
					<span>Create your first course to start teaching.</span>
				</div>
			{:else}
				<div class="table-wrap">
					<table class="courses">
						<thead>
							<tr>
								<th>Title</th>
								<th>Status</th>
								<th>Students</th>
								<th>Price</th>
								<th class="actions-col">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each myCourses as c (c.id)}
								<tr>
									<td class="title-cell">
										<a href={`/courses/${c.id}`}>{c.title ?? 'Untitled'}</a>
										{#if c.category}<span class="sub">{c.category}</span>{/if}
									</td>
									<td>
										<span class="status {c.status?.toLowerCase()}">{c.status ?? 'DRAFT'}</span>
									</td>
									<td>{c.studentsCount ?? 0}</td>
									<td>{c.price ? fmtMoney(c.price, c.currency) : 'Free'}</td>
									<td class="actions-col">
										<div class="row-actions">
											<a class="btn ghost sm" href={`/lecturer/courses/${c.id}/edit`}>Edit</a>
											{#if c.status !== 'PUBLISHED'}
												<form method="POST" action="/lecturer/courses?/publish" use:enhance={onSubmit('publish')}>
													<input type="hidden" name="id" value={c.id} />
													<button class="btn solid sm" type="submit" disabled={busy}>Publish</button>
												</form>
											{/if}
											<form method="POST" action="/lecturer/courses?/delete" use:enhance={onSubmit('delete')}>
												<input type="hidden" name="id" value={c.id} />
												<button class="btn danger sm" type="submit" disabled={busy}
													onclick={(e) => !confirm(`Delete "${c.title ?? 'this course'}"? This cannot be undone.`) && e.preventDefault()}>
													Delete
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<!-- Published catalog -->
		<section class="block">
			<div class="block-head">
				<h2>Published Courses</h2>
				<a class="btn ghost sm" href="/courses">View all</a>
			</div>
			{#if published.length === 0}
				<p class="muted">No published courses in the catalog yet.</p>
			{:else}
				<div class="mini-grid">
					{#each published.slice(0, 6) as c (c.id)}
						<a class="mini-card" href={`/courses/${c.id}`}>
							<div class="mini-thumb">
								{#if c.thumbnailUrl}<img src={mediaUrl(c.thumbnailUrl)} alt={c.title ?? ''} />{:else}<div class="ph"></div>{/if}
							</div>
							<div class="mini-body">
								<b>{c.title ?? 'Untitled'}</b>
								<span class="muted">{c.instructorName ?? 'Instructor'}{c.price ? ` · ${fmtMoney(c.price, c.currency)}` : ' · Free'}</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{:else}
		<!-- Student view -->
		<section class="grid">
			<a class="tile" href="/courses">
				<h2>Browse Courses</h2>
				<p>Explore the catalog and enroll in something new.</p>
			</a>
			<a class="tile" href="/me">
				<h2>My Profile</h2>
				<p>View and update your account details.</p>
			</a>
		</section>

		<section class="block">
			<div class="block-head">
				<h2>My Learning</h2>
				<a class="btn ghost sm" href="/my-courses">View all</a>
			</div>
			{#if enrolledCourses.length === 0}
				<p class="muted">You haven't enrolled in any courses yet. Browse the catalog to get started.</p>
			{:else}
				<div class="mini-grid">
					{#each enrolledCourses.slice(0, 6) as c (c.id)}
						<a class="mini-card" href={`/courses/${c.id}/learn`}>
							<div class="mini-thumb">
								{#if c.thumbnailUrl}<img src={mediaUrl(c.thumbnailUrl)} alt={c.title ?? ''} />{:else}<div class="ph"></div>{/if}
							</div>
							<div class="mini-body">
								<b>{c.title ?? 'Untitled'}</b>
								<span class="muted">{c.instructorName ?? 'Instructor'} · {c.progressPercent ?? 0}%</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>
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
	.page-head p { color: #5b6072; margin: 0 0 2rem; }
	.alert { padding: 0.8rem 1rem; border-radius: 10px; background: #fdecec; color: #c1272d; margin-bottom: 1.2rem; font-size: 0.9rem; }
	.alert.ok { background: #eafaf0; color: #1f9d55; }

	/* Stats */
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.stat {
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 14px;
		padding: 1.2rem 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.stat-num { font-family: 'Space Grotesk', sans-serif; font-size: 1.7rem; font-weight: 700; }
	.stat-label { color: #6b7180; font-size: 0.85rem; }

	.block { margin-top: 2rem; }
	.block-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
	.block h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.3rem; margin: 0; }
	.empty {
		text-align: center; padding: 2.5rem 1.25rem; color: #5b6072;
		border: 1.5px dashed #e7e8f2; border-radius: 14px; background: #fafafd;
	}
	.empty b { display: block; color: #161a2b; font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; margin-bottom: 0.3rem; }
	.muted { color: #6b7180; font-size: 0.88rem; }

	/* Table */
	.table-wrap { overflow-x: auto; border: 1px solid #e7e8f2; border-radius: 14px; background: #fff; }
	table.courses { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	.courses th, .courses td { text-align: left; padding: 0.85rem 1rem; border-bottom: 1px solid #f0f1f7; }
	.courses th { color: #6b7180; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; background: #fafbfd; }
	.courses tbody tr:last-child td { border-bottom: none; }
	.title-cell a { font-weight: 600; color: #161a2b; text-decoration: none; }
	.title-cell a:hover { color: #4f46e5; }
	.sub { display: block; color: #8a90a0; font-size: 0.78rem; font-weight: 400; }
	.status {
		font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
		padding: 3px 9px; border-radius: 999px; background: #edeff5; color: #4a5568;
	}
	.status.published { background: #eafaf0; color: #1f9d55; }
	.status.draft { background: #fff4e0; color: #a06a00; }
	.actions-col { width: 1%; white-space: nowrap; }
	.row-actions { display: flex; gap: 8px; flex-wrap: wrap; }

	/* Buttons */
	.btn {
		display: inline-block; text-align: center; padding: 0.55rem 0.95rem; border-radius: 9px;
		font-weight: 600; font-size: 0.85rem; border: 1.5px solid transparent; cursor: pointer; text-decoration: none;
	}
	.btn.sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
	.btn.solid { background: #161a2b; color: #fff; }
	.btn.solid:hover { background: #232a44; }
	.btn.ghost { background: #f5f6fb; color: #161a2b; border-color: #e7e8f2; }
	.btn.ghost:hover { background: #eceef5; }
	.btn.danger { background: #fdecec; color: #c1272d; border-color: #f6d2d4; }
	.btn.danger:hover { background: #f9dada; }
	.btn:disabled { opacity: 0.6; cursor: default; }

	/* Student tiles */
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
	.tile {
		display: block; text-decoration: none; color: inherit; background: #fff;
		border: 1px solid #e7e8f2; border-radius: 14px; padding: 1.5rem;
		box-shadow: 0 1px 2px rgba(22, 26, 43, 0.04);
		transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
	}
	.tile:hover { box-shadow: 0 12px 32px -12px rgba(46, 31, 143, 0.18); border-color: var(--line, #e7e8f2); }
	.tile h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; margin: 0 0 0.4rem; }
	.tile p { color: #5b6072; font-size: 0.9rem; margin: 0; }

	/* Mini cards */
	.mini-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
	.mini-card {
		display: flex; gap: 0.8rem; align-items: center; text-decoration: none; color: inherit;
		background: #fff; border: 1px solid #e7e8f2; border-radius: 12px; padding: 0.7rem; transition: border-color 0.2s, box-shadow 0.2s;
	}
	.mini-card:hover { border-color: transparent; box-shadow: 0 10px 24px -12px rgba(46, 31, 143, 0.18); }
	.mini-thumb { width: 56px; height: 56px; border-radius: 9px; overflow: hidden; background: #eef0f7; flex-shrink: 0; }
	.mini-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.mini-thumb .ph { width: 100%; height: 100%; background: linear-gradient(135deg, #e9ecf5, #f6f7fb); }
	.mini-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.mini-body b { font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.mini-body .muted { font-size: 0.8rem; }
</style>
