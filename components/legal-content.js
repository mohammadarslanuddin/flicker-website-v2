/* =====================================================================
   Legal / document content for the shared DocTemplate (document mode).
   Each entry: { eyebrow, title, updated, sections[] } where every
   section is { id, label, title, paras[] }. The template derives the
   sticky "Contents" index from each section's { id, label }.
   Privacy is ported from the imported Template design; the others
   follow the same shape with Flicker-appropriate copy.
   ===================================================================== */

const UPDATED = "Last updated June 18, 2026";

export const PRIVACY = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  updated: UPDATED,
  sections: [
    { id: "overview", label: "Overview", title: "Overview", paras: [
      "This Privacy Policy explains how Flicker App collects, uses, and protects your information when you use our products and services. By using our services, you agree to the practices described here.",
      "We believe privacy is a feature, not an afterthought. This page is written to be read — if anything is unclear, contact us and we will explain it plainly.",
    ] },
    { id: "collect", label: "Information we collect", title: "Information we collect", paras: [
      "We collect information you provide directly, such as your account details, the titles you save, and any highlights or notes you create. We also collect limited technical information needed to operate and improve the service.",
      "We do not sell your personal information, and we limit collection to what is necessary to deliver the experience you expect.",
    ] },
    { id: "use", label: "How we use it", title: "How we use your information", paras: [
      "Information is used to provide, maintain, and improve our summaries and audio, to communicate with you, and to keep the platform safe and secure for everyone.",
      "Where required, we will ask for your consent before using your information for any purpose not described in this policy.",
    ] },
    { id: "rights", label: "Your rights", title: "Your rights and choices", paras: [
      "You can access, correct, export, or delete your information at any time from your account settings. You may also object to or restrict certain processing of your data.",
      "To exercise any of these rights, reach out and we will respond within the timeframe required by applicable law.",
    ] },
    { id: "contact", label: "Contact", title: "Contact us", paras: [
      "If you have questions about this policy or how we handle your information, contact our team at privacy@flickerapp.com.",
    ] },
  ],
};

export const TERMS = {
  eyebrow: "Legal",
  title: "Terms & Conditions",
  updated: UPDATED,
  sections: [
    { id: "acceptance", label: "Acceptance", title: "Acceptance of terms", paras: [
      "These Terms & Conditions govern your access to and use of Flicker App. By creating an account or using the service, you agree to be bound by these terms.",
      "If you do not agree with any part of these terms, you should not use the service.",
    ] },
    { id: "accounts", label: "Your account", title: "Your account", paras: [
      "You are responsible for keeping your account credentials secure and for all activity that happens under your account. Let us know promptly if you suspect any unauthorised use.",
      "You must be old enough to form a binding contract in your jurisdiction to use Flicker App.",
    ] },
    { id: "use", label: "Acceptable use", title: "Acceptable use", paras: [
      "Flicker App and its summaries are provided for your personal, non-commercial use. You agree not to redistribute, resell, or scrape content from the service without our written permission.",
      "We may suspend or terminate access that violates these terms or that puts the service or other members at risk.",
    ] },
    { id: "content", label: "Content & IP", title: "Content and intellectual property", paras: [
      "Summaries, audio, artwork, and software are owned by Flicker App or its licensors and are protected by intellectual-property laws. Your highlights and notes remain yours.",
      "Book titles and source works belong to their respective authors and publishers; our summaries are original works created to help you decide what to read in full.",
    ] },
    { id: "liability", label: "Liability", title: "Disclaimers and liability", paras: [
      "The service is provided “as is”. To the fullest extent permitted by law, Flicker App is not liable for indirect or incidental damages arising from your use of the service.",
      "Questions about these terms? Contact legal@flickerapp.com.",
    ] },
  ],
};

export const TERMS_OF_SERVICE = {
  eyebrow: "Legal",
  title: "Terms of Service",
  updated: UPDATED,
  sections: [
    { id: "service", label: "The service", title: "The service", paras: [
      "These Terms of Service describe the subscription and the features Flicker App provides, including written summaries, Listen audio, highlights, and your personal library.",
      "We continually improve the service, so specific features may change, be added, or be removed over time.",
    ] },
    { id: "subscriptions", label: "Subscriptions", title: "Subscriptions and billing", paras: [
      "Paid plans renew automatically at the end of each billing period unless cancelled beforehand. Prices are shown before you confirm a purchase.",
      "You can manage or cancel your subscription at any time from your account settings or through the app store you signed up with.",
    ] },
    { id: "trials", label: "Trials & refunds", title: "Trials and refunds", paras: [
      "Where a free trial is offered, you will not be charged until the trial ends. Cancel before it ends to avoid being billed.",
      "Refunds are handled in line with applicable consumer-protection law and the policies of the store you purchased through.",
    ] },
    { id: "changes", label: "Changes", title: "Changes to these terms", paras: [
      "We may update these terms to reflect changes to the service or the law. When we make material changes, we will let you know through the app or by email.",
      "Continuing to use Flicker App after an update means you accept the revised terms.",
    ] },
    { id: "contact", label: "Contact", title: "Contact us", paras: [
      "For anything related to your subscription or these terms, reach our team at support@flickerapp.com.",
    ] },
  ],
};

export const COOKIES = {
  eyebrow: "Legal",
  title: "Cookie Policy",
  updated: UPDATED,
  sections: [
    { id: "what", label: "What cookies are", title: "What cookies are", paras: [
      "Cookies are small text files stored on your device that help websites and apps work and remember your preferences. This policy explains how Flicker App uses them.",
      "Some cookies are essential; others help us understand how the service is used so we can improve it.",
    ] },
    { id: "types", label: "How we use them", title: "How we use cookies", paras: [
      "We use essential cookies to keep you signed in and to remember your reading preferences. We use analytics cookies, where you allow them, to measure which summaries are most helpful.",
      "We do not use cookies to sell your personal information.",
    ] },
    { id: "manage", label: "Managing cookies", title: "Managing your preferences", paras: [
      "You can accept or decline non-essential cookies at any time from your settings, and you can clear cookies through your browser or device controls.",
      "Blocking some cookies may affect how parts of the service work.",
    ] },
    { id: "contact", label: "Contact", title: "Contact us", paras: [
      "Questions about our use of cookies? Contact privacy@flickerapp.com.",
    ] },
  ],
};
