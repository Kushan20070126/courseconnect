<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let isSubmitting = $state(false);
</script>

<div class="wrap">
	<header class="top">
		<div>
			<h1>Admin Dashboard</h1>
			<p class="sub">Platform overview and lecturer approvals.</p>
		</div>
		<form method="POST" action="/logout">
			<button class="logout" type="submit">Log out</button>
		</form>
	</header>

	{#if form?.message}
		<div class="alert" class:ok={form.success}>{form.message}</div>
	{/if}

	<section class="stats">
		<div class="stat">
			<b>{data.stats?.users ?? 0}</b>
			<span>Total users</span>
		</div>
		<div class="stat">
			<b>{data.stats?.lecturers ?? 0}</b>
			<span>Lecturers</span>
		</div>
		<div class="stat">
			<b>{data.stats?.students ?? 0}</b>
			<span>Students</span>
		</div>
		<div class="stat">
			<b>{data.stats?.courses ?? 0}</b>
			<span>Courses</span>
		</div>
		<div class="stat">
			<b>{data.pending?.length ?? 0}</b>
			<span>Pending approval</span>
		</div>
	</section>

	<section class="panel">
		<h2>Pending Lecturer Applications</h2>

		{#if data.pending?.length}
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Title</th>
						<th>Area</th>
						<th>Experience</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.pending as lec (lec.id)}
						<tr>
							<td>{lec.firstName ?? ''} {lec.lastName ?? ''}</td>
							<td>{lec.email}</td>
							<td>{lec.title ?? '—'}</td>
							<td>{lec.area ?? '—'}</td>
							<td>{lec.experience ?? 0} yrs</td>
							<td class="actions">
								<form
									method="POST"
									action="?/approve"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ update }) => {
											await update();
											isSubmitting = false;
										};
									}}
								>
									<input type="hidden" name="id" value={lec.id} />
									<button type="submit" class="approve" disabled={isSubmitting}>Approve</button>
								</form>
								<form
									method="POST"
									action="?/reject"
									use:enhance={() => {
										isSubmitting = true;
										return async ({ update }) => {
											await update();
											isSubmitting = false;
										};
									}}
								>
									<input type="hidden" name="id" value={lec.id} />
									<button type="submit" class="reject" disabled={isSubmitting}>Reject</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty">No pending lecturer applications. 🎉</p>
		{/if}
	</section>
</div>

<style>
	.wrap {
		max-width: 960px;
		margin: 2.5rem auto;
		padding: 0 1.25rem 3rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.6rem;
	}
	.sub {
		color: #5b6072;
		margin: 4px 0 0;
		font-size: 0.9rem;
	}
	.logout {
		border: 1.5px solid #e7e8f2;
		background: #fff;
		color: #5b6072;
		padding: 0.6rem 1rem;
		border-radius: 9px;
		font-weight: 600;
		cursor: pointer;
	}
	.alert {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fca5a5;
		padding: 0.7rem 0.9rem;
		border-radius: 8px;
		margin-bottom: 1.25rem;
		font-size: 0.88rem;
	}
	.alert.ok {
		background: #f0fdf4;
		color: #166534;
		border-color: #86efac;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.stat {
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 12px;
		padding: 1.1rem;
		text-align: center;
	}
	.stat b {
		display: block;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.6rem;
		color: #4f46e5;
	}
	.stat span {
		font-size: 0.75rem;
		color: #9aa0b4;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.panel {
		background: #fff;
		border: 1px solid #e7e8f2;
		border-radius: 14px;
		padding: 1.5rem;
	}
	.panel h2 {
		margin: 0 0 1rem;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.15rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.7rem 0.6rem;
		border-bottom: 1px solid #f0f1f7;
	}
	th {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9aa0b4;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		white-space: nowrap;
	}
	.approve,
	.reject {
		border: none;
		border-radius: 8px;
		padding: 0.45rem 0.85rem;
		font-weight: 600;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.approve {
		background: #4f46e5;
		color: #fff;
	}
	.reject {
		background: #fee2e2;
		color: #b91c1c;
	}
	.empty {
		color: #5b6072;
		text-align: center;
		padding: 2rem 0;
	}
	@media (max-width: 720px) {
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
		table {
			display: block;
			overflow-x: auto;
		}
	}
</style>
