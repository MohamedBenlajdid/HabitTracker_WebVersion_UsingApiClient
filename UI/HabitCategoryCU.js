import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// ----- DOM references -----
const form = document.getElementById('categoryForm');
const windowTitle = document.getElementById('windowTitle');
const txtName = document.getElementById('txtName');
const txtIcon = document.getElementById('txtIcon');
const txtColor = document.getElementById('txtColor');
const colorPreview = document.getElementById('colorPreview');
const lblError = document.getElementById('lblError');
const btnCancel = document.getElementById('btnCancel');

// ----- State -----
let isUpdate = false;
let categoryId = null;

// ----- Helpers -----
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

// Validate hex color (with or without #, 6 or 8 digits)
function isValidHexColor(color) {
  if (!color) return false;
  const hex = color.startsWith('#') ? color.substring(1) : color;
  return /^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(hex);
}

// Update color preview
function updateColorPreview(color) {
  if (color && isValidHexColor(color)) {
    // Ensure it has # prefix for CSS
    const hex = color.startsWith('#') ? color : '#' + color;
    colorPreview.style.backgroundColor = hex;
  } else {
    colorPreview.style.backgroundColor = 'transparent';
  }
}

// Load existing category for edit
async function loadCategory(id) {
  try {
    const api = new ApiClient();
    const category = await api.getAsync(`api/HabitCategory/${id}`);
    if (!category) {
      showError('Category not found.');
      return false;
    }
    txtName.value = category.name || '';
    txtIcon.value = category.icon || '';
    txtColor.value = category.color || '';
    updateColorPreview(category.color);
    return true;
  } catch (err) {
    showError(`Failed to load category: ${err.message}`);
    return false;
  }
}

// ----- Main init -----
const urlParams = new URLSearchParams(window.location.search);
const idParam = urlParams.get('id');
if (idParam) {
  isUpdate = true;
  categoryId = parseInt(idParam, 10);
  windowTitle.textContent = 'Edit Habit Category';
  loadCategory(categoryId);
} else {
  isUpdate = false;
  windowTitle.textContent = 'New Habit Category';
}

// ----- Live color preview on input -----
txtColor.addEventListener('input', () => {
  updateColorPreview(txtColor.value);
});

// ----- Form submit -----
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const name = txtName.value.trim();
  if (!name) {
    showError('Category name is required.');
    return;
  }

  const color = txtColor.value.trim();
  if (color && !isValidHexColor(color)) {
    showError('Invalid color format. Use #RRGGBB or #AARRGGBB.');
    return;
  }

  const category = {
    name,
    icon: txtIcon.value.trim() || '',
    color: color || ''
  };

  try {
    const api = new ApiClient();
    let response;
    if (!isUpdate) {
      response = await api.postAsync('api/HabitCategory', category);
    } else {
      response = await api.putAsync(`api/HabitCategory/${categoryId}`, category);
    }

    if (response.ok) {
      // Success – redirect to category list (adjust as needed)
      window.location.href = 'HabitCategories.html';
    } else {
      const errorText = await response.text();
      showError(errorText || 'Failed to save category.');
    }
  } catch (err) {
    showError(`Unexpected error: ${err.message}`);
  }
});

// ----- Cancel -----
btnCancel.addEventListener('click', () => {
  window.location.href = 'HabitCategories.html';
});
