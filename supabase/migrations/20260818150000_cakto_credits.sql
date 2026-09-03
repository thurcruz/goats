create table if not exists public.credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount <> 0),
  kind text not null check (kind in ('purchase', 'refund', 'chargeback', 'usage', 'adjustment')),
  provider text,
  provider_reference text,
  description text,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

create table if not exists public.cakto_orders (
  order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_email text not null,
  product_id text not null,
  product_name text,
  offer_id text,
  amount numeric(12,2) not null default 0,
  credits bigint not null check (credits > 0),
  status text not null check (status in ('paid', 'refunded', 'chargedback')),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.cakto_webhook_events (
  event_key text primary key,
  event_type text not null,
  order_id text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);
create index if not exists cakto_orders_user_updated_idx on public.cakto_orders (user_id, updated_at desc);

alter table public.credit_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.cakto_orders enable row level security;
alter table public.cakto_webhook_events enable row level security;

create policy "Users read own wallet" on public.credit_wallets for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read own ledger" on public.credit_ledger for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read own Cakto orders" on public.cakto_orders for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.get_my_credit_account()
returns table(balance bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.credit_wallets(user_id) values (auth.uid()) on conflict (user_id) do nothing;
  return query select w.balance from public.credit_wallets w where w.user_id = auth.uid();
end;
$$;

revoke all on function public.get_my_credit_account() from public, anon;

create or replace function public.process_cakto_payment(
  p_event_key text,
  p_event_type text,
  p_order_id text,
  p_customer_email text,
  p_product_id text,
  p_product_name text,
  p_offer_id text,
  p_amount numeric,
  p_credits bigint,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  delta bigint;
  new_balance bigint;
begin
  if p_event_type not in ('purchase_approved', 'refund', 'chargeback') then raise exception 'Unsupported event'; end if;
  if p_credits <= 0 then raise exception 'Invalid credits'; end if;

  insert into public.cakto_webhook_events(event_key, event_type, order_id, payload)
  values (p_event_key, p_event_type, p_order_id, p_payload)
  on conflict (event_key) do nothing;
  if not found then return jsonb_build_object('duplicate', true); end if;

  select id into target_user from auth.users where lower(email) = lower(p_customer_email) limit 1;
  if target_user is null then raise exception 'No GOATS user for customer email'; end if;

  if p_event_type = 'purchase_approved' then
    delta := p_credits;
    insert into public.cakto_orders(order_id, user_id, customer_email, product_id, product_name, offer_id, amount, credits, status, paid_at)
    values (p_order_id, target_user, lower(p_customer_email), p_product_id, nullif(p_product_name, ''), p_offer_id, p_amount, p_credits, 'paid', now())
    on conflict (order_id) do update set status = 'paid', updated_at = now();
  else
    if not exists (select 1 from public.cakto_orders where order_id = p_order_id and status = 'paid') then
      raise exception 'Paid order not found';
    end if;
    delta := -p_credits;
    update public.cakto_orders set status = case when p_event_type = 'refund' then 'refunded' else 'chargedback' end, updated_at = now()
    where order_id = p_order_id;
  end if;

  insert into public.credit_wallets(user_id, balance) values (target_user, delta)
  on conflict (user_id) do update set balance = public.credit_wallets.balance + excluded.balance, updated_at = now()
  returning balance into new_balance;

  insert into public.credit_ledger(user_id, amount, kind, provider, provider_reference, description)
  values (target_user, delta, case when p_event_type = 'purchase_approved' then 'purchase' else p_event_type end, 'cakto', p_event_key, p_product_name);

  return jsonb_build_object('duplicate', false, 'balance', new_balance, 'user_id', target_user);
end;
$$;

revoke all on function public.process_cakto_payment(text,text,text,text,text,text,text,numeric,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.process_cakto_payment(text,text,text,text,text,text,text,numeric,bigint,jsonb) to service_role;
grant execute on function public.get_my_credit_account() to authenticated;
