#!/bin/bash
# Seed demo data via the API for screenshot purposes
set -e
API="http://localhost:44455/api"

create_job() {
  local title="$1" employer="$2" url="$3" location="$4" resume="$5" source="$6" status="$7"
  id=$(curl -s -X POST "$API/jobs" -H "Content-Type: application/json" \
    -d "{\"title\":\"$title\",\"employer\":\"$employer\",\"jobUrl\":\"$url\",\"location\":\"$location\",\"resumeUsed\":\"$resume\",\"foundVia\":\"$source\",\"remote\":true}" \
    | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  if [ -n "$status" ] && [ "$status" != "applied" ]; then
    curl -s -X POST "$API/jobs/$id/stage-events" -H "Content-Type: application/json" \
      -d "{\"toStatus\":\"$status\"}" > /dev/null
  fi
  echo "$id"
}

create_job "Senior Backend Engineer"     "Stripe"        "https://stripe.com/jobs/listing/senior-backend-engineer/1"  "San Francisco, CA" "backend"        "linkedin"     "screening"
create_job "Staff Software Engineer"     "Datadog"       "https://datadoghq.com/careers/staff-engineer/2"             "New York, NY"      "lead"           "linkedin"     "technical"
create_job "Full Stack Engineer"         "Linear"        "https://linear.app/careers/fullstack/3"                     "Remote"            "fullstack"      "company_site" "applied"
create_job "Backend Engineer, Payments"  "Plaid"         "https://plaid.com/careers/backend-payments/4"               "Remote"            "backend"        "linkedin"     "rejected"
create_job "Engineering Manager"         "Vercel"        "https://vercel.com/careers/engineering-manager/5"           "Remote"            "lead"           "referral"     "onsite"
create_job "AI Engineer"                 "Anthropic"     "https://anthropic.com/careers/ai-engineer/6"                "San Francisco, CA" "ai-integration" "company_site" "screening"
create_job "Senior Software Engineer"    "Notion"        "https://notion.so/careers/senior-engineer/7"                "New York, NY"      "fullstack"      "wellfound"    "applied"
create_job "Backend Engineer"            "Supabase"      "https://supabase.com/careers/backend/8"                     "Remote"            "backend"        "hackernews"   "applied"
create_job "Platform Engineer"           "Render"        "https://render.com/careers/platform/9"                      "Remote"            "backend"        "linkedin"     "rejected"
create_job "Software Engineer, AI"       "OpenAI"        "https://openai.com/careers/swe-ai/10"                       "San Francisco, CA" "ai-integration" "linkedin"     "applied"
create_job "Senior Full Stack Engineer"  "Cloudflare"    "https://cloudflare.com/careers/senior-fullstack/11"         "Remote"            "fullstack"      "indeed"       "screening"
create_job "Tech Lead, Infrastructure"   "Fly.io"        "https://fly.io/careers/tech-lead-infra/12"                  "Remote"            "lead"           "hackernews"   "offer"
create_job "Backend Engineer, Identity"  "Clerk"         "https://clerk.com/careers/backend-identity/13"              "Remote"            "backend"        "wellfound"    "applied"
create_job "Senior Engineer, Growth"     "PostHog"       "https://posthog.com/careers/senior-growth/14"               "Remote"            "fullstack"      "company_site" "rejected"
create_job "Distinguished Engineer"      "Railway"       "https://railway.app/careers/distinguished/15"               "Remote"            "lead"           "referral"     "technical"
create_job "Backend Engineer"            "Resend"        "https://resend.com/careers/backend/16"                      "Remote"            "backend"        "linkedin"     "applied"
create_job "AI Platform Engineer"        "Modal"         "https://modal.com/careers/ai-platform/17"                   "New York, NY"      "ai-integration" "wellfound"    "applied"
create_job "Senior Engineer"             "Neon"          "https://neon.tech/careers/senior-engineer/18"               "Remote"            "backend"        "linkedin"     "screening"

echo "Seed complete."
