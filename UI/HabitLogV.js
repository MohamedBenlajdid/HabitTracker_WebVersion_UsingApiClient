import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const pnlFind = document.getElementById('pnlFind');
const pnlDetails = document.getElementById('pnlDetails');
const btnFindLog = document.getElementById('btnFindLog');
const txtHabitLogID = document.getElementById('txtHabitLogID');
const txtHabitName = document.getElementById('txtHabitName');
const txtLogDate = document.getElementById('txtLogDate');
const chkCompleted = document.getElementById('chkCompleted');
const txtCompletedAt = document.getElementById('txtCompletedAt');
const txtNotes = document.getElementById('txtNotes');
const txtCreatedAt = document.getElementById('txtCreatedAt');
const lblError = document.getElementById('lblError');
const btnClose = document.getElementById('btnClose');

// Helpers
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

// Load and display log details
async function loadLogById(logId) {
  clearError();
  try {
    const api = new ApiClient();
    // 1. Fetch the log
    const log = await api.getAsync(`api/HabitLog/${logId}`);
    if (!log) {
      showError('Log not found or access denied.');
      pnlDetails.classList.add('hidden');
      return;
    }

    // 2. Fetch habit name
    let habitName = 'Unknown';
    if (log.habitID > 0) {
      try {
        const habit = await api.getAsync(`api/Habit/${log.habitID}`);
        if (habit) habitName = habit.name;
      } catch {
        // ignore, keep 'Unknown'
      }
    }

    // 3. Fill fields
    txtHabitLogID.textContent = log.habitLogID;
    txtHabitName.textContent = habitName;
    txtLogDate.textContent = log.logDate; // already "YYYY-MM-DD" from API
    chkCompleted.checked = log.completed || false;
    txtCompletedAt.textContent = log.completedAt ? log.completedAt : '—';
    txtNotes.textContent = (log.notes && log.notes.trim()) ? log.notes : '—';
    txtCreatedAt.textContent = log.createdAt || '—';

    pnlFind.classList.add('hidden');
    pnlDetails.classList.remove('hidden');
  } catch (err) {
    showError(`Error loading log: ${err.message}`);
    pnlDetails.classList.add('hidden');
  }
}

// ----- Init -----
const urlParams = new URLSearchParams(window.location.search);
const idParam = urlParams.get('id');
const selectedParam = urlParams.get('selectedLogId');

if (idParam) {
  // Direct load via ?id=xxx
  const logId = parseInt(idParam, 10);
  if (!isNaN(logId) && logId > 0) {
    loadLogById(logId);
  } else {
    showError('Invalid log ID.');
  }
} else if (selectedParam) {
  // Return from finder via ?selectedLogId=xxx
  const logId = parseInt(selectedParam, 10);
  if (!isNaN(logId) && logId > 0) {
    loadLogById(logId);
  } else {
    showError('Invalid selected log ID.');
  }
} else {
  // No ID → show find button
  pnlFind.classList.remove('hidden');
  pnlDetails.classList.add('hidden');
}

// ----- Find button: redirect to finder with returnUrl -----
btnFindLog.addEventListener('click', () => {
  // Build the return URL to this page (without query params)
  const baseUrl = window.location.pathname;
  window.location.href = `HabitLogF.html?returnUrl=${encodeURIComponent(baseUrl)}`;
});

// ----- Close: go back to previous page or main -----
btnClose.addEventListener('click', () => {
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = 'Main.html';
  }
});
