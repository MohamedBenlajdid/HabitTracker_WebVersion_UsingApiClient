import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

const form = document.getElementById('moodForm');
const txtName = document.getElementById('txtName');
const txtEmoji = document.getElementById('txtEmoji');
const txtColor = document.getElementById('txtColor');
const txtError = document.getElementById('txtError');
const btnCancel = document.getElementById('btnCancel');
const windowTitle = document.getElementById('windowTitle');

let existingMoodId = null;
let returnUrl = 'JournalingSessionManagement.html';

function showError(msg) {
  txtError.textContent = msg;
  txtError.classList.remove('hidden');
}
function clearError() {
  txtError.classList.add('hidden');
}

async function loadMood(id) {
  clearError();
  try {
    const api = new ApiClient();
    const mood = await api.getAsync(`api/Mood/${id}`);
    if (!mood) { showError('Mood not found.'); return; }
    txtName.value = mood.name || '';
    txtEmoji.value = mood.emoji || '';
    txtColor.value = mood.color || '';
  } catch (err) {
    showError(`Failed to load mood: ${err.message}`);
  }
}

async function saveMood(e) {
  e.preventDefault();
  clearError();
  const name = txtName.value.trim();
  if (!name) { showError('Mood name is required.'); return; }
  const moodData = { name, emoji: txtEmoji.value.trim(), color: txtColor.value.trim() };
  try {
    const api = new ApiClient();
    let response;
    if (existingMoodId) {
      response = await api.putAsync(`api/Mood/${existingMoodId}`, moodData);
    } else {
      response = await api.postAsync('api/Mood', moodData);
    }
    if (response.ok) {
      let savedId = existingMoodId;
      if (!existingMoodId) {
        const created = await response.json();
        savedId = created.moodID;
      }
      const sep = returnUrl.includes('?') ? '&' : '?';
      window.location.href = returnUrl + sep + 'moodSaved=' + savedId;
    } else {
      const errorText = await response.text();
      showError(errorText || 'Failed to save mood.');
    }
  } catch (err) {
    showError(`Error saving mood: ${err.message}`);
  }
}

function cancel() {
  window.location.href = returnUrl;
}

const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
const returnParam = params.get('returnUrl');
if (returnParam) returnUrl = returnParam;
if (idParam) {
  const id = parseInt(idParam, 10);
  if (!isNaN(id) && id > 0) {
    existingMoodId = id;
    windowTitle.textContent = 'Edit Mood';
    loadMood(id);
  } else {
    showError('Invalid mood ID.');
  }
} else {
  windowTitle.textContent = 'New Mood';
}

form.addEventListener('submit', saveMood);
btnCancel.addEventListener('click', cancel);
