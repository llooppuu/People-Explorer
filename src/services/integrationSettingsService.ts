import { prisma } from "../lib/prisma";

const EUIPO_PROVIDER = "euipo";

export type EuipoCredentials = {
  clientId: string;
  clientSecret: string;
};

function maskSecret(secret?: string) {
  if (!secret) {
    return undefined;
  }

  return secret.length <= 4 ? "****" : `${"*".repeat(Math.max(4, secret.length - 4))}${secret.slice(-4)}`;
}

export async function getEuipoCredentials(): Promise<EuipoCredentials | undefined> {
  const saved = await prisma.integrationCredential.findUnique({
    where: { provider: EUIPO_PROVIDER }
  });

  if (saved) {
    return {
      clientId: saved.clientId,
      clientSecret: saved.clientSecret
    };
  }

  const clientId = process.env.EUIPO_CLIENT_ID;
  const clientSecret = process.env.EUIPO_CLIENT_SECRET;

  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

export async function getEuipoSettingsStatus() {
  const saved = await prisma.integrationCredential.findUnique({
    where: { provider: EUIPO_PROVIDER }
  });

  if (saved) {
    return {
      provider: EUIPO_PROVIDER,
      configured: true,
      source: "database" as const,
      clientId: saved.clientId,
      secretPreview: maskSecret(saved.clientSecret),
      updatedAt: saved.updatedAt
    };
  }

  const envCredentials = process.env.EUIPO_CLIENT_ID && process.env.EUIPO_CLIENT_SECRET;

  return {
    provider: EUIPO_PROVIDER,
    configured: Boolean(envCredentials),
    source: envCredentials ? ("environment" as const) : ("none" as const),
    clientId: process.env.EUIPO_CLIENT_ID,
    secretPreview: maskSecret(process.env.EUIPO_CLIENT_SECRET),
    updatedAt: null
  };
}

export async function saveEuipoSettings(input: EuipoCredentials) {
  return prisma.integrationCredential.upsert({
    where: { provider: EUIPO_PROVIDER },
    create: {
      provider: EUIPO_PROVIDER,
      clientId: input.clientId,
      clientSecret: input.clientSecret
    },
    update: {
      clientId: input.clientId,
      clientSecret: input.clientSecret
    }
  });
}
