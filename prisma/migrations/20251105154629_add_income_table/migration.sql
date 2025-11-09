-- CreateTable
CREATE TABLE "income" (
    "id" SERIAL NOT NULL,
    "receipt_pic" TEXT,
    "receipt_number" VARCHAR(50),
    "amount" DECIMAL(10,2) NOT NULL,
    "event_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "paid_status" VARCHAR(20) NOT NULL,
    "approve_status" VARCHAR(20) NOT NULL,
    "approve_person_id" TEXT,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,

    CONSTRAINT "income_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "income_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "income_paid_status_check" CHECK ("paid_status" IN ('Pending', 'Paid')),
    CONSTRAINT "income_approve_status_check" CHECK ("approve_status" IN ('Approved', 'Declined', 'Pending'))
);

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income" ADD CONSTRAINT "income_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
