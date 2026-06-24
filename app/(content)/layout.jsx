import { ContentChrome } from "../../components/content-chrome";

// Shared shell for every non-home route (Blog, Blog Post, legal/Template
// docs). Wraps children with the route-aware SiteNav + dark-band SiteFooter
// and neutralises the home page's ScrollSmoother shell (see ContentChrome).
export default function ContentLayout({ children }) {
  return <ContentChrome>{children}</ContentChrome>;
}
