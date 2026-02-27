/**
 * Bible Workbook Generator - Frontend JavaScript
 * Handles form submission, progress polling, and preset loading
 */

// Bootstrap modal instance
let progressModal;

// Form submission handler
document.getElementById('generate-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const config = Object.fromEntries(formData);

    try {
        // Start generation
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error('Failed to start generation');
        }

        const { taskId } = await response.json();

        // Show progress modal
        showProgressModal();

        // Poll for status
        pollStatus(taskId);

    } catch (error) {
        console.error('Error:', error);
        alert('Error starting PDF generation: ' + error.message);
    }
});

/**
 * Show progress modal
 */
function showProgressModal() {
    const modalEl = document.getElementById('progressModal');
    progressModal = new bootstrap.Modal(modalEl);
    progressModal.show();

    // Reset progress
    updateProgress(0, 'pending');
}

/**
 * Hide progress modal
 */
function hideProgressModal() {
    if (progressModal) {
        progressModal.hide();
    }
}

/**
 * Update progress bar and status text
 */
function updateProgress(progress, status) {
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');

    // Update progress bar
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);

    // Update status text
    const statusMessages = {
        pending: 'Initializing...',
        fetching: 'Fetching Bible text from API...',
        parsing: 'Parsing Bible data...',
        analyzing: 'Analyzing verses...',
        generating: 'Generating PDF workbook...',
        complete: 'Complete! Downloading...',
        error: 'Error occurred'
    };

    progressStatus.textContent = statusMessages[status] || status;
}

/**
 * Poll task status until complete or error
 */
async function pollStatus(taskId) {
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`/api/status/${taskId}`);

            if (!response.ok) {
                throw new Error('Failed to get status');
            }

            const data = await response.json();

            // Update progress
            updateProgress(data.progress, data.status);

            // Handle completion
            if (data.status === 'complete') {
                clearInterval(interval);
                setTimeout(() => {
                    hideProgressModal();
                    // Trigger download
                    window.location.href = `/api/download/${taskId}`;
                }, 1000);
            }

            // Handle error
            else if (data.status === 'error') {
                clearInterval(interval);
                setTimeout(() => {
                    hideProgressModal();
                    alert('Error generating PDF: ' + (data.error || 'Unknown error'));
                }, 1000);
            }

        } catch (error) {
            console.error('Polling error:', error);
            clearInterval(interval);
            hideProgressModal();
            alert('Error checking status: ' + error.message);
        }
    }, 1000);  // Poll every second
}

/**
 * Load preset configuration
 */
async function loadPreset(name) {
    try {
        const response = await fetch(`/api/presets/${name}`);

        if (!response.ok) {
            throw new Error(`Preset '${name}' not found`);
        }

        const preset = await response.json();

        // Populate form fields
        document.getElementById('book').value = preset.book || 'mat';
        document.getElementById('bookName').value = preset.bookName || 'Matthew';

        // Page size
        if (preset.pageSize) {
            // Handle special case for 6x9
            let radioId;
            if (preset.pageSize === '6x9') {
                radioId = 'page6x9';
            } else {
                radioId = `page${preset.pageSize.charAt(0).toUpperCase() + preset.pageSize.slice(1)}`;
            }
            const radio = document.getElementById(radioId);
            if (radio) radio.checked = true;
        }

        // Margins
        if (preset.marginLeft !== undefined) {
            document.getElementById('marginLeft').value = preset.marginLeft;
        }
        if (preset.marginRight !== undefined) {
            document.getElementById('marginRight').value = preset.marginRight;
        }
        if (preset.marginTop !== undefined) {
            document.getElementById('marginTop').value = preset.marginTop;
        }
        if (preset.marginBottom !== undefined) {
            document.getElementById('marginBottom').value = preset.marginBottom;
        }

        // Line height
        if (preset.lineHeight !== undefined) {
            document.getElementById('lineHeight').value = preset.lineHeight;
        }

        // Fonts
        if (preset.verseLabelFont) {
            document.getElementById('verseLabelFont').value = preset.verseLabelFont;
        }
        if (preset.verseLabelSize !== undefined) {
            document.getElementById('verseLabelSize').value = preset.verseLabelSize;
        }
        if (preset.pageNumberFont) {
            document.getElementById('pageNumberFont').value = preset.pageNumberFont;
        }
        if (preset.pageNumberSize !== undefined) {
            document.getElementById('pageNumberSize').value = preset.pageNumberSize;
        }

        // Line appearance
        if (preset.lineColor) {
            document.getElementById('lineColor').value = preset.lineColor;
        }
        if (preset.lineWidth !== undefined) {
            document.getElementById('lineWidth').value = preset.lineWidth;
        }

        // Advanced
        if (preset.charsPerLine !== undefined) {
            document.getElementById('charsPerLine').value = preset.charsPerLine;
        }
        if (preset.wholeWordFactor !== undefined) {
            document.getElementById('wholeWordFactor').value = preset.wholeWordFactor;
        }
        if (preset.verseLabelWidth !== undefined) {
            document.getElementById('verseLabelWidth').value = preset.verseLabelWidth;
        }

        // Update all range slider displays
        updateAllDisplays();

        // Success feedback
        console.log(`Loaded preset: ${name}`);

    } catch (error) {
        console.error('Error loading preset:', error);
        alert('Error loading preset: ' + error.message);
    }
}

/**
 * Update range slider display value
 */
function updateDisplay(slider) {
    const display = document.getElementById(`${slider.id}-display`);
    if (display) {
        const value = parseFloat(slider.value).toFixed(2);
        display.textContent = `${value}"`;
    }
}

/**
 * Update all range slider displays
 */
function updateAllDisplays() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        updateDisplay(slider);
    });
}

// Initialize displays on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAllDisplays();
});
