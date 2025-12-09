// Typeahead functionality for states and institutions

function initTypeahead(inputId, dataArray, hiddenInputId = null) {
    const input = document.getElementById(inputId);
    if (!input || !dataArray) return;

    const dropdown = document.getElementById(`${inputId}-dropdown`);
    if (!dropdown) return;

    const hiddenInput = hiddenInputId ? document.getElementById(hiddenInputId) : null;
    let selectedIndex = -1;
    let filteredData = [];

    function showDropdown() {
        if (filteredData.length > 0) {
            dropdown.style.display = 'block';
        }
    }

    function hideDropdown() {
        dropdown.style.display = 'none';
        selectedIndex = -1;
    }

    function renderDropdown() {
        if (filteredData.length === 0) {
            hideDropdown();
            return;
        }

        dropdown.innerHTML = filteredData.slice(0, 10).map((item, index) => {
            const isSelected = index === selectedIndex ? 'selected' : '';
            return `<li class="typeahead-item ${isSelected}" data-index="${index}" data-value="${item}">${item}</li>`;
        }).join('');

        showDropdown();

        // Add click handlers
        dropdown.querySelectorAll('.typeahead-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.getAttribute('data-value');
                input.value = value;
                if (hiddenInput) hiddenInput.value = value;
                hideDropdown();
                input.dispatchEvent(new Event('change'));
            });
        });
    }

    function filterData(query) {
        if (!query || query.length < 1) {
            filteredData = [];
            hideDropdown();
            return;
        }

        const lowerQuery = query.toLowerCase();
        filteredData = dataArray.filter(item => 
            item.toLowerCase().includes(lowerQuery)
        ).slice(0, 10);

        selectedIndex = -1;
        renderDropdown();
    }

    // Input event
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        filterData(query);
        if (hiddenInput) hiddenInput.value = query;
    });

    // Focus event
    input.addEventListener('focus', () => {
        if (input.value.trim()) {
            filterData(input.value.trim());
        }
    });

    // Blur event (delay to allow click on dropdown)
    input.addEventListener('blur', () => {
        setTimeout(() => {
            hideDropdown();
        }, 200);
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
        if (!dropdown.style.display || dropdown.style.display === 'none') {
            if (e.key === 'ArrowDown' && input.value.trim()) {
                filterData(input.value.trim());
                e.preventDefault();
            }
            return;
        }

        const items = dropdown.querySelectorAll('.typeahead-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            renderDropdown();
            items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            renderDropdown();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && filteredData[selectedIndex]) {
                const value = filteredData[selectedIndex];
                input.value = value;
                if (hiddenInput) hiddenInput.value = value;
                hideDropdown();
                input.dispatchEvent(new Event('change'));
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
}

// Initialize typeaheads when DOM is ready
function initAllTypeaheads() {
    if (typeof nigerianStates !== 'undefined') {
        const stateInput = document.getElementById('state');
        if (stateInput && stateInput.classList.contains('typeahead-input')) {
            initTypeahead('state', nigerianStates, 'state-value');
        }

        const voterStateInput = document.getElementById('voter_state');
        if (voterStateInput && voterStateInput.classList.contains('typeahead-input')) {
            initTypeahead('voter_state', nigerianStates, 'voter_state-value');
        }
    }

    if (typeof allInstitutions !== 'undefined') {
        const institutionInput = document.getElementById('institution');
        if (institutionInput && institutionInput.classList.contains('typeahead-input')) {
            initTypeahead('institution', allInstitutions, 'institution-value');
        }
    }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllTypeaheads);
} else {
    initAllTypeaheads();
}







