import { DocTemplate } from "../../../components/doc-template";
import { COOKIES } from "../../../components/legal-content";

export const metadata = { title: "Cookie Policy — Flicker App" };

export default function Page() {
  return <DocTemplate doc={COOKIES} />;
}
