import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtMoodId = document.getElementById('txtMoodId');
const txtName = document.getElementById('txtName');
const txtEmoji = document.getElementById('txtEmoji');
const txtColor = document.getElementById('txtColor');
const colorPreview = document.getElementById('colorPreview');
const btnFind = document.getElementById('btnFind');
const btnSelect = document.getElementById('btnSelect');
const btnClose = document.getElementById('btnClose');

// State
let currentMoodId = null;
let returnUrl = 'JournalingSessionManagement.html';

// Helpers
function clearDisplay() {
  txtMoodId.textContent = '—';
  txtName.textContent = '—';
  txtEmoji.textContent = '—';
  txtColor.textContent = '—';
  colorPreview.style.backgroundColor = 'transparent';
  btnSelect.disabled = true;
  currentMoodId = null;
}

function displayMood(mood) {
  if (!mood) {
    clearDisplay();
    return;
  }
  txtMoodId.textContent = mood.moodID;
  txtName.textContent = mood.name || '—';
  txtEmoji.textContent = mood.emoji || '—';
  txtColor.textContent = mood.color || '—';
  if (mood.color) {
    colorPreview.style.backgroundColor = mood.color;
  } else {
    colorPreview.style.backgroundColor = 'transparent';
  }
  currentMoodId = mood.moodID;
  btnSelect.disabled = false;
}

// Load mood by ID
async function loadMood(id) {
  try {
    const api = new ApiClient();
    const mood = await api.getAsync(`api/Mood/${id}`);
    if (!mood) {
      alert('Mood not found.');
      clearDisplay();
      return;
    }
    displayMood(mood);
  } catch (err) {
    alert(`Failed to load mood: ${err.message}`);
    clearDisplay();
  }
}

// ---- Select action: return to caller with selected ID ----
function selectMood() {
  if (!currentMoodId) {
    alert('No mood loaded.');
    return;
  }
  const sep = returnUrl.includes('?') ? '&' : '?';
  window.location.href = returnUrl + sep + 'selectedMoodId=' + currentMoodId;
}

// ---- Close: go back ----
function closeViewer() {
  window.location.href = returnUrl;
}

// ---- Find: open MoodF ----
function openFinder() {
  const baseUrl = window.location.pathname;
  // Pass the current returnUrl so after selection MoodF comes back here
  window.location.href = `MoodF.html?returnUrl=${encodeURIComponent(baseUrl + '?returnUrl=' + encodeURIComponent(returnUrl))}`;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const selectedParam = params.get('selectedMoodId');
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) loadMood(id);
  else clearDisplay();
} else if (selectedParam) {
  const id = parseInt(selectedParam, 10);
  if (!isNaN(id) && id > 0) loadMood(id);
  else clearDisplay();
} else {
  clearDisplay();
}

// ---- Event listeners ----
btnFind.addEventListener('click', openFinder);
btnSelect.addEventListener('click', selectMood);
btnClose.addEventListener('click', closeViewer);
