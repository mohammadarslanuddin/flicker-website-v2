import { DocTemplate } from "../../../components/doc-template";
import { PRIVACY } from "../../../components/legal-content";

export const metadata = { title: "Privacy Policy — Flicker App" };

export default function Page() {
  return <DocTemplate doc={PRIVACY} />;
}
