<script>
	import CourseForm from '$lib/components/CourseForm.svelte';

	let { data } = $props();
	let course = $derived(data?.course ?? {});
</script>

<svelte:head>
	<title>Edit Course · CourseConnect</title>
</svelte:head>

<div class="page">
	<a class="back" href="/lecturer/courses">← Back to my courses</a>
	<h1>Edit course</h1>
	<p class="sub">{course.title ?? ''}{course.status ? ` · ${course.status}` : ''}</p>

	<div class="card">
		<CourseForm mode="edit" action="?/save" initial={course} submitLabel="Save changes" />
	</div>
</div>

<style>
	.page {
		max-width: 820px;
		margin: 0 auto;
		padding: 2.2rem 1.5rem 4rem;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
	}
	.back { color: #5b6072; text-decoration: none; font-size: 0.9rem; }
	.back:hover { color: #161a2b; }
	h1 { font-family: 'Space Grotesk', sans-serif; font-size: 1.8rem; margin: 1rem 0 0.3rem; }
	.sub { color: #5b6072; margin: 0 0 1.6rem; }
	.card {
		background: #fff;
		border: 1px solid #ecedf3;
		border-radius: 16px;
		padding: 1.6rem;
		box-shadow: 0 8px 24px rgba(20, 26, 43, 0.05);
	}
</style>
