/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `FormData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FormData_type_key" ON "FormData"("type");
