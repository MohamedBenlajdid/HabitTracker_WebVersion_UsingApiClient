import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const txtSearch = document.getElementById('txtSearch');
const habitList = document.getElementById('habitList');
const lblError = document.getElementById('lblError');
const btnSelect = document.getElementById('btnSelect');
const btnCancel = document.getElementById('btnCancel');

// State
let allHabits = [];
let categoryMap = {}; // id -> name
let selectedId = null;

// Helpers
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

// Render the list from a given array of habits
function renderList(habits) {
  habitList.innerHTML = '';
  if (!habits || habits.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No habits found.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    habitList.appendChild(empty);
    return;
  }

  habits.forEach(h => {
    const item = document.createElement('div');
    item.className = 'habit-item';
    item.dataset.id = h.habitID;

    // Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'habit-name';
    nameSpan.textContent = h.name || '';
    item.appendChild(nameSpan);

    // Category
    const catSpan = document.createElement('span');
    catSpan.className = 'habit-category';
    const catName = h.categoryID && categoryMap[h.categoryID] ? categoryMap[h.categoryID] : '—';
    catSpan.textContent = `Cat: ${catName}`;
    item.appendChild(catSpan);

    // Frequency
    const freqSpan = document.createElement('span');
    freqSpan.className = 'habit-frequency';
    freqSpan.textContent = `${h.targetPerWeek || 0}/week`;
    item.appendChild(freqSpan);

    // Click to select
    item.addEventListener('click', () => {
      document.querySelectorAll('.habit-item.selected').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedId = h.habitID;
      clearError();
    });

    // Double-click to select and confirm
    item.addEventListener('dblclick', () => {
      selectedId = h.habitID;
      confirmSelection();
    });

    habitList.appendChild(item);
  });
}

// Filter and re-render
function filterHabits() {
  const filter = txtSearch.value.trim();
  if (!filter) {
    renderList(allHabits);
    return;
  }
  const filtered = allHabits.filter(h =>
    h.name.toLowerCase().includes(filter.toLowerCase())
  );
  renderList(filtered);
}

// Confirm selection: redirect back with chosen ID
function confirmSelection() {
  if (selectedId === null) {
    showError('Please select a habit first.');
    return;
  }
  clearError();

  // Get the return URL from query string (default to HabitCU.html)
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'HabitCU.html';

  // Build the redirect URL with the selected habit ID
  const separator = returnUrl.includes('?') ? '&' : '?';
  const redirectTo = returnUrl + separator + 'selectedHabitId=' + selectedId;

  window.location.href = redirectTo;
}

// Cancel: go back without selection
function cancelSelection() {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'HabitCU.html';
  window.location.href = returnUrl;
}

// ----- Load data on page load -----
async function loadData() {
  try {
    const api = new ApiClient();
    const userId = ApiClient.CurrentUserId;
    if (!userId) {
      showError('User not logged in.');
      return;
    }

    // Load habits for the current user
    const habits = await api.getAsync(`api/Habit/user/${userId}`);
    allHabits = habits || [];

    // Load categories to map names
    const categories = await api.getAsync('api/HabitCategory');
    if (categories) {
      categoryMap = {};
      categories.forEach(c => { categoryMap[c.categoryID] = c.name; });
    }

    renderList(allHabits);
  } catch (err) {
    showError(`Failed to load data: ${err.message}`);
  }
}

// ----- Event listeners -----
txtSearch.addEventListener('input', filterHabits);
btnSelect.addEventListener('click', confirmSelection);
btnCancel.addEventListener('click', cancelSelection);

// ----- Init -----
loadData();
