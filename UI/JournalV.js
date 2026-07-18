import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtEntryId = document.getElementById('txtEntryId');
const txtUserId = document.getElementById('txtUserId');
const txtEntryDate = document.getElementById('txtEntryDate');
const txtMood = document.getElementById('txtMood');
const txtTitle = document.getElementById('txtTitle');
const txtContent = document.getElementById('txtContent');
const txtCreatedAt = document.getElementById('txtCreatedAt');
const txtUpdatedAt = document.getElementById('txtUpdatedAt');

const btnFind = document.getElementById('btnFind');
const btnSelect = document.getElementById('btnSelect');
const btnClose = document.getElementById('btnClose');

// State
let currentEntryId = null;        // ID of currently displayed entry
let returnUrl = 'JournalManagement.html';

// Helpers
function clearDisplay() {
  txtEntryId.textContent = '—';
  txtUserId.textContent = '—';
  txtEntryDate.textContent = '—';
  txtMood.textContent = '—';
  txtTitle.textContent = '—';
  txtContent.textContent = '—';
  txtCreatedAt.textContent = '—';
  txtUpdatedAt.textContent = '—';
  btnSelect.disabled = true;
  currentEntryId = null;
}

async function loadEntry(id) {
  try {
    const api = new ApiClient();
    const entry = await api.getAsync(`api/Journal/${id}`);
    if (!entry) {
      clearDisplay();
      alert('Entry not found.');
      return;
    }

    currentEntryId = entry.journalEntryID;
    txtEntryId.textContent = entry.journalEntryID;
    txtUserId.textContent = entry.userID;
    txtEntryDate.textContent = entry.entryDate || '—';
    txtTitle.textContent = entry.title || '—';
    txtContent.textContent = entry.content || '—';
    txtCreatedAt.textContent = entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—';
    txtUpdatedAt.textContent = entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : '—';

    // Fetch mood if present
    if (entry.moodID) {
      try {
        const mood = await api.getAsync(`api/Mood/${entry.moodID}`);
        txtMood.textContent = mood ? `${mood.emoji || ''}  ${mood.name || ''}` : `ID: ${entry.moodID}`;
      } catch {
        txtMood.textContent = `ID: ${entry.moodID} (error)`;
      }
    } else {
      txtMood.textContent = '—';
    }

    btnSelect.disabled = false;
  } catch (err) {
    clearDisplay();
    alert(`Failed to load entry: ${err.message}`);
  }
}

// ---- Select action: return to caller with selected ID ----
function selectEntry() {
  if (!currentEntryId) {
    alert('No entry loaded.');
    return;
  }
  const separator = returnUrl.includes('?') ? '&' : '?';
  window.location.href = returnUrl + separator + 'selectedJournalId=' + currentEntryId;
}

// ---- Close: go back ----
function closeViewer() {
  window.location.href = returnUrl;
}

// ---- Find: open JournalF ----
function openFinder() {
  const baseUrl = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const returnParam = params.get('returnUrl') || 'JournalManagement.html';
  window.location.href = `JournalF.html?returnUrl=${encodeURIComponent(baseUrl + '?returnUrl=' + encodeURIComponent(returnParam))}`;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const selectedParam = params.get('selectedJournalId');
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) loadEntry(id);
  else clearDisplay();
} else if (selectedParam) {
  const id = parseInt(selectedParam, 10);
  if (!isNaN(id) && id > 0) loadEntry(id);
  else clearDisplay();
} else {
  clearDisplay();
}

// ---- Event listeners ----
btnFind.addEventListener('click', openFinder);
btnSelect.addEventListener('click', selectEntry);
btnClose.addEventListener('click', closeViewer);
