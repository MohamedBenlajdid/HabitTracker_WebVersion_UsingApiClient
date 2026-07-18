import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const txtId = document.getElementById('txtId');
const txtName = document.getElementById('txtName');
const txtCategory = document.getElementById('txtCategory');
const txtTargetPerWeek = document.getElementById('txtTargetPerWeek');
const txtTargetPerDay = document.getElementById('txtTargetPerDay');
const txtReminder = document.getElementById('txtReminder');
const txtDescription = document.getElementById('txtDescription');
const lblError = document.getElementById('lblError');
const btnFind = document.getElementById('btnFind');
const btnClose = document.getElementById('btnClose');

// Helpers
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

function clearFields() {
  txtId.textContent = '-';
  txtName.textContent = '-';
  txtCategory.textContent = '-';
  txtTargetPerWeek.textContent = '-';
  txtTargetPerDay.textContent = '-';
  txtReminder.textContent = '-';
  txtDescription.textContent = '-';
}

// Load and display habit details
async function loadHabitById(id) {
  clearError();
  try {
    const api = new ApiClient();
    // 1. Fetch the habit
    const habit = await api.getAsync(`api/Habit/${id}`);
    if (!habit) {
      clearFields();
      showError('Habit not found.');
      return;
    }

    // 2. Fetch category name if needed
    let categoryName = '—';
    if (habit.categoryID) {
      try {
        const category = await api.getAsync(`api/HabitCategory/${habit.categoryID}`);
        if (category) categoryName = category.name;
      } catch {
        // ignore, keep default
      }
    }

    // 3. Fill fields
    txtId.textContent = habit.habitID ?? '-';
    txtName.textContent = habit.name || '-';
    txtCategory.textContent = categoryName;
    txtTargetPerWeek.textContent = habit.targetPerWeek ?? '-';
    txtTargetPerDay.textContent = habit.targetPerDay ?? '-';
    // Format reminder time if present
    if (habit.reminderTime) {
      let timeStr = habit.reminderTime;
      if (typeof timeStr === 'object') {
        // e.g. { hours: 8, minutes: 0 }
        const h = String(timeStr.hours).padStart(2, '0');
        const m = String(timeStr.minutes).padStart(2, '0');
        timeStr = `${h}:${m}`;
      } else if (typeof timeStr === 'string' && timeStr.length >= 5) {
        timeStr = timeStr.substring(0, 5);
      }
      txtReminder.textContent = timeStr;
    } else {
      txtReminder.textContent = '—';
    }
    txtDescription.textContent = (habit.description && habit.description.trim()) ? habit.description : '—';

    clearError();
  } catch (err) {
    clearFields();
    showError(`Failed to load habit: ${err.message}`);
  }
}

// ----- Init -----
const urlParams = new URLSearchParams(window.location.search);
const idParam = urlParams.get('id');
const selectedParam = urlParams.get('selectedHabitId');

if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) {
    loadHabitById(id);
  } else {
    showError('Invalid habit ID.');
  }
} else if (selectedParam) {
  const id = parseInt(selectedParam, 10);
  if (!isNaN(id) && id > 0) {
    loadHabitById(id);
  } else {
    showError('Invalid selected habit ID.');
  }
} else {
  // No ID: show find button and clear fields
  btnFind.style.display = 'inline-block';
  clearFields();
}

// ----- Find button: redirect to finder with returnUrl -----
btnFind.addEventListener('click', () => {
  const baseUrl = window.location.pathname;
  window.location.href = `HabitF.html?returnUrl=${encodeURIComponent(baseUrl)}`;
});

// ----- Close: go back to previous page or management -----
btnClose.addEventListener('click', () => {
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = 'HabitManagement.html';
  }
});
