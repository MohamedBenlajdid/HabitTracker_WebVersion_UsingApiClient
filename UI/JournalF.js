import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const cmbFilterField = document.getElementById('cmbFilterField');
const txtFilterValue = document.getElementById('txtFilterValue');
const btnFind = document.getElementById('btnFind');
const btnRefresh = document.getElementById('btnRefresh');
const entryList = document.getElementById('entryList');
const btnSelect = document.getElementById('btnSelect');
const btnCancel = document.getElementById('btnCancel');

// State
let allEntries = [];
let filteredEntries = [];
let moodEmojiCache = {};
let selectedEntryId = null;

// Return URL (where to go after selection/cancel)
let returnUrl = 'JournalManagement.html';

// Helpers
function renderList(entries) {
  entryList.innerHTML = '';
  if (!entries || entries.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No entries found.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    entryList.appendChild(empty);
    return;
  }

  entries.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'entry-item';
    div.dataset.id = entry.journalEntryID;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    dateSpan.textContent = entry.entryDate || '';
    div.appendChild(dateSpan);

    const emoji = entry.moodID && moodEmojiCache[entry.moodID] ? moodEmojiCache[entry.moodID] : '';
    if (emoji) {
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'emoji';
      emojiSpan.textContent = emoji;
      div.appendChild(emojiSpan);
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'title';
    titleSpan.textContent = entry.title || '';
    div.appendChild(titleSpan);

    // Click to select
    div.addEventListener('click', () => {
      document.querySelectorAll('.entry-item.selected').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedEntryId = entry.journalEntryID;
      btnSelect.disabled = false;
    });

    // Double-click to select and confirm
    div.addEventListener('dblclick', () => {
      selectedEntryId = entry.journalEntryID;
      confirmSelection();
    });

    entryList.appendChild(div);
  });
}

// ---- Filter logic ----
function applyFilter() {
  const filterText = txtFilterValue.value.trim();
  const field = cmbFilterField.value;

  if (!filterText) {
    filteredEntries = [...allEntries];
  } else {
    filteredEntries = allEntries.filter(entry => {
      switch (field) {
        case 'Title':
          return entry.title && entry.title.toLowerCase().includes(filterText.toLowerCase());
        case 'Content':
          return entry.content && entry.content.toLowerCase().includes(filterText.toLowerCase());
        case 'Date':
          return entry.entryDate && entry.entryDate.includes(filterText);
        case 'Mood':
          if (!entry.moodID) return false;
          const emoji = moodEmojiCache[entry.moodID] || '';
          return emoji.toLowerCase().includes(filterText.toLowerCase());
        default:
          return true;
      }
    });
  }

  // Sort by date descending
  filteredEntries.sort((a, b) => (a.entryDate > b.entryDate ? -1 : 1));
  renderList(filteredEntries);
  selectedEntryId = null;
  btnSelect.disabled = true;
}

// ---- Load data ----
async function loadData() {
  try {
    const api = new ApiClient();
    const userId = ApiClient.CurrentUserId;
    if (!userId) {
      alert('User not logged in.');
      return;
    }

    // Load entries
    const entries = await api.getAsync(`api/Journal/user/${userId}`);
    allEntries = entries || [];

    // Load moods
    const moods = await api.getAsync('api/Mood');
    if (moods) {
      moodEmojiCache = {};
      moods.forEach(m => { moodEmojiCache[m.moodID] = m.emoji || ''; });
    }

    applyFilter();
  } catch (err) {
    console.error('Failed to load data:', err);
    alert('Error loading journal entries.');
  }
}

// ---- Confirm selection ----
function confirmSelection() {
  if (!selectedEntryId) {
    alert('Please select an entry.');
    return;
  }
  // Redirect back to returnUrl with selected ID
  const separator = returnUrl.includes('?') ? '&' : '?';
  window.location.href = returnUrl + separator + 'selectedJournalId=' + selectedEntryId;
}

// ---- Cancel ----
function cancel() {
  window.location.href = returnUrl;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

// Load data
loadData();

// Event listeners
btnFind.addEventListener('click', applyFilter);
btnRefresh.addEventListener('click', () => {
  txtFilterValue.value = '';
  applyFilter();
});
btnSelect.addEventListener('click', confirmSelection);
btnCancel.addEventListener('click', cancel);

// Allow Enter key to trigger Find
txtFilterValue.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') btnFind.click();
});
