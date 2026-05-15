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
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    if (status) status.textContent = "Thanks. Your enquiry is ready to be connected to a CRM or email endpoint.";
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
  container.innerHTML = posts.map((post) => {
    const meta = [post.category, post.date ? formatDate(post.date) : "", post.readTime]
      .filter(Boolean)
      .join(" · ");
    const image = post.image || "../content/WhatsApp%20Image%202026-05-15%20at%2012.59.00.jpeg";
    const href = post.url || "#";
    return `
      <article class="article-card">
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
};

const renderEvents = (container, events) => {
  if (!Array.isArray(events) || events.length === 0) return;
  container.innerHTML = events.map((eventItem, index) => {
    const dateLine = [formatDate(eventItem.date), eventItem.time].filter(Boolean).join(" · ");
    const price = eventItem.price || "Free";
    const priceNote = eventItem.priceNote || "";
    return `
      <article class="space-row">
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
