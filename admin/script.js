// API Base URL
const API_BASE = window.location.origin;
let authToken = localStorage.getItem('authToken');

// Check authentication on load
window.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showLogin();
    }
});

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
                showDashboard(data.username);
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Network error. Please try again.';
            errorDiv.classList.add('show');
        }
    });
}

// Verify Token
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            showDashboard(data.user.username);
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

// Show/Hide Screens
function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard(username) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('username-display').textContent = username;
    loadContent();
    loadMembers();
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('authToken');
    showLogin();
});

// Navigation
document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        showSection(section);
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
    });
});

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(sec => {
        sec.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update title
    const titles = {
        'content': 'Content Management',
        'members': 'Members',
        'media': 'Media Library',
        'conferences': 'Conferences',
        'attendance': 'Attendance Scanner',
        'reps': 'Institution Reps',
        'hero-slider': 'Hero Slider Manager',
        'settings': 'Settings'
    };
    document.getElementById('section-title').textContent = titles[section] || 'Dashboard';

    // Load section-specific data
    if (section === 'conferences') {
        loadConferences();
    } else if (section === 'attendance') {
        loadConferencesForScanner();
    } else if (section === 'reps') {
        loadRepsConferences();
    } else if (section === 'hero-slider') {
        loadHeroSlides();
    } else if (section === 'settings') {
        // Reset password form when opening settings
        const form = document.getElementById('change-password-form');
        if (form) {
            form.reset();
            const errorDiv = document.getElementById('password-change-error');
            const successDiv = document.getElementById('password-change-success');
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';
        }
    }
}

// Load Content
async function loadContent() {
    try {
        const response = await fetch(`${API_BASE}/api/content`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const content = await response.json();

        // Populate forms
        if (content.hero_tagline) {
            document.getElementById('hero-title-input').value = content.hero_tagline.title || '';
            document.getElementById('hero-tagline-input').value = content.hero_tagline.content || '';
        }

        if (content.mission_statement) {
            document.getElementById('mission-title-input').value = content.mission_statement.title || '';
            document.getElementById('mission-content-input').value = content.mission_statement.content || '';
        }

        if (content.about) {
            document.getElementById('about-title-input').value = content.about.title || '';
            document.getElementById('about-content-input').value = content.about.content || '';
            document.getElementById('about-image-input').value = content.about.image_url || '';
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Save Content
document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
        const key = this.getAttribute('data-key');
        let data = {};

        if (key === 'hero_tagline') {
            data = {
                title: document.getElementById('hero-title-input').value,
                content: document.getElementById('hero-tagline-input').value
            };
        } else if (key === 'mission_statement') {
            data = {
                title: document.getElementById('mission-title-input').value,
                content: document.getElementById('mission-content-input').value
            };
        } else if (key === 'about') {
            data = {
                title: document.getElementById('about-title-input').value,
                content: document.getElementById('about-content-input').value,
                image_url: document.getElementById('about-image-input').value
            };
        }

        // Handle file upload for about image
        const aboutImageFile = document.getElementById('about-image-file');
        if (aboutImageFile && aboutImageFile.files.length > 0 && key === 'about') {
            const formData = new FormData();
            formData.append('file', aboutImageFile.files[0]);
            
            try {
                const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                });
                const uploadData = await uploadResponse.json();
                if (uploadData.url) {
                    data.image_url = uploadData.url;
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        }

        // Handle banner upload
        if (key === 'banner') {
            const bannerFile = document.getElementById('banner-file');
            if (bannerFile && bannerFile.files.length > 0) {
                const formData = new FormData();
                formData.append('file', bannerFile.files[0]);
                
                try {
                    const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: formData
                    });
                    const uploadData = await uploadResponse.json();
                    if (uploadData.url) {
                        data.banner_url = uploadData.url;
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                }
            }
        }

        // Save content
        try {
            this.classList.add('saving');
            this.textContent = 'Saving...';

            const response = await fetch(`${API_BASE}/api/content/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.textContent = 'Saved!';
                setTimeout(() => {
                    this.textContent = 'Save';
                    this.classList.remove('saving');
                }, 2000);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.textContent = 'Error';
            setTimeout(() => {
                this.textContent = 'Save';
                this.classList.remove('saving');
            }, 2000);
        }
    });
});

// Load Members
async function loadMembers() {
    try {
        const response = await fetch(`${API_BASE}/api/members`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const members = await response.json();

        // Update count
        document.getElementById('total-members').textContent = members.length;

        // Update table
        const tbody = document.getElementById('members-tbody');
        if (members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading">No members registered yet.</td></tr>';
        } else {
            tbody.innerHTML = members.map(m => `
                <tr>
                    <td>${m.id}</td>
                    <td>${m.full_name}</td>
                    <td>${m.email}</td>
                    <td>${m.phone}</td>
                    <td>${m.age}</td>
                    <td>${m.state}</td>
                    <td>${m.lga}</td>
                    <td>${m.is_registered_voter ? 'Yes' : 'No'}</td>
                    <td>${new Date(m.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Export CSV
document.getElementById('export-csv-btn')?.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}/api/members/export`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nextgen_members.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Export failed. Please try again.');
    }
});

// Media Upload
document.getElementById('media-upload')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                addMediaItem(data.url, file.type);
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }
});

function addMediaItem(url, type) {
    const grid = document.getElementById('media-grid');
    if (grid.querySelector('.loading')) {
        grid.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'media-item';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = () => deleteMedia(url, deleteBtn);
    
    if (type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Media';
        item.appendChild(img);
        item.appendChild(deleteBtn);
    } else if (type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        item.appendChild(video);
        item.appendChild(deleteBtn);
    }

    grid.appendChild(item);
}

async function deleteMedia(url, btn) {
    const filename = url.split('/').pop();
    try {
        const response = await fetch(`${API_BASE}/api/upload/${filename}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            btn.closest('.media-item').remove();
        }
    } catch (error) {
        console.error('Delete error:', error);
    }
}

// Image preview
document.getElementById('about-image-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('about-image-input').parentElement;
            let previewDiv = preview.querySelector('.image-preview');
            if (!previewDiv) {
                previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview';
                preview.appendChild(previewDiv);
            }
            previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('banner-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('banner-preview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Banner Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// ========== CONFERENCE MANAGEMENT ==========

// Load conferences
async function loadConferences() {
    try {
        const response = await fetch(`${API_BASE}/api/conferences?status=all`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const conferences = await response.json();

        const list = document.getElementById('conferences-list');
        if (conferences.length === 0) {
            list.innerHTML = '<p class="loading">No conferences yet. Create your first conference!</p>';
            return;
        }

        list.innerHTML = conferences.map(conf => {
            const hasDate = conf.date && conf.date.trim() !== '';
            const dateDisplay = hasDate ? new Date(conf.date).toLocaleDateString() : 'Coming Soon';
            return `
                <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="color: var(--primary-green); margin-bottom: 0.5rem;">${conf.title}</h3>
                            <p style="color: var(--text-secondary);">${dateDisplay} ${conf.time || ''}</p>
                            <span style="display: inline-block; padding: 0.3rem 0.8rem; background: ${conf.status === 'published' ? 'rgba(0, 201, 109, 0.2)' : 'rgba(230, 57, 70, 0.2)'}; color: ${conf.status === 'published' ? 'var(--primary-green)' : 'var(--primary-red)'}; border-radius: 20px; font-size: 0.8rem; margin-top: 0.5rem;">
                                ${conf.status === 'published' ? '✓ Published' : 'Draft'}
                            </span>
                            ${!hasDate ? `<span style="display: inline-block; padding: 0.3rem 0.8rem; background: rgba(255, 165, 0, 0.2); color: #ff8c00; border-radius: 20px; font-size: 0.8rem; margin-top: 0.5rem; margin-left: 0.5rem;">⏳ Coming Soon</span>` : ''}
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${conf.status === 'published' 
                                ? `<button class="save-btn" onclick="toggleConferenceStatus(${conf.id}, 'draft')" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: #ffa500;">Unpublish</button>`
                                : `<button class="save-btn" onclick="toggleConferenceStatus(${conf.id}, 'published')" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--primary-green);">Publish</button>`
                            }
                            <button class="save-btn" onclick="editConference(${conf.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Edit</button>
                            <button class="save-btn" onclick="viewConferenceRegistrations(${conf.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--primary-green);">Registrations</button>
                            ${conf.status === 'draft' ? `<button class="save-btn" onclick="deleteConference(${conf.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--primary-red);">Delete</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading conferences:', error);
    }
}

// New conference button
document.getElementById('new-conference-btn')?.addEventListener('click', () => {
    openConferenceModal();
});

// Conference form submission
document.getElementById('conference-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('conference-id').value;
    const data = {
        title: document.getElementById('conf-title').value,
        description: document.getElementById('conf-description').value,
        date: document.getElementById('conf-date').value,
        time: document.getElementById('conf-time').value,
        venue: document.getElementById('conf-venue').value,
        address: document.getElementById('conf-address').value,
        banner: document.getElementById('conf-banner').value,
        status: document.getElementById('conf-status').value,
        featured_in_slider: document.getElementById('conf-featured') ? document.getElementById('conf-featured').checked : false,
        registration_enabled: document.getElementById('conf-registration-enabled') ? document.getElementById('conf-registration-enabled').checked : true,
        guidelines: document.getElementById('conf-guidelines').value
    };

    // Parse speakers and agenda
    try {
        const speakersText = document.getElementById('conf-speakers').value.trim();
        if (speakersText) {
            data.speakers = JSON.parse(speakersText);
        } else {
            data.speakers = [];
        }
    } catch (e) {
        alert('Invalid speakers JSON format. Please check your JSON syntax.');
        console.error('Speakers JSON parse error:', e);
        return;
    }

    try {
        const agendaText = document.getElementById('conf-agenda').value.trim();
        if (agendaText) {
            data.agenda = JSON.parse(agendaText);
        } else {
            data.agenda = [];
        }
    } catch (e) {
        alert('Invalid agenda JSON format. Please check your JSON syntax.');
        console.error('Agenda JSON parse error:', e);
        return;
    }

    // Handle banner upload
    const bannerFile = document.getElementById('conf-banner-file').files[0];
    if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        try {
            const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
            const uploadData = await uploadResponse.json();
            if (uploadData.url) {
                data.banner = uploadData.url;
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    }

    try {
        const url = id ? `${API_BASE}/api/conferences/${id}` : `${API_BASE}/api/conferences`;
        const method = id ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const savedConference = await response.json();
            alert('Conference saved successfully!');
            closeConferenceModal();
            loadConferences();
        } else {
            let errorMessage = 'Unknown error';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || response.statusText;
                if (errorData.details) {
                    console.error('Server error details:', errorData.details);
                }
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                console.error('Failed to parse error response:', parseError);
            }
            console.error('Conference save failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorMessage
            });
            alert(`Error saving conference: ${errorMessage}\n\nCheck the browser console for more details.`);
        }
    } catch (error) {
        console.error('Conference save error:', error);
        console.error('Error stack:', error.stack);
        alert(`Error saving conference: ${error.message || 'Network error'}\n\nCheck the browser console for more details.`);
    }
});

function openConferenceModal(conference = null) {
    const modal = document.getElementById('conference-modal');
    const form = document.getElementById('conference-form');
    form.reset();
    
    if (conference) {
        document.getElementById('modal-title').textContent = 'Edit Conference';
        document.getElementById('conference-id').value = conference.id;
        document.getElementById('conf-title').value = conference.title || '';
        document.getElementById('conf-description').value = conference.description || '';
        document.getElementById('conf-date').value = (conference.date && conference.date.trim() !== '') ? conference.date : '';
        document.getElementById('conf-time').value = conference.time || '';
        document.getElementById('conf-venue').value = conference.venue || '';
        document.getElementById('conf-address').value = conference.address || '';
        document.getElementById('conf-banner').value = conference.banner || '';
        document.getElementById('conf-status').value = conference.status || 'draft';
        
        // Safely set featured checkbox if it exists
        const featuredCheckbox = document.getElementById('conf-featured');
        if (featuredCheckbox) {
            featuredCheckbox.checked = conference.featured_in_slider === 1 || conference.featured_in_slider === true;
        }
        
        // Set registration enabled checkbox
        const registrationCheckbox = document.getElementById('conf-registration-enabled');
        if (registrationCheckbox) {
            registrationCheckbox.checked = conference.registration_enabled !== undefined ? (conference.registration_enabled === 1 || conference.registration_enabled === true) : true;
        }
        
        document.getElementById('conf-guidelines').value = conference.guidelines || '';
        document.getElementById('conf-speakers').value = conference.speakers ? JSON.stringify(conference.speakers, null, 2) : '';
        document.getElementById('conf-agenda').value = conference.agenda ? JSON.stringify(conference.agenda, null, 2) : '';
    } else {
        document.getElementById('modal-title').textContent = 'New Conference';
        document.getElementById('conference-id').value = '';
    }
    
    modal.style.display = 'block';
}

function closeConferenceModal() {
    document.getElementById('conference-modal').style.display = 'none';
}

async function editConference(id) {
    try {
        const response = await fetch(`${API_BASE}/api/conferences/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            alert(`Error loading conference: ${errorData.error || response.statusText}`);
            return;
        }
        
        const conference = await response.json();
        
        // Ensure speakers and agenda are arrays (they should already be parsed by the API)
        if (conference.speakers && typeof conference.speakers === 'string') {
            try {
                conference.speakers = JSON.parse(conference.speakers);
            } catch (e) {
                conference.speakers = [];
            }
        }
        if (conference.agenda && typeof conference.agenda === 'string') {
            try {
                conference.agenda = JSON.parse(conference.agenda);
            } catch (e) {
                conference.agenda = [];
            }
        }
        
        openConferenceModal(conference);
    } catch (error) {
        console.error('Error loading conference:', error);
        alert('Failed to load conference details. Please try again.');
    }
}

async function toggleConferenceStatus(id, newStatus) {
    try {
        // Get current conference data
        const response = await fetch(`${API_BASE}/api/conferences/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const conference = await response.json();
        
        // Update status
        const updateResponse = await fetch(`${API_BASE}/api/conferences/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                ...conference,
                status: newStatus
            })
        });
        
        if (updateResponse.ok) {
            loadConferences();
            alert(newStatus === 'published' ? 'Conference published successfully!' : 'Conference unpublished.');
        } else {
            alert('Error updating conference status');
        }
    } catch (error) {
        console.error('Toggle status error:', error);
        alert('Error updating conference status');
    }
}

async function deleteConference(id) {
    if (!confirm('Are you sure you want to delete this conference?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/conferences/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            loadConferences();
        } else {
            alert('Cannot delete conference with existing registrations');
        }
    } catch (error) {
        console.error('Delete error:', error);
    }
}

async function viewConferenceRegistrations(id) {
    try {
        const response = await fetch(`${API_BASE}/api/registrations/conference/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const registrations = await response.json();
        
        const list = document.getElementById('conferences-list');
        list.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <button class="save-btn" onclick="loadConferences()" style="margin-bottom: 1rem;">← Back to Conferences</button>
                <h3>Registrations (${registrations.length})</h3>
                <button class="export-btn" onclick="exportRegistrations(${id})">Export to CSV</button>
            </div>
            <div class="glass-card">
                <table class="members-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Type</th>
                            <th>Checked In</th>
                            <th>Check-in Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrations.map(r => `
                            <tr>
                                <td>${r.attendee_code}</td>
                                <td>${r.fullname}</td>
                                <td>${r.email}</td>
                                <td>${r.phone}</td>
                                <td>${r.attendance_type}</td>
                                <td>${r.checked_in ? '✓ Yes' : '✗ No'}</td>
                                <td>${r.checkin_time || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading registrations:', error);
    }
}

async function exportRegistrations(conferenceId) {
    try {
        const response = await fetch(`${API_BASE}/api/registrations/export/${conferenceId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conference_${conferenceId}_registrations.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Export error:', error);
    }
}

// ========== ATTENDANCE SCANNER ==========

let scannerStream = null;
let scannerInterval = null;

async function loadConferencesForScanner() {
    try {
        const response = await fetch(`${API_BASE}/api/conferences?status=all`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const conferences = await response.json();
        
        const select = document.getElementById('scanner-conference-select');
        select.innerHTML = '<option value="">Select Conference</option>' +
            conferences.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                loadAttendanceList(e.target.value);
                document.getElementById('export-attendance-btn').style.display = 'inline-block';
            } else {
                document.getElementById('attendance-list').innerHTML = '<p class="loading">Select a conference to view check-ins</p>';
                document.getElementById('export-attendance-btn').style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error loading conferences:', error);
    }
}

document.getElementById('start-scanner-btn')?.addEventListener('click', startScanner);
document.getElementById('stop-scanner-btn')?.addEventListener('click', stopScanner);

function startScanner() {
    const video = document.getElementById('scanner-video');
    const conferenceId = document.getElementById('scanner-conference-select').value;
    
    if (!conferenceId) {
        alert('Please select a conference first');
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            scannerStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            video.play();
            
            document.getElementById('start-scanner-btn').style.display = 'none';
            document.getElementById('stop-scanner-btn').style.display = 'inline-block';
            
            const canvas = document.getElementById('scanner-canvas');
            const context = canvas.getContext('2d');
            
            scannerInterval = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        handleQRScan(code.data, conferenceId);
                    }
                }
            }, 100);
        })
        .catch(err => {
            console.error('Camera error:', err);
            alert('Unable to access camera. Please ensure permissions are granted.');
        });
}

function stopScanner() {
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
    }
    document.getElementById('scanner-video').style.display = 'none';
    document.getElementById('start-scanner-btn').style.display = 'inline-block';
    document.getElementById('stop-scanner-btn').style.display = 'none';
    document.getElementById('scanner-result').innerHTML = '';
}

async function handleQRScan(qrData, conferenceId) {
    stopScanner();
    
    try {
        // Parse QR data
        const data = JSON.parse(qrData);
        const { attendee_code } = data;
        
        // Check in
        const response = await fetch(`${API_BASE}/api/registrations/checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ attendee_code })
        });
        
        const result = await response.json();
        const resultDiv = document.getElementById('scanner-result');
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div style="padding: 1rem; background: rgba(0, 201, 109, 0.2); border-radius: 10px; color: var(--primary-green);">
                    <strong>✓ Check-in Successful!</strong><br>
                    ${result.registration.fullname}<br>
                    ${result.registration.email}
                </div>
            `;
            loadAttendanceList(conferenceId);
        } else {
            resultDiv.innerHTML = `
                <div style="padding: 1rem; background: rgba(230, 57, 70, 0.2); border-radius: 10px; color: var(--primary-red);">
                    <strong>✗ ${result.error}</strong>
                </div>
            `;
        }
        
        setTimeout(() => {
            resultDiv.innerHTML = '';
        }, 5000);
    } catch (error) {
        console.error('Scan error:', error);
        document.getElementById('scanner-result').innerHTML = `
            <div style="padding: 1rem; background: rgba(230, 57, 70, 0.2); border-radius: 10px; color: var(--primary-red);">
                <strong>Error processing QR code</strong>
            </div>
        `;
    }
}

async function loadAttendanceList(conferenceId) {
    try {
        const response = await fetch(`${API_BASE}/api/registrations/conference/${conferenceId}?checked_in=true`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const checkins = await response.json();
        
        const list = document.getElementById('attendance-list');
        if (checkins.length === 0) {
            list.innerHTML = '<p class="loading">No check-ins yet</p>';
            return;
        }
        
        list.innerHTML = `
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Attendee Code</th>
                        <th>Check-in Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${checkins.map(c => `
                        <tr>
                            <td>${c.fullname}</td>
                            <td>${c.email}</td>
                            <td>${c.attendee_code}</td>
                            <td>${new Date(c.checkin_time).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

document.getElementById('export-attendance-btn')?.addEventListener('click', () => {
    const conferenceId = document.getElementById('scanner-conference-select').value;
    if (conferenceId) {
        exportRegistrations(conferenceId);
    }
});

// ========== INSTITUTION REPS ==========

async function loadRepsConferences() {
    try {
        const response = await fetch(`${API_BASE}/api/conferences?status=all`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const conferences = await response.json();
        
        const select = document.getElementById('reps-conference-select');
        if (!select) {
            console.error('reps-conference-select element not found');
            return;
        }
        
        select.innerHTML = '<option value="">Select Conference</option>' +
            conferences.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        
        // Remove existing event listeners by cloning the select
        const newSelect = select.cloneNode(true);
        select.parentNode.replaceChild(newSelect, select);
        
        // Add change event listener
        newSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                loadReps(e.target.value);
            } else {
                document.getElementById('reps-list').innerHTML = '<p class="loading">Select a conference to view reps</p>';
            }
        });
    } catch (error) {
        console.error('Error loading conferences for reps:', error);
        const select = document.getElementById('reps-conference-select');
        if (select) {
            select.innerHTML = '<option value="">Error loading conferences</option>';
        }
    }
}

async function loadReps(conferenceId) {
    try {
        const response = await fetch(`${API_BASE}/api/reps/conference/${conferenceId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to load reps' }));
            throw new Error(errorData.error || 'Failed to load reps');
        }
        
        const reps = await response.json();
        
        const list = document.getElementById('reps-list');
        if (!list) return;
        
        // Check if reps is an array
        if (!Array.isArray(reps)) {
            console.error('Expected array but got:', reps);
            list.innerHTML = '<p class="error-message">Error: Invalid response format</p>';
            return;
        }
        
        if (reps.length === 0) {
            list.innerHTML = '<p class="loading">No reps assigned for this conference yet.</p>';
            return;
        }
        
        list.innerHTML = reps.map(rep => `
            <div class="glass-card" style="margin-bottom: 1rem; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="color: var(--primary-green); margin-bottom: 0.5rem;">${rep.name}</h3>
                        <p style="color: var(--text-secondary); margin: 0.3rem 0;"><strong>Institution:</strong> ${rep.institution}</p>
                        <p style="color: var(--text-secondary); margin: 0.3rem 0;"><strong>Email:</strong> ${rep.email}</p>
                        <p style="color: var(--text-secondary); margin: 0.3rem 0;"><strong>Phone:</strong> ${rep.phone}</p>
                        ${rep.referral_code ? `<p style="color: var(--primary-green); margin: 0.5rem 0;"><strong>Referral Code:</strong> <code style="background: rgba(0, 201, 109, 0.1); padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 600;">${rep.referral_code}</code></p>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                        <button class="action-btn" onclick="editRep(${rep.id}, ${conferenceId})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Edit</button>
                        <button class="action-btn" onclick="deleteRep(${rep.id}, ${conferenceId})" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--primary-red);">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reps:', error);
        const list = document.getElementById('reps-list');
        if (list) {
            list.innerHTML = `<p class="error-message">Failed to load reps: ${error.message || 'Unknown error'}</p>`;
        }
    }
}

// New Rep button handler
document.getElementById('new-rep-btn')?.addEventListener('click', () => {
    const conferenceId = document.getElementById('reps-conference-select')?.value;
    if (!conferenceId) {
        alert('Please select a conference first');
        return;
    }
    openRepModal(null, conferenceId);
});

function initRepInstitutionTypeahead() {
    const input = document.getElementById('rep-institution');
    if (!input || typeof allInstitutions === 'undefined') {
        // Try loading the script if not available
        if (typeof allInstitutions === 'undefined') {
            const script = document.createElement('script');
            script.src = '/nigerian-data.js';
            script.onload = () => {
                if (typeof allInstitutions !== 'undefined' && typeof initTypeahead === 'function') {
                    initTypeahead('rep-institution', allInstitutions, 'rep-institution-value');
                }
            };
            document.head.appendChild(script);
        }
        return;
    }
    
    // Use the typeahead function if available
    if (typeof initTypeahead === 'function') {
        initTypeahead('rep-institution', allInstitutions, 'rep-institution-value');
    }
}

function openRepModal(rep = null, conferenceId = null) {
    const modal = document.getElementById('rep-modal');
    const form = document.getElementById('rep-form');
    form.reset();
    
    // Initialize institution typeahead
    initRepInstitutionTypeahead();
    
    if (rep) {
        document.getElementById('rep-modal-title').textContent = 'Edit Institution Rep';
        document.getElementById('rep-id').value = rep.id;
        document.getElementById('rep-conference-id').value = rep.conference_id;
        document.getElementById('rep-name').value = rep.name || '';
        document.getElementById('rep-email').value = rep.email || '';
        document.getElementById('rep-phone').value = rep.phone || '';
        
        // Set institution after typeahead is initialized
        setTimeout(() => {
            const institutionInput = document.getElementById('rep-institution');
            const institutionHidden = document.getElementById('rep-institution-value');
            if (institutionInput && rep.institution) {
                institutionInput.value = rep.institution;
                if (institutionHidden) institutionHidden.value = rep.institution;
            }
        }, 200);
        
        if (rep.referral_code) {
            document.getElementById('rep-referral-code').value = rep.referral_code;
            document.getElementById('rep-referral-code-display').style.display = 'block';
        } else {
            document.getElementById('rep-referral-code-display').style.display = 'none';
        }
    } else {
        document.getElementById('rep-modal-title').textContent = 'New Institution Rep';
        document.getElementById('rep-id').value = '';
        document.getElementById('rep-conference-id').value = conferenceId || '';
        document.getElementById('rep-referral-code-display').style.display = 'none';
    }
    
    modal.style.display = 'block';
}

function closeRepModal() {
    document.getElementById('rep-modal').style.display = 'none';
}

// Close modal handlers
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

// Rep form submission
document.getElementById('rep-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('rep-id').value;
    const conferenceId = document.getElementById('rep-conference-id').value;
    
    // Get institution value from typeahead (hidden input) or direct input
    const institutionHidden = document.getElementById('rep-institution-value');
    const institutionInput = document.getElementById('rep-institution');
    const institution = (institutionHidden?.value || institutionInput?.value || '').trim();
    
    const data = {
        conference_id: conferenceId,
        name: document.getElementById('rep-name').value.trim(),
        email: document.getElementById('rep-email').value.trim(),
        phone: document.getElementById('rep-phone').value.trim(),
        institution: institution
    };
    
    if (!conferenceId) {
        alert('Conference ID is required');
        return;
    }
    
    if (!institution) {
        alert('Institution is required');
        return;
    }
    
    try {
        const url = id ? `${API_BASE}/api/reps/${id}` : `${API_BASE}/api/reps`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const savedRep = await response.json();
            closeRepModal();
            loadReps(conferenceId);
            alert('Rep saved successfully!');
        } else {
            const errorData = await response.json();
            alert(`Error saving rep: ${errorData.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Error saving rep:', error);
        alert('Network error. Please try again.');
    }
});

async function editRep(repId, conferenceId) {
    try {
        const response = await fetch(`${API_BASE}/api/reps/${repId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            alert('Failed to load rep details');
            return;
        }
        const rep = await response.json();
        openRepModal(rep, conferenceId);
    } catch (error) {
        console.error('Error loading rep:', error);
        alert('Failed to load rep details');
    }
}

async function deleteRep(repId, conferenceId) {
    if (!confirm('Are you sure you want to delete this rep?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/reps/${repId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadReps(conferenceId);
            alert('Rep deleted successfully');
        } else {
            const errorData = await response.json();
            alert(`Error deleting rep: ${errorData.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting rep:', error);
        alert('Network error. Please try again.');
    }
}

function copyReferralCode() {
    const referralCodeInput = document.getElementById('rep-referral-code');
    referralCodeInput.select();
    referralCodeInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(referralCodeInput.value);
    alert('Referral code copied to clipboard!');
}

// ========== HERO SLIDES ==========

async function loadHeroSlides() {
    try {
        const response = await fetch(`${API_BASE}/api/hero-slides/all`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load hero slides');
        }
        
        const slides = await response.json();
        const list = document.getElementById('hero-slides-list');
        
        if (!list) return;
        
        if (slides.length === 0) {
            list.innerHTML = '<p class="loading">No hero slides yet. Click "+ New Slide" to create one.</p>';
            return;
        }
        
        list.innerHTML = slides.map((slide, index) => `
            <div class="hero-slide-item glass-card" data-id="${slide.id}" data-order="${slide.order_index || index}" style="margin-bottom: 1rem; padding: 1.5rem; cursor: move;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <h3 style="color: var(--primary-green); margin: 0;">${slide.title || 'Untitled Slide'}</h3>
                            ${slide.is_conference_slide ? '<span style="background: rgba(0, 201, 109, 0.1); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; color: var(--primary-green);">🎤 Conference</span>' : ''}
                            ${slide.is_active ? '<span style="background: rgba(0, 201, 109, 0.1); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; color: var(--primary-green);">✓ Active</span>' : '<span style="background: rgba(230, 57, 70, 0.1); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; color: var(--primary-red);">✗ Inactive</span>'}
                        </div>
                        ${slide.subtitle ? `<p style="color: var(--text-secondary); margin: 0.5rem 0;">${slide.subtitle}</p>` : ''}
                        ${slide.conference_title ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Linked to: ${slide.conference_title}</p>` : ''}
                        ${slide.buttons && slide.buttons.length > 0 ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">${slide.buttons.length} button(s)</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="action-btn" onclick="editHeroSlide(${slide.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Edit</button>
                        <button class="action-btn" onclick="deleteHeroSlide(${slide.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--primary-red);">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Initialize drag and drop
        initHeroSlideDragDrop();
    } catch (error) {
        console.error('Error loading hero slides:', error);
        const list = document.getElementById('hero-slides-list');
        if (list) {
            list.innerHTML = '<p class="error-message">Failed to load hero slides. Please refresh the page.</p>';
        }
    }
}

function initHeroSlideDragDrop() {
    const container = document.getElementById('hero-slides-list');
    if (!container) return;
    
    const items = container.querySelectorAll('.hero-slide-item');
    items.forEach(item => {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.id);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = container.querySelector('.dragging');
        if (!dragging) return;
        
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.hero-slide-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Save hero slide order
document.getElementById('save-hero-order-btn')?.addEventListener('click', async () => {
    const items = document.querySelectorAll('.hero-slide-item');
    const order = Array.from(items).map((item, index) => ({
        id: parseInt(item.dataset.id),
        order_index: index + 1
    }));
    
    try {
        const response = await fetch(`${API_BASE}/api/hero-slides/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ order })
        });
        
        if (response.ok) {
            alert('Slide order saved successfully!');
            loadHeroSlides();
        } else {
            alert('Failed to save slide order');
        }
    } catch (error) {
        console.error('Error saving order:', error);
        alert('Network error. Please try again.');
    }
});

// New hero slide button
document.getElementById('new-hero-slide-btn')?.addEventListener('click', () => {
    openHeroSlideModal();
});

function openHeroSlideModal(slide = null) {
    const modal = document.getElementById('hero-slide-modal');
    const form = document.getElementById('hero-slide-form');
    if (!modal || !form) return;
    
    form.reset();
    document.getElementById('hero-buttons-container').innerHTML = '';
    
    if (slide) {
        document.getElementById('hero-slide-id').value = slide.id;
        document.getElementById('hero-slide-title').value = slide.title || '';
        document.getElementById('hero-slide-subtitle').value = slide.subtitle || '';
        document.getElementById('hero-slide-bg-url').value = slide.background_image_path || '';
        document.getElementById('hero-slide-active').checked = slide.is_active === 1 || slide.is_active === true;
        document.getElementById('hero-slide-overlay').value = slide.overlay_alignment || 'left';
        
        if (slide.buttons && slide.buttons.length > 0) {
            slide.buttons.forEach(btn => {
                addHeroButton(btn);
            });
        }
        
        if (slide.is_conference_slide) {
            document.getElementById('hero-slide-conference-note').style.display = 'block';
        } else {
            document.getElementById('hero-slide-conference-note').style.display = 'none';
        }
    } else {
        document.getElementById('hero-slide-id').value = '';
        document.getElementById('hero-slide-active').checked = true;
        document.getElementById('hero-slide-overlay').value = 'left';
        document.getElementById('hero-slide-conference-note').style.display = 'none';
    }
    
    modal.style.display = 'block';
}

function closeHeroSlideModal() {
    document.getElementById('hero-slide-modal').style.display = 'none';
}

function addHeroButton(button = null) {
    const container = document.getElementById('hero-buttons-container');
    const index = container.children.length;
    
    const buttonHtml = `
        <div class="hero-button-item glass-card" style="margin-bottom: 1rem; padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label style="margin: 0; font-weight: 600;">Button ${index + 1}</label>
                <button type="button" class="action-btn" onclick="this.parentElement.parentElement.remove()" style="padding: 0.3rem 0.8rem; font-size: 0.85rem; background: var(--primary-red);">Remove</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Text</label>
                    <input type="text" class="hero-btn-text" value="${button?.text || ''}" placeholder="Button text">
                </div>
                <div class="form-group">
                    <label>URL</label>
                    <input type="text" class="hero-btn-url" value="${button?.url || ''}" placeholder="Button URL">
                </div>
            </div>
            <div class="form-group" style="margin-top: 0.5rem;">
                <label>Style</label>
                <select class="hero-btn-style">
                    <option value="primary" ${button?.style === 'primary' ? 'selected' : ''}>Primary (Green)</option>
                    <option value="secondary" ${button?.style === 'secondary' ? 'selected' : ''}>Secondary (Red)</option>
                    <option value="outline" ${button?.style === 'outline' ? 'selected' : ''}>Outline</option>
                </select>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', buttonHtml);
}

async function editHeroSlide(id) {
    try {
        const response = await fetch(`${API_BASE}/api/hero-slides/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load slide');
        }
        
        const slide = await response.json();
        openHeroSlideModal(slide);
    } catch (error) {
        console.error('Error loading slide:', error);
        alert('Failed to load slide details');
    }
}

async function deleteHeroSlide(id) {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/hero-slides/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadHeroSlides();
            alert('Slide deleted successfully');
        } else {
            const errorData = await response.json();
            alert(`Error deleting slide: ${errorData.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting slide:', error);
        alert('Network error. Please try again.');
    }
}

// Hero slide form submission
document.getElementById('hero-slide-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('hero-slide-id').value;
    const buttons = [];
    document.querySelectorAll('.hero-button-item').forEach(item => {
        const text = item.querySelector('.hero-btn-text').value;
        const url = item.querySelector('.hero-btn-url').value;
        const style = item.querySelector('.hero-btn-style').value;
        
        if (text && url) {
            buttons.push({ text, url, style });
        }
    });
    
    const data = {
        title: document.getElementById('hero-slide-title').value,
        subtitle: document.getElementById('hero-slide-subtitle').value,
        background_image_path: document.getElementById('hero-slide-bg-url').value || null,
        overlay_alignment: document.getElementById('hero-slide-overlay').value,
        is_active: document.getElementById('hero-slide-active').checked,
        buttons: buttons
    };
    
    try {
        const url = id ? `${API_BASE}/api/hero-slides/${id}` : `${API_BASE}/api/hero-slides`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeHeroSlideModal();
            loadHeroSlides();
            alert('Slide saved successfully!');
        } else {
            const errorData = await response.json();
            alert(`Error saving slide: ${errorData.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Error saving slide:', error);
        alert('Network error. Please try again.');
    }
});

// Close modal handlers
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

// ========== PASSWORD CHANGE ==========

document.getElementById('change-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorDiv = document.getElementById('password-change-error');
    const successDiv = document.getElementById('password-change-success');
    
    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'New passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
        errorDiv.textContent = 'New password must be at least 6 characters long';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            successDiv.textContent = 'Password changed successfully!';
            successDiv.style.display = 'block';
            
            // Clear form
            document.getElementById('change-password-form').reset();
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        } else {
            errorDiv.textContent = data.error || 'Failed to change password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Password change error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

