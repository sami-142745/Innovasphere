-- Project team capacity introduced with the Phase 4.1 API contract.
-- Idempotent so databases previously updated by Hibernate's ddl-auto can also
-- be baselined safely. Existing projects receive the application default of 10.
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'projects'
    AND column_name = 'max_team_size'
);

SET @ddl = IF(
  @column_exists = 0,
  'ALTER TABLE `projects` ADD COLUMN `max_team_size` int DEFAULT 10',
  'SELECT 1'
);

PREPARE add_max_team_size FROM @ddl;
EXECUTE add_max_team_size;
DEALLOCATE PREPARE add_max_team_size;

UPDATE `projects`
SET `max_team_size` = 10
WHERE `max_team_size` IS NULL;
