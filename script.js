import { inject } from '@vercel/analytics';

// Vercel Web Analytics. The endpoint only exists on Vercel, so this is a
// no-op locally rather than an error.
inject();

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Mobile navigation
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');

if (hamburger && nav) {
	const setOpen = (open) => {
		nav.classList.toggle('open', open);
		hamburger.setAttribute('aria-expanded', String(open));
	};

	hamburger.addEventListener('click', (e) => {
		e.stopPropagation();
		setOpen(!nav.classList.contains('open'));
	});

	// Any navigation choice closes the menu.
	nav.addEventListener('click', (e) => {
		if (e.target.closest('a')) setOpen(false);
	});

	document.addEventListener('click', (e) => {
		if (!nav.contains(e.target) && !hamburger.contains(e.target)) setOpen(false);
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') setOpen(false);
	});

	// Leaving the mobile breakpoint should not strand the menu in an open state.
	window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
		if (e.matches) setOpen(false);
	});
}
