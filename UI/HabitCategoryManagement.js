// Button references
const btnOpenCU = document.getElementById('btnOpenCU');
const btnOpenView = document.getElementById('btnOpenView');
const btnOpenFind = document.getElementById('btnOpenFind');

// Navigate to the respective pages
btnOpenCU.addEventListener('click', () => {
  window.location.href = 'HabitCategoryCU.html';
});

// In HabitCategoryManagement.js
btnOpenView.addEventListener('click', () => {
  // Remove the alert and uncomment the redirect
  window.location.href = 'HabitCategoryV.html';
});

btnOpenFind.addEventListener('click', () => {
  // Open the finder page; it will handle returning a selection via URL parameters
  window.location.href = 'HabitCategoryF.html';
});
