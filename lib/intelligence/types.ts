import type { Contact, ContactOwnershipType } from "../types/contact.ts";
import type { SourceEvidence } from "../types/evidence.ts";

export type CrawlResult = {
  url: string;
  finalUrl: string;
  reachable: boolean;
  statusCode: number | null;
  contentType: string | null;
  contentLength: number;
  body: string | null;
  redirects: string[];
  error?: string | null;
  timingMs: number;
};

export type WebsiteLinkCategory =
  | "contact"
  | "about"
  | "team"
  | "services"
  | "social"
  | "general";

export type WebsiteLink = {
  label: string;
  url: string;
  isInternal: boolean;
  category: WebsiteLinkCategory;
};

export type SocialPlatform =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "twitter"
  | "youtube"
  | "other";

export type SocialProfileLink = {
  platform: SocialPlatform;
  url: string;
};

export type DiscoveredPages = {
  contact: string | null;
  about: string | null;
  team: string | null;
  services: string | null;
};

export type WebsiteIntelligence = {
  url: string;
  finalUrl: string;
  reachable: boolean;
  statusCode: number | null;
  title: string | null;
  description: string | null;
  headings: string[];
  textSnippet: string;
  metaTags: Record<string, string>;
  links: WebsiteLink[];
  socialLinks: SocialProfileLink[];
  discoveredPages: DiscoveredPages;
  hasHttps: boolean;
  hasContactPage: boolean;
  hasTeamPage: boolean;
  hasCallToAction: boolean;
  signals: string[];
  fetchedAt: string;
};

export type ExtractedEmail = {
  email: string;
  ownershipType: ContactOwnershipType;
  sourceUrl: string;
  contextSnippet?: string;
};

export type ExtractedPhone = {
  phone: string;
  rawPhone: string;
  countryCode?: string | null;
  ownershipType: ContactOwnershipType;
  sourceUrl: string;
  contextSnippet?: string;
};

export type DiscoveredBusinessContacts = {
  emails: ExtractedEmail[];
  phones: ExtractedPhone[];
  addressSnippet?: string | null;
  socialProfiles: SocialProfileLink[];
  contacts: Contact[];
  evidence: SourceEvidence[];
};
