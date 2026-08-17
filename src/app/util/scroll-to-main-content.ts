/**
 * Smoothly scrolls the window back up to the start of the main content.
 * Falls back to the top of the page if no <main> element exists.
 */
export const scrollToMainContent = (): void => {
  const main = document.querySelector('main');
  const top = main ? main.getBoundingClientRect().top + window.scrollY : 0;
  window.scrollTo({ top, behavior: 'smooth' });
};
