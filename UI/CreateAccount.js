import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const form = document.getElementById('createAccountForm');
const txtFirstName = document.getElementById('txtFirstName');
const txtLastName = document.getElementById('txtLastName');
const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const txtConfirmPassword = document.getElementById('txtConfirmPassword');
const lblError = document.getElementById('lblError');
const btnLogin = document.getElementById('btnLogin');

// Helper to show error
function showError(message) {
  lblError.textContent = message;
  lblError.classList.remove('hidden');
}

// Helper to clear error
function clearError() {
  lblError.classList.add('hidden');
}

// Form submission handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const firstName = txtFirstName.value.trim();
  const lastName = txtLastName.value.trim();
  const email = txtEmail.value.trim();
  const password = txtPassword.value.trim();
  const confirmPassword = txtConfirmPassword.value.trim();

  if (!firstName || !lastName || !email || !password) {
    showError('All fields are required.');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  const newUser = {
    firstName,
    lastName,
    email,
    passwordHash: password,
    isActive: true
  };

  try {
    const api = new ApiClient();
    const response = await api.postAsync('api/User', newUser);

    if (response.ok) {
      window.location.href = 'Login.html';
    } else {
      const errorText = await response.text();
      showError(errorText || 'Registration failed. Please try again.');
    }
  } catch (error) {
    showError(`An unexpected error occurred: ${error.message}`);
  }
});

btnLogin.addEventListener('click', () => {
  window.location.href = 'Login.html';
});
