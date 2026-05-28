CREATE TABLE "AiSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'OLLAMA',
    "ollamaUrl" TEXT,
    "ollamaModel" TEXT,
    "openaiApiKey" TEXT,
    "openaiModel" TEXT,
    "openaiBaseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSetting_pkey" PRIMARY KEY ("id")
);
