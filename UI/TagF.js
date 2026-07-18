import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtFilterValue = document.getElementById('txtFilterValue');
const btnFind = document.getElementById('btnFind');
const btnRefresh = document.getElementById('btnRefresh');
const tagList = document.getElementById('tagList');
const btnSelect = document.getElementById('btnSelect');
const btnCancel = document.getElementById('btnCancel');

// State
let allTags = [];
let filteredTags = [];
let selectedTagId = null;
let returnUrl = 'JournalingSessionManagement.html';

// ---- Render list ----
function renderList(tags) {
  tagList.innerHTML = '';
  if (!tags || tags.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No tags found.';
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#888';
    tagList.appendChild(empty);
    return;
  }

  tags.forEach(tag => {
    const div = document.createElement('div');
    div.className = 'tag-item';
    div.dataset.id = tag.tagID;
    div.textContent = tag.name;

    // Click to select
    div.addEventListener('click', () => {
      document.querySelectorAll('.tag-item.selected').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      selectedTagId = tag.tagID;
      btnSelect.disabled = false;
    });

    // Double-click to select and confirm
    div.addEventListener('dblclick', () => {
      selectedTagId = tag.tagID;
      confirmSelection();
    });

    tagList.appendChild(div);
  });
}

// ---- Filter ----
function applyFilter() {
  const filterText = txtFilterValue.value.trim();
  if (!filterText) {
    filteredTags = [...allTags];
  } else {
    filteredTags = allTags.filter(t =>
      t.name && t.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }
  renderList(filteredTags);
  selectedTagId = null;
  btnSelect.disabled = true;
}

// ---- Load data ----
async function loadData() {
  try {
    const api = new ApiClient();
    const tags = await api.getAsync('api/Tag');
    allTags = tags || [];
    applyFilter();
  } catch (err) {
    console.error('Failed to load tags:', err);
    alert('Error loading tags.');
  }
}

// ---- Confirm selection ----
function confirmSelection() {
  if (!selectedTagId) {
    alert('Please select a tag.');
    return;
  }
  const sep = returnUrl.includes('?') ? '&' : '?';
  window.location.href = returnUrl + sep + 'selectedTagId=' + selectedTagId;
}

// ---- Cancel ----
function cancel() {
  window.location.href = returnUrl;
}

// ---- Init ----
const params = new URLSearchParams(window.location.search);
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;

loadData();

// Event listeners
btnFind.addEventListener('click', applyFilter);
btnRefresh.addEventListener('click', () => {
  txtFilterValue.value = '';
  applyFilter();
});
btnSelect.addEventListener('click', confirmSelection);
btnCancel.addEventListener('click', cancel);

// Enter key triggers Find
txtFilterValue.addEventListener('keypress', e => {
  if (e.key === 'Enter') btnFind.click();
});
