import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM elements
const dpLogDate = document.getElementById('dpLogDate');
const btnLoad = document.getElementById('btnLoad');
const lblError = document.getElementById('lblError');
const tbody = document.getElementById('logBody');
const btnCancel = document.getElementById('btnCancel');

// State
let userId = ApiClient.CurrentUserId;
let selectedLogId = null;

// Helpers
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Render rows from log data
function renderLogs(logs, habitNames) {
  tbody.innerHTML = '';
  if (!logs || logs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'No logs found for this date.';
    td.style.textAlign = 'center';
    td.style.padding = '20px';
    td.style.color = '#888';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement('tr');

    // Log ID
    const tdId = document.createElement('td');
    tdId.textContent = log.habitLogID;
    tdId.className = 'col-logid';
    tr.appendChild(tdId);

    // Habit name
    const tdHabit = document.createElement('td');
    tdHabit.textContent = habitNames[log.habitID] || 'Unknown';
    tdHabit.className = 'col-habit';
    tr.appendChild(tdHabit);

    // Completed (checkbox, disabled)
    const tdCompleted = document.createElement('td');
    tdCompleted.className = 'col-completed';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = log.completed || false;
    chk.disabled = true;
    tdCompleted.appendChild(chk);
    tr.appendChild(tdCompleted);

    // Notes
    const tdNotes = document.createElement('td');
    tdNotes.textContent = log.notes || '';
    tdNotes.className = 'col-notes';
    tr.appendChild(tdNotes);

    // Select button
    const tdSelect = document.createElement('td');
    tdSelect.className = 'col-select';
    const btn = document.createElement('button');
    btn.textContent = 'Select';
    btn.className = 'btn-select';
    btn.dataset.logId = log.habitLogID;
    btn.addEventListener('click', () => {
      selectedLogId = parseInt(btn.dataset.logId, 10);
      confirmSelection();
    });
    tdSelect.appendChild(btn);
    tr.appendChild(tdSelect);

    tbody.appendChild(tr);
  });
}

// Load logs for a given date
async function loadLogs(date) {
  clearError();
  try {
    const api = new ApiClient();
    const dateStr = formatDate(date);
    // 1. Get logs for the date
    const logs = await api.getAsync(`api/HabitLog/user/${userId}/date/${dateStr}`);
    if (!logs || logs.length === 0) {
      renderLogs([], {});
      return;
    }
    // 2. Get all habits to map IDs to names
    const habits = await api.getAsync(`api/Habit/user/${userId}`);
    const habitMap = {};
    if (habits) {
      habits.forEach(h => { habitMap[h.habitID] = h.name; });
    }
    renderLogs(logs, habitMap);
  } catch (err) {
    showError(`Error loading logs: ${err.message}`);
  }
}

// Confirm selection: redirect back with selected log ID
function confirmSelection() {
  if (selectedLogId === null) {
    showError('Please select a log.');
    return;
  }
  clearError();
  // Get return URL from query parameter, default to Main.html
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'Main.html';
  const separator = returnUrl.includes('?') ? '&' : '?';
  const redirectTo = returnUrl + separator + 'selectedLogId=' + selectedLogId;
  window.location.href = redirectTo;
}

// Cancel: go back without selection
function cancel() {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'Main.html';
  window.location.href = returnUrl;
}

// ----- Init -----
// 1. Set date from URL or today
const urlParams = new URLSearchParams(window.location.search);
const dateParam = urlParams.get('date');
let initialDate = new Date();
if (dateParam) {
  const parts = dateParam.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    if (!isNaN(d.getTime())) initialDate = d;
  }
}
dpLogDate.value = formatDate(initialDate);

// 2. Load initial logs
loadLogs(initialDate);

// 3. Event listeners
btnLoad.addEventListener('click', () => {
  const dateVal = dpLogDate.value;
  if (!dateVal) {
    showError('Please select a date.');
    return;
  }
  const parts = dateVal.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  if (isNaN(d.getTime())) {
    showError('Invalid date.');
    return;
  }
  loadLogs(d);
});

btnCancel.addEventListener('click', cancel);
