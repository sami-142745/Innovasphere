-- JWT revocation support: incrementing token_version invalidates all previously
-- issued access tokens for a user.
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'token_version'
);

SET @ddl = IF(
  @column_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `token_version` int NOT NULL DEFAULT 0 AFTER `role`',
  'SELECT 1'
);

PREPARE add_token_version FROM @ddl;
EXECUTE add_token_version;
DEALLOCATE PREPARE add_token_version;
