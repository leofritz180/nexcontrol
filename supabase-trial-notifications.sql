-- NexControl — Trial notification tracking
alter table tenants add column if not exists last_trial_notif_date date;
alter table tenants add column if not exists trial_expired_notified boolean default false;
