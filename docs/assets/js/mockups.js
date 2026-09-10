(() => {
  'use strict';
  const mockups = JSON.parse(document.getElementById('mockup-data').textContent);
  const byId = new Map(mockups.map(mockup => [mockup.number, mockup]));
  const ids = mockups.map(mockup => mockup.number);
  const storageKey = 'log-log-legends-mockup-shortlist-v1';
  const cards = [...document.querySelectorAll('.mockup-card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const dialog = document.getElementById('mockup-viewer');
  const canvas = document.getElementById('viewer-canvas');
  const viewerImage = document.getElementById('viewer-image');
  const status = document.getElementById('review-status');
  const viewerStatus = document.getElementById('viewer-status');
  const copyButton = document.getElementById('copy-shortlist');
  let favourites = new Set();
  let activeFilter = 'all';
  let currentId = null;
  let fitPage = false;
  let opener = null;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) favourites = new Set(saved.filter(id => byId.has(id)));
  } catch { /* Review remains usable when browser storage is unavailable. */ }

  function syncFavourites() {
    document.querySelectorAll('[data-favourite]').forEach(button => {
      const id = button.id === 'viewer-favourite' ? currentId : Number(button.dataset.favourite);
      const saved = favourites.has(id);
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? 'Saved' : 'Save favourite';
      button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} mockup ${id} ${saved ? 'from' : 'to'} favourites`);
    });
    document.getElementById('shortlist-count').textContent = favourites.size;
    copyButton.disabled = favourites.size === 0;
    document.getElementById('shortlist-hint').textContent = favourites.size
      ? `${favourites.size} saved. Copy your shortlist, then paste it into chat.`
      : 'Save favourites to make a shortlist. Choices stay in this browser.';
  }

  function applyFilter() {
    let visibleCount = 0;
    cards.forEach(card => {
      const id = Number(card.dataset.mockup);
      const visible = activeFilter === 'all' || byId.get(id).collection === activeFilter
        || (activeFilter === 'saved' && favourites.has(id));
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
    document.getElementById('visible-count').textContent = `Showing ${visibleCount} of ${mockups.length} full-page mockups`;
    document.getElementById('empty-shortlist').hidden = visibleCount !== 0;
  }

  function setFilter(filter, updateUrl = true) {
    activeFilter = filters.some(button => button.dataset.filter === filter) ? filter : 'all';
    applyFilter();
    if (updateUrl) {
      const url = new URL(location.href);
      if (activeFilter === 'all') url.searchParams.delete('collection');
      else url.searchParams.set('collection', activeFilter);
      history.replaceState(null, '', url);
    }
  }

  function toggleFavourite(id) {
    if (!byId.has(id)) return;
    const adding = !favourites.has(id);
    if (adding) favourites.add(id); else favourites.delete(id);
    let persisted = true;
    try { localStorage.setItem(storageKey, JSON.stringify([...favourites].sort((a, b) => a - b))); }
    catch { persisted = false; }
    syncFavourites();
    applyFilter();
    const message = `Mockup ${id} ${adding ? 'saved' : 'removed'}. ${favourites.size} in your shortlist.`
      + (persisted ? '' : ' Browser storage is unavailable; copy your shortlist before leaving.');
    status.textContent = message;
    if (dialog.open) viewerStatus.textContent = message;
    if (activeFilter === 'saved' && !adding && !dialog.open) filters.find(button => button.dataset.filter === 'saved').focus();
  }

  function openMockup(id, updateUrl = true) {
    const mockup = byId.get(id);
    if (!mockup || typeof dialog.showModal !== 'function') return;
    const alreadyOpen = dialog.open;
    if (!alreadyOpen) opener = document.activeElement;
    currentId = id;
    viewerImage.src = mockup.image;
    viewerImage.width = mockup.width;
    viewerImage.height = mockup.height;
    viewerImage.alt = `Complete page for mockup ${id}: ${mockup.name}. ${mockup.collection === 'ux' ? 'UX principles' : mockup.inspiration || 'Original direction'}.`;
    document.getElementById('viewer-title').textContent = `${String(id).padStart(2, '0')} · ${mockup.name}`;
    document.getElementById('viewer-origin').textContent = mockup.collection === 'ux'
      ? 'UX principles' : mockup.inspiration ? `${mockup.inspiration} inspired` : 'Original direction';
    const position = ids.indexOf(id);
    document.getElementById('viewer-position').textContent = `${position + 1} / ${mockups.length}`;
    document.getElementById('previous-mockup').disabled = position === 0;
    document.getElementById('next-mockup').disabled = position === ids.length - 1;
    document.getElementById('open-image').href = mockup.image;
    const reference = document.getElementById('viewer-reference');
    reference.hidden = !mockup.referenceUrl;
    if (mockup.referenceUrl) reference.href = mockup.referenceUrl;
    const rationale = document.getElementById('viewer-rationale');
    rationale.hidden = !mockup.uxSummary;
    rationale.open = false;
    document.getElementById('viewer-rationale-label').textContent = mockup.rationaleLabel || 'UX rationale & review notes';
    document.getElementById('viewer-ux-summary').textContent = mockup.uxSummary || '';
    document.getElementById('viewer-review-note').textContent = mockup.reviewNote ? `Before implementation: ${mockup.reviewNote}` : '';
    const correction = document.getElementById('viewer-correction');
    if (correction) {
      correction.textContent = mockup.correctionNotice || '';
      correction.hidden = !mockup.correctionNotice;
    }
    const sources = document.getElementById('viewer-ux-sources');
    sources.hidden = !(mockup.uxSources || []).length;
    sources.replaceChildren();
    (mockup.uxSources || []).forEach((source, index) => {
      if (index) sources.append(' · ');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.title;
      sources.append(link);
    });
    viewerStatus.textContent = '';
    document.getElementById('viewer-copy-fallback').hidden = true;
    syncFavourites();
    if (!alreadyOpen) {
      document.body.classList.add('viewer-open');
      dialog.showModal();
    }
    canvas.scrollTop = 0;
    if (updateUrl) {
      const method = alreadyOpen ? 'replaceState' : 'pushState';
      history[method](null, '', `#mockup-${id}`);
    }
  }

  function closeMockup() {
    dialog.close();
  }

  function readHash() {
    const match = location.hash.match(/^#mockup-(\d+)$/);
    if (match && byId.has(Number(match[1]))) openMockup(Number(match[1]), false);
    else if (dialog.open) closeMockup();
  }

  async function copyText(text, inViewer = false) {
    const message = inViewer ? viewerStatus : status;
    const fallback = document.getElementById(inViewer ? 'viewer-copy-fallback' : 'copy-fallback');
    fallback.hidden = true;
    try {
      await navigator.clipboard.writeText(text);
      message.textContent = inViewer ? 'Link copied. Paste it to share this mockup.' : 'Shortlist copied. Paste it into chat to share your choices.';
    } catch {
      fallback.hidden = false;
      const field = fallback.querySelector('textarea');
      field.value = text;
      field.focus();
      field.select();
      message.textContent = 'Automatic copying is unavailable. Copy the selected text below.';
    }
  }

  document.querySelectorAll('[data-open-mockup]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      openMockup(Number(link.dataset.openMockup));
    });
  });
  document.querySelectorAll('[data-favourite]').forEach(button => {
    button.addEventListener('click', () => toggleFavourite(button.id === 'viewer-favourite' ? currentId : Number(button.dataset.favourite)));
  });
  filters.forEach(button => button.addEventListener('click', () => {
    setFilter(button.dataset.filter);
    status.textContent = document.getElementById('visible-count').textContent;
  }));
  document.getElementById('show-all').addEventListener('click', () => {
    setFilter('all');
    filters[0].focus();
  });
  copyButton.addEventListener('click', () => {
    const choices = [...favourites].sort((a, b) => a - b).map(id => {
      const mockup = byId.get(id);
      return `${id} — ${mockup.name}${mockup.inspiration ? ` (${mockup.inspiration})` : ''}`;
    });
    copyText(`My favourite mockups:\n${choices.join('\n')}`);
  });
  document.getElementById('copy-mockup-link').addEventListener('click', () => copyText(location.href, true));
  document.getElementById('close-viewer').addEventListener('click', closeMockup);
  document.getElementById('previous-mockup').addEventListener('click', () => openMockup(ids[ids.indexOf(currentId) - 1]));
  document.getElementById('next-mockup').addEventListener('click', () => openMockup(ids[ids.indexOf(currentId) + 1]));
  document.getElementById('fit-page').addEventListener('click', event => {
    fitPage = !fitPage;
    canvas.classList.toggle('fit-page', fitPage);
    event.currentTarget.setAttribute('aria-pressed', String(fitPage));
    event.currentTarget.textContent = fitPage ? 'Read at full width' : 'Fit whole page';
    canvas.scrollTop = 0;
  });
  dialog.addEventListener('keydown', event => {
    if (event.target.matches('textarea, input') || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); openMockup(ids[ids.indexOf(currentId) + 1]); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); openMockup(ids[ids.indexOf(currentId) - 1]); }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    if (/^#mockup-\d+$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (opener && !opener.closest('[hidden]')) opener.focus();
    else filters[0].focus();
  });
  viewerImage.addEventListener('error', () => { viewerStatus.textContent = 'This image could not load. Try “Open image” or reload the page.'; });
  window.addEventListener('hashchange', readHash);
  window.addEventListener('popstate', () => setFilter(new URLSearchParams(location.search).get('collection'), false));
  document.querySelectorAll('[data-js-only]').forEach(element => { element.hidden = false; });
  syncFavourites();
  filters.forEach(button => {
    if (button.dataset.filter === 'saved') return;
    button.querySelector('.filter-count').textContent = button.dataset.filter === 'all'
      ? mockups.length : mockups.filter(mockup => mockup.collection === button.dataset.filter).length;
  });
  setFilter(new URLSearchParams(location.search).get('collection'), false);
  readHash();
})();
