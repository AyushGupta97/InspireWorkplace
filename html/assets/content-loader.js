// Content loader — applies data/content.json to page elements
// Falls back to static HTML if JSON unavailable or key missing
(async () => {
  const pageMeta = document.querySelector('meta[name="page-id"]');
  if (!pageMeta) return;

  const pageId = pageMeta.content;
  // Determine correct data path based on current page location
  // If on a page in /html/ subdirectory, go up one level; otherwise stay in current level
  const dataPath = window.location.pathname.includes('/html/') ? '../data' : './data';

  try {
    // Check if admin panel signaled a reload is needed
    const adminSaved = localStorage.getItem('_adminSaved') === 'true';
    if (adminSaved) {
      localStorage.removeItem('_adminSaved');
      // Hard refresh to bypass cache and get fresh content
      location.reload(true);
      return;
    }

    const res = await fetch(`${dataPath}/content.json`, { cache: 'default' });
    if (!res.ok) return;
    const all = await res.json();

    // Expose settings globally so site.js can read web3formsKey
    window._siteSettings = all.settings || {};

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

    // ── Google Search Console verification ──────────────────────
    if (all.settings?.googleVerification) {
      setMeta('google-site-verification', all.settings.googleVerification);
    }

    // ── noindex meta tag ───────────────────────────────────────
    if (seoData?.noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      // Remove any existing robots meta with noindex
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta && robotsMeta.content.includes('noindex')) {
        robotsMeta.remove();
      }
    }

    // ── JSON-LD Schema Markup ──────────────────────────────────
    // LocalBusiness (on home page)
    if (pageId === 'home' && all.settings?.schema?.localBusiness) {
      const lb = all.settings.schema.localBusiness;
      const lbSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": lb.name,
        "description": lb.description,
        "telephone": lb.telephone,
        "email": lb.email,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": lb.streetAddress,
          "addressLocality": lb.addressLocality,
          "addressRegion": lb.addressRegion,
          "postalCode": lb.postalCode,
          "addressCountry": "IN"
        },
        "priceRange": lb.priceRange,
        "url": lb.url,
        "image": lb.image
      };
      if (lb.openingHours) lbSchema.openingHoursSpecification = parseOpeningHours(lb.openingHours);
      injectJsonLd('schema-localbusiness', lbSchema);
    }

    // FAQPage (on home page if FAQ items exist)
    if (pageId === 'home') {
      const faqItems = all.home?.faqSection?.items;
      if (faqItems?.length) {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        };
        injectJsonLd('schema-faq', faqSchema);
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
        ${it.image ? `<img src="${cp}${esc(it.image)}" alt="${esc(it.cite)}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-bottom:1rem;">` : ''}
        <p>"${esc(it.text)}"</p>
        <cite><strong>${esc(it.cite)}</strong>${it.title ? `<br>${esc(it.title)}` : ''}</cite>
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
          ${it.subtitle ? `<p style="color:var(--muted);font-size:0.9rem;margin:0.5rem 0 1rem">${esc(it.subtitle)}</p>` : ''}
          <p>${esc(it.desc)}</p>
          ${it.features && Array.isArray(it.features) && it.features.length ? `<ul style="margin:1rem 0;padding-left:1.5rem"><li style="margin:0.5rem 0">${it.features.map(f => esc(f)).join('</li><li style="margin:0.5rem 0">')}</li></ul>` : ''}
          ${it.pricing && Array.isArray(it.pricing) && it.pricing.length ? `<div style="margin:1rem 0">${it.pricing.map(p => `<div style="display:flex;justify-content:space-between"><span>${esc(p.label)}</span><strong>${esc(p.price)}</strong></div>`).join('')}</div>` : ''}
          ${it.cta ? `<a href="#" style="display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:#333;color:#fff;text-decoration:none;border-radius:4px">${esc(it.cta)}</a>` : ''}
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

function injectJsonLd(id, schema) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

function parseOpeningHours(hoursStr) {
  // Parse "Mo-Sa 08:00-20:00" → array of openingHoursSpecification objects
  const dayMap = {'Mo':1,'Tu':2,'We':3,'Th':4,'Fr':5,'Sa':6,'Su':0};
  const parts = hoursStr.split(' ');
  if (parts.length !== 2) return [];

  const dayRange = parts[0];
  const timeRange = parts[1];
  const [start, end] = timeRange.split('-');

  const specs = [];
  if (dayRange.includes('-')) {
    const [startDay, endDay] = dayRange.split('-');
    const startNum = dayMap[startDay];
    const endNum = dayMap[endDay];
    for (let d = startNum; d <= endNum; d++) {
      const dayKey = Object.keys(dayMap).find(k => dayMap[k] === d);
      specs.push({ "@type": "OpeningHoursSpecification", "dayOfWeek": dayKey, "opens": start, "closes": end });
    }
  } else {
    specs.push({ "@type": "OpeningHoursSpecification", "dayOfWeek": dayRange, "opens": start, "closes": end });
  }
  return specs;
}
