# Inspire Workplace — Testing & QA Checklist

The two things that must never break: **(1) the public website's user experience**, and
**(2) the admin CMS being able to edit and publish content**. Everything else is secondary.

Run the relevant sections of this checklist before every deploy to `main` (the branch GitHub
Pages serves). Mark each item ✅ pass / ❌ fail / ⚠️ needs attention.

**How to test locally** (paths must match GitHub Pages, so always serve the repo root):

```bash
python3 -m http.server 8765
# then open http://localhost:8765/
```

Do **not** open the HTML files directly with `file://` — `fetch()` of the JSON in `data/`
will fail and you'll only see the static fallback content.

Legend: 🌐 = public website · 🛠️ = admin CMS · 🔁 = regression/bug watch

---

## 1. 🌐 Public website — global (every page)

- [ ] Page loads with no console errors (open DevTools → Console).
- [ ] Header/nav renders: logo, Home, Spaces, About, Events, Blogs, Contact, phone, "Book a tour".
- [ ] Footer renders with Quick Links, Important Links, Contact, and Google Maps link.
- [ ] Content from `data/content.json` overrides the static fallback text (change a heading in
      the admin, confirm it appears live).
- [ ] Images in `content/` load (no broken-image icons).
- [ ] Mobile menu toggle (`+`) opens/closes the nav on small screens.
- [ ] Nav shrinks/gets `.scrolled` styling after scrolling ~30px.
- [ ] Scroll-reveal animations fire once as sections enter the viewport.
- [ ] All internal links resolve (no 404s); phone (`tel:`) and email (`mailto:`) links work.
- [ ] Responsive: check at 360px, 768px, 1024px, 1440px. No horizontal scroll; nothing overlaps.
- [ ] SEO tags injected in `<head>`: title, meta description, canonical, OG tags (View Source
      after JS runs, or check `data/content.json > seo`).
- [ ] JSON-LD present: LocalBusiness + FAQ on home; Event on events; BlogPosting list on blog.
- [ ] Favicon loads.

## 2. 🌐 Home page (`index.html`)

- [ ] Hero: eyebrow, heading (prefix + emphasis), lead, both CTAs, and both hero images.
- [ ] Ticker strip scrolls seamlessly (items duplicated, no visible seam).
- [ ] Spaces list (5 rows) with numbers, titles, descriptions, prices.
- [ ] Amenities grid renders all tiles.
- [ ] "Why Inspire" split section: check-list items + image.
- [ ] Gallery renders with correct sizes (wide/mid/third).
- [ ] Reviews/testimonials render; the `featured` one is styled differently.
- [ ] FAQ items expand/collapse (`<details>`).
- [ ] CTA banner buttons link correctly (tour + phone).

## 3. 🌐 Spaces page (`html/spaces.html`)

- [ ] Header (eyebrow, H1, lead).
- [ ] All space cards render from `spaceCards.cards` with image, title, subtitle, desc, price, CTA.
- [ ] Card CTAs link to the contact page.
- [ ] Amenities check-list + image.
- [ ] CTA banner.

## 4. 🌐 About page (`html/about.html`)

- [ ] Story section: text, check-list, image.
- [ ] Values cards (3).
- [ ] Gallery section header + gallery images.
- [ ] CTA banner.

## 5. 🌐 Events page (`html/events.html`)

- [ ] Header renders.
- [ ] Events load from `data/events.json` into cards (date, time, price, description).
- [ ] Clicking a card opens the event detail modal.
- [ ] Modal shows title, image, date/time, price, description, agenda, speakers, registration.
- [ ] Modal CTA button uses the event's `ctaUrl`; "Contact organiser" uses `contactEmail`.
- [ ] Modal closes via ✕, "Close" button, and background click; body scroll re-enables.
- [ ] CTA banner.

## 6. 🌐 Blog / Journal (`html/blog.html` + `html/blog-detail.html`)

- [ ] Header renders.
- [ ] Blog cards load from `data/blogs.json` (image, category · date · read time, title, excerpt).
- [ ] Clicking a card opens `blog-detail.html?id=N` with the correct post.
- [ ] Blog detail renders full content, image, and meta for several different `id` values.
- [ ] Invalid/missing `?id` is handled gracefully (no crash / sensible fallback).
- [ ] CTA banner.

