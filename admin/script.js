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
        'hero-slider': 'Hero Slider Manager'
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
            const date = new Date(conf.date);
            return `
                <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="color: var(--primary-green); margin-bottom: 0.5rem;">${conf.title}</h3>
                            <p style="color: var(--text-secondary);">${date.toLocaleDateString()} ${conf.time || ''}</p>
                            <span style="display: inline-block; padding: 0.3rem 0.8rem; background: ${conf.status === 'published' ? 'rgba(0, 201, 109, 0.2)' : 'rgba(230, 57, 70, 0.2)'}; color: ${conf.status === 'published' ? 'var(--primary-green)' : 'var(--primary-red)'}; border-radius: 20px; font-size: 0.8rem; margin-top: 0.5rem;">
                                ${conf.status === 'published' ? '✓ Published' : 'Draft'}
                            </span>
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
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            alert(`Error saving conference: ${errorData.error || response.statusText}`);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert(`Error saving conference: ${error.message || 'Network error'}`);
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
        document.getElementById('conf-date').value = conference.date || '';
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

