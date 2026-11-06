/**
 * blog-shapes-suppress.js
 * Minimal JS fallback: adds .blog-page to <body> on blog/post pages.
 * This activates the Mode B "full hide" rule in blog-redesign.scss.
 *
 * Use ONLY if CSS-only approach (Mode A opacity) is insufficient.
 * Drop this script into /public/scripts/ and reference in Layout.astro:
 *   <script defer src="/scripts/blog-shapes-suppress.js"></script>
 *
 * NOTE: Current CSS already scopes suppression via #blogBody / #postBody
 * selectors — this file is only needed if you want full shape removal.
 */

(function () {
  const id = document.body.id;
  if (id === 'blogBody' || id === 'postBody') {
    document.body.classList.add('blog-page');
  }
})();
