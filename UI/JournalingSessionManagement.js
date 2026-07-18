import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM refs
const txtUserEmail = document.getElementById('txtUserEmail');
const txtDateTime = document.getElementById('txtDateTime');

// ---- Load user info and date/time ----
async function loadUserInfo() {
  try {
    const api = new ApiClient();
    const userId = ApiClient.CurrentUserId;
    if (!userId) {
      txtUserEmail.textContent = '👤 Not logged in';
      return;
    }
    const user = await api.getAsync(`api/User/${userId}`);
    txtUserEmail.textContent = `👤 ${user?.email || 'Unknown'}`;
  } catch {
    txtUserEmail.textContent = '👤 Offline';
  }
}

function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const datePart = now.toLocaleDateString('en-US', options);
  const timePart = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  txtDateTime.textContent = `📅 ${datePart}   🕒 ${timePart}`;
}

// ---- Navigate to pages with returnUrl ----
function navigateTo(page, returnUrl) {
  const base = window.location.pathname;
  const url = page + (page.includes('?') ? '&' : '?') + `returnUrl=${encodeURIComponent(returnUrl || base)}`;
  window.location.href = url;
}

// ---- Button handlers ----
function setupButtons() {
  // Mood
  document.querySelector('[data-action="mood-create"]').addEventListener('click', () => {
    navigateTo('MoodCU.html');
  });
  document.querySelector('[data-action="mood-find"]').addEventListener('click', () => {
    navigateTo('MoodF.html');
  });
  document.querySelector('[data-action="mood-view"]').addEventListener('click', () => {
    navigateTo('MoodV.html');
  });

  // Journal
  document.querySelector('[data-action="journal-create"]').addEventListener('click', () => {
    navigateTo('JournalCU.html');
  });
  document.querySelector('[data-action="journal-find"]').addEventListener('click', () => {
    navigateTo('JournalF.html');
  });
  document.querySelector('[data-action="journal-view"]').addEventListener('click', () => {
    navigateTo('JournalV.html');
  });

  // Tags
  document.querySelector('[data-action="tag-create"]').addEventListener('click', () => {
    navigateTo('TagCU.html');
  });
  document.querySelector('[data-action="tag-find"]').addEventListener('click', () => {
    navigateTo('TagF.html');
  });
  document.querySelector('[data-action="tag-view"]').addEventListener('click', () => {
    navigateTo('TagV.html');
  });
}

// ---- Init ----
loadUserInfo();
updateDateTime();
setupButtons();

// Optional: update time every second
// setInterval(updateDateTime, 1000);
