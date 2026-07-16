<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Direct visits (GET) to /logout just bounce to sign-in.
	onMount(() => {
		goto('/signin');
	});
</script>

<p style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #5b6072;">
	Signing you out…
</p>
