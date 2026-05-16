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

const loadJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${url}`);
  return response.json();
};

const renderBlogs = (container, posts) => {
  if (!Array.isArray(posts) || posts.length === 0) return;
  container.innerHTML = posts.map((post, i) => {
    const meta = [post.category, post.date ? formatDate(post.date) : "", post.readTime]
      .filter(Boolean)
      .join(" · ");
    const image = post.image || "../content/WhatsApp%20Image%202026-05-15%20at%2012.59.00.jpeg";
    const href = post.url || "#";
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
    const priceNote = eventItem.priceNote || "";
    const delay = Math.min(index, 4);
    return `
      <article class="space-row" data-reveal data-delay="${delay}">
        <span class="num">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3>${escapeHtml(eventItem.title)}</h3>
          <p>${escapeHtml(dateLine)}</p>
          <p>${escapeHtml(eventItem.description)}</p>
          ${eventItem.url ? `<p><a href="${escapeHtml(eventItem.url)}">${escapeHtml(eventItem.cta || "Learn more")}</a></p>` : ""}
        </div>
        <div class="price">${escapeHtml(price)} <small>${escapeHtml(priceNote)}</small></div>
      </article>
    `;
  }).join("");
  container.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
};

const blogList = document.querySelector("[data-blog-list]");
if (blogList?.dataset.source) {
  loadJson(blogList.dataset.source)
    .then((posts) => renderBlogs(blogList, posts))
    .catch(() => {});
}

const eventList = document.querySelector("[data-event-list]");
if (eventList?.dataset.source) {
  loadJson(eventList.dataset.source)
    .then((events) => renderEvents(eventList, events))
    .catch(() => {});
}
