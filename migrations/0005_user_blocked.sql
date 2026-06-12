-- Флаг «заблокировал бота» — чтобы не слать рассылку тем, кто закрыл диалог.
-- Сбрасывается в 0 при любом новом взаимодействии (см. upsertUser).
ALTER TABLE users ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0;
