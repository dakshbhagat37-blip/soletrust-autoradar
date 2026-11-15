import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Phase 1: Core Foundation Verification Suite", () => {
  test("1. Environment configuration files exist", () => {
    assert.ok(fs.existsSync(".env.example"), ".env.example must exist");
    assert.ok(fs.existsSync(".env.local"), ".env.local must exist");

    const envContent = fs.readFileSync(".env.example", "utf8");
    assert.match(envContent, /NEXT_PUBLIC_SUPABASE_URL/, "Must define NEXT_PUBLIC_SUPABASE_URL");
    assert.match(envContent, /SEARXNG_URL/, "Must define SEARXNG_URL");
  });

  test("2. Canonical SQL migrations exist with all required entities", () => {
    const migrationPath = path.resolve("lib/supabase/migrations/0001_autoradar_core.sql");
    assert.ok(fs.existsSync(migrationPath), "Migration 0001_autoradar_core.sql must exist");

    const sql = fs.readFileSync(migrationPath, "utf8");
    const requiredTables = [
      "search_jobs",
      "businesses",
      "business_sources",
      "decision_makers",
      "person_evidence",
      "contacts",
      "qualification_scores",
      "provider_runs",
      "verification_history",
      "leads",
    ];

    for (const table of requiredTables) {
      assert.match(
        sql,
        new RegExp(`create table if not exists public\\.${table}`, "i"),
        `Migration must create table public.${table}`,
      );
    }
  });

  test("3. TypeScript contracts & types are defined", () => {
    const typeFiles = [
      "lib/types/evidence.ts",
      "lib/types/contact.ts",
      "lib/types/decision-maker.ts",
      "lib/types/qualification.ts",
      "lib/types/business.ts",
      "lib/types/search-job.ts",
      "lib/types/api.ts",
      "lib/types/index.ts",
    ];

    for (const file of typeFiles) {
      assert.ok(fs.existsSync(path.resolve(file)), `Type contract ${file} must exist`);
    }
  });

  test("4. AppError hierarchy conforms to API specs", async () => {
    // Dynamic import to verify transpiled execution
    const {
      AppError,
      ValidationError,
      NotFoundError,
      ProviderError,
      DatabaseError,
      TimeoutError,
    } = await import("../lib/errors/app-error.ts");

    assert.ok(AppError);
    const valErr = new ValidationError("Invalid query", { field: "industry" });
    assert.equal(valErr.statusCode, 400);
    assert.equal(valErr.code, "VALIDATION_ERROR");
    assert.deepEqual(valErr.details, { field: "industry" });

    const notFoundErr = new NotFoundError("Lead 123");
    assert.equal(notFoundErr.statusCode, 404);
    assert.equal(notFoundErr.code, "NOT_FOUND");

    const provErr = new ProviderError("searxng", "Gateway timeout");
    assert.equal(provErr.statusCode, 502);
    assert.equal(provErr.provider, "searxng");

    const dbErr = new DatabaseError("Connection refused");
    assert.equal(dbErr.statusCode, 500);

    const timeoutErr = new TimeoutError("Crawl", 5000);
    assert.equal(timeoutErr.statusCode, 504);
    assert.match(timeoutErr.message, /5000ms/);
  });

  test("5. API response helpers construct standard envelopes", async () => {
    const { createSuccessResponse, createErrorResponse } = await import(
      "../lib/types/api.ts"
    );

    const success = createSuccessResponse({ count: 5 }, { total: 10 }, "req-1");
    assert.equal(success.success, true);
    assert.deepEqual(success.data, { count: 5 });
    assert.equal(success.meta.total, 10);
    assert.equal(success.meta.requestId, "req-1");
    assert.ok(success.meta.timestamp);

    const error = createErrorResponse("BAD_REQUEST", "Invalid", undefined, "req-2");
    assert.equal(error.success, false);
    assert.equal(error.error.code, "BAD_REQUEST");
    assert.equal(error.error.message, "Invalid");
    assert.equal(error.meta.requestId, "req-2");
  });

  test("6. SearchJob store initializes and retrieves jobs cleanly", async () => {
    const {
      createInitialSearchJob,
      saveSearchJob,
      getSearchJob,
      listRecentSearchJobs,
    } = await import("../lib/jobs/store.ts");

    const job = createInitialSearchJob({
      industry: "Dermatology",
      city: "Vadodara",
      country: "India",
      serviceTrack: "creative+technical",
      limit: 10,
    });

    assert.ok(job.id, "Job must have an ID");
    assert.equal(job.status, "pending");
    assert.equal(job.progress, 0);
    assert.equal(job.currentStage, "queued");
    assert.equal(job.query.city, "Vadodara");
    assert.equal(job.stageStats.candidatesFound, 0);

    await saveSearchJob(job);
    const retrieved = await getSearchJob(job.id);
    assert.ok(retrieved, "Job must be retrievable");
    assert.equal(retrieved.id, job.id);
    assert.equal(retrieved.query.industry, "Dermatology");

    const recent = listRecentSearchJobs();
    assert.ok(recent.length > 0, "Recent jobs list must contain jobs");
  });

  test("7. Layout props typing compiles without global Next type dependency", () => {
    const layoutPath = path.resolve("app/layout.tsx");
    const layoutCode = fs.readFileSync(layoutPath, "utf8");
    assert.ok(
      !layoutCode.includes('LayoutProps<"/"'),
      "Layout must not depend on fragile generated LayoutProps",
    );
    assert.match(
      layoutCode,
      /children:\s*React\.ReactNode/,
      "Layout must use standard React children typing",
    );
  });

  test("8. Internal API /api/health responds with 200 OK and diagnostics", async () => {
    const { GET } = await import("../app/api/health/route.ts");
    const response = await GET();
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.service, "SoleTrust AutoRadar Intelligence Core");
    assert.ok(body.configuration);
    assert.ok(body.checks);
  });

  test("9. Internal API /api/search-jobs validates input and creates jobs", async () => {
    const { POST } = await import("../app/api/search-jobs/route.ts");

    // Invalid request (missing industry)
    const badReq = new Request("http://localhost:3000/api/search-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "Vadodara",
        country: "India",
      }),
    });
    const badRes = await POST(badReq);
    assert.equal(badRes.status, 400);
    const badBody = await badRes.json();
    assert.equal(badBody.success, false);
    assert.equal(badBody.error.code, "VALIDATION_ERROR");

    // Valid request
    const validReq = new Request("http://localhost:3000/api/search-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry: "Dermatology clinics",
        city: "Vadodara",
        country: "India",
        serviceTrack: "creative+technical",
        limit: 10,
      }),
    });
    const validRes = await POST(validReq);
    assert.equal(validRes.status, 201);
    const validBody = await validRes.json();
    assert.equal(validBody.success, true);
    assert.ok(validBody.data.id);
    assert.equal(validBody.data.status, "pending");

    // Test GET /api/search-jobs/:id
    const { GET: getJob } = await import("../app/api/search-jobs/[id]/route.ts");
    const detailRes = await getJob(new Request("http://localhost:3000"), {
      params: Promise.resolve({ id: validBody.data.id }),
    });
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.equal(detailBody.success, true);
    assert.equal(detailBody.data.id, validBody.data.id);
    assert.equal(detailBody.data.query.city, "Vadodara");
  });
});
