import ApiClient from '../HabitTracker.ApiClient/ApiClient.js';

// DOM references
const form = document.getElementById('loginForm');
const txtEmail = document.getElementById('txtEmail');
const txtPassword = document.getElementById('txtPassword');
const chkRememberMe = document.getElementById('chkRememberMe');
const lblError = document.getElementById('lblError');
const btnRegister = document.getElementById('btnRegister');

function showError(message) {
  lblError.textContent = message;
  lblError.classList.remove('hidden');
}

function clearError() {
  lblError.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const email = txtEmail.value.trim();
  const password = txtPassword.value.trim();

  if (!email || !password) {
    showError('Email and password are required.');
    return;
  }

  try {
    const api = new ApiClient();

    // 1. Call login endpoint
    const response = await api.postAsync('api/Authentication/login', {
      email,
      password
    });

    if (response.ok) {
      // 2. Read tokens from response (expect { accessToken, refreshToken })
      const tokens = await response.json();

      // 3. Store tokens securely:
      //    - accessToken → in-memory (static property)
      //    - refreshToken → localStorage (via static setter)
      ApiClient.accessToken = tokens.accessToken;
      ApiClient.RefreshToken = tokens.refreshToken;

      // 4. Redirect to the main page
      window.location.href = 'Main.html';
    } else {
      // 5. Read error message from API
      const errorText = await response.text();
      showError(`Login failed: ${errorText}`);
    }
  } catch (error) {
    showError(`An unexpected error occurred: ${error.message}`);
  }
});

// Register link → redirect to create account page
btnRegister.addEventListener('click', () => {
  window.location.href = 'CreateAccount.html';
});