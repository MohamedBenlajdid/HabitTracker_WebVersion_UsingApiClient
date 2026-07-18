import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtEntryInfo = document.getElementById('txtEntryInfo');
const btnAddTag = document.getElementById('btnAddTag');
const tagList = document.getElementById('tagList');
const txtError = document.getElementById('txtError');
const btnRemoveTag = document.getElementById('btnRemoveTag');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');

// State
let journalEntryId = null;
let initialTags = [];
let addedTags = [];
let removedTags = [];
let selectedTagId = null;

// Helpers
function showError(msg) {
  txtError.textContent = msg;
  txtError.classList.remove('hidden');
}
function clearError() {
  txtError.classList.add('hidden');
}

// Get working set (initial - removed + added)
function getWorkingTags() {
  const set = [...initialTags];
  // Remove any that are in removedTags
  removedTags.forEach(r => {
    const idx = set.findIndex(t => t.tagID === r.tagID);
    if (idx !== -1) set.splice(idx, 1);
  });
  // Add any in addedTags not already present
  addedTags.forEach(a => {
    if (!set.some(t => t.tagID === a.tagID)) set.push(a);
  });
  return set;
}

// Render tag list
function renderTags() {
  const tags = getWorkingTags().sort((a, b) => a.name.localeCompare(b.name));
  tagList.innerHTML = '';
  if (tags.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No tags.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    tagList.appendChild(empty);
  } else {
    tags.forEach(tag => {
      const div = document.createElement('div');
      div.className = 'tag-item';
      div.dataset.id = tag.tagID;
      div.textContent = tag.name;
      div.addEventListener('click', () => {
        document.querySelectorAll('.tag-item.selected').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        selectedTagId = tag.tagID;
        btnRemoveTag.disabled = false;
      });
      tagList.appendChild(div);
    });
  }
  btnRemoveTag.disabled = true;
  selectedTagId = null;
}

// ---- Load data ----
async function loadEntryInfo() {
  try {
    const api = new ApiClient();
    const entry = await api.getAsync(`api/Journal/${journalEntryId}`);
    txtEntryInfo.textContent = entry ? `Entry: ${entry.title}` : '[Entry not found]';
  } catch {
    txtEntryInfo.textContent = '[Entry not found]';
  }
}

async function loadCurrentTags() {
  try {
    const api = new ApiClient();
    const tags = await api.getAsync(`api/JournalTag/${journalEntryId}/tags`);
    initialTags = tags || [];
  } catch {
    initialTags = [];
  }
  addedTags = [];
  removedTags = [];
  renderTags();
  clearError();
}

// ---- Add tag from finder ----
async function handleTagSelected(tagId) {
  // Check if already in working set
  const working = getWorkingTags();
  if (working.some(t => t.tagID === tagId)) {
    showError('This tag is already added.');
    return;
  }

  // Fetch tag details
  try {
    const api = new ApiClient();
    const tag = await api.getAsync(`api/Tag/${tagId}`);
    if (!tag) {
      showError('Tag not found.');
      return;
    }

    // Check if it was in removed list
    const removedIdx = removedTags.findIndex(t => t.tagID === tagId);
    if (removedIdx !== -1) {
      removedTags.splice(removedIdx, 1);
    } else if (!initialTags.some(t => t.tagID === tagId)) {
      addedTags.push(tag);
    }
    renderTags();
    clearError();
  } catch {
    showError('Failed to retrieve tag.');
  }
}

// ---- Remove selected tag ----
function removeSelectedTag() {
  if (selectedTagId === null) {
    showError('Please select a tag to remove.');
    return;
  }

  // Check if in addedTags
  const addedIdx = addedTags.findIndex(t => t.tagID === selectedTagId);
  if (addedIdx !== -1) {
    addedTags.splice(addedIdx, 1);
  } else if (initialTags.some(t => t.tagID === selectedTagId) &&
             !removedTags.some(t => t.tagID === selectedTagId)) {
    // Need the full tag object to store in removedTags
    const tag = initialTags.find(t => t.tagID === selectedTagId);
    if (tag) removedTags.push({ ...tag });
  }

  renderTags();
  clearError();
}

// ---- Save changes ----
async function saveChanges() {
  clearError();
  let hasErrors = false;
  const api = new ApiClient();

  for (const tag of addedTags) {
    const response = await api.postAsync(`api/JournalTag/${journalEntryId}/${tag.tagID}`, null);
    if (!response.ok) {
      const errorText = await response.text();
      showError(`Failed to add tag '${tag.name}': ${errorText}`);
      hasErrors = true;
    }
  }

  for (const tag of removedTags) {
    const response = await api.deleteAsync(`api/JournalTag/${journalEntryId}/${tag.tagID}`);
    if (!response.ok) {
      const errorText = await response.text();
      showError(`Failed to remove tag '${tag.name}': ${errorText}`);
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    // Reload to reflect saved state
    await loadCurrentTags();
    // Notify parent if needed (via redirect or event)
    const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || 'JournalManagement.html';
    const separator = returnUrl.includes('?') ? '&' : '?';
    window.location.href = returnUrl + separator + 'tagsSaved=1';
  }
}

// ---- Cancel ----
function cancel() {
  const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || 'JournalManagement.html';
  window.location.href = returnUrl;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const returnParam = params.get('returnUrl');
const selectedTagParam = params.get('selectedTagId');

if (idParam) {
  journalEntryId = parseInt(idParam, 10);
} else {
  alert('No journal entry ID provided.');
}

if (selectedTagParam) {
  const tagId = parseInt(selectedTagParam, 10);
  if (!isNaN(tagId)) {
    handleTagSelected(tagId);
  }
}

loadEntryInfo();
loadCurrentTags();

// ---- Event listeners ----
btnAddTag.addEventListener('click', () => {
  const returnUrl = window.location.pathname + window.location.search;
  window.location.href = `TagF.html?returnUrl=${encodeURIComponent(returnUrl)}`;
});

btnRemoveTag.addEventListener('click', removeSelectedTag);

btnSave.addEventListener('click', saveChanges);

btnCancel.addEventListener('click', cancel);
