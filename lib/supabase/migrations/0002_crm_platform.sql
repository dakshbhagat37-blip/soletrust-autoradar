-- ============================================================
-- SOLETRUST AUTORADAR — CRM & SALES PLATFORM SCHEMA
-- Migration: 0002_crm_platform.sql
-- ============================================================

-- ============================================================
-- 1. USERS & ORGANIZATIONS
-- ============================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  avatar_url text,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'manager', 'member', 'viewer')),
  org_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.users
  add constraint fk_users_org foreign key (org_id) references public.organizations(id) on delete set null;

-- ============================================================
-- 2. CRM LEADS
-- Extends business records with full sales lifecycle
-- ============================================================
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,

  -- Identity snapshot
  company_name text not null,
  industry text,
  website text,
  city text,
  country text,

  -- CRM fields
  stage text not null default 'new'
    check (stage in (
      'new', 'researched', 'qualified', 'ready_for_outreach',
      'contacted', 'engaged', 'follow_up_required',
      'meeting_scheduled', 'proposal_sent', 'negotiation',
      'won', 'lost', 'disqualified', 'on_hold'
    )),

  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),

  assigned_to uuid references public.users(id) on delete set null,
  qualification_score numeric(5,2) default 0,
  service_fit_score numeric(5,2) default 0,

  -- Deal info
  estimated_deal_value numeric(12,2),
  currency text default 'INR',

  -- Metadata
  tags text[] default '{}',
  notes text,
  lost_reason text,
  next_action text,
  next_follow_up_at timestamptz,

  -- Source tracking
  discovery_source text,
  service_track text,

  -- Timestamps
  first_contacted_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_leads_business on public.crm_leads(business_id);
create index if not exists idx_crm_leads_stage on public.crm_leads(stage);
create index if not exists idx_crm_leads_assigned on public.crm_leads(assigned_to);
create index if not exists idx_crm_leads_org on public.crm_leads(org_id);
create index if not exists idx_crm_leads_priority on public.crm_leads(priority);
create index if not exists idx_crm_leads_follow_up on public.crm_leads(next_follow_up_at);

-- ============================================================
-- 3. ACTIVITY LOG
-- Every action on a lead recorded chronologically
-- ============================================================
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,

  activity_type text not null
    check (activity_type in (
      'lead_created', 'stage_changed', 'note_added', 'tag_added', 'tag_removed',
      'assigned', 'priority_changed', 'lead_qualified', 'lead_disqualified',
      'business_discovered', 'business_verified', 'industry_verified',
      'website_checked', 'location_checked', 'contact_found',
      'decision_maker_identified', 'person_verified',
      'message_drafted', 'message_approved', 'message_sent',
      'delivery_confirmed', 'reply_received', 'reply_logged',
      'call_recorded', 'meeting_scheduled', 'meeting_completed',
      'proposal_sent', 'deal_created', 'deal_updated',
      'follow_up_scheduled', 'follow_up_completed', 'task_created', 'task_completed',
      'won', 'lost', 'reopened', 'custom'
    )),

  title text not null,
  description text,
  metadata jsonb default '{}'::jsonb,

  -- Change tracking
  previous_value text,
  new_value text,

  created_at timestamptz not null default now()
);

create index if not exists idx_activities_lead on public.activities(lead_id);
create index if not exists idx_activities_type on public.activities(activity_type);
create index if not exists idx_activities_created on public.activities(created_at desc);

-- ============================================================
-- 4. OUTREACH ACTIVITIES
-- Every message/call/interaction with a prospect
-- ============================================================
create table if not exists public.outreach_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,

  channel text not null
    check (channel in ('email', 'linkedin', 'phone', 'whatsapp', 'manual', 'other')),

  message_subject text,
  message_body text,

  status text not null default 'draft'
    check (status in (
      'draft', 'approved', 'scheduled', 'sent', 'delivered',
      'bounced', 'replied', 'no_reply', 'failed', 'cancelled'
    )),

  -- Provider tracking
  provider text,
  provider_message_id text,

  -- Scheduling
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  replied_at timestamptz,

  -- Outcome
  outcome text,
  next_action text,

  -- Manual vs provider
  is_manual boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_outreach_lead on public.outreach_activities(lead_id);
create index if not exists idx_outreach_status on public.outreach_activities(status);
create index if not exists idx_outreach_channel on public.outreach_activities(channel);

