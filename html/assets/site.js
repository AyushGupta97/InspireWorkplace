// ── Scroll-reveal ──────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

// ── Stat counter ───────────────────────────────────────────
const countUp = (el, target, suffix) => {
  const start = performance.now();
  const duration = 1400;
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
};

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const strong = entry.target.querySelector("strong[data-count]");
      if (!strong) return;
      const target = parseFloat(strong.dataset.count);
      const suffix = strong.dataset.suffix || "";
      countUp(strong, target, suffix);
      statObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll(".stat").forEach((el) => statObserver.observe(el));

// ── Nav shrink on scroll ────────────────────────────────────
const header = document.querySelector(".site-header");
if (header) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
}

const toggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

const form = document.querySelector("[data-lead-form]");
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const submitBtn = form.querySelector("[type=submit]");
    const settings = window._siteSettings || {};
    const key = settings.web3formsKey || "";

    if (!key) {
      if (status) {
        status.style.color = "var(--orange)";
        status.textContent = "Email not configured yet. Please call or email us directly.";
      }
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: key,
          subject: settings.formSubject || "New Enquiry — Inspire Workplace",
          from_name: "Inspire Workplace Website",
          ...data,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (status) {
          status.style.color = "var(--olive)";
          status.textContent = "Thank you! We will be in touch shortly.";
        }
        form.reset();
      } else {
        throw new Error(result.message || "Submission failed.");
      }
    } catch (err) {
      if (status) {
        status.style.color = "var(--orange)";
        status.textContent = "Something went wrong. Please call +91 78998 30610 directly.";
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit enquiry"; }
    }
  });
}

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const loadJson = async (url, storageKey) => {
  try {
    const response = await fetch(url, { cache: "default" });
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      throw new Error(`Unable to load ${url}`);
    }
    const data = await response.json();

    // ── Update tracking for auto-refresh ──────────────────────
    // Only check for content.json (which has proper revision field)
    // Skip for blogs/events arrays as they use _revision which doesn't serialize properly to JSON
    if (storageKey === "content" && data.revision) {
      const storedRevision = sessionStorage.getItem(`_${storageKey}_revision`);
      if (storedRevision && storedRevision !== String(data.revision)) {
        sessionStorage.setItem(`_${storageKey}_revision`, data.revision);
        location.reload();
      } else {
        sessionStorage.setItem(`_${storageKey}_revision`, data.revision);
      }
    }

    return data;
  } catch (e) {
    console.error(`loadJson error for ${url}:`, e);
    throw e;
  }
};

const renderBlogs = (container, posts) => {
  if (!Array.isArray(posts) || posts.length === 0) return;
  container.innerHTML = posts.map((post, i) => {
    const meta = [post.category, post.date ? formatDate(post.date) : "", post.readTime]
      .filter(Boolean)
      .join(" · ");
    const image = post.image || "../content/WhatsApp%20Image%202026-05-15%20at%2012.59.00.jpeg";
    const href = "blog-detail.html?id=" + i;
    const delay = i % 3;
    return `
      <article class="article-card" data-reveal ${delay ? `data-delay="${delay}"` : ""}>
        <a href="${escapeHtml(href)}" aria-label="${escapeHtml(post.title)}">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(post.imageAlt || post.title)}">
        </a>
        <div class="card-body">
          <span class="meta">${escapeHtml(meta)}</span>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
        </div>
      </article>
    `;
  }).join("");
  container.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
};

