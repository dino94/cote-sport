/*
# Enable pg_cron extension

Creates the pg_cron schema and makes the cron.schedule() function available
for scheduling recurring database jobs.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
