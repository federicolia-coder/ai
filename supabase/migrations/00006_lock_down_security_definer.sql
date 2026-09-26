-- Security definer functions were executable by anon and authenticated through PostgREST.
-- A signed-in user could call increment_token_usage with a negative amount and give
-- themselves unlimited tokens. Only the edge functions (service role) call these.

revoke execute on function public.check_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.increment_token_usage(uuid, integer) from public, anon, authenticated;
revoke execute on function public.reset_expired_usage() from public, anon, authenticated;
-- Trigger functions: privilege is checked when the trigger is created, not when it fires.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;

grant execute on function public.check_rate_limit(uuid, text, integer, integer) to service_role;
grant execute on function public.increment_token_usage(uuid, integer) to service_role;
grant execute on function public.reset_expired_usage() to service_role;

-- Returns the user's current usage period, opening a new calendar month when the last one expired.
create or replace function public.ensure_current_usage(p_user_id uuid)
returns public.usage
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row public.usage;
  v_limit bigint;
begin
  select * into v_row
  from public.usage
  where user_id = p_user_id and period_start <= now() and period_end > now()
  order by period_start desc
  limit 1;

  if found then
    return v_row;
  end if;

  select token_limit into v_limit from public.subscriptions where user_id = p_user_id;

  insert into public.usage (user_id, period_start, period_end, tokens_used, token_limit)
  values (
    p_user_id,
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    0,
    coalesce(v_limit, 100000)
  )
  on conflict (user_id, period_start) do nothing;

  select * into v_row
  from public.usage
  where user_id = p_user_id and period_start <= now() and period_end > now()
  order by period_start desc
  limit 1;

  return v_row;
end;
$$;

revoke execute on function public.ensure_current_usage(uuid) from public, anon, authenticated;
grant execute on function public.ensure_current_usage(uuid) to service_role;

-- Always record what was spent. The old version skipped the update when it would cross the
-- limit, so usage near the limit was never counted and the user could keep chatting.
-- Returns true while the user is still within the limit.
create or replace function public.increment_token_usage(p_user_id uuid, p_tokens integer)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_row public.usage;
begin
  if p_tokens is null or p_tokens < 0 then
    raise exception 'p_tokens must be a non-negative integer';
  end if;

  v_row := public.ensure_current_usage(p_user_id);
  if v_row.id is null then
    return false;
  end if;

  update public.usage
  set tokens_used = tokens_used + p_tokens
  where id = v_row.id
  returning * into v_row;

  return v_row.tokens_used <= v_row.token_limit;
end;
$$;

-- Plan limits live in the subscription so a new period inherits them.
update public.subscriptions
set token_limit = case plan when 'plus' then 2000000 when 'pro' then 10000000 else 100000 end
where token_limit is distinct from case plan when 'plus' then 2000000 when 'pro' then 10000000 else 100000 end;
