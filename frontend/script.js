// API Base URL
const API_BASE = window.location.origin;

// Load content from API
async function loadContent() {
    try {
        const response = await fetch(`${API_BASE}/api/content`);
        const content = await response.json();

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
            const logos = document.querySelectorAll('#logo-img, #footer-logo-img');
            logos.forEach(logo => {
                if (logo) logo.src = content.logo_url;
            });
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Load Hero Slider
async function loadHeroSlider() {
    const wrapper = document.getElementById('hero-slider-wrapper');
    if (!wrapper) return;

    try {
        const response = await fetch(`${API_BASE}/api/hero-slides`);
        const slides = await response.json();

        if (!slides.length) {
            // Fallback slide
            wrapper.innerHTML = `
                <div class="swiper-slide hero-slide">
                    <div class="hero-slide-background" style="background: linear-gradient(135deg, rgba(0, 201, 109, 0.4), rgba(230, 57, 70, 0.4));"></div>
                    <div class="hero-slide-overlay align-center">
                        <div class="hero-slide-content">
                            <h1>Empowering the Next Generation</h1>
                            <p>Building political awareness and voter education for Nigerian youth aged 15-25</p>
                            <div class="hero-slide-buttons">
                                <a href="#register" class="hero-slide-button primary">Join Us</a>
                                <a href="/conferences" class="hero-slide-button secondary">View Conferences</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            wrapper.innerHTML = slides.map(slide => {
                const alignmentClass = `align-${slide.overlay_alignment || 'left'}`;
                const bgStyle = slide.background_image_path 
                    ? `background-image: url('${slide.background_image_path}');`
                    : `background: linear-gradient(135deg, rgba(0, 201, 109, 0.4), rgba(230, 57, 70, 0.4));`;

                const buttonsHtml = slide.buttons && slide.buttons.length > 0
                    ? `<div class="hero-slide-buttons">
                         ${slide.buttons.map(btn => `
                           <a href="${btn.url}" class="hero-slide-button ${btn.style || 'primary'}">
                             ${btn.text}
                           </a>
                         `).join('')}
                       </div>`
                    : '';

                return `
                    <div class="swiper-slide hero-slide">
                        <div class="hero-slide-background" style="${bgStyle}"></div>
                        <div class="hero-slide-overlay ${alignmentClass}">
                            <div class="hero-slide-content">
                                ${slide.is_conference_slide ? '<div class="hero-slide-badge">📅 Featured Conference</div>' : ''}
                                <h1>${slide.title}</h1>
                                ${slide.subtitle ? `<p>${slide.subtitle}</p>` : ''}
                                ${buttonsHtml}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Initialize Swiper
        if (typeof Swiper !== 'undefined') {
            new Swiper('.hero-swiper', {
                loop: slides.length > 1,
                autoplay: {
                    delay: 6000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                },
                effect: 'slide',
                speed: 800,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: true
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                },
                grabCursor: true,
                keyboard: {
                    enabled: true
                }
            });
        }
    } catch (error) {
        console.error('Error loading hero slider:', error);
        // Fallback on error
        wrapper.innerHTML = `
            <div class="swiper-slide hero-slide">
                <div class="hero-slide-background" style="background: linear-gradient(135deg, rgba(0, 201, 109, 0.4), rgba(230, 57, 70, 0.4));"></div>
                <div class="hero-slide-overlay align-center">
                    <div class="hero-slide-content">
                        <h1>Welcome to NextGen Community</h1>
                        <p>Empowering Nigerian youth through political awareness and civic engagement</p>
                    </div>
                </div>
            </div>
        `;
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

// Typeahead functionality is handled by typeahead.js
// These functions are kept for backward compatibility but are no longer used

// Registration Form
const registrationForm = document.getElementById('registration-form');
const isRegisteredVoter = document.getElementById('is_registered_voter');
const isStudent = document.getElementById('is_student');
const reasonGroup = document.getElementById('reason-group');
const voterStateGroup = document.getElementById('voter-state-group');
const institutionGroup = document.getElementById('institution-group');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
    loadHeroSlider();
    
    // Typeaheads will be initialized automatically by typeahead.js
    if (typeof initAllTypeaheads === 'function') {
        initAllTypeaheads();
    }
    
    // Smooth scroll for anchor links
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
});

if (isStudent) {
    isStudent.addEventListener('change', (e) => {
        if (e.target.value === 'true') {
            institutionGroup.style.display = 'block';
            document.getElementById('institution').required = true;
        } else {
            institutionGroup.style.display = 'none';
            document.getElementById('institution').required = false;
            document.getElementById('institution').value = '';
        }
    });
}

if (isRegisteredVoter) {
    isRegisteredVoter.addEventListener('change', (e) => {
        if (e.target.value === 'true') {
            // Show voter state field
            voterStateGroup.style.display = 'block';
            document.getElementById('voter_state').required = true;
            // Hide reason field
            reasonGroup.style.display = 'none';
            document.getElementById('not_registered_reason').required = false;
        } else if (e.target.value === 'false') {
            // Show reason field
            reasonGroup.style.display = 'block';
            document.getElementById('not_registered_reason').required = true;
            // Hide voter state field
            voterStateGroup.style.display = 'none';
            document.getElementById('voter_state').required = false;
        } else {
            // Hide both
            voterStateGroup.style.display = 'none';
            reasonGroup.style.display = 'none';
            document.getElementById('voter_state').required = false;
            document.getElementById('not_registered_reason').required = false;
        }
    });
}

if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registrationForm);
        // Calculate age from date of birth
        const dob = new Date(formData.get('date_of_birth'));
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        // Get values from typeahead inputs or hidden inputs
        const stateValue = document.getElementById('state-value')?.value || document.getElementById('state')?.value;
        const institutionValue = document.getElementById('institution-value')?.value || document.getElementById('institution')?.value;
        const voterStateValue = document.getElementById('voter_state-value')?.value || document.getElementById('voter_state')?.value;

        const data = {
            full_name: formData.get('full_name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            age: age,
            date_of_birth: formData.get('date_of_birth'),
            gender: formData.get('gender'),
            state: stateValue,
            lga: formData.get('lga'),
            occupation: formData.get('occupation') || null,
            is_student: formData.get('is_student') === 'true',
            institution: institutionValue || null,
            is_registered_voter: formData.get('is_registered_voter') === 'true',
            voter_state: voterStateValue || null,
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

// Handle logo fallback
const logoImages = document.querySelectorAll('#logo-img, #hero-logo-img, #footer-logo-img');
logoImages.forEach(img => {
    if (img) {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    }
});

