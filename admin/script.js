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
        'media': 'Media Library'
    };
    document.getElementById('section-title').textContent = titles[section] || 'Dashboard';
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

