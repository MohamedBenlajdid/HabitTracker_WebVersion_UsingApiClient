import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const txtUsername = document.getElementById('txtUsername');
const txtDate = document.getElementById('txtDate');
const lblError = document.getElementById('lblError');
const tbody = document.getElementById('habitLogBody');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');

// State
let rows = []; // array of { habitId, habitName, isCompleted, notes, logId }
let userId = ApiClient.CurrentUserId;
let logDate = new Date(); // default to today

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

// Render rows into the table
function renderRows() {
  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No habits found for today.';
    td.style.textAlign = 'center';
    td.style.padding = '20px';
    td.style.color = '#888';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row, index) => {
    const tr = document.createElement('tr');

    // ID
    const tdId = document.createElement('td');
    tdId.textContent = row.habitId;
    tdId.className = 'col-id';
    tr.appendChild(tdId);

    // Name
    const tdName = document.createElement('td');
    tdName.textContent = row.habitName;
    tdName.className = 'col-name';
    tr.appendChild(tdName);

    // Done? (checkbox)
    const tdDone = document.createElement('td');
    tdDone.className = 'col-done';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = row.isCompleted || false;
    chk.addEventListener('change', () => {
      rows[index].isCompleted = chk.checked;
    });
    tdDone.appendChild(chk);
    tr.appendChild(tdDone);

    // Notes (text input)
    const tdNotes = document.createElement('td');
    tdNotes.className = 'col-notes';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = row.notes || '';
    inp.placeholder = 'Optional note';
    inp.addEventListener('input', () => {
      rows[index].notes = inp.value;
    });
    tdNotes.appendChild(inp);
    tr.appendChild(tdNotes);

    tbody.appendChild(tr);
  });
}

// ----- Load user info -----
async function loadUserInfo() {
  try {
    const api = new ApiClient();
    const user = await api.getAsync(`api/User/${userId}`);
    txtUsername.textContent = user ? user.email : 'Unknown';
  } catch {
    txtUsername.textContent = 'Unknown';
  }
}

// ----- Load habits and logs -----
async function loadHabitsAndLogs() {
  clearError();
  try {
    const api = new ApiClient();
    // 1. Get habits for this user
    const habits = await api.getAsync(`api/Habit/user/${userId}`);
    if (!habits || habits.length === 0) {
      rows = [];
      renderRows();
      return;
    }

    // 2. Get today's logs
    const dateStr = formatDate(logDate);
    const logs = await api.getAsync(`api/HabitLog/user/${userId}/date/${dateStr}`);
    const logMap = {};
    if (logs) {
      logs.forEach(l => { logMap[l.habitID] = l; });
    }

    // 3. Build rows
    rows = habits.map(h => {
      const log = logMap[h.habitID];
      return {
        habitId: h.habitID,
        habitName: h.name,
        isCompleted: log ? log.completed : false,
        notes: log ? log.notes || '' : '',
        logId: log ? log.habitLogID : 0
      };
    });

    renderRows();
  } catch (err) {
    showError(`Error loading data: ${err.message}`);
  }
}

// ----- Save all logs -----
async function saveLogs() {
  clearError();
  try {
    const api = new ApiClient();
    const dateStr = formatDate(logDate);

    for (const row of rows) {
      const hasData = row.isCompleted || row.notes.trim() !== '';

      if (row.logId > 0) {
        // Update existing log
        const logData = {
          habitLogID: row.logId,
          habitID: row.habitId,
          logDate: dateStr,
          completed: row.isCompleted,
          notes: row.notes
        };
        const response = await api.putAsync(`api/HabitLog/${row.logId}`, logData);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update log for '${row.habitName}': ${errorText}`);
        }
      } else if (hasData) {
        // Insert new log
        const logData = {
          habitID: row.habitId,
          logDate: dateStr,
          completed: row.isCompleted,
          notes: row.notes
        };
        const response = await api.postAsync('api/HabitLog', logData);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to insert log for '${row.habitName}': ${errorText}`);
        }
      }
      // If no data and no existing log, skip
    }

    // Success: go back (or stay) – we'll redirect to the previous page
    if (document.referrer) {
      window.history.back();
    } else {
      window.location.href = 'Main.html';
    }
  } catch (err) {
    showError(`Error saving: ${err.message}`);
  }
}

// ----- Cancel -----
function cancel() {
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = 'Main.html';
  }
}

// ----- Init -----
// Check for date parameter? default today
const params = new URLSearchParams(window.location.search);
const dateParam = params.get('date');
if (dateParam) {
  const parts = dateParam.split('-');
  if (parts.length === 3) {
    logDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    if (isNaN(logDate.getTime())) logDate = new Date();
  }
}
txtDate.textContent = formatDate(logDate);

// Load everything
loadUserInfo();
loadHabitsAndLogs();

// Event listeners
btnSave.addEventListener('click', saveLogs);
btnCancel.addEventListener('click', cancel);