## 7. 🌐 Contact page (`html/contact.html`)

- [ ] Header + contact-details card (address, both phones, email, hours).
- [ ] Map links open Google Maps.
- [ ] Lead form: required-field validation on Name and Phone.
- [ ] **Submit a real test enquiry** → success message shows and the email arrives
      (Web3Forms key in `settings.web3formsKey`). Confirms the whole lead pipeline.
- [ ] Submit with the key removed/blank → graceful "email not configured" message, no crash.
- [ ] Network-failure path shows the "call us directly" fallback message.
- [ ] Location section (image, heading, lead, check-list).

## 8. 🌐 Legal pages

- [ ] `html/privacy-policy.html` and `html/terms-of-use.html` load and are linked from the footer.

---

## 9. 🛠️ Admin — authentication (`admin.html`)

- [ ] Visiting `admin.html` shows the login screen (token prompt).
- [ ] Invalid token → clear "Invalid token" error, no app access.
- [ ] Valid token **without** repo access → "does not have access to this repository" error.
- [ ] Valid token **with** `repo` scope → logs in, shows the dashboard, username in top bar.
- [ ] Session persists on refresh (token in `sessionStorage`); closing the tab requires re-login.
- [ ] "Sign out" clears the session and returns to login.
- [ ] `robots.txt` disallows `/admin.html` (confirm the file still contains that line).

## 10. 🛠️ Admin — Blogs

- [ ] Existing posts list on load with thumbnails.
- [ ] Add post: fill fields, pick/upload an image, save → new commit to `data/blogs.json` →
      appears on the live blog page.
- [ ] Edit post → changes persist and publish.
- [ ] Delete post (with confirm dialog) → removed from list and file.
- [ ] Required-field validation (title + excerpt) blocks empty saves.
- [ ] Image picker (library) and image upload both work and set the correct `../content/...` path.

## 11. 🛠️ Admin — Events

- [ ] Existing events list on load.
- [ ] Add / edit / delete event → commits to `data/events.json` → reflected on events page + modal.
- [ ] Agenda and speakers (one per line) round-trip correctly to/from arrays.
- [ ] Required-field validation (title + description).
- [ ] Image picker/upload works.

## 12. 🛠️ Admin — Page editors (Home, Spaces, About, Events page, Journal, Contact)

- [ ] Each page editor loads current values from `data/content.json`.
- [ ] Section cards expand/collapse.
- [ ] Editing a text field + Save → commit → live site updates (hard-refresh: Ctrl/Cmd+Shift+R).
- [ ] List items (spaces, amenities, FAQ, gallery, testimonials, cards, venues, checks):
      add / edit / delete via the item modal; order preserved.
- [ ] Image fields (hero images, story image, location image) pick/upload correctly.
- [ ] The revision timestamp bumps on save (drives auto-refresh on the public site).

## 13. 🛠️ Admin — SEO

- [ ] Switching page tabs preserves edits (data collected before switching).
- [ ] Title (/60) and description (/160) counters update live.
- [ ] Save → SEO tags appear on the corresponding live page.
- [ ] "Noindex this page" checkbox writes `noindex` and the live page gets the robots meta.

## 14. 🛠️ Admin — Sitemap  *(recently fixed — test carefully)*

