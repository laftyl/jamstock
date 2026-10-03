import('./js/app.js').catch((error) => {
  const authError = document.querySelector('#auth-error');
  if (authError) {
    authError.textContent = error.message;
  }
});