const renderEvents = (container, events) => {
  if (!Array.isArray(events) || events.length === 0) return;
  container.innerHTML = events.map((eventItem, index) => {
    const dateLine = [formatDate(eventItem.date), eventItem.time].filter(Boolean).join(" · ");
    const price = eventItem.price || "Free";
    const image = eventItem.image || "../content/WhatsApp%20Image%202026-05-15%20at%2012.59.04%20(2).jpeg";
    const delay = Math.min(index, 4);
    return `
      <article class="event-card" data-reveal data-delay="${delay}" style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;padding:2rem;background:#f9f9f9;border-radius:8px;align-items:center;cursor:pointer;transition:all 0.3s ease" onmouseover="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'" onclick="window.openEventDetail(${index})">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(eventItem.imageAlt || eventItem.title)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px">
        <div>
          <h3 style="margin:0 0 0.5rem 0">${escapeHtml(eventItem.title)}</h3>
          <div style="color:var(--muted);margin-bottom:1rem;font-size:0.9rem">${escapeHtml(dateLine)}</div>
          <p style="margin:0 0 1.5rem 0">${escapeHtml(eventItem.description)}</p>
          <div style="display:flex;gap:1rem;align-items:center">
            <div style="font-weight:700">${escapeHtml(price)} ${eventItem.priceNote ? `<small>${escapeHtml(eventItem.priceNote)}</small>` : ""}</div>
            <button class="btn btn-dark" style="cursor:pointer">View details →</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
  container.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
  // Store events globally for modal access
  window._pageEvents = events;
};

const getDataPath = () => window.location.pathname.includes('/html/') ? '../data' : './data';

const blogList = document.querySelector("[data-blog-list]");
if (blogList) {
  const blogSource = `${getDataPath()}/blogs.json`;
  if (blogSource) {
    loadJson(blogSource, "blogs")
      .then((posts) => {
        if (Array.isArray(posts) && posts.length > 0) {
          renderBlogs(blogList, posts);
          // Inject BlogPosting schema on blog listing page
          if (document.querySelector('meta[name="page-id"]')?.content === 'blog') {
            injectBlogListSchema(posts);
          }
        } else {
          console.warn("No blog posts found or invalid format");
        }
      })
      .catch((err) => {
        console.error("Failed to load blogs from " + blogSource + ":", err.message);
      });
  } else {
    console.warn("[data-blog-list] found but no data-source attribute");
  }
} else {
  console.warn("[data-blog-list] element not found on this page");
}

const eventList = document.querySelector("[data-event-list]");
if (eventList) {
  const eventSource = `${getDataPath()}/events.json`;
  if (eventSource) {
    loadJson(eventSource, "events")
      .then((events) => {
        if (Array.isArray(events) && events.length > 0) {
          renderEvents(eventList, events);
          // Inject Event schema
          injectEventSchema(events);
        } else {
          console.warn("No events found or invalid format");
        }
      })
      .catch((err) => {
        console.error("Failed to load events from " + eventSource + ":", err.message);
      });
  } else {
    console.warn("[data-event-list] found but no data-source attribute");
  }
} else {
  console.warn("[data-event-list] element not found on this page");
}

// ── Event Details Modal ──────────────────────────────────────
window.openEventDetail = (index) => {
  const event = window._pageEvents?.[index];
  if (!event) return;
  
  const modal = document.getElementById("event-details-modal");
  if (!modal) return;
  
  // Populate modal with event data
  document.getElementById("modal-event-title").textContent = event.title;
  document.getElementById("modal-event-image").src = event.image || "";
  document.getElementById("modal-event-image").alt = event.imageAlt || event.title;
  
  const dateTime = [formatDate(event.date), event.time].filter(Boolean).join(" · ");
  document.getElementById("modal-event-datetime").textContent = dateTime;
  
  const price = event.price || "Free";
  const priceNote = event.priceNote ? ` ${event.priceNote}` : "";
  document.getElementById("modal-event-price").textContent = price + priceNote;
  
  document.getElementById("modal-event-description").textContent = event.longDescription || event.description || "";
  
  // Agenda section
  const agendaSection = document.getElementById("modal-event-agenda-section");
  if (event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0) {
    document.getElementById("modal-event-agenda").innerHTML = event.agenda.map(item => `<li>${escapeHtml(item)}</li>`).join("");
    agendaSection.style.display = "block";
  } else {
    agendaSection.style.display = "none";
  }
  
  // Speakers section
  const speakersSection = document.getElementById("modal-event-speakers-section");
  if (event.speakers && Array.isArray(event.speakers) && event.speakers.length > 0) {
    document.getElementById("modal-event-speakers").innerHTML = event.speakers.map(speaker => `<li>${escapeHtml(speaker)}</li>`).join("");
    speakersSection.style.display = "block";
  } else {
    speakersSection.style.display = "none";
  }
  
  // Registration info section
  const regSection = document.getElementById("modal-event-registration-section");
  if (event.registrationInfo) {
    document.getElementById("modal-event-registration").textContent = event.registrationInfo;
    regSection.style.display = "block";
  } else {
    regSection.style.display = "none";
  }
  
  // CTA Button
  const ctaButton = document.getElementById("modal-event-cta");
  ctaButton.textContent = event.cta || "Register Now";
  ctaButton.href = event.ctaUrl || "#";
  
  // Contact link
  const contactLink = document.getElementById("modal-event-contact");
  if (event.contactEmail) {
    contactLink.href = `mailto:${event.contactEmail}`;
  }
  
  // Show modal
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
};

window.closeEventModal = () => {
  const modal = document.getElementById("event-details-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
};

// ── JSON-LD Schema Injection ────────────────────────────────
function injectJsonLdScript(id, schema) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

// Inject Event schema for events page
function injectEventSchema(events) {
  const eventSchemas = events.map(ev => ({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.title,
    "description": ev.longDescription || ev.description,
    "startDate": ev.date,
    "location": {
      "@type": "Place",
      "name": "Inspire Workplace",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Outer Ring Road, Marathahalli",
        "addressLocality": "Bengaluru",
        "addressRegion": "Karnataka",
        "postalCode": "560037",
        "addressCountry": "IN"
      }
    },
    "image": ev.image ? `https://raw.githubusercontent.com/AyushGupta97/InspireWorkplace/main/content/${ev.image}` : undefined,
    "offers": {
      "@type": "Offer",
      "price": ev.price === "Free" ? "0" : ev.price.replace(/[^\d.]/g, ''),
      "priceCurrency": "INR"
    }
  }));
  if (eventSchemas.length > 0) {
    injectJsonLdScript('schema-events', {
      "@context": "https://schema.org",
      "@graph": eventSchemas
    });
  }
}

// Inject BlogPosting schema list for blog page
function injectBlogListSchema(posts) {
  const blogSchemas = posts.map((p, i) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": p.title,
    "description": p.excerpt,
    "datePublished": p.date || new Date().toISOString().split('T')[0],
    "author": {
      "@type": "Organization",
      "name": "Inspire Workplace"
    },
    "image": p.image ? `https://raw.githubusercontent.com/AyushGupta97/InspireWorkplace/main/content/${p.image}` : undefined
  }));
  if (blogSchemas.length > 0) {
    injectJsonLdScript('schema-blogs', {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": blogSchemas.map((s, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": s
      }))
    });
  }
}

// Close modal on background click
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("event-details-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) window.closeEventModal();
    });
  }
});
