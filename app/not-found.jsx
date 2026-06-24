import { ContentChrome } from "../components/content-chrome";
import { DocTemplate } from "../components/doc-template";

export const metadata = { title: "Page not found — Flicker App" };

// Global 404. Uses the Template's error mode inside the shared content chrome
// so it carries the site header + footer and scrolls correctly.
export default function NotFound() {
  return (
    <ContentChrome>
      <DocTemplate mode="error" />
    </ContentChrome>
  );
}
