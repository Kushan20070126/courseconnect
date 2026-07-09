// Nav buttons are anchors and navigate natively; kept for parity.
const loginButton = document.getElementById('loginBtn');
const registerButton = document.getElementById('registerBtn');

if (loginButton) {
  loginButton.addEventListener('click', () => { window.location.href = 'login.html'; });
}
if (registerButton) {
  registerButton.addEventListener('click', () => { window.location.href = 'register.html'; });
}

// Contact form (simulated submit — replace with your real fetch() call)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const contactBtn = document.getElementById('contactBtn');
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }
    const payload = {
      name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      message: document.getElementById('contactMsg').value,
    };
    contactBtn.classList.add('loading');
    contactBtn.disabled = true;
    console.log('Contact payload:', payload);
    setTimeout(() => {
      contactBtn.classList.remove('loading');
      contactBtn.disabled = false;
      contactForm.reset();
      alert('Thanks! Your message has been sent.');
    }, 900);
  });
}
