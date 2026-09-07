export type PersonProfileSection = {
  id: string;
  title: string;
  sourceName: string;
  text?: string;
  items?: Array<{
    label: string;
    value: string;
  }>;
};

export type ExternalReferenceCandidate = {
  sourceName: string;
  baseUrl: string;
  sourceType: "API" | "RSS" | "MANUAL";
  url: string;
  content?: string;
  personProfile?: {
    role?: string;
    biography?: string;
    category?: string;
    localized?: {
      et?: {
        role?: string;
        biography?: string;
      };
      en?: {
        role?: string;
        biography?: string;
      };
    };
  };
};
