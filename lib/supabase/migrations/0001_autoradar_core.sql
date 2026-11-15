-- ============================================================
-- SOLETRUST AUTORADAR — CORE DATABASE SCHEMA
-- Migration: 0001_autoradar_core.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. SEARCH JOBS
-- Tracks asynchronous search & enrichment jobs
-- ============================================================
create table if not exists public.search_jobs (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  city text not null,
  region text,
  country text not null,
  service_track text not null default 'general',
  requested_limit integer not null default 10,
  
  status text not null default 'pending'
    check (status in ('pending', 'discovering', 'verifying', 'enriching', 'completed', 'failed', 'cancelled')),
  
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
    
  current_stage text not null default 'queued',
  stage_stats jsonb not null default '{}'::jsonb,
  error_message text,
  
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_search_jobs_status on public.search_jobs(status);
create index if not exists idx_search_jobs_created_at on public.search_jobs(created_at desc);

-- ============================================================
-- 2. BUSINESSES (ACCOUNTS)
-- Canonical company profiles discovered and verified
-- ============================================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  search_job_id uuid references public.search_jobs(id) on delete set null,
  
  canonical_name text not null,
  raw_name text,
  website text,
  domain text,
  
  industry text,
  address text,
  city text,
  region text,
  country text,
  employee_range text,
  description text,
  
  identity_status text not null default 'unverified'
    check (identity_status in ('verified', 'partially_verified', 'unverified', 'rejected')),
    
  identity_score numeric(5,2) not null default 0,
  qualification_score numeric(5,2) not null default 0,
  service_track text,
  
  status text not null default 'discovered'
    check (status in ('discovered', 'researching', 'qualified', 'review', 'rejected', 'contacted', 'meeting')),
    
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_domain on public.businesses(domain);
create index if not exists idx_businesses_status on public.businesses(status);
create index if not exists idx_businesses_qualification on public.businesses(qualification_score desc);
create index if not exists idx_businesses_job on public.businesses(search_job_id);

-- ============================================================
-- 3. BUSINESS SOURCES & EVIDENCE
-- Traceable provenance for every claim
-- ============================================================
create table if not exists public.business_sources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  
  source_url text not null,
  source_host text,
  source_type text not null default 'unknown',
  provider text not null default 'unknown',
  evidence text,
  
  discovered_at timestamptz not null default now()
);

create index if not exists idx_business_sources_biz on public.business_sources(business_id);
create index if not exists idx_business_sources_host on public.business_sources(source_host);

-- ============================================================
-- 4. DECISION MAKERS
-- Verified human beings with purchasing or management authority
-- ============================================================
create table if not exists public.decision_makers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  
  full_name text not null,
  role text not null,
  role_label text not null,
  
  profile_url text,
  source_url text,
  
  discovery_status text not null default 'discovered'
    check (discovery_status in ('discovered', 'evidence_found', 'partially_verified', 'verified', 'rejected')),
    
  verification_status text not null default 'unverified'
    check (verification_status in ('verified', 'partially_verified', 'unverified', 'needs_review', 'rejected')),
    
  confidence_score numeric(5,2) not null default 0,
  reason text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decision_makers_biz on public.decision_makers(business_id);
create index if not exists idx_decision_makers_status on public.decision_makers(verification_status);

-- ============================================================
-- 5. PERSON EVIDENCE
-- Multi-source host verification for decision-makers
-- ============================================================
create table if not exists public.person_evidence (
  id uuid primary key default gen_random_uuid(),
  decision_maker_id uuid not null references public.decision_makers(id) on delete cascade,
  
  source_url text not null,
  source_host text not null,
  source_type text not null,
  source_title text,
  evidence_text text not null,
  
  discovered_at timestamptz not null default now()
);

create index if not exists idx_person_evidence_dm on public.person_evidence(decision_maker_id);
create index if not exists idx_person_evidence_host on public.person_evidence(source_host);

-- ============================================================
-- 6. CONTACTS (BUSINESS & DECISION-MAKER CONTACTS)
-- NEVER confuse a clinic reception line with a direct owner phone
-- ============================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  decision_maker_id uuid references public.decision_makers(id) on delete set null,
  
  contact_type text not null
    check (contact_type in ('email', 'phone')),
    
  contact_value text not null,
  
  ownership_type text not null default 'unknown'
    check (ownership_type in ('business_main', 'reception', 'department', 'decision_maker_direct', 'professional_direct', 'unknown')),
    
  verification_status text not null default 'unknown'
    check (verification_status in ('extracted', 'syntax_valid', 'domain_valid', 'mx_valid', 'provider_verified', 'confirmed', 'invalid', 'unknown')),
    
  verification_method text,
  source_url text,
  evidence text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_contacts_biz on public.contacts(business_id);
create index if not exists idx_contacts_dm on public.contacts(decision_maker_id);
create index if not exists idx_contacts_val on public.contacts(contact_value);

-- ============================================================
-- 7. QUALIFICATION SCORES
-- Transparent 6-factor score breakdown
-- ============================================================
create table if not exists public.qualification_scores (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  
  identity_score numeric(5,2) not null default 0,
  industry_score numeric(5,2) not null default 0,
  location_score numeric(5,2) not null default 0,
  contactability_score numeric(5,2) not null default 0,
  decision_maker_score numeric(5,2) not null default 0,
  service_fit_score numeric(5,2) not null default 0,
  overall_score numeric(5,2) not null default 0,
  
  is_qualified boolean not null default false,
  explanation text,
  reasons jsonb not null default '[]'::jsonb,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_qual_biz on public.qualification_scores(business_id);

-- ============================================================
-- 8. PROVIDER RUNS
-- Audit & observability for waterfall discovery
-- ============================================================
create table if not exists public.provider_runs (
  id uuid primary key default gen_random_uuid(),
  search_job_id uuid references public.search_jobs(id) on delete cascade,
  
  provider_name text not null,
  query text not null,
  status text not null default 'started'
    check (status in ('started', 'success', 'failed', 'empty')),
    
  result_count integer not null default 0,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_provider_runs_job on public.provider_runs(search_job_id);

-- ============================================================
-- 9. VERIFICATION HISTORY
-- Audit trail for every verification status change
-- ============================================================
create table if not exists public.verification_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null
    check (entity_type in ('business', 'decision_maker', 'contact')),
    
  entity_id uuid not null,
  verification_type text not null,
  previous_status text,
  new_status text not null,
  evidence text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_verif_history_entity on public.verification_history(entity_id);

-- ============================================================
-- 10. BACKWARD-COMPATIBILITY LEADS VIEW / TABLE
-- Provides seamless compatibility for existing app/page.tsx queries
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  website text,
  industry text,
  city text,
  country text,
  employee_range text,
  service_track text,
  score numeric(5,2) default 0,
  status text default 'new',
  source text,
  source_url text,
  score_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_score on public.leads(score desc);

