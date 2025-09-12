// Greeting
const now = new Date();
const hours = now.getHours();
let greeting;

if (hours < 12) {
	greeting = "Good morning!";
} else if (hours < 18) {
	greeting = "Good afternoon!";
} else if (hours === 23) {
	greeting = "It's almost midnight!";
} else {
	greeting = "Good evening!";
}

const greetingEl = document.getElementById("greeting");
if (greetingEl) greetingEl.innerText = greeting;

// Year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Mobile nav toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
	hamburger.addEventListener('click', () => {
		const expanded = hamburger.getAttribute('aria-expanded') === 'true';
		hamburger.setAttribute('aria-expanded', String(!expanded));
		navLinks.classList.toggle('open');
	});
}

// Close nav on link click (mobile)
if (navLinks) {
	navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
		link.addEventListener('click', () => {
			navLinks.classList.remove('open');
			hamburger && hamburger.setAttribute('aria-expanded', 'false');
		});
	});
}

// Smooth scroll focus management
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', (e) => {
		const targetId = anchor.getAttribute('href');
		if (!targetId || targetId === '#') return;
		const target = document.querySelector(targetId);
		if (!target) return;
		e.preventDefault();
		target.scrollIntoView({ behavior: 'smooth' });
	});
});

// Contact form validation
const form = document.getElementById('contact-form');
if (form) {
	const nameInput = document.getElementById('name');
	const emailInput = document.getElementById('email');
	const messageInput = document.getElementById('message');
	const errorName = document.getElementById('error-name');
	const errorEmail = document.getElementById('error-email');
	const errorMessage = document.getElementById('error-message');

	function validateEmail(value) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	form.addEventListener('submit', (e) => {
		let valid = true;
		if (nameInput && errorName) {
			if (!nameInput.value.trim()) { errorName.textContent = 'Please enter your name.'; valid = false; } else { errorName.textContent = ''; }
		}
		if (emailInput && errorEmail) {
			if (!validateEmail(emailInput.value)) { errorEmail.textContent = 'Enter a valid email.'; valid = false; } else { errorEmail.textContent = ''; }
		}
		if (messageInput && errorMessage) {
			if (messageInput.value.trim().length < 10) { errorMessage.textContent = 'Please enter at least 10 characters.'; valid = false; } else { errorMessage.textContent = ''; }
		}
		if (!valid) e.preventDefault();
	});
}