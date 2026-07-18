import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// ----- DOM references -----
const form = document.getElementById('habitForm');
const windowTitle = document.getElementById('windowTitle');
const txtName = document.getElementById('txtName');
const txtTargetPerWeek = document.getElementById('txtTargetPerWeek');
const txtTargetPerDay = document.getElementById('txtTargetPerDay');
const txtReminderTime = document.getElementById('txtReminderTime');
const txtDescription = document.getElementById('txtDescription');
const chkArchived = document.getElementById('chkArchived');
const ddlCategory = document.getElementById('ddlCategory');
const lblError = document.getElementById('lblError');
const btnCancel = document.getElementById('btnCancel');

// ----- State -----
let isUpdate = false;
let habitId = null;

// ----- Helpers -----
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

// Load categories into dropdown
async function loadCategories() {
  try {
    const api = new ApiClient();
    const categories = await api.getAsync('api/HabitCategory');
    // Clear existing options (keep the "None" one)
    ddlCategory.innerHTML = '<option value="">None</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.categoryID; // or id, adjust to your model
      opt.textContent = cat.name;
      ddlCategory.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
    // Optionally show error, but not critical
  }
}

// Load existing habit for edit
async function loadHabit(id) {
  try {
    const api = new ApiClient();
    const habit = await api.getAsync(`api/Habit/${id}`);
    if (!habit) {
      showError('Habit not found.');
      return false;
    }
    txtName.value = habit.name || '';
    txtTargetPerWeek.value = habit.targetPerWeek ?? '';
    txtTargetPerDay.value = habit.targetPerDay ?? '';
    // ReminderTime: expect a string "HH:mm:ss" or timespan; we only want HH:mm
    if (habit.reminderTime) {
      // If it's an object with hours/minutes, format; else if string, take first 5 chars
      let timeStr = habit.reminderTime;
      if (typeof timeStr === 'object') {
        // Assuming it's like { hours: 8, minutes: 0 }
        timeStr = `${String(habit.reminderTime.hours).padStart(2,'0')}:${String(habit.reminderTime.minutes).padStart(2,'0')}`;
      } else if (typeof timeStr === 'string' && timeStr.length >= 5) {
        timeStr = timeStr.substring(0,5);
      }
      txtReminderTime.value = timeStr;
    } else {
      txtReminderTime.value = '';
    }
    txtDescription.value = habit.description || '';
    chkArchived.checked = habit.isArchived || false;
    // Set category dropdown
    if (habit.categoryID) {
      ddlCategory.value = habit.categoryID;
    } else {
      ddlCategory.value = '';
    }
    return true;
  } catch (err) {
    showError(`Failed to load habit: ${err.message}`);
    return false;
  }
}

// ----- Main init -----
// Determine mode from URL query param: ?id=123 for edit, else create
const urlParams = new URLSearchParams(window.location.search);
const idParam = urlParams.get('id');
if (idParam) {
  isUpdate = true;
  habitId = parseInt(idParam, 10);
  windowTitle.textContent = 'Edit Habit';
  // Load habit after categories are loaded (they are independent)
  // But we can load categories first, then load habit
  loadCategories().then(() => {
    loadHabit(habitId);
  });
} else {
  isUpdate = false;
  windowTitle.textContent = 'New Habit';
  loadCategories(); // just populate dropdown
}

// ----- Form submit -----
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  // Validation
  const name = txtName.value.trim();
  if (!name) {
    showError('Name is required.');
    return;
  }
  const targetPerWeek = parseInt(txtTargetPerWeek.value, 10);
  if (isNaN(targetPerWeek) || targetPerWeek < 0) {
    showError('Target per week must be a positive number.');
    return;
  }
  const targetPerDayVal = txtTargetPerDay.value.trim();
  let targetPerDay = null;
  if (targetPerDayVal !== '') {
    const parsed = parseInt(targetPerDayVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      showError('Target per day must be a positive number.');
      return;
    }
    targetPerDay = parsed;
  }
  // Reminder time - we'll send as string "HH:mm" or null
  let reminderTime = null;
  const timeVal = txtReminderTime.value.trim();
  if (timeVal) {
    // Validate format HH:mm
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeVal)) {
      showError('Reminder time must be in HH:mm format.');
      return;
    }
    reminderTime = timeVal;
  }
  const description = txtDescription.value.trim() || '';
  const isArchived = chkArchived.checked;
  const categoryID = ddlCategory.value ? parseInt(ddlCategory.value, 10) : null;

  // Build habit object (matches server expectation)
  const habit = {
    name,
    targetPerWeek,
    targetPerDay,
    reminderTime,   // send as string "HH:mm", server should parse
    description,
    isArchived,
    categoryID,
    userID: ApiClient.CurrentUserId
  };

  try {
    const api = new ApiClient();
    let response;
    if (!isUpdate) {
      response = await api.postAsync('api/Habit', habit);
    } else {
      response = await api.putAsync(`api/Habit/${habitId}`, habit);
    }

    if (response.ok) {
      // Success: close the page and go back (or reload parent)
      // We'll redirect to the habits list page (adjust as needed)
      window.location.href = 'Habits.html'; // or close modal
    } else {
      const errorText = await response.text();
      showError(errorText || 'Failed to save habit.');
    }
  } catch (err) {
    showError(`Unexpected error: ${err.message}`);
  }
});

// ----- Cancel -----
btnCancel.addEventListener('click', () => {
  // Redirect back to habits list (or close modal)
  window.location.href = 'Habits.html';
});
