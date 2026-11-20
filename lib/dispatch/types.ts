export interface StudioSettings {
  studioName: string;
  contactEmail: string;
  website: string;
  defaultCurrency: "USD" | "AUD" | "EUR" | "GBP" | "INR";
  paymentTerms: string;
  governingJurisdiction: string;
  webhookUrl?: string;
  webhookEnabled: boolean;
  webhookAuthHeader?: string;
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    fromEmail: string;
    fromName: string;
  };
}

export interface WebhookDispatchPayload {
  event: "lead.qualified" | "lead.pitch_sent" | "lead.contract_sent" | "lead.won" | "manual.dispatch";
  timestamp: string;
  lead: {
    id: string;
    companyName: string;
    website?: string | null;
    city?: string | null;
    country?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    decisionMakerName?: string | null;
    decisionMakerRole?: string | null;
    stage: string;
    score: number;
    estimatedValue?: number | null;
    currency: string;
  };
  outreachSequence?: {
    touch1: { subject: string; body: string };
    touch2: { subject: string; body: string };
    touch3: { subject: string; body: string };
    whatsappDraft?: string;
    optimalSendWindow?: string;
  };
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  studioName: "SoleTrust Creative & Technical Studio",
  contactEmail: "partnerships@soletrust.local",
  website: "https://soletrust.local",
  defaultCurrency: "USD",
  paymentTerms: "50% upfront deposit upon signing, 50% upon milestone completion",
  governingJurisdiction: "Australia",
  webhookUrl: "",
  webhookEnabled: false,
  webhookAuthHeader: "",
};