- [ ] Open Sitemap; Base URL and existing URL rows load from `settings.sitemap`.
- [ ] Add / edit / remove a URL row.
- [ ] **Click "Generate & Save Sitemap" → succeeds** (toast confirms) and commits `sitemap.xml`.
      *(This previously failed silently because the file SHA wasn't loaded before the PUT.)*
- [ ] Open `/sitemap.xml` on the live site → valid XML, `<lastmod>` = today, all URLs present.
- [ ] Save a second time in the same session (SHA reuse path) → still succeeds, no 409/422.
- [ ] `robots.txt` still points to the sitemap URL.

## 15. 🛠️ Admin — Robots.txt

- [ ] Load / Refresh pulls current `robots.txt` (or shows the default template if missing).
- [ ] Edit + Save → commit → live `robots.txt` updated.

## 16. 🛠️ Admin — Images

- [ ] Image grid lists files from `content/`.
- [ ] Upload one/multiple images → committed to `content/` → appear in grid and pickers.
- [ ] Delete image (with confirm) → removed from repo and grid.

## 17. 🛠️ Admin — Settings

- [ ] Web3Forms key, contact email, form subject load and save.
- [ ] Google Search Console verification saves and injects the meta tag on the site.
- [ ] LocalBusiness schema fields save and appear in the home page JSON-LD.

---

## 18. 👁️ Visibility feature — pages *(new)*

Admin → **Visibility**. Home cannot be hidden (by design).

- [ ] Toggling a page **Hidden** and clicking **Save Visibility** commits `content.json`.
- [ ] Hidden page is removed from the **header nav** on every page.
- [ ] Hidden page is removed from the **footer links** on every page.
- [ ] Opening the hidden page's URL directly **redirects to the home page**.
- [ ] Toggling it back **Visible** + Save restores the nav/footer links and direct access.
- [ ] Hiding Contact also hides the contact-linked nav/footer CTAs (expected) — decide if that's
      acceptable before hiding Contact in production.
- [ ] Un-set (never toggled) pages remain visible — default is always "visible".

## 19. 👁️ Visibility feature — sections *(new)*

Each section card header (in the page editors) has a **Visible / Hidden** toggle.

- [ ] Toggling a section **Hidden** and clicking the page's **Save** button commits `content.json`.
- [ ] The corresponding `[data-section]` block disappears on the live page; the rest of the page
      is unaffected and layout stays intact.
- [ ] Toggling back **Visible** + Save restores it.
- [ ] The toggle does **not** collapse/expand the section card (click isolation works).
- [ ] Verify one section per page type: e.g. home `reviewsSection`, spaces `spaceCards`,
      about `valuesSection`, events `upcomingSection`, blog `header`, contact `locationSection`.
- [ ] Known no-op: the events `venuesSection` toggle has no visible effect (that section is not
      rendered on `events.html`). Confirm it doesn't error.
- [ ] Section and page toggles round-trip in `content.json` under `settings.visibility`
      (`{ pages: { … }, sections: { "page.section": false } }`), value `false` = hidden.

---

## 20. 🔁 Regression & integration watch-list

- [ ] **Publish pipeline:** an admin save commits to `main` → GitHub Pages rebuilds
      (allow 1–2 min) → change is live. Confirm end-to-end at least once per session.
- [ ] **Auto-refresh:** after an admin save, an already-open public tab reloads to show fresh
      content (`revision` change / `_adminSaved` flag).
- [ ] **Static fallback:** if `data/content.json` fails to load, pages still show baseline
      static content (no blank sections).
- [ ] **Encoding:** rupee `₹` and dashes render correctly everywhere (watch for mojibake like
      `â¹` / `Ã¢ÂÂ¹`). `data/blogs.json` still contains legacy mojibake — clean up separately.
- [ ] **Branch hygiene:** `dev` and `main` don't silently diverge — the admin commits to `main`,
      so pull `main` into local work regularly.
- [ ] **Image paths:** `content/…` from root pages, `../content/…` from `/html/` pages both resolve.
- [ ] **Concurrent edits:** two admin saves in a row don't 409 on a stale SHA (re-login if they do).
- [ ] No secrets committed (the Web3Forms key in `content.json` is public by design; never commit
      a GitHub PAT).

---

## 21. Cross-browser / device matrix

- [ ] Chrome (desktop + Android)
- [ ] Safari (macOS + iOS)
- [ ] Firefox
- [ ] Edge
- [ ] Slow/3G network (throttle in DevTools) — content still loads and forms still submit.

---

### Notes for testers

- The admin is a single file (`admin.html`) that talks directly to the GitHub Contents API;
  every "Save" is a real commit. Test with a throwaway change first when validating flows.
- When something "doesn't save," check the browser console and the toast message — most failures
  are GitHub API errors (bad/expired token, missing scope, or a stale file SHA).
