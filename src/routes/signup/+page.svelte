<script>
	import { enhance } from '$app/forms';

	let { form } = $props();

	let isSubmitting = $state(false);
	let showPassword = $state(false);
	let showConfirm = $state(false);

	let step = $state(0);
	const TOTAL_STEPS = 4;

	// Collected form data
	let data = $state({
		firstName: '',
		lastName: '',
		age: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: 'student',
		educationLevel: '',
		interest: [],
		goal: [],
		title: '',
		experience: '',
		area: [],
		bio: ''
	});

	let interestInput = $state('');
	let goalInput = $state('');
	let areaInput = $state('');

	function addInterest() {
		const v = interestInput.trim();
		if (v && !data.interest.includes(v)) {
			data.interest = [...data.interest, v];
		}
		interestInput = '';
	}
	function removeInterest(i) {
		data.interest = data.interest.filter((_, idx) => idx !== i);
	}

	function addGoal() {
		const v = goalInput.trim();
		if (v && !data.goal.includes(v)) {
			data.goal = [...data.goal, v];
		}
		goalInput = '';
	}
	function removeGoal(i) {
		data.goal = data.goal.filter((_, idx) => idx !== i);
	}

	let currentStep = $derived(form?.step ?? 'initiate');
	let trackingEmail = $derived(form?.email ?? '');

	const progress = $derived(((step + 1) / TOTAL_STEPS) * 100);

	const stepMeta = [
		{ title: 'Your details', sub: 'Tell us a little about yourself.' },
		{ title: 'I am a…', sub: 'Choose how you’ll use CourseConnect.' },
		{ title: 'Education level', sub: 'Help us tailor your experience.' },
		{ title: 'Create your account', sub: 'Set a password to secure your account.' }
	];

	// Inline validation errors per step
	let errors = $state({});

	function validateStep(s) {
		const e = {};
		if (s === 0) {
			if (!data.firstName.trim()) e.firstName = 'First name is required';
			if (!data.lastName.trim()) e.lastName = 'Last name is required';
			if (!data.age || Number(data.age) < 13) e.age = 'Enter a valid age (13+)';
			if (!data.email.trim()) e.email = 'Email is required';
			else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email';
		} else if (s === 1) {
			if (!data.role) e.role = 'Please choose an option';
		} else if (s === 2) {
			if (data.role === 'student') {
				if (!data.educationLevel) e.educationLevel = 'Select your education level';
				if (!data.interest.length) e.interest = 'Add at least one interest';
				if (!data.goal.length) e.goal = 'Add at least one career goal';
			} else {
				if (!data.title) e.title = 'Select your title';
				if (!data.experience || Number(data.experience) < 0) e.experience = 'Enter valid years';
				if (!data.area.length) e.area = 'Add at least one specialized area';
				if (!data.bio.trim()) e.bio = 'Short biography is required';
			}
		} else if (s === 3) {
			if (!data.password) e.password = 'Password is required';
			else if (data.password.length < 6) e.password = 'Use at least 6 characters';
			if (!data.confirmPassword) e.confirmPassword = 'Confirm your password';
			else if (data.confirmPassword !== data.password) e.confirmPassword = 'Passwords do not match';
		}
		return e;
	}

	let passwordError = $derived(errors.confirmPassword ?? '');

	function next() {
		const e = validateStep(step);
		errors = { ...errors, ...e };
		if (Object.keys(e).length === 0) {
			if (step < TOTAL_STEPS - 1) step += 1;
		} else {
			step = step;
		}
	}
	function back() {
		if (step > 0) step -= 1;
	}
	function goTo(i) {
		// Only allow jumping to a completed/valid step
		if (i < step) {
			step = i;
		} else if (i === step) {
			step = i;
		} else {
			for (let s = step; s < i; s++) {
				const e = validateStep(s);
				if (Object.keys(e).length) {
					errors = { ...errors, ...e };
					return;
				}
			}
			step = i;
		}
	}
	function onInput(field) {
		if (errors[field]) {
			const copy = { ...errors };
			delete copy[field];
			errors = copy;
		}
	}
