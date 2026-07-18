import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const cmbFilterField = document.getElementById('cmbFilterField');
const txtFilterValue = document.getElementById('txtFilterValue');
const btnFind = document.getElementById('btnFind');
const btnRefresh = document.getElementById('btnRefresh');
const moodList = document.getElementById('moodList');
const btnSelect = document.getElementById('btnSelect');
const btnCancel = document.getElementById('btnCancel');

// State
let allMoods = [];
let filteredMoods = [];
let selectedMoodId = null;
let returnUrl = 'JournalingSessionManagement.html';

// ---- Render list ----
function renderList(moods) {
  moodList.innerHTML = '';
  if (!moods || moods.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No moods found.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    moodList.appendChild(empty);
    return;
  }

  moods.forEach(mood => {
    const div = document.createElement('div');
    div.className = 'mood-item';
    div.dataset.id = mood.moodID;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = mood.name || '';
    div.appendChild(nameSpan);

    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'emoji';
    emojiSpan.textContent = mood.emoji || '';
    div.appendChild(emojiSpan);

    const colorSpan = document.createElement('span');
    colorSpan.className = 'color';
    const color = mood.color || '#cccccc';
    colorSpan.style.backgroundColor = color;
    colorSpan.textContent = color;
    div.appendChild(colorSpan);

    // Click to select
    div.addEventListener('click', () => {
      document.querySelectorAll('.mood-item.selected').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedMoodId = mood.moodID;
      btnSelect.disabled = false;
    });

    // Double-click to select and confirm
    div.addEventListener('dblclick', () => {
      selectedMoodId = mood.moodID;
      confirmSelection();
    });

    moodList.appendChild(div);
  });
}

// ---- Filter ----
function applyFilter() {
  const filterText = txtFilterValue.value.trim();
  const field = cmbFilterField.value;

  if (!filterText) {
    filteredMoods = [...allMoods];
  } else {
    filteredMoods = allMoods.filter(m => {
      const val = (m[field.toLowerCase()] || '').toLowerCase();
      return val.includes(filterText.toLowerCase());
    });
  }

  renderList(filteredMoods);
  selectedMoodId = null;
  btnSelect.disabled = true;
}

// ---- Load data ----
async function loadData() {
  try {
    const api = new ApiClient();
    const moods = await api.getAsync('api/Mood');
    allMoods = moods || [];
    applyFilter();
  } catch (err) {
    console.error('Failed to load moods:', err);
    alert('Error loading moods.');
  }
}

// ---- Confirm selection ----
function confirmSelection() {
  if (!selectedMoodId) {
    alert('Please select a mood.');
    return;
  }
  const sep = returnUrl.includes('?') ? '&' : '?';
  window.location.href = returnUrl + sep + 'selectedMoodId=' + selectedMoodId;
}

// ---- Cancel ----
function cancel() {
  window.location.href = returnUrl;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

loadData();

// Event listeners
btnFind.addEventListener('click', applyFilter);
btnRefresh.addEventListener('click', () => {
  txtFilterValue.value = '';
  applyFilter();
});
btnSelect.addEventListener('click', confirmSelection);
btnCancel.addEventListener('click', cancel);

// Enter key triggers Find
txtFilterValue.addEventListener('keypress', e => {
  if (e.key === 'Enter') btnFind.click();
});
