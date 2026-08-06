create or replace function public.enforce_profile_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  end if;

  new.is_banned      := old.is_banned;
  new.banned_at      := old.banned_at;
  new.banned_by      := old.banned_by;
  new.ban_reason     := old.ban_reason;
  new.kyc_status     := old.kyc_status;
  new.kyc_level      := old.kyc_level;
  new.phone_verified := old.phone_verified;
  new.is_deactivated := old.is_deactivated;
  new.id             := old.id;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_protected_columns on public.profiles;
create trigger trg_enforce_profile_protected_columns
before update on public.profiles
for each row execute function public.enforce_profile_protected_columns();

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id and not public.is_user_banned(auth.uid()));

create or replace function public.enforce_user_warning_immutability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  end if;

  new.id                := old.id;
  new.user_id           := old.user_id;
  new.reason            := old.reason;
  new.category          := old.category;
  new.issued_by         := old.issued_by;
  new.related_report_id := old.related_report_id;
  new.created_at        := old.created_at;

  return new;
end;
$$;

drop trigger if exists trg_enforce_user_warning_immutability on public.user_warnings;
create trigger trg_enforce_user_warning_immutability
before update on public.user_warnings
for each row execute function public.enforce_user_warning_immutability();

drop policy if exists "Users acknowledge own warnings" on public.user_warnings;
create policy "Users acknowledge own warnings"
on public.user_warnings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());