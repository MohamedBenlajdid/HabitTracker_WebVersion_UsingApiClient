import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM elements
const txtUserEmail = document.getElementById('txtUserEmail');
const txtDateTime = document.getElementById('txtDateTime');
const lblWelcome = document.getElementById('lblWelcome');
const btnLogout = document.getElementById('btnLogout');

// Helper to format date/time (like C#: "dddd, MMMM dd, yyyy   HH:mm:ss")
function formatDateTime(date) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const datePart = date.toLocaleDateString('en-US', options);
  const timePart = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `📅 ${datePart}   🕒 ${timePart}`;
}

// Update the clock (once; if you want live update, call setInterval)
function updateDateTime() {
  txtDateTime.textContent = formatDateTime(new Date());
}

// Load user info from API
async function loadUserInfo() {
  try {
    const api = new ApiClient(); // uses CurrentUserId
    const userId = ApiClient.CurrentUserId;
    if (!userId) {
      txtUserEmail.textContent = '👤 Not logged in';
      lblWelcome.textContent = 'Welcome!';
      return;
    }

    const user = await api.getAsync(`api/User/${userId}`);
    if (user) {
      txtUserEmail.textContent = `👤 ${user.email}`;
      lblWelcome.textContent = `Welcome, ${user.firstName} ${user.lastName}!`;
    } else {
      txtUserEmail.textContent = '👤 Unknown user';
      lblWelcome.textContent = 'Welcome!';
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
    txtUserEmail.textContent = '👤 Offline';
    lblWelcome.textContent = 'Welcome!';
  }
}

// Handle "Coming Soon" actions
function showComingSoon() {
  alert('🚧 This section will be implemented soon.');
}

// Card button handlers
function setupCardButtons() {
  document.querySelectorAll('.card-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;

      // Disabled buttons show coming soon
      if (btn.classList.contains('btn-disabled')) {
        showComingSoon();
        return;
      }

      switch (action) {
  case 'manage-habits':
    window.location.href = 'HabitManagement.html';
    break;
  case 'manage-categories':
    window.location.href = 'HabitCategoryManagement.html';
    break;
  case 'journal-hub':
    window.location.href = 'JournalingSessionManagement.html';
    break;
  default:
    showComingSoon();
}
    });
  });
}

// Logout
btnLogout.addEventListener('click', () => {
  ApiClient.CurrentUserId = null; // or 0
  window.location.href = 'Login.html';
});

// Initialise on page load
updateDateTime();
loadUserInfo();
setupCardButtons();

// Optional: update clock every second (uncomment if you want live clock)
// setInterval(updateDateTime, 1000);
