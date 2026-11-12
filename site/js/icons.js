// Project-owned line icons, drawn from basic SVG geometry. MIT licensed.
(function () {
  const shapes = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
    longs: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4Z"/>',
    like: '<path d="M8 10h-5v11h5Zm0 0 5-7c2 0 2 2 1 5h5a2 2 0 0 1 2 2l-2 9a2 2 0 0 1-2 2H8"/>',
    dislike: '<path d="M8 14H3V3h5Zm0 0 5 7c2 0 2-2 1-5h5a2 2 0 0 0 2-2l-2-9a2 2 0 0 0-2-2H8"/>',
    history: '<path d="M4 9a8.5 8.5 0 1 1 0 7M4 4v5h5M12 7v6l4 2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    playlist: '<path d="M3 5h17M3 10h17M3 15h8m4-1 6 4-6 4Z"/>',
    playall: '<path d="M3 4h14M3 9h14M3 14h7m5-1 6 4-6 4Z"/>',
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    filters: '<path d="M3 5h18M6 12h12M9 19h6"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
    external: '<path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/>',
    hn: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m8 7 4 6 4-6m-4 6v5"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  };
  window.HT_ICON = (name) => `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${shapes[name] || shapes.play}</svg>`;
  window.HT_ICONS = shapes;
})();
