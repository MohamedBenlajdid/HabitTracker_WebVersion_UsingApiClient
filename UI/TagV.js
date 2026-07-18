import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtTagId = document.getElementById('txtTagId');
const txtName = document.getElementById('txtName');
const txtCreatedAt = document.getElementById('txtCreatedAt');
const btnFind = document.getElementById('btnFind');
const btnSelect = document.getElementById('btnSelect');
const btnClose = document.getElementById('btnClose');

// State
let currentTagId = null;
let returnUrl = 'JournalingSessionManagement.html';

// Helpers
function clearDisplay() {
  txtTagId.textContent = '—';
  txtName.textContent = '—';
  txtCreatedAt.textContent = '—';
  btnSelect.disabled = true;
  currentTagId = null;
}

function displayTag(tag) {
  if (!tag) {
    clearDisplay();
    return;
  }
  txtTagId.textContent = tag.tagID;
  txtName.textContent = tag.name || '—';
  txtCreatedAt.textContent = tag.createdAt ? new Date(tag.createdAt).toLocaleString() : '—';
  currentTagId = tag.tagID;
  btnSelect.disabled = false;
}

// Load tag by ID
async function loadTag(id) {
  try {
    const api = new ApiClient();
    const tag = await api.getAsync(`api/Tag/${id}`);
    if (!tag) {
      alert('Tag not found.');
      clearDisplay();
      return;
    }
    displayTag(tag);
  } catch (err) {
    alert(`Failed to load tag: ${err.message}`);
    clearDisplay();
  }
}

// ---- Select action: return to caller with selected ID ----
function selectTag() {
  if (!currentTagId) {
    alert('No tag loaded.');
    return;
  }
  const sep = returnUrl.includes('?') ? '&' : '?';
  window.location.href = returnUrl + sep + 'selectedTagId=' + currentTagId;
}

// ---- Close: go back ----
function closeViewer() {
  window.location.href = returnUrl;
}

// ---- Find: open TagF ----
function openFinder() {
  const baseUrl = window.location.pathname;
  // Pass the current returnUrl so after selection TagF comes back here
  window.location.href = `TagF.html?returnUrl=${encodeURIComponent(baseUrl + '?returnUrl=' + encodeURIComponent(returnUrl))}`;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const selectedParam = params.get('selectedTagId');
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) loadTag(id);
  else clearDisplay();
} else if (selectedParam) {
  const id = parseInt(selectedParam, 10);
  if (!isNaN(id) && id > 0) loadTag(id);
  else clearDisplay();
} else {
  clearDisplay();
}

// ---- Event listeners ----
btnFind.addEventListener('click', openFinder);
btnSelect.addEventListener('click', selectTag);
btnClose.addEventListener('click', closeViewer);
