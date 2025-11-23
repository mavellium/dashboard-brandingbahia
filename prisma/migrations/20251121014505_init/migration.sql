-- CreateTable
CREATE TABLE "FormData" (
    "id" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormData_pkey" PRIMARY KEY ("id")
);
