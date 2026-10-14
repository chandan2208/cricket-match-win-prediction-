(function () {
  var body = document.body;
  if (!body) return;

  var sideNav = document.querySelector('nav.fixed.left-0') || document.querySelector('nav[class*="left-0"][class*="fixed"]');
  if (!sideNav) {
    return;
  }

  sideNav.classList.add('responsive-mobile-nav');

  var existingBackdrop = document.querySelector('.nav-backdrop');
  var backdrop = existingBackdrop || document.createElement('div');
  backdrop.className = 'nav-backdrop';
  if (!existingBackdrop) {
    document.body.appendChild(backdrop);
  }

  var existingToggle = document.querySelector('.nav-toggle-btn');
  var toggle = existingToggle || document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-toggle-btn';
  toggle.setAttribute('aria-label', 'Toggle navigation menu');
  toggle.innerHTML = '<span class="material-symbols-outlined">menu</span>';
  if (!existingToggle) {
    document.body.appendChild(toggle);
  }

  function openNav() {
    body.classList.add('nav-open');
    toggle.innerHTML = '<span class="material-symbols-outlined">close</span>';
    console.log('[responsive] mobile nav opened');
  }

  function closeNav() {
    body.classList.remove('nav-open');
    toggle.innerHTML = '<span class="material-symbols-outlined">menu</span>';
    console.log('[responsive] mobile nav closed');
  }

  function toggleNav() {
    if (body.classList.contains('nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  }

  toggle.addEventListener('click', toggleNav);
  backdrop.addEventListener('click', closeNav);

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) {
      closeNav();
    }
  });
})();
