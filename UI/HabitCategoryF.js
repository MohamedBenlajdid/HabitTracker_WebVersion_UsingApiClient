import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// ----- DOM references -----
const txtSearch = document.getElementById('txtSearch');
const categoryList = document.getElementById('categoryList');
const lblError = document.getElementById('lblError');
const btnSelect = document.getElementById('btnSelect');
const btnCancel = document.getElementById('btnCancel');

// ----- State -----
let allCategories = [];
let selectedId = null;

// ----- Helpers -----
function showError(msg) {
  lblError.textContent = msg;
  lblError.classList.remove('hidden');
}
function clearError() {
  lblError.classList.add('hidden');
}

// Parse hex color (with or without #) to a valid CSS color
function parseColor(hex) {
  if (!hex) return 'transparent';
  const clean = hex.startsWith('#') ? hex : '#' + hex;
  // simple validation: 6 or 8 hex digits
  if (/^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/.test(clean)) {
    return clean;
  }
  return 'transparent';
}

// Build the list from a given array
function renderList(categories) {
  categoryList.innerHTML = '';
  if (!categories || categories.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No categories found.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    categoryList.appendChild(empty);
    return;
  }

  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.dataset.id = cat.categoryID;

    // Color circle
    const circle = document.createElement('div');
    circle.className = 'color-circle';
    circle.style.backgroundColor = parseColor(cat.color);
    item.appendChild(circle);

    // Icon
    const icon = document.createElement('span');
    icon.className = 'category-icon';
    icon.textContent = cat.icon || '';
    item.appendChild(icon);

    // Name
    const name = document.createElement('span');
    name.className = 'category-name';
    name.textContent = cat.name;
    item.appendChild(name);

    // Click to select
    item.addEventListener('click', () => {
      // Deselect previously selected
      document.querySelectorAll('.category-item.selected').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedId = cat.categoryID;
      clearError();
    });

    // Double-click to select and confirm
    item.addEventListener('dblclick', () => {
      selectedId = cat.categoryID;
      confirmSelection();
    });

    categoryList.appendChild(item);
  });
}

// Filter and re-render
function filterCategories() {
  const filter = txtSearch.value.trim();
  if (!filter) {
    renderList(allCategories);
    return;
  }
  const filtered = allCategories.filter(cat =>
    cat.name.toLowerCase().includes(filter.toLowerCase())
  );
  renderList(filtered);
}

// Confirm selection: redirect back with chosen ID
function confirmSelection() {
  if (selectedId === null) {
    showError('Please select a category first.');
    return;
  }
  clearError();

  // Get the return URL from query string (or default to HabitCU.html)
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'HabitCU.html';

  // Build the redirect URL with the selected category ID
  const separator = returnUrl.includes('?') ? '&' : '?';
  const redirectTo = returnUrl + separator + 'selectedCategoryId=' + selectedId;

  window.location.href = redirectTo;
}

// Cancel: go back without selection
function cancelSelection() {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'HabitCU.html';
  window.location.href = returnUrl;
}

// ----- Load categories on page load -----
async function loadCategories() {
  try {
    const api = new ApiClient();
    const data = await api.getAsync('api/HabitCategory');
    allCategories = data || [];
    renderList(allCategories);
  } catch (err) {
    showError(`Failed to load categories: ${err.message}`);
  }
}

// ----- Event listeners -----
txtSearch.addEventListener('input', filterCategories);

btnSelect.addEventListener('click', confirmSelection);

btnCancel.addEventListener('click', cancelSelection);

// ----- Init -----
loadCategories();
