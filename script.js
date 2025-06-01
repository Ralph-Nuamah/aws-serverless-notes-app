document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const noteContentEl = document.getElementById('noteContent');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const resultAreaEl = document.getElementById('resultArea');

    const retrieveNoteIdEl = document.getElementById('retrieveNoteId');
    const retrieveNoteBtn = document.getElementById('retrieveNoteBtn');
    const retrievedNoteAreaEl = document.getElementById('retrievedNoteArea');

    console.log("noteContentEl:", noteContentEl);
    console.log("saveNoteBtn:", saveNoteBtn);
    console.log("retrieveNoteIdEl:", retrieveNoteIdEl);
    console.log("retrieveNoteBtn:", retrieveNoteBtn);

    const API_BASE_URL = 'https://mul1rg0rtc.execute-api.eu-north-1.amazonaws.com';

    if (!saveNoteBtn || !retrieveNoteBtn) {
        console.error("Missing buttons in DOM!");
        return;
    }

    saveNoteBtn.addEventListener('click', async () => {
        const content = noteContentEl.value.trim();
        if (!content) {
            resultAreaEl.innerHTML = '<p style="color: red;">Please enter some content for your note.</p>';
            return;
        }

        resultAreaEl.innerHTML = '<p>Saving...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content }),
            });
            const data = await response.json();
            if (response.ok) {
                const noteId = data.noteId;
                const viewUrl = `${window.location.origin}${window.location.pathname}?noteId=${noteId}`;
                resultAreaEl.innerHTML = `
                    <p style="color: green;">Note saved successfully!</p>
                    <p><strong>Note ID:</strong> ${noteId}</p>
                    <p><strong>Shareable Link:</strong> <a href="${viewUrl}" target="_blank">${viewUrl}</a></p>
                    <p>
                        <button onclick="copyToClipboard('${noteId}')">Copy ID</button>
                        <button onclick="copyToClipboard('${viewUrl}')">Copy Link</button>
                    </p>
                `;
                noteContentEl.value = '';
            } else {
                resultAreaEl.innerHTML = `<p style="color: red;">Error: ${data.error || 'Failed to save note'}</p>`;
            }
        } catch (error) {
            console.error('Error saving note:', error);
            resultAreaEl.innerHTML = `<p style="color: red;">Network error or API issue: ${error.message}</p>`;
        }
    });

    retrieveNoteBtn.addEventListener('click', async () => {
        const noteId = retrieveNoteIdEl.value.trim();
        if (!noteId) {
            retrievedNoteAreaEl.innerHTML = '<p style="color: red;">Please enter a Note ID to retrieve.</p>';
            return;
        }

        retrievedNoteAreaEl.innerHTML = '<p>Retrieving...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/notes/${noteId}`);
            const data = await response.json();
            if (response.ok) {
                retrievedNoteAreaEl.innerHTML = `
                    <p><strong>Note Content:</strong></p>
                    <pre>${escapeHtml(data.content)}</pre>
                    <p><small>Created At: ${new Date(data.createdAt * 1000).toLocaleString()}</small></p>
                `;
            } else {
                retrievedNoteAreaEl.innerHTML = `<p style="color: red;">Error: ${data.error || 'Note not found'}</p>`;
            }
        } catch (error) {
            console.error('Error retrieving note:', error);
            retrievedNoteAreaEl.innerHTML = `<p style="color: red;">Network error or API issue: ${error.message}</p>`;
        }
    });

    function loadNoteFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const noteId = urlParams.get('noteId');
        if (noteId) {
            retrieveNoteIdEl.value = noteId;
            retrieveNoteBtn.click();
        }
    }

    loadNoteFromUrl();
}); // ✅ closes DOMContentLoaded

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy to clipboard.');
    });
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
