import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const txtId = document.getElementById('txtId');
const txtName = document.getElementById('txtName');
const txtIcon = document.getElementById('txtIcon');
const txtColor = document.getElementById('txtColor');
const colorPreview = document.getElementById('colorPreview');
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

function updateColorPreview(color) {
  if (color && /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color.replace('#', ''))) {
    const hex = color.startsWith('#') ? color : '#' + color;
    colorPreview.style.backgroundColor = hex;
  } else {
    colorPreview.style.backgroundColor = 'transparent';
  }
}

function displayCategory(cat) {
  txtId.textContent = cat.categoryID ?? '-';
  txtName.textContent = cat.name || '-';
  txtIcon.textContent = cat.icon || '-';
  const color = cat.color || '';
  txtColor.textContent = color || '-';
  updateColorPreview(color);
  clearError();
}

function clearDisplay() {
  txtId.textContent = '-';
  txtName.textContent = '-';
  txtIcon.textContent = '-';
  txtColor.textContent = '-';
  colorPreview.style.backgroundColor = 'transparent';
}

async function loadCategory(id) {
  try {
    const api = new ApiClient();
    const category = await api.getAsync(`api/HabitCategory/${id}`);
    if (category) {
      displayCategory(category);
    } else {
      clearDisplay();
      showError('Category not found.');
    }
  } catch (err) {
    clearDisplay();
    showError(`Failed to load category: ${err.message}`);
  }
}

// ----- Init: check URL parameters -----
function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const idParam = getParam('id');
const selectedIdParam = getParam('selectedCategoryId');

if (idParam) {
  loadCategory(parseInt(idParam, 10));
} else if (selectedIdParam) {
  loadCategory(parseInt(selectedIdParam, 10));
}

// ----- Find button: redirect to finder with return URL -----
btnFind.addEventListener('click', () => {
  // Build the return URL to this page (without any query params to avoid double‑loading)
  const baseUrl = window.location.pathname;
  // Append a random or timestamp to prevent caching? Not needed.
  window.location.href = `HabitCategoryF.html?returnUrl=${encodeURIComponent(baseUrl)}`;
});

// ----- Close button: go back to management or previous page -----
btnClose.addEventListener('click', () => {
  // If we came from management, go back; else go to management hub
  if (document.referrer && document.referrer.includes('HabitCategoryManagement')) {
    window.history.back();
  } else {
    window.location.href = 'HabitCategoryManagement.html';
  }
});
