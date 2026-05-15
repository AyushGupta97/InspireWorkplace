# Inspire Workplace Website Hosting Guide

This guide explains how to publish the website with GitHub Pages and connect a GoDaddy domain.

## 1. Confirm The Project Structure

Your repository should keep this structure:

```text
/
├── index.html
├── CNAME
├── robots.txt
├── sitemap.xml
├── .nojekyll
├── content/
│   └── website images
└── html/
    ├── spaces.html
    ├── about.html
    ├── events.html
    ├── blog.html
    ├── contact.html
    └── assets/
        ├── site.css
        └── site.js
```

The root `index.html` is the public homepage. The `content/` folder must stay at the repository root because the pages load images from there.

## 2. Update The Domain

The current setup assumes:

```text
inspireworkplace.com
```

If your real GoDaddy domain is different, update these files before publishing:

- `CNAME`
- `robots.txt`
- `sitemap.xml`
- Canonical URLs inside each HTML page

For example, if the domain is `example.com`, replace `inspireworkplace.com` with `example.com`.

## 3. Create A GitHub Repository

1. Go to GitHub.
2. Create a new repository.
3. Name it something like `inspire-workplace`.
4. Keep it public unless you have GitHub Pages enabled for private repositories.
5. Do not add another README if you are uploading this existing folder directly.

## 4. Upload The Website

Option A: GitHub web upload

1. Open the repository on GitHub.
2. Click `Add file`.
3. Click `Upload files`.
4. Upload all files and folders from this project root.
5. Commit the upload.

Option B: Git command line

```bash
git init
git add .
git commit -m "Launch Inspire Workplace website"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

## 5. Enable GitHub Pages

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Click `Pages`.
4. Under `Build and deployment`, set:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Click `Save`.

GitHub will publish the site. The first build can take a few minutes.

## 6. Add The Custom Domain In GitHub

1. In the same `Settings > Pages` screen, find `Custom domain`.
2. Enter your domain, for example:

```text
inspireworkplace.com
```

3. Click `Save`.
4. Keep `Enforce HTTPS` enabled once GitHub allows it. It may take a few minutes after DNS is correct.

The `CNAME` file in this project helps GitHub remember the domain.

## 7. Configure DNS In GoDaddy

Log in to GoDaddy and open DNS management for the domain.

For the root domain, add these `A` records:

```text
Type: A    Name: @    Value: 185.199.108.153
Type: A    Name: @    Value: 185.199.109.153
Type: A    Name: @    Value: 185.199.110.153
Type: A    Name: @    Value: 185.199.111.153
```

For the `www` version, add this `CNAME` record:

```text
Type: CNAME    Name: www    Value: YOUR-USER.github.io
```

Replace `YOUR-USER` with your GitHub username or organization name.

Remove conflicting records for `@` or `www` if GoDaddy shows older website builders, parking records, forwarding records, or duplicate CNAME records.

## 8. Wait For DNS Propagation

DNS can update quickly, but it may take several hours globally. During this period the site may work on one network and not another.

Check these URLs:

```text
https://inspireworkplace.com/
https://www.inspireworkplace.com/
```

## 9. Final SEO Checks

After the site is live:

1. Open `https://inspireworkplace.com/sitemap.xml`.
2. Open `https://inspireworkplace.com/robots.txt`.
3. Verify images load on homepage and subpages.
4. Add the domain to Google Search Console.
5. Submit the sitemap URL:

```text
https://inspireworkplace.com/sitemap.xml
```

## 10. How To Preview Locally

Do not serve only the `html/` folder. Serve the project root:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://localhost:8765/
```

This matches how GitHub Pages serves the website and keeps image paths working.
