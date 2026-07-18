import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const form = document.getElementById('tagForm');
const txtName = document.getElementById('txtName');
const txtError = document.getElementById('txtError');
const btnCancel = document.getElementById('btnCancel');
const windowTitle = document.getElementById('windowTitle');

// State
let existingTagId = null;
let returnUrl = 'JournalingSessionManagement.html';

// Helpers
function showError(msg) {
  txtError.textContent = msg;
  txtError.classList.remove('hidden');
}
function clearError() {
  txtError.classList.add('hidden');
}

// ---- Load existing tag for edit ----
async function loadTag(id) {
  clearError();
  try {
    const api = new ApiClient();
    const tag = await api.getAsync(`api/Tag/${id}`);
    if (!tag) {
      showError('Tag not found.');
      return;
    }
    txtName.value = tag.name || '';
  } catch (err) {
    showError(`Failed to load tag: ${err.message}`);
  }
}

// ---- Save (create or update) ----
async function saveTag(e) {
  e.preventDefault();
  clearError();

  const name = txtName.value.trim();
  if (!name) {
    showError('Tag name is required.');
    return;
  }

  const tagData = { name };

  try {
    const api = new ApiClient();
    let response;
    if (existingTagId) {
      // Update
      response = await api.putAsync(`api/Tag/${existingTagId}`, tagData);
    } else {
      // Create
      response = await api.postAsync('api/Tag', tagData);
    }

    if (response.ok) {
      let savedId = existingTagId;
      if (!existingTagId) {
        // Get the created ID from response
        const created = await response.json();
        savedId = created.tagID;
      }
      // Redirect back to returnUrl with success param
      const sep = returnUrl.includes('?') ? '&' : '?';
      window.location.href = returnUrl + sep + 'tagSaved=' + savedId;
    } else {
      const errorText = await response.text();
      showError(errorText || 'Failed to save tag.');
    }
  } catch (err) {
    showError(`Error saving tag: ${err.message}`);
  }
}

// ---- Cancel ----
function cancel() {
  window.location.href = returnUrl;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) {
    existingTagId = id;
    windowTitle.textContent = 'Edit Tag';
    loadTag(id);
  } else {
    showError('Invalid tag ID.');
  }
} else {
  windowTitle.textContent = 'New Tag';
}

// Event listeners
form.addEventListener('submit', saveTag);
btnCancel.addEventListener('click', cancel);
