// Content loader — applies data/content.json to page elements
// Falls back to static HTML if JSON unavailable or key missing
(async () => {
  const pageMeta = document.querySelector('meta[name="page-id"]');
  if (!pageMeta) return;

  const pageId = pageMeta.content;
  const baseMeta = document.querySelector('meta[name="content-base"]');
  const base = baseMeta ? baseMeta.content : '..';
  const dataPath = base ? `${base}/data` : 'data';

  try {
    const res = await fetch(`${dataPath}/content.json`, { cache: 'default' });
    if (!res.ok) return;
    const all = await res.json();

    // Expose settings globally so site.js can read web3formsKey
    window._siteSettings = all.settings || {};

    // ── Content refresh (only when triggered from admin save) ────
    // Check if admin panel signaled a reload is needed
    if (localStorage.getItem('_adminSaved') === 'true') {
      localStorage.removeItem('_adminSaved');
      // Reload to show updated content from admin
      location.reload();
    }

    // ── Inject SEO meta tags ──────────────────────────────────
    const seoData = all.seo && all.seo[pageId];
    if (seoData) {
      if (seoData.title) document.title = seoData.title;

      const setMeta = (name, content, attr = 'name') => {
        let tag = document.querySelector(`meta[${attr}="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attr, name);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      if (seoData.description) setMeta('description', seoData.description);
      if (seoData.keywords) setMeta('keywords', seoData.keywords);
      if (seoData.ogTitle) setMeta('og:title', seoData.ogTitle, 'property');
      if (seoData.ogDescription) setMeta('og:description', seoData.ogDescription, 'property');
      if (seoData.ogImagePath) setMeta('og:image', seoData.ogImagePath, 'property');
      if (seoData.canonicalUrl) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.rel = 'canonical';
          document.head.appendChild(canonical);
        }
        canonical.href = seoData.canonicalUrl;
      }
    }

    const pc = all[pageId];
    if (!pc) return;

    // ── text content ──────────────────────────────────────────
    document.querySelectorAll('[data-ckey]').forEach(el => {
      const v = getVal(pc, el.dataset.ckey);
      if (v != null && v !== '') el.textContent = v;
    });

    // ── href attributes ───────────────────────────────────────
    document.querySelectorAll('[data-chref]').forEach(el => {
      const v = getVal(pc, el.dataset.chref);
      if (v) el.href = v;
    });

    // ── dynamic list renders ──────────────────────────────────
    document.querySelectorAll('[data-csource]').forEach(el => {
      const items = getVal(pc, el.dataset.csource);
      if (!items) return;
      const html = render(el.dataset.crenderType, items, base);
      if (html !== null) {
        el.innerHTML = html;
        // Re-observe newly rendered elements for scroll reveal
        if (window._revealObserver) {
          el.querySelectorAll('[data-reveal]').forEach(r => window._revealObserver.observe(r));
        }
        // Re-observe stat counters
        if (window._statObserver) {
          el.querySelectorAll('.stat').forEach(s => window._statObserver.observe(s));
        }
      }
    });

    // ── image src attributes ──────────────────────────────────
    document.querySelectorAll('[data-cimg]').forEach(el => {
      const v = getVal(pc, el.dataset.cimg);
      if (v) {
        const imgPath = base && !v.startsWith('content/') ? `${base}/${v}` : v;
        el.src = imgPath;
      }
    });
  } catch (_) {
    // silent — static HTML fallback remains
  }
})();

function getVal(obj, path) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((a, k) => (a != null ? a[k] : undefined), obj);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render(type, data, base) {
  const cp = base ? `${base}/content/` : 'content/';

  const r = {
    spaceRows: items => items.map(it => `
      <article class="space-row" data-reveal>
        <span class="num">${esc(it.num)}</span>
        <div><h3>${esc(it.title)}</h3><p>${esc(it.desc)}</p></div>
        <div class="price">${esc(it.price)} <small>${esc(it.per)}</small></div>
      </article>`).join(''),

    amenitiesGrid: items => items.map(it =>
      `<div class="amenity"><b>${esc(it.title)}</b><span>${esc(it.desc)}</span></div>`
    ).join(''),

    checkList: items => items.map(it => `<li>${esc(it)}</li>`).join(''),

    statsGrid: items => items.map(it => `
      <div class="stat">
        <strong data-count="${esc(it.value)}" data-suffix="${esc(it.suffix)}">${esc(it.value)}${esc(it.suffix)}</strong>
        <span>${esc(it.label)}</span>
      </div>`).join(''),

    testimonialsGrid: items => items.map((it, i) => `
      <blockquote class="quote${it.featured ? ' featured' : ''}" data-reveal ${i > 0 ? `data-delay="${Math.min(i,4)}"` : ''}>
        <p>"${esc(it.text)}"</p>
        <cite>${esc(it.cite)}</cite>
      </blockquote>`).join(''),

    faqItems: items => items.map(it => `
      <details>
        <summary>${esc(it.q)}</summary>
        <p>${esc(it.a)}</p>
      </details>`).join(''),

    spaceCards: items => items.map((it, i) => `
      <article class="card" id="${esc(it.id)}" data-reveal ${i > 0 && i % 3 !== 0 ? `data-delay="${i % 3}"` : ''}>
        ${it.image ? `<img src="${cp}${esc(it.image)}" alt="${esc(it.title)}">` : ''}
        <div class="card-body">
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.desc)}</p>
          <div class="price">${esc(it.price)} <small>${esc(it.per)}</small></div>
        </div>
      </article>`).join(''),

    valueCards: items => items.map((it, i) => `
      <article class="card" data-reveal ${i > 0 ? `data-delay="${Math.min(i,4)}"` : ''}>
        <div class="card-body"><h3>${esc(it.title)}</h3><p>${esc(it.desc)}</p></div>
      </article>`).join(''),

    eventVenueCards: items => items.map((it, i) => `
      <article class="card" data-reveal ${i > 0 ? `data-delay="${Math.min(i,4)}"` : ''}>
        ${it.image ? `<img src="${cp}${esc(it.image)}" alt="${esc(it.title)}">` : ''}
        <div class="card-body">
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.desc)}</p>
          <div class="price">${esc(it.price)} <small>${esc(it.per)}</small></div>
        </div>
      </article>`).join(''),
  };

  return r[type] ? r[type](Array.isArray(data) ? data : [data]) : null;
}