</script>

<svelte:head>
	<title>Sign up · CourseConnect</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="stage">
	<!-- Brand panel -->
	<aside class="brand-panel">
		<a href="/" class="brand-mark">
			<span class="glyph">
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M12 3 3 8l9 5 7.5-4.17V15h1.5V8L12 3Zm-6 8.13V15l6 3.33L18 15v-3.87l-6 3.33-6-3.33Z"
						fill="currentColor"
					/>
				</svg>
			</span>
			CourseConnect
		</a>

		<div class="ring-orbit"><span class="dot"></span></div>

		<div class="brand-copy">
			<h1>Start your learning journey.</h1>
			<p>
				Join thousands of students and lecturers building skills, courses and community —
				with no walls between you and great teaching.
			</p>

			<div class="stat-row">
				<div class="stat"><b>1,200+</b><span>Courses</span></div>
				<div class="stat"><b>45k</b><span>Learners</span></div>
				<div class="stat"><b>98%</b><span>Satisfaction</span></div>
			</div>
		</div>

		<p class="quote">
			<strong>“Learning without walls.”</strong> Access world-class instruction anywhere,
			anytime — on any device.
		</p>
	</aside>

	<!-- Form panel -->
	<main class="form-panel">
		<div class="form-card">
			{#if currentStep === 'initiate'}
				<p class="eyebrow">Create account</p>
				<h2>{stepMeta[step].title}</h2>
				<p class="sub">{stepMeta[step].sub}</p>

				<!-- Stepper -->
				<ol class="stepper">
					{#each stepMeta as m, i}
						<li class:done={i < step} class:active={i === step}>
							<button
								type="button"
								class="step-btn"
								class:clickable={i <= step}
								disabled={i > step}
								aria-current={i === step ? 'step' : undefined}
								onclick={() => goTo(i)}
							>
								<span class="node">{i < step ? '✓' : i + 1}</span>
								<span class="label">{m.title}</span>
							</button>
						</li>
					{/each}
				</ol>
				<div class="progress"><span style="width:{progress}%"></span></div>

				{#if form?.message}
					<div class="alert" class:error={!form.success} role="alert">
						<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{form.message}</span>
					</div>
				{/if}

				<form
					method="POST"
					action="?/initiate"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<!-- Hidden fields carry data from earlier steps -->
					<input type="hidden" name="firstName" value={data.firstName} />
					<input type="hidden" name="lastName" value={data.lastName} />
					<input type="hidden" name="age" value={data.age} />
					<input type="hidden" name="email" value={data.email} />
					<input type="hidden" name="password" value={data.password} />
					<input type="hidden" name="confirmPassword" value={data.confirmPassword} />
					<input type="hidden" name="role" value={data.role} />
				<input type="hidden" name="educationLevel" value={data.educationLevel} />
				<input type="hidden" name="interest" value={data.interest.join(', ')} />
				<input type="hidden" name="goal" value={data.goal.join(', ')} />
					<input type="hidden" name="title" value={data.title} />
					<input type="hidden" name="experience" value={data.experience} />
					<input type="hidden" name="area" value={data.area.join(', ')} />
					<input type="hidden" name="bio" value={data.bio} />

					{#if step === 0}
						<!-- Step 1: Personal details -->
						<div class="field" class:invalid={errors.firstName}>
							<label for="firstName">First name</label>
							<input
								id="firstName"
								type="text"
								placeholder="Jane"
								bind:value={data.firstName}
								oninput={() => onInput('firstName')}
								autocomplete="given-name"
								required
								disabled={isSubmitting}
							/>
							{#if errors.firstName}<p class="field-error">{errors.firstName}</p>{/if}
						</div>
						<div class="field" class:invalid={errors.lastName}>
							<label for="lastName">Last name</label>
							<input
								id="lastName"
								type="text"
								placeholder="Doe"
								bind:value={data.lastName}
								oninput={() => onInput('lastName')}
								autocomplete="family-name"
								required
								disabled={isSubmitting}
							/>
							{#if errors.lastName}<p class="field-error">{errors.lastName}</p>{/if}
						</div>
						<div class="field" class:invalid={errors.age}>
							<label for="age">Age</label>
							<input
								id="age"
								type="number"
								min="13"
								max="120"
								placeholder="21"
								bind:value={data.age}
								oninput={() => onInput('age')}
								required
								disabled={isSubmitting}
							/>
							{#if errors.age}<p class="field-error">{errors.age}</p>{/if}
						</div>

						<div class="field" class:invalid={errors.email}>
							<label for="email">Email address</label>
							<div class="input-wrap">
								<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<path d="M2.5 5.5h15v9h-15v-9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
									<path d="m3 6 7 5 7-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<input
									id="email"
									type="email"
									placeholder="you@example.com"
									bind:value={data.email}
									oninput={() => onInput('email')}
									autocomplete="email"
									required
									disabled={isSubmitting}
								/>
							</div>
							{#if errors.email}<p class="field-error">{errors.email}</p>{/if}
						</div>
					{:else if step === 1}
						<!-- Step 2: Role -->
						<div class="choice-grid" role="radiogroup" aria-label="Your role" class:invalid={errors.role}>
							<label class="choice" class:selected={data.role === 'student'}>
								<input type="radio" name="role" value="student" bind:group={data.role} hidden />
								<span class="choice-ic">
									<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M12 4 2 9l10 5 10-5-10-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
										<path d="M6 11v4.5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5V11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<span class="choice-title">Student</span>
								<span class="choice-desc">Learn skills & join courses</span>
							</label>

							<label class="choice" class:selected={data.role === 'lecturer'}>
								<input type="radio" name="role" value="lecturer" bind:group={data.role} hidden />
								<span class="choice-ic">
									<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.6" />
										<path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
									</svg>
								</span>
								<span class="choice-title">Lecturer</span>
								<span class="choice-desc">Teach & publish courses</span>
							</label>
						</div>
						{#if errors.role}<p class="field-error">{errors.role}</p>{/if}
					{:else if step === 2}
						<!-- Step 3: Education / role details -->
						{#if data.role === 'student'}
							<div class="field" class:invalid={errors.educationLevel}>
								<label for="educationLevel">Education level</label>
								<select id="educationLevel" bind:value={data.educationLevel} onchange={() => onInput('educationLevel')} disabled={isSubmitting}>
									<option value="" disabled>Select your level…</option>
									<option value="highschool">High School</option>
									<option value="undergrad">Undergraduate</option>
									<option value="postgrad">Postgraduate</option>
									<option value="other">Other</option>
								</select>
								{#if errors.educationLevel}<p class="field-error">{errors.educationLevel}</p>{/if}
							</div>
							<div class="field" class:invalid={errors.interest}>
								<label for="interest">Interests</label>
								<div class="tag-box">
									{#each data.interest as a, i}
										<span class="tag">
											{a}
											<button type="button" class="tag-x" onclick={() => removeInterest(i)} aria-label={'Remove ' + a} tabindex="-1">×</button>
										</span>
									{/each}
									<input
										id="interest"
										type="text"
										placeholder={data.interest.length ? 'Add another…' : 'e.g. AI, Design, Business'}
										bind:value={interestInput}
										onkeydown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addInterest(); } }}
										disabled={isSubmitting}
									/>
								</div>
								<button type="button" class="add-link" onclick={addInterest} disabled={isSubmitting || !interestInput.trim()}>
									+ Add interest
								</button>
								{#if errors.interest}<p class="field-error">{errors.interest}</p>{/if}
							</div>
							<div class="field" class:invalid={errors.goal}>
								<label for="goal">Career goal</label>
								<div class="tag-box">
									{#each data.goal as a, i}
										<span class="tag">
											{a}
											<button type="button" class="tag-x" onclick={() => removeGoal(i)} aria-label={'Remove ' + a} tabindex="-1">×</button>
										</span>
									{/each}
									<input
										id="goal"
										type="text"
										placeholder={data.goal.length ? 'Add another…' : 'e.g. Become a data scientist'}
										bind:value={goalInput}
										onkeydown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addGoal(); } }}
										disabled={isSubmitting}
									/>
								</div>
								<button type="button" class="add-link" onclick={addGoal} disabled={isSubmitting || !goalInput.trim()}>
									+ Add goal
								</button>
								{#if errors.goal}<p class="field-error">{errors.goal}</p>{/if}
							</div>
						{:else}
							<div class="field" class:invalid={errors.title}>
								<label for="title">Title</label>
								<select id="title" bind:value={data.title} onchange={() => onInput('title')} disabled={isSubmitting}>
									<option value="" disabled>Select your title…</option>
									<option value="Mr.">Mr.</option>
									<option value="Ms.">Ms.</option>
									<option value="Mrs.">Mrs.</option>
									<option value="Dr.">Dr.</option>
									<option value="Prof.">Prof.</option>
									<option value="Assoc. Prof.">Assoc. Prof.</option>
									<option value="Asst. Prof.">Asst. Prof.</option>
									<option value="Other">Other</option>
								</select>
								{#if errors.title}<p class="field-error">{errors.title}</p>{/if}
							</div>
							<div class="field" class:invalid={errors.experience}>
								<label for="experience">Years of experience</label>
								<input id="experience" type="number" min="0" placeholder="e.g. 5" bind:value={data.experience} oninput={() => onInput('experience')} disabled={isSubmitting} />
								{#if errors.experience}<p class="field-error">{errors.experience}</p>{/if}
							</div>
							<div class="field" class:invalid={errors.area}>
								<label for="area">Specialized area</label>
								<div class="tag-box">
									{#each data.area as a, i}
										<span class="tag">
											{a}
											<button type="button" class="tag-x" onclick={() => removeArea(i)} aria-label={'Remove ' + a} tabindex="-1">×</button>
										</span>
									{/each}
									<input
										id="area"
										type="text"
										placeholder={data.area.length ? 'Add another…' : 'e.g. Machine Learning'}
										bind:value={areaInput}
										onkeydown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addArea(); } }}
										disabled={isSubmitting}
									/>
								</div>
								<button type="button" class="add-link" onclick={addArea} disabled={isSubmitting || !areaInput.trim()}>
									+ Add area
								</button>
								{#if errors.area}<p class="field-error">{errors.area}</p>{/if}
							</div>
							<div class="field" class:invalid={errors.bio}>
								<label for="bio">Short biography</label>
								<textarea id="bio" rows="3" placeholder="Tell learners about yourself" bind:value={data.bio} oninput={() => onInput('bio')} disabled={isSubmitting}></textarea>
								{#if errors.bio}<p class="field-error">{errors.bio}</p>{/if}
							</div>
						{/if}
					{:else if step === 3}
						<!-- Step 4: Password -->
						<div class="field" class:invalid={errors.password}>
							<label for="password">Password</label>
							<div class="input-wrap">
								<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
									<path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
								</svg>
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Create a password"
									bind:value={data.password}
									oninput={() => onInput('password')}
									autocomplete="new-password"
									required
									disabled={isSubmitting}
								/>
								<button type="button" class="pass-toggle" onclick={() => (showPassword = !showPassword)} aria-label="Toggle password" tabindex="-1">
									{#if showPassword}
										<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
											<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
											<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
											<path d="m4 4 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
										</svg>
									{:else}
										<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
											<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
											<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
										</svg>
									{/if}
								</button>
							</div>
							{#if errors.password}<p class="field-error">{errors.password}</p>{/if}
						</div>
						<div class="field" class:invalid={errors.confirmPassword}>
							<label for="confirmPassword">Confirm password</label>
							<div class="input-wrap">
								<svg class="lead-ic" viewBox="0 0 20 20" fill="none" aria-hidden="true">
									<rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
									<path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
								</svg>
								<input
									id="confirmPassword"
									type={showConfirm ? 'text' : 'password'}
									placeholder="Re-enter your password"
									bind:value={data.confirmPassword}
									oninput={() => onInput('confirmPassword')}
									autocomplete="new-password"
									required
									disabled={isSubmitting}
								/>
								<button type="button" class="pass-toggle" onclick={() => (showConfirm = !showConfirm)} aria-label="Toggle confirm password" tabindex="-1">
									{#if showConfirm}
										<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
											<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
											<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
											<path d="m4 4 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
										</svg>
									{:else}
										<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
											<path d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
											<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
										</svg>
									{/if}
								</button>
							</div>
							{#if errors.confirmPassword}
								<p class="field-error">{errors.confirmPassword}</p>
							{/if}
						</div>
					{/if}

					<!-- Nav buttons -->
					<div class="nav-row" class:split={step > 0}>
						{#if step > 0}
							<button type="button" class="btn-ghost" onclick={back} disabled={isSubmitting}>Back</button>
						{/if}
						{#if step < TOTAL_STEPS - 1}
							<button type="button" class="btn-submit" onclick={next} disabled={isSubmitting}>
								<span class="btn-label">Next</span>
							</button>
						{:else}
							<button type="submit" class="btn-submit" class:loading={isSubmitting} disabled={isSubmitting || Object.keys(errors).length > 0}>
								<span class="spinner"></span>
								<span class="btn-label">{isSubmitting ? 'Creating account…' : 'Create account'}</span>
							</button>
						{/if}
					</div>
				</form>

				<p class="signup-line">
					Already have an account? <a href="/signin">Sign in</a>
				</p>

			{:else if currentStep === 'verify'}
				<p class="eyebrow">Almost there</p>
				<h2>Verify your email</h2>
				<p class="sub">We sent a 6-digit confirmation code to <strong>{trackingEmail}</strong>.</p>

				{#if form?.message}
					<div class="alert" class:error={!form.success} class:success={form.success} role="alert">
						<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
								clip-rule="evenodd"
							/>
						</svg>
						<span>{form.message}</span>
					</div>
				{/if}

				<form
					method="POST"
					action="?/verify"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<input type="hidden" name="email" value={trackingEmail} />
					<div class="field">
						<label for="otp">Verification code</label>
						<input id="otp" type="text" name="otp" placeholder="123456" maxlength="6" autocomplete="one-time-code" required disabled={isSubmitting} class="otp-input" />
					</div>
					<button type="submit" class="btn-submit" class:loading={isSubmitting} disabled={isSubmitting}>
						<span class="spinner"></span>
						<span class="btn-label">{isSubmitting ? 'Verifying…' : 'Confirm & activate'}</span>
					</button>
				</form>

				<form
					method="POST"
					action="?/resend"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
					class="resend-container"
				>
					<input type="hidden" name="email" value={trackingEmail} />
					<button type="submit" class="link-btn" disabled={isSubmitting}> Didn't get a code? Resend it. </button>
				</form>

			{:else if currentStep === 'pending-approval'}
				<div class="approval-card">
					<div class="approval-badge">✓</div>
					<h2>Registration received</h2>
					<p>{form?.message}</p>
					<p class="muted">You’ll get an email once your workspace is enabled by our team.</p>
					<a href="/signin" class="btn-submit inline">Return to sign in</a>
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.stage {
		min-height: 100vh;
		display: flex;
		font-family: 'Inter', system-ui, sans-serif;
		color: #161a2b;
		background: #f5f6fb;
	}

	/* ---------- Brand panel ---------- */
	.brand-panel {
		position: relative;
		flex: 0 0 44%;
		max-width: 580px;
		background: radial-gradient(120% 140% at 15% 0%, #6a5cf0 0%, #4f46e5 42%, #2e1f8f 100%);
		color: #fff;
		padding: 56px 52px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
	}
	.brand-panel::before,
	.brand-panel::after {
		content: '';
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.14);
	}
	.brand-panel::before {
		width: 520px;
		height: 520px;
		right: -220px;
		top: -160px;
	}
	.brand-panel::after {
		width: 340px;
		height: 340px;
		right: -140px;
		bottom: -120px;
		border-color: rgba(255, 255, 255, 0.1);
	}
	.ring-orbit {
		position: absolute;
		width: 230px;
		height: 230px;
		border-radius: 50%;
		border: 1px dashed rgba(255, 255, 255, 0.22);
		right: 60px;
		top: 40%;
	}
	.ring-orbit .dot {
		position: absolute;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #f2a93b;
		top: -5px;
		left: calc(50% - 5px);
		box-shadow: 0 0 0 6px rgba(242, 169, 59, 0.18);
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.brand-mark {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 1.05rem;
		position: relative;
		z-index: 1;
		color: #fff;
		text-decoration: none;
	}
	.brand-mark .glyph {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(2px);
	}
	.brand-mark .glyph svg {
		width: 20px;
		height: 20px;
	}
	.brand-copy {
		position: relative;
		z-index: 1;
		max-width: 400px;
	}
	.brand-copy h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.7rem, 2.6vw, 2.15rem);
		line-height: 1.18;
		font-weight: 700;
		margin: 0 0 14px;
	}
	.brand-copy p {
		color: rgba(255, 255, 255, 0.78);
		font-size: 0.94rem;
		line-height: 1.6;
		margin: 0;
	}
	.stat-row {
		display: flex;
		gap: 28px;
		margin-top: 34px;
	}
	.stat-row .stat b {
		display: block;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
	}
	.stat-row .stat span {
		font-size: 0.76rem;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.quote {
		position: relative;
		z-index: 1;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
		padding-top: 20px;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.72);
		line-height: 1.6;
		margin: 0;
	}
	.quote strong {
		color: #fff;
		font-weight: 600;
	}

	/* ---------- Form panel ---------- */
	.form-panel {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
	}
	.form-card {
		width: 100%;
		max-width: 440px;
	}

	.eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: #0ea5a0;
		margin: 0 0 8px;
	}
	.form-card h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 700;
		font-size: 1.6rem;
		margin: 0 0 6px;
	}
	.form-card .sub {
		color: #5b6072;
		font-size: 0.92rem;
		margin: 0 0 22px;
	}

	/* Stepper */
	.stepper {
		list-style: none;
		display: flex;
		gap: 6px;
		padding: 0;
		margin: 0 0 12px;
	}
	.stepper li {
		flex: 1;
		display: flex;
	}
	.step-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		font-size: 0.68rem;
		color: #9aa0b4;
		font-weight: 600;
		user-select: none;
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		cursor: default;
	}
	.step-btn.clickable {
		cursor: pointer;
	}
	.step-btn:disabled {
		cursor: default;
	}
	.step-btn:focus-visible {
		outline: 2px solid #4f46e5;
		outline-offset: 3px;
		border-radius: 8px;
	}
	.stepper .node {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ececf5;
		color: #9aa0b4;
		font-size: 0.8rem;
		border: 2px solid transparent;
		transition: all 0.25s;
	}
	.stepper li.active .node {
		background: #4f46e5;
		color: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
	}
	.stepper li.done .node {
		background: #0ea5a0;
		color: #fff;
	}
	.stepper li.active .label {
		color: #161a2b;
	}
	.stepper li.done .label {
		color: #0ea5a0;
	}

	.progress {
		height: 5px;
		background: #ececf5;
		border-radius: 99px;
		overflow: hidden;
		margin-bottom: 26px;
	}
	.progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #4f46e5, #0ea5a0);
		border-radius: 99px;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Alert */
	.alert {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-radius: 10px;
		font-size: 0.88rem;
		margin-bottom: 20px;
		line-height: 1.4;
	}
	.alert svg {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.alert.error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}
	.alert.success {
		background: #f0fdf4;
		color: #166534;
		border: 1px solid #86efac;
	}

	/* Fields */
	.field {
		margin-bottom: 16px;
	}
	.field label {
		display: block;
		font-size: 0.78rem;
		font-weight: 600;
		color: #5b6072;
		margin-bottom: 7px;
	}
	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}
	.lead-ic {
		position: absolute;
		left: 13px;
		width: 18px;
		height: 18px;
		color: #9aa0b4;
		pointer-events: none;
	}
	.input-wrap input,
	.field input,
	.field select,
	.field textarea {
		width: 100%;
		font-family: 'Inter', sans-serif;
		font-size: 0.92rem;
		color: #161a2b;
		background: #fbfbfe;
		border: 1.5px solid #e7e8f2;
		border-radius: 10px;
		padding: 12px 14px;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
		box-sizing: border-box;
	}
	.input-wrap input {
		padding-left: 40px;
	}
	.field select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 8l5 5 5-5' stroke='%239aa0b4' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 14px center;
		padding-right: 36px;
	}
	.field textarea {
		resize: vertical;
		line-height: 1.5;
	}
	.field input::placeholder,
	.field textarea::placeholder {
		color: #a3a8ba;
	}
	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		border-color: #4f46e5;
		background: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
	}
	.input-wrap:focus-within .lead-ic {
		color: #4f46e5;
	}
	.field input:disabled,
	.field select:disabled,
	.field textarea:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Tag input (specialized areas) */
	.tag-box {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		min-height: 46px;
		padding: 8px 10px;
		border: 1.5px solid #e7e8f2;
		border-radius: 10px;
		background: #fbfbfe;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
	}
	.tag-box:focus-within {
		border-color: #4f46e5;
		background: #fff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #eef0ff;
		color: #4338ca;
		border: 1px solid #dcdcfb;
		border-radius: 99px;
		padding: 5px 10px;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.tag-x {
		background: none;
		border: none;
		color: #4338ca;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0 2px;
		border-radius: 50%;
	}
	.tag-x:hover {
		color: #1e1b4b;
	}
	.tag-box input {
		flex: 1;
		min-width: 120px;
		border: none;
		outline: none;
		background: transparent;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		padding: 4px 2px;
		color: #161a2b;
	}
	.field.invalid .tag-box {
		border-color: #dc2626;
		box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
	}
	.add-link {
		margin-top: 8px;
		background: none;
		border: none;
		color: #4f46e5;
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
	}
	.add-link:disabled {
		color: #b9bce0;
		cursor: default;
	}

	.field-error {
		color: #dc2626;
		font-size: 0.78rem;
		margin: 6px 0 0;
	}
	.field.invalid input,
	.field.invalid select,
	.field.invalid textarea {
		border-color: #dc2626;
		box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
	}
	.choice-grid.invalid {
		outline: 2px dashed #dc2626;
		outline-offset: 4px;
		border-radius: 14px;
	}

	.pass-toggle {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		padding: 5px;
		color: #9aa0b4;
		cursor: pointer;
		display: flex;
		align-items: center;
		border-radius: 6px;
		transition: color 0.2s;
	}
	.pass-toggle:hover {
		color: #4f46e5;
	}
	.pass-toggle svg {
		width: 18px;
		height: 18px;
	}

	/* Choice cards */
	.choice-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 8px;
	}
	.choice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 18px 16px;
		border: 1.5px solid #e7e8f2;
		border-radius: 14px;
		background: #fbfbfe;
		cursor: pointer;
		transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
	}
	.choice:hover {
		border-color: #c5c8ee;
		background: #fafaff;
	}
	.choice.selected {
		border-color: #4f46e5;
		background: #f3f1ff;
		box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
	}
	.choice-ic {
		width: 38px;
		height: 38px;
		border-radius: 10px;
		background: rgba(79, 70, 229, 0.1);
		color: #4f46e5;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.choice-ic svg {
		width: 22px;
		height: 22px;
	}
	.choice.selected .choice-ic {
		background: #4f46e5;
		color: #fff;
	}
	.choice-title {
		font-weight: 700;
		font-size: 0.95rem;
		color: #161a2b;
	}
	.choice-desc {
		font-size: 0.78rem;
		color: #5b6072;
		line-height: 1.4;
	}

	/* Nav buttons */
	.nav-row {
		display: flex;
		margin-top: 8px;
	}
	.nav-row.split {
		gap: 12px;
	}
	.nav-row .btn-submit {
		flex: 1;
	}
	.btn-ghost {
		width: 110px;
		border: 1.5px solid #e7e8f2;
		background: #fff;
		color: #5b6072;
		border-radius: 11px;
		padding: 14px;
		font-weight: 700;
		font-size: 0.94rem;
		cursor: pointer;
		transition: border-color 0.2s, color 0.2s;
	}
	.btn-ghost:hover:not(:disabled) {
		border-color: #c5c8ee;
		color: #161a2b;
	}

	/* Submit */
	.btn-submit {
		position: relative;
		width: 100%;
		border: none;
		border-radius: 11px;
		padding: 14px;
		font-family: 'Inter', sans-serif;
		font-weight: 700;
		font-size: 0.94rem;
		color: #fff;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		box-shadow: 0 10px 24px -10px rgba(79, 70, 229, 0.55);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		overflow: hidden;
		transition: box-shadow 0.18s, background 0.18s, opacity 0.18s;
		text-decoration: none;
	}
	.btn-submit.inline {
		display: inline-flex;
		width: auto;
		padding: 12px 22px;
		margin-top: 6px;
	}
	.btn-submit:hover:not(:disabled) {
		background: linear-gradient(135deg, #4338ca, #5b53e0);
		box-shadow: 0 14px 28px -10px rgba(79, 70, 229, 0.6);
	}
	.btn-submit:active:not(:disabled) {
		background: linear-gradient(135deg, #3b30b8, #4f46e5);
	}
	.btn-submit:disabled {
		opacity: 0.85;
		cursor: default;
	}
	.spinner {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		animation: spin 0.7s linear infinite;
		display: none;
	}
	.btn-submit.loading .spinner {
		display: inline-block;
	}

	.signup-line {
		text-align: center;
		margin-top: 22px;
		font-size: 0.86rem;
		color: #5b6072;
	}
	.signup-line a {
		color: #4f46e5;
		font-weight: 700;
		text-decoration: none;
	}
	.signup-line a:hover {
		text-decoration: underline;
	}

	.otp-input {
		text-align: center;
		font-size: 1.4rem;
		letter-spacing: 0.35rem;
		font-weight: 600;
	}

	.resend-container {
		margin-top: 16px;
		text-align: center;
	}
	.link-btn {
		background: none;
		color: #4f46e5;
		border: none;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}
	.link-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	/* Pending approval */
	.approval-card {
		text-align: center;
	}
	.approval-badge {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, #4f46e5, #6d5cf3);
		color: #fff;
		font-size: 1.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 18px;
	}
	.approval-card p {
		color: #5b6072;
		font-size: 0.92rem;
		line-height: 1.6;
	}
	.approval-card .muted {
		color: #9aa0b4;
		font-size: 0.85rem;
	}

	/* ---------- Responsive ---------- */
	@media (max-width: 900px) {
		.brand-panel {
			display: none;
		}
		.form-panel {
			padding: 40px 20px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		*,
		.ring-orbit,
		.form-card {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
