// Shared site header as a light-DOM custom element so page-level CSS
// (e.g. projects.html's landscape overrides) can still target .site-header.

const template = document.createElement('template');
template.innerHTML = `
<header class="site-header">
  <button type="button" class="portrait-btn" aria-haspopup="dialog" aria-label="View portrait">
    <img src="assets/portrait-header.webp" alt="Photo of Roel de Jong">
  </button>
  <span class="site-name">Roel de Jong</span>
  <nav class="site-nav">
    <a href="index.html" data-nav="home">
      <svg aria-hidden="true"><use href="assets/icons.svg#icon-home"></use></svg>
      Home
    </a>
    <a href="cv.html" data-nav="cv">
      <svg aria-hidden="true"><use href="assets/icons.svg#icon-cv"></use></svg>
      CV
    </a>
    <a href="projects.html" data-nav="projects">
      <svg aria-hidden="true"><use href="assets/icons.svg#icon-projects"></use></svg>
      Projects
    </a>
    <a href="https://github.com/twiggler" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
      <svg aria-hidden="true"><use href="assets/icons.svg#icon-github"></use></svg>
      GitHub
    </a>
  </nav>
  <button class="hamburger" aria-label="Toggle navigation" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</header>
<div class="portrait-lightbox" role="dialog" aria-modal="true" aria-label="Portrait of Roel de Jong" hidden>
  <button type="button" class="portrait-lightbox__close" aria-label="Close portrait">&#10005;</button>
  <img src="assets/portrait-large.webp" alt="Portrait of Roel de Jong">
</div>`;

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const frag = template.content.cloneNode(true);

    const active = this.getAttribute('active');
    const current = active && frag.querySelector(`[data-nav="${active}"]`);
    if (current) {
      current.classList.add('active');
      current.setAttribute('aria-current', 'page');
    }

    const toggle = frag.querySelector('.hamburger');
    const nav = frag.querySelector('.site-nav');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Portrait lightbox: open on click; close via button, backdrop, or Escape.
    const portraitBtn = frag.querySelector('.portrait-btn');
    const lightbox = frag.querySelector('.portrait-lightbox');
    const closeBtn = frag.querySelector('.portrait-lightbox__close');
    let lastFocused = null;

    const onKeydown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      // The close button is the only focusable element in the dialog; keep focus trapped on it.
      else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    };
    const openLightbox = () => {
      lastFocused = document.activeElement;
      lightbox.hidden = false;
      closeBtn.focus();
      document.addEventListener('keydown', onKeydown);
    };
    function closeLightbox() {
      lightbox.hidden = true;
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    portraitBtn.addEventListener('click', openLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    this.replaceChildren(frag);
  }
}

customElements.define('site-header', SiteHeader);
