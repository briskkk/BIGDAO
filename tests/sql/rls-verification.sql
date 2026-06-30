-- Run with Supabase local users or the dashboard SQL editor after creating:
-- owner_user, editor_user, viewer_user and outsider_user test accounts.
--
-- Expected checks:
-- 1. outsider_user: select from accounts where family_id = '<family_id>' returns 0 rows.
-- 2. viewer_user: insert into transactions for '<family_id>' fails with RLS violation.
-- 3. editor_user: insert into transactions for '<family_id>' succeeds.
-- 4. owner_user: insert/update family_members for '<family_id>' succeeds.
-- 5. outsider_user: insert into accounts with forged family_id = '<family_id>' fails.
--
-- Example SQL assertions inside an authenticated session:
select public.is_family_member('<family_id>'::uuid) as should_match_membership;
select public.has_family_role('<family_id>'::uuid, array['owner','editor']::public.family_role[]) as can_write_family_data;
