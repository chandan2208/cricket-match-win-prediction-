/**
 * CricPredic — Theme System
 */
(function () {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtns = document.querySelectorAll('.theme-toggle');
    
    const updateIcons = () => {
      const isDark = document.documentElement.classList.contains('dark');
      themeToggleBtns.forEach(btn => {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        }
      });
    };
    
    updateIcons();

    themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateIcons();
      });
    });
  });
})();
