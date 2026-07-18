import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtSearch = document.getElementById('txtSearch');
const listContainer = document.getElementById('habitListContainer');
const lblStatus = document.getElementById('lblStatus');
const lblError = document.getElementById('lblError');
const btnNew = document.getElementById('btnNew');
const btnFind = document.getElementById('btnFind');
const btnView = document.getElementById('btnView');
const btnDelete = document.getElementById('btnDelete');
const btnTodayLog = document.getElementById('btnTodayLog');
const btnFilterLogs = document.getElementById('btnFilterLogs');
const btnViewLogs = document.getElementById('btnViewLogs');

// Confirm modal refs
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

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
function setStatus(msg) {
  lblStatus.textContent = msg;
}

// ---- Confirm dialog (Promise-based) ----
function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmModal.classList.remove('hidden');
    confirmYes.onclick = () => {
      confirmModal.classList.add('hidden');
      resolve(true);
    };
    confirmNo.onclick = () => {
      confirmModal.classList.add('hidden');
      resolve(false);
    };
  });
}

// ---- Render list ----
function renderList(habits) {
  listContainer.innerHTML = '';
  if (!habits || habits.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No habits found.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    listContainer.appendChild(empty);
    return;
  }

  habits.forEach(h => {
    const div = document.createElement('div');
    div.className = 'habit-item';
    div.dataset.id = h.habitID;

    // Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = h.name || '';
    div.appendChild(nameSpan);

    // Category
    const catSpan = document.createElement('span');
    catSpan.className = 'category';
    const catName = h.categoryID && categoryMap[h.categoryID] ? categoryMap[h.categoryID] : '—';
    catSpan.textContent = `Cat: ${catName}`;
    div.appendChild(catSpan);

    // Frequency
    const freqSpan = document.createElement('span');
    freqSpan.className = 'frequency';
    let freqText = `${h.targetPerWeek || 0}/w`;
    if (h.targetPerDay) freqText += `  ·  ${h.targetPerDay}/d`;
    freqSpan.textContent = freqText;
    div.appendChild(freqSpan);

    // Archived badge
    if (h.isArchived) {
      const archSpan = document.createElement('span');
      archSpan.className = 'archived';
      archSpan.textContent = 'Archived';
      div.appendChild(archSpan);
    }

    // Click to select
    div.addEventListener('click', () => {
      document.querySelectorAll('.habit-item.selected').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedId = h.habitID;
      clearError();
    });

    // Double-click to edit
    div.addEventListener('dblclick', () => {
      selectedId = h.habitID;
      openEdit(selectedId);
    });

    listContainer.appendChild(div);
  });
}

// ---- Filtering ----
function refreshList() {
  const filter = txtSearch.value.trim();
  const filtered = filter ? allHabits.filter(h => h.name.toLowerCase().includes(filter.toLowerCase())) : allHabits;
  renderList(filtered);
  selectedId = null;
  clearError();
}

// ---- Load data ----
async function loadData() {
  setStatus('Loading habits...');
  clearError();
  try {
    const api = new ApiClient();
    const userId = ApiClient.CurrentUserId;
    if (!userId) {
      showError('User not logged in.');
      setStatus('Error loading habits.');
      return;
    }

    // 1. Get habits
    const habits = await api.getAsync(`api/Habit/user/${userId}`);
    allHabits = habits || [];

    // 2. Get categories for mapping
    const categories = await api.getAsync('api/HabitCategory');
    if (categories) {
      categoryMap = {};
      categories.forEach(c => { categoryMap[c.categoryID] = c.name; });
    }

    refreshList();
    setStatus(`${allHabits.length} habit(s) loaded.`);
  } catch (err) {
    showError(`Failed to load data: ${err.message}`);
    setStatus('Error loading habits.');
  }
}

// ---- Actions ----
function getSelectedId() {
  if (selectedId) return selectedId;
  // fallback: try to find selected class
  const sel = document.querySelector('.habit-item.selected');
  if (sel && sel.dataset.id) {
    selectedId = parseInt(sel.dataset.id, 10);
    return selectedId;
  }
  return null;
}

function openEdit(id) {
  window.location.href = `HabitCU.html?id=${id}`;
}

async function handleNew() {
  window.location.href = 'HabitCU.html';
}

async function handleFind() {
  // Open finder with return URL to this page
  window.location.href = `HabitF.html?returnUrl=${encodeURIComponent(window.location.pathname)}`;
}

async function handleView() {
  const id = getSelectedId();
  if (!id) {
    showError('Please select a habit first.');
    return;
  }
  window.location.href = `HabitV.html?id=${id}`;
}

async function handleDelete() {
  const id = getSelectedId();
  if (!id) {
    showError('Please select a habit first.');
    return;
  }
  const confirmed = await showConfirm('Are you sure you want to delete this habit?');
  if (!confirmed) return;

  try {
    const api = new ApiClient();
    const response = await api.deleteAsync(`api/Habit/${id}`);
    if (response.ok) {
      setStatus('Habit deleted.');
      await loadData(); // reload list
    } else {
      const errorText = await response.text();
      showError(errorText || 'Delete failed.');
    }
  } catch (err) {
    showError(`Delete failed: ${err.message}`);
  }
}

function handleTodayLog() {
  window.location.href = 'HabitLogCU.html';
}

function handleFilterLogs() {
  window.location.href = 'HabitLogF.html';
}

function handleViewLogs() {
  window.location.href = 'HabitLogV.html';
}

// ---- Check for return from finder (selectedHabitId) ----
function checkReturnParam() {
  const params = new URLSearchParams(window.location.search);
  const selected = params.get('selectedHabitId');
  if (selected) {
    const id = parseInt(selected, 10);
    if (!isNaN(id)) {
      // Remove the param from URL and open viewer
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      // Now open viewer with that ID
      window.location.href = `HabitV.html?id=${id}`;
    }
  }
}

// ---- Init ----
checkReturnParam(); // if we came back from finder

// Load data on page load
loadData();

// Event listeners
txtSearch.addEventListener('input', refreshList);

btnNew.addEventListener('click', handleNew);
btnFind.addEventListener('click', handleFind);
btnView.addEventListener('click', handleView);
btnDelete.addEventListener('click', handleDelete);
btnTodayLog.addEventListener('click', handleTodayLog);
btnFilterLogs.addEventListener('click', handleFilterLogs);
btnViewLogs.addEventListener('click', handleViewLogs);

// If the user clicks outside the modal, close it (optional)
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.classList.add('hidden');
  }
});
