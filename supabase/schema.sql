-- Enable UUID extension
create extension if not exists "uuid-ossp";

create schema if not exists smarp;

-- Portfolios Table for SMAs
create table smarp.portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  client_name text not null,
  total_value numeric(15, 2) not null,
  holdings jsonb not null, -- Stores tickers and weights [{ "ticker": "AAPL", "weight": 0.4 }, ...]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Simulation Results Audit Trail
create table smarp.simulation_runs (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references smarp.portfolios(id) on delete cascade not null,
  parameters jsonb not null, -- Stores config: paths, regime switching, macro shocks
  results jsonb not null,    -- Stores output percentiles, VaR, Expected Shortfall
  executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table smarp.portfolios enable row level security;
alter table smarp.simulation_runs enable row level security;

create policy "Users can view their own portfolios"
  on smarp.portfolios for select using (auth.uid() = user_id);

create policy "Users can insert their own portfolios"
  on smarp.portfolios for insert with check (auth.uid() = user_id);
