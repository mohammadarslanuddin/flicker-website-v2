import { DocTemplate } from "../../../components/doc-template";
import { TERMS_OF_SERVICE } from "../../../components/legal-content";

export const metadata = { title: "Terms of Service — Flicker App" };

export default function Page() {
  return <DocTemplate doc={TERMS_OF_SERVICE} />;
}