-- ============================================================
-- 5. CONVERSATIONS & MESSAGES
-- Thread-based message tracking
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,

  channel text not null
    check (channel in ('email', 'linkedin', 'phone', 'whatsapp', 'manual', 'other')),

  subject text,
  thread_id text,

  status text not null default 'active'
    check (status in ('active', 'waiting_reply', 'replied', 'closed', 'snoozed')),

  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_lead on public.conversations(lead_id);
create index if not exists idx_conversations_status on public.conversations(status);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  outreach_id uuid references public.outreach_activities(id) on delete set null,

  direction text not null
    check (direction in ('outbound', 'inbound')),

  sender_name text,
  sender_email text,
  body text not null,

  -- Reply classification
  reply_classification text
    check (reply_classification in (
      'positive', 'neutral', 'negative', 'out_of_office',
      'unsubscribe', 'needs_review', null
    )),

  -- Source
  is_manual boolean not null default false,
  provider_message_id text,

  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_direction on public.messages(direction);

-- ============================================================
-- 6. FOLLOW-UPS
-- Scheduled follow-up actions with context
-- ============================================================
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,

  reason text not null,
  due_at timestamptz not null,

  status text not null default 'pending'
    check (status in ('pending', 'due', 'overdue', 'completed', 'cancelled', 'paused')),

  completed_at timestamptz,
  paused_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_follow_ups_lead on public.follow_ups(lead_id);
create index if not exists idx_follow_ups_status on public.follow_ups(status);
create index if not exists idx_follow_ups_due on public.follow_ups(due_at);

-- ============================================================
-- 7. TASKS
-- General task management linked to leads
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,

  title text not null,
  description text,

  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),

  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'completed', 'cancelled')),

  due_at timestamptz,
  completed_at timestamptz,
  reminder_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_lead on public.tasks(lead_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due on public.tasks(due_at);

-- ============================================================
-- 8. MEETINGS
-- Scheduled meetings with leads/contacts
-- ============================================================
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  organized_by uuid references public.users(id) on delete set null,

  title text not null,
  description text,
  location text,
  meeting_url text,

  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text default 'Asia/Kolkata',

  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),

  attendees jsonb default '[]'::jsonb,
  agenda text,
  notes text,
  outcome text,
  next_actions text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meetings_lead on public.meetings(lead_id);
create index if not exists idx_meetings_starts on public.meetings(starts_at);
create index if not exists idx_meetings_status on public.meetings(status);

-- ============================================================
-- 9. DEALS
-- Revenue tracking and deal management
-- ============================================================
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,

  title text not null,
  service_offered text,
  amount numeric(12,2),
  currency text default 'INR',

  stage text not null default 'proposal'
    check (stage in ('proposal', 'negotiation', 'won', 'lost')),

  probability integer default 50
    check (probability >= 0 and probability <= 100),

  expected_close_date date,
  actual_close_date date,

  competitors text,
  business_need text,
  proposal_url text,
  lost_reason text,

  won_at timestamptz,
  lost_at timestamptz,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deals_lead on public.deals(lead_id);
create index if not exists idx_deals_stage on public.deals(stage);

-- ============================================================
-- 10. CUSTOMERS
-- Won deals converted to customer records
-- ============================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,

  company_name text not null,
  primary_contact_name text,
  primary_contact_email text,
  industry text,
  city text,
  country text,

  total_revenue numeric(12,2) default 0,
  currency text default 'INR',
  services_sold text[],

  status text not null default 'active'
    check (status in ('active', 'inactive', 'churned')),

  acquired_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_lead on public.customers(lead_id);
create index if not exists idx_customers_status on public.customers(status);

-- ============================================================
-- 11. SUPPRESSION LIST
-- Contacts who have unsubscribed or should not be contacted
-- ============================================================
create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  contact_value text not null,
  contact_type text not null check (contact_type in ('email', 'phone')),
  reason text not null default 'unsubscribe',
  suppressed_at timestamptz not null default now()
);

create unique index if not exists idx_suppression_unique on public.suppression_list(contact_value, contact_type);

-- ============================================================
-- 12. INTEGRATIONS
-- External service connections
-- ============================================================
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,

  provider text not null,
  integration_type text not null
    check (integration_type in ('email', 'calendar', 'whatsapp', 'linkedin', 'crm_import', 'webhook', 'other')),

  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'expired', 'error')),

  config jsonb default '{}'::jsonb,
  token_encrypted text,

  connected_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_integrations_org on public.integrations(org_id);
create index if not exists idx_integrations_status on public.integrations(status);

