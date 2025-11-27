// API Base URL
const API_BASE = window.location.origin;

// Load content from API
async function loadContent() {
    try {
        const response = await fetch(`${API_BASE}/api/content`);
        const content = await response.json();

        // Update hero section
        if (content.hero_tagline) {
            const titleEl = document.getElementById('hero-title');
            const taglineEl = document.getElementById('hero-tagline-text');
            if (titleEl && content.hero_tagline.title) titleEl.textContent = content.hero_tagline.title;
            if (taglineEl && content.hero_tagline.content) taglineEl.textContent = content.hero_tagline.content;
        }

        // Update mission
        if (content.mission_statement) {
            const missionEl = document.getElementById('mission-text');
            if (missionEl && content.mission_statement.content) {
                missionEl.textContent = content.mission_statement.content;
            }
        }

        // Update about section
        if (content.about) {
            const aboutEl = document.getElementById('about-text');
            if (aboutEl && content.about.content) {
                aboutEl.textContent = content.about.content;
            }
            if (content.about.image_url) {
                const imgEl = document.getElementById('about-image');
                if (imgEl) imgEl.src = content.about.image_url;
            }
        }

        // Update logo if provided
        if (content.logo_url) {
            const logos = document.querySelectorAll('#logo-img, #hero-logo-img, #footer-logo-img');
            logos.forEach(logo => {
                if (logo) logo.src = content.logo_url;
            });
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Registration Form
const registrationForm = document.getElementById('registration-form');
const isRegisteredVoter = document.getElementById('is_registered_voter');
const reasonGroup = document.getElementById('reason-group');

if (isRegisteredVoter) {
    isRegisteredVoter.addEventListener('change', (e) => {
        if (e.target.value === 'false') {
            reasonGroup.style.display = 'block';
            document.getElementById('not_registered_reason').required = true;
        } else {
            reasonGroup.style.display = 'none';
            document.getElementById('not_registered_reason').required = false;
        }
    });
}

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registrationForm);
        const data = {
            full_name: formData.get('full_name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            age: parseInt(formData.get('age')),
            gender: formData.get('gender'),
            state: formData.get('state'),
            lga: formData.get('lga'),
            occupation: formData.get('occupation') || null,
            is_registered_voter: formData.get('is_registered_voter') === 'true',
            not_registered_reason: formData.get('not_registered_reason') || null
        };

        try {
            const response = await fetch(`${API_BASE}/api/members/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showSuccessModal();
                registrationForm.reset();
                reasonGroup.style.display = 'none';
            } else {
                alert(result.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred. Please try again later.');
        }
    });
}

// Success Modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('success-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with X button
const closeBtn = document.querySelector('.close-modal');
if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
        }
    });
}, observerOptions);

document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
});

// Load content on page load
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
});

// Handle logo fallback
const logoImages = document.querySelectorAll('#logo-img, #hero-logo-img, #footer-logo-img');
logoImages.forEach(img => {
    if (img) {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    }
});

