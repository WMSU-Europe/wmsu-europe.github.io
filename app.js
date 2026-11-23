'use strict';

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
const internalLinks = Array.from(navigation.querySelectorAll('a[href^="#"]'));
const closeMenu = () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
};
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  navigation.classList.toggle('is-open', !isOpen);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 701px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

// Match the active menu item to the section currently passing beneath the header.
const sections = internalLinks.map(link => document.querySelector(link.hash));
let pendingFrame = false;
function updateActiveSection() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
  document.documentElement.style.setProperty('--reading-progress', String(progress));
  let active = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 145) active = section;
  }
  internalLinks.forEach(link => {
    if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  pendingFrame = false;
}
window.addEventListener('scroll', () => {
  if (!pendingFrame) {
    pendingFrame = true;
    window.requestAnimationFrame(updateActiveSection);
  }
}, { passive: true });
updateActiveSection();
window.addEventListener('resize', updateActiveSection, { passive: true });

// Theme blocks disclose one full-width research panel immediately beneath their row.
const themeButtons = Array.from(document.querySelectorAll('[data-theme]'));
const themePanels = Array.from(document.querySelectorAll('[data-theme-panel]'));
let activeTheme = null;
themeButtons.forEach(button => {
  const title = button.querySelector('.card-title');
  const description = button.querySelector('.card-description');
  const status = button.querySelector('.card-status');
  title.id = 'card-title-' + button.dataset.theme;
  description.id = 'card-description-' + button.dataset.theme;
  status.id = 'card-status-' + button.dataset.theme;
  button.setAttribute('aria-labelledby', title.id);
  button.setAttribute('aria-describedby', description.id + ' ' + status.id);
});
function showTheme(key, { scroll = true, focus = true, updateUrl = true } = {}) {
  const button = themeButtons.find(item => item.dataset.theme === key);
  if (!button) return;
  activeTheme = key;
  themeButtons.forEach(item => {
    const expanded = item === button;
    item.setAttribute('aria-expanded', String(expanded));
    item.querySelector('.card-action').firstChild.nodeValue = expanded ? 'Close research ' : 'Read the research ';
  });
  themePanels.forEach(panel => panel.hidden = panel.dataset.themePanel !== key);
  const panel = document.getElementById(key);
  if (updateUrl) history.replaceState(null, '', '#' + key);
  window.requestAnimationFrame(() => {
    if (focus) panel.querySelector('h3').focus({ preventScroll: true });
    if (scroll) panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
}
function hideTheme({ focus = true } = {}) {
  const button = themeButtons.find(item => item.dataset.theme === activeTheme);
  themePanels.forEach(panel => panel.hidden = true);
  themeButtons.forEach(item => {
    item.setAttribute('aria-expanded', 'false');
    item.querySelector('.card-action').firstChild.nodeValue = 'Read the research ';
  });
  if (activeTheme && location.hash === '#' + activeTheme) history.replaceState(null, '', '#themes');
  activeTheme = null;
  if (focus && button) button.focus();
}
themeButtons.forEach(button => button.addEventListener('click', () => {
  if (activeTheme === button.dataset.theme) hideTheme();
  else showTheme(button.dataset.theme);
}));
document.querySelectorAll('[data-close-theme]').forEach(button => button.addEventListener('click', () => hideTheme()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeTheme && event.target.closest('.theme-panel')) hideTheme();
});
window.addEventListener('hashchange', () => {
  const key = location.hash.slice(1);
  if (themePanels.some(panel => panel.dataset.themePanel === key)) showTheme(key, { updateUrl: false });
});
const initialTheme = location.hash.slice(1);
if (themePanels.some(panel => panel.dataset.themePanel === initialTheme)) {
  showTheme(initialTheme, { focus: false, updateUrl: false });
}

const config = window.WMSU_CONFIG || {};
if (config.authorUrl) {
  const authorUrl = new URL(config.authorUrl, window.location.href);
  if (authorUrl.protocol === 'https:') {
    document.querySelectorAll('.author-link').forEach(link => link.href = authorUrl.href);
  }
}
document.querySelectorAll('[data-document]').forEach(slot => {
  const path = config.documents?.[slot.dataset.document];
  if (!path) return;
  const url = new URL(path, window.location.href);
  // PDF slots accept same-site files only. No external scripts or HTML documents.
  if (url.origin !== window.location.origin || !url.pathname.toLowerCase().endsWith('.pdf')) return;
  const label = slot.querySelector('span:last-child');
  const link = document.createElement('a');
  link.href = url.href;
  link.textContent = 'Download project description (PDF)';
  link.download = '';
  label.replaceWith(link);
});
