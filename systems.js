(() => {
  const filterGroup = document.querySelector('.catalog-filters');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.catalog-grid .service-card')];
  const count = document.getElementById('catalogCount');

  function filterCards(category) {
    let visible = 0;
    cards.forEach(card => {
      const matches = category === 'all' || card.dataset.category === category;
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    filterButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === category));
    });
    count.textContent = `${visible}件のシステム`;
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => filterCards(button.dataset.filter));
  });
  if (filterGroup) filterGroup.hidden = false;

  // Direct links from the home page always reveal their matching system.
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.matches('.service-card') && target.hidden) {
      filterCards('all');
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  });

  const dialog = document.getElementById('imagePreview');
  const previewImage = document.getElementById('imagePreviewImage');
  const previewTitle = document.getElementById('imagePreviewTitle');
  const original = document.getElementById('imagePreviewOriginal');
  let previewTrigger;

  document.querySelectorAll('.service-image').forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      if (typeof dialog.showModal !== 'function') {
        window.open(image.src, '_blank', 'noopener');
        return;
      }
      previewTrigger = button;
      previewImage.src = image.src;
      previewImage.alt = image.alt;
      previewTitle.textContent = button.closest('.service-card').querySelector('.card-title').textContent;
      original.href = image.src;
      dialog.showModal();
      document.body.classList.add('is-preview-open');
    });
  });
  document.getElementById('imagePreviewClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('is-preview-open');
    previewTrigger?.focus({ preventScroll: true });
  });
})();
