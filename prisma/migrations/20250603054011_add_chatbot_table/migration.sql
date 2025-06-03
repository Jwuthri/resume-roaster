-- CreateTable
CREATE TABLE "chatbot" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_id" TEXT,
    "conversation_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "llm_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chatbot_user_id_idx" ON "chatbot"("user_id");

-- CreateIndex
CREATE INDEX "chatbot_anonymous_id_idx" ON "chatbot"("anonymous_id");

-- CreateIndex
CREATE INDEX "chatbot_conversation_id_idx" ON "chatbot"("conversation_id");

-- CreateIndex
CREATE INDEX "chatbot_created_at_idx" ON "chatbot"("created_at");

-- AddForeignKey
ALTER TABLE "chatbot" ADD CONSTRAINT "chatbot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
