import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const form = document.getElementById('journalForm');
const txtTitle = document.getElementById('txtTitle');
const dpEntryDate = document.getElementById('dpEntryDate');
const txtContent = document.getElementById('txtContent');
const txtMoodDisplay = document.getElementById('txtMoodDisplay');
const btnSelectMood = document.getElementById('btnSelectMood');
const btnManageTags = document.getElementById('btnManageTags');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const txtError = document.getElementById('txtError');
const windowTitle = document.getElementById('windowTitle');

// Mood modal refs
const moodModal = document.getElementById('moodModal');
const moodList = document.getElementById('moodList');
const moodCancel = document.getElementById('moodCancel');

// State
let existingEntryId = null;
let selectedMoodId = null;
let moods = [];
let returnUrl = 'JournalManagement.html'; // default

// Helpers
function showMessage(msg, type = 'error') {
  txtError.textContent = msg;
  txtError.className = 'message ' + type;
}
function clearMessage() {
  txtError.className = 'message hidden';
}

function setMoodDisplay(mood) {
  if (mood) {
    txtMoodDisplay.textContent = mood.emoji + '  ' + mood.name;
  } else {
    txtMoodDisplay.textContent = '';
  }
}

// ---- Mood selection modal ----
async function loadMoods() {
  try {
    const api = new ApiClient();
    moods = await api.getAsync('api/Mood') || [];
    renderMoodList(moods);
  } catch (err) {
    showMessage('Failed to load moods: ' + err.message);
  }
}

function renderMoodList(moods) {
  moodList.innerHTML = '';
  if (moods.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'No moods available.';
    div.style.padding = '10px';
    div.style.color = '#888';
    moodList.appendChild(div);
    return;
  }
  moods.forEach(m => {
    const div = document.createElement('div');
    div.className = 'mood-item';
    div.innerHTML = `<span class="emoji">${m.emoji || ''}</span> ${m.name}`;
    div.addEventListener('click', () => {
      selectedMoodId = m.moodID;
      setMoodDisplay(m);
      moodModal.classList.add('hidden');
    });
    moodList.appendChild(div);
  });
}

btnSelectMood.addEventListener('click', () => {
  moodModal.classList.remove('hidden');
  // Reload moods in case they changed
  loadMoods();
});
moodCancel.addEventListener('click', () => {
  moodModal.classList.add('hidden');
});
// Click outside modal to close
moodModal.addEventListener('click', (e) => {
  if (e.target === moodModal) moodModal.classList.add('hidden');
});

// ---- Load existing entry ----
async function loadEntry(id) {
  clearMessage();
  try {
    const api = new ApiClient();
    const entry = await api.getAsync(`api/Journal/${id}`);
    if (!entry) {
      showMessage('Journal entry not found.');
      return;
    }
    existingEntryId = entry.journalEntryID;
    txtTitle.value = entry.title || '';
    dpEntryDate.value = entry.entryDate; // expects YYYY-MM-DD
    txtContent.value = entry.content || '';
    selectedMoodId = entry.moodID;
    if (selectedMoodId) {
      // Find mood name/emoji from a separate call? We can fetch the mood.
      try {
        const mood = await api.getAsync(`api/Mood/${selectedMoodId}`);
        if (mood) setMoodDisplay(mood);
      } catch {
        // ignore
      }
    }
    btnManageTags.style.display = 'inline-block';
    windowTitle.textContent = 'Edit Journal Entry';
  } catch (err) {
    showMessage('Failed to load entry: ' + err.message);
  }
}

// ---- Save ----
async function saveEntry(e) {
  e.preventDefault();
  clearMessage();

  const title = txtTitle.value.trim();
  const date = dpEntryDate.value;
  const content = txtContent.value.trim();

  if (!title) {
    showMessage('Title is required.');
    return;
  }
  if (!date) {
    showMessage('Date is required.');
    return;
  }

  const entry = {
    title,
    entryDate: date,
    content,
    moodID: selectedMoodId,
    userID: ApiClient.CurrentUserId
  };

  try {
    const api = new ApiClient();
    let response;
    if (existingEntryId) {
      // Update
      response = await api.putAsync(`api/Journal/${existingEntryId}`, entry);
    } else {
      // Create
      response = await api.postAsync('api/Journal', entry);
    }

    if (response.ok) {
      let newId = existingEntryId;
      if (!existingEntryId) {
        // Get the created ID from response
        const created = await response.json();
        newId = created.journalEntryID;
      }
      showMessage('Journal entry saved successfully.', 'success');
      // Enable manage tags if not already
      btnManageTags.style.display = 'inline-block';
      // Optionally redirect back after a short delay
      setTimeout(() => {
        // Go back to returnUrl with maybe a query param
        const redirect = returnUrl.includes('?') ? returnUrl + '&saved=1' : returnUrl + '?saved=1';
        window.location.href = redirect;
      }, 1000);
    } else {
      const errorText = await response.text();
      showMessage(errorText || 'Failed to save entry.');
    }
  } catch (err) {
    showMessage('Error saving entry: ' + err.message);
  }
}

// ---- Manage Tags ----
// In JournalCU.js
btnManageTags.addEventListener('click', () => {
  if (existingEntryId) {
    // Pass the entry ID and a return URL so the tag manager comes back here
    const returnParam = `returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    window.location.href = `JournalTagManage.html?id=${existingEntryId}&${returnParam}`;
  }
});

// ---- Cancel ----
btnCancel.addEventListener('click', () => {
  window.location.href = returnUrl;
});

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) {
    loadEntry(id);
  } else {
    showMessage('Invalid entry ID.');
  }
} else {
  // Create mode
  btnManageTags.style.display = 'none';
  windowTitle.textContent = 'New Journal Entry';
  // Set today's date
  const today = new Date().toISOString().split('T')[0];
  dpEntryDate.value = today;
}

// Form submit
form.addEventListener('submit', saveEntry);

// Load moods initially (for mood modal)
loadMoods();
