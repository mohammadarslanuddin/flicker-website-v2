import { DocTemplate } from "../../../components/doc-template";
import { TERMS } from "../../../components/legal-content";

export const metadata = { title: "Terms & Conditions — Flicker App" };

export default function Page() {
  return <DocTemplate doc={TERMS} />;
}
