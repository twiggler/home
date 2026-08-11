// Shared site header as a light-DOM custom element so page-level CSS
// (e.g. projects.html's landscape overrides) can still target .site-header.

const template = document.createElement('template');
template.innerHTML = `
<header class="site-header">
  <img src="profile.webp" alt="Photo of Roel de Jong">
  <span class="site-name">Roel de Jong</span>
  <nav class="site-nav">
    <a href="index.html" data-nav="home">
      <svg aria-hidden="true"><use href="icons.svg#icon-home"></use></svg>
      Home
    </a>
    <a href="cv.html" data-nav="cv">
      <svg aria-hidden="true"><use href="icons.svg#icon-cv"></use></svg>
      CV
    </a>
    <a href="projects.html" data-nav="projects">
      <svg aria-hidden="true"><use href="icons.svg#icon-projects"></use></svg>
      Projects
    </a>
    <a href="https://github.com/twiggler" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
      <svg aria-hidden="true"><use href="icons.svg#icon-github"></use></svg>
      GitHub
    </a>
  </nav>
  <button class="hamburger" aria-label="Toggle navigation" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</header>`;

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

    this.replaceChildren(frag);
  }
}

customElements.define('site-header', SiteHeader);
