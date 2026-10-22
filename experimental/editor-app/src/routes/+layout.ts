// Static SPA: no prerendering (pages fetch live data with the admin cookie);
// the adapter's index.html fallback serves every URL client-side.
import '../app.css';

export const ssr = false;
export const prerender = false;
