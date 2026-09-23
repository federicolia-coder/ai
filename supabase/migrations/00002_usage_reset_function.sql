-- Function to reset token usage for a new billing period
-- Called by Stripe webhook on invoice.paid or scheduled cron
create or replace function public.reset_expired_usage()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Create new usage records for users whose current period has ended
  insert into public.usage (user_id, period_start, period_end, tokens_used, token_limit)
  select
    u.user_id,
    now(),
    now() + interval '1 month',
    0,
    s.token_limit
  from public.usage u
  join public.subscriptions s on s.user_id = u.user_id
  where u.period_end <= now()
    and not exists (
      select 1 from public.usage u2
      where u2.user_id = u.user_id
        and u2.period_start > u.period_start
    )
  on conflict (user_id, period_start) do nothing;
end;
$$;

-- Rate limiting helper: check if user can make a request
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_window_seconds int default 60,
  p_max_requests int default 30
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_count int;
begin
  -- Simple rate limit using messages table for chat actions
  if p_action = 'chat' then
    select count(*) into v_count
    from public.messages
    where user_id = p_user_id
      and role = 'user'
      and created_at > now() - (p_window_seconds || ' seconds')::interval;

    return v_count < p_max_requests;
  end if;

  return true;
end;
$$;
