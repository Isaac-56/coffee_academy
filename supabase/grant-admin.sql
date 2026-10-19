-- First create and verify the administrator's account through /student.
-- Replace the email below, then run in Supabase SQL Editor as project owner.
-- Never expose admin membership writes to the browser.
do $$
declare target_id uuid; target_email text := 'REPLACE_WITH_ADMIN_EMAIL';
begin
 select id into target_id from auth.users
 where lower(email)=lower(target_email) and email_confirmed_at is not null;
 if target_id is null then raise exception 'No verified account found for this email. Register and confirm the account first.'; end if;
 insert into tera_private.admins(user_id) values(target_id) on conflict do nothing;
end $$;
