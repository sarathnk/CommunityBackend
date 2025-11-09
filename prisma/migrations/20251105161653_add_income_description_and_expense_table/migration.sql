-- AlterTable
ALTER TABLE "income" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "expense" (
    "id" SERIAL NOT NULL,
    "bill_pic" TEXT,
    "bill_number" VARCHAR(50),
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "event_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "approve_status" VARCHAR(20) NOT NULL,
    "approve_person_id" TEXT,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "expense_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "expense_approve_status_check" CHECK ("approve_status" IN ('Approved', 'Declined', 'Pending'))
);

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
