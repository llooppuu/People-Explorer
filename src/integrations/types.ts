export type ExternalReferenceCandidate = {
  sourceName: string;
  baseUrl: string;
  sourceType: "API" | "RSS" | "MANUAL";
  url: string;
  content?: string;
};

