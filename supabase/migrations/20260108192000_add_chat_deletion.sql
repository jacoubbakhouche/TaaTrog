
-- Add columns for Soft Delete and History Clearing
alter table "public"."conversations"
add column "deleted_for_user" boolean default false,
add column "deleted_for_checker" boolean default false,
add column "cleared_at_for_user" timestamp with time zone,
add column "cleared_at_for_checker" timestamp with time zone;

-- Index for performance (optional but good practice)
create index conversations_deleted_user_idx on conversations(user_id) where deleted_for_user = false;
create index conversations_deleted_checker_idx on conversations(checker_id) where deleted_for_checker = false;
