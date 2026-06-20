// Schmitz Beauty Co. — small site interactions

// Current year in the footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close the menu after tapping a link
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Consultation form -> Netlify Forms (AJAX so we can show a thank-you in place)
const form = document.getElementById('consultForm');
const success = document.getElementById('formSuccess');

if (form) {
  const encode = (data) =>
    Object.keys(data)
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(data),
    })
      .then(() => {
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch(() => {
        alert('Something went wrong. Please try again in a moment, or reach out directly.');
      });
  });
}

// Hero photo slideshow — crossfade through the photos
const slides = document.querySelectorAll('.hero-slide');
if (slides.length > 1) {
  let slideIndex = 0;
  setInterval(() => {
    slides[slideIndex].classList.remove('is-active');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add('is-active');
  }, 4500);
}
