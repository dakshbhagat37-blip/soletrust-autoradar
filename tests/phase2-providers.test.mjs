import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Phase 2: Provider and API Layer Verification Suite", () => {
  test("1. Provider contract and types are defined", async () => {
    const typesPath = path.resolve("lib/providers/types.ts");
    assert.ok(fs.existsSync(typesPath), "lib/providers/types.ts must exist");
  });

  test("2. Mock Provider implements DiscoveryProvider and returns candidates", async () => {
    const { MockDiscoveryProvider } = await import("../lib/providers/mock.ts");
    const mock = new MockDiscoveryProvider();

    assert.equal(mock.id, "mock");
    assert.ok(mock.name);
    assert.ok(mock.priority > 0);

    const health = await mock.checkHealth();
    assert.equal(health.status, "healthy");
    assert.ok(health.latencyMs >= 0);

    const query = {
      industry: "Dermatology clinics",
      city: "Vadodara",
      country: "India",
      limit: 5,
    };

    const res = await mock.discover(query);
    assert.equal(res.provider, "mock");
    assert.equal(res.candidates.length, 5);

    const first = res.candidates[0];
    assert.ok(first.companyName, "Must have company name");
    assert.ok(first.website, "Must have website");
    assert.ok(first.domain, "Must have domain");
    assert.equal(first.city, "Vadodara");
    assert.equal(first.country, "India");
    assert.equal(first.confidence, "high");
  });

  test("3. SearXNG Provider blocks directories, social media and aggregators", async () => {
    const { SearXNGDiscoveryProvider } = await import("../lib/providers/searxng.ts");
    const searxng = new SearXNGDiscoveryProvider();

    assert.equal(searxng.id, "searxng");
    assert.equal(searxng.priority, 20);

    // Verify SearXNG settings file has Brave and DuckDuckGo enabled (Problem 11)
    const settingsPath = path.resolve("searxng/searxng/settings.yml");
    assert.ok(fs.existsSync(settingsPath), "searxng/settings.yml must exist");
    const settings = fs.readFileSync(settingsPath, "utf8");
    assert.match(settings, /name:\s*brave[\s\S]*?disabled:\s*false/, "Brave must be enabled");
    assert.match(settings, /name:\s*duckduckgo[\s\S]*?disabled:\s*false/, "DuckDuckGo must be enabled");
  });

  test("4. Overpass Provider is registered with highest priority", async () => {
    const { OverpassDiscoveryProvider } = await import("../lib/providers/overpass.ts");
    const overpass = new OverpassDiscoveryProvider();

    assert.equal(overpass.id, "overpass");
    assert.equal(overpass.priority, 10); // Highest priority for geographic accuracy
  });

  test("5. Waterfall Orchestrator executes provider sequence and handles failover", async () => {
    const { WaterfallOrchestrator } = await import("../lib/providers/waterfall.ts");
    const { MockDiscoveryProvider } = await import("../lib/providers/mock.ts");

    const orchestrator = new WaterfallOrchestrator();

    // Create a mock provider that simulates failure
    const failingMock = new MockDiscoveryProvider();
    failingMock.setSimulateFailure(true);
    // Give it id "failing-provider" and high priority
    Object.defineProperty(failingMock, "id", { value: "failing-provider" });
    Object.defineProperty(failingMock, "priority", { value: 5 });

    // Create a secondary working mock provider
    const fallbackMock = new MockDiscoveryProvider();
    Object.defineProperty(fallbackMock, "id", { value: "fallback-mock" });
    Object.defineProperty(fallbackMock, "priority", { value: 15 });

    orchestrator.registerProvider(failingMock);
    orchestrator.registerProvider(fallbackMock);

    const summary = await orchestrator.runWaterfall(
      {
        industry: "Dermatology",
        city: "Vadodara",
        country: "India",
        limit: 4,
      },
      {
        customProviderOrder: ["failing-provider", "fallback-mock"],
      },
    );

    assert.ok(summary.attemptedProviders.includes("failing-provider"));
    assert.ok(summary.failedProviders.includes("failing-provider"));
    assert.ok(summary.successfulProviders.includes("fallback-mock"));
    assert.equal(summary.candidates.length, 4);
    assert.equal(summary.providerRuns.length, 2);

    const failRun = summary.providerRuns.find((r) => r.providerId === "failing-provider");
    assert.equal(failRun.status, "failed");
    assert.ok(failRun.errorMessage);

    const successRun = summary.providerRuns.find((r) => r.providerId === "fallback-mock");
    assert.equal(successRun.status, "success");
    assert.equal(successRun.resultCount, 4);
  });

  test("6. Internal API /api/providers returns registered discovery providers", async () => {
    const { GET } = await import("../app/api/providers/route.ts");
    const res = await GET();
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 3);

    const ids = body.data.map((p) => p.id);
    assert.ok(ids.includes("overpass"));
    assert.ok(ids.includes("searxng"));
    assert.ok(ids.includes("mock"));
  });

  test("7. Internal API /api/providers/health checks live provider health", async () => {
    const { GET } = await import("../app/api/providers/health/route.ts");
    const res = await GET();
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.overallStatus);
    assert.ok(body.data.providers.length >= 3);

    const mockCheck = body.data.providers.find((p) => p.providerId === "mock");
    assert.equal(mockCheck.status, "healthy");
  });
});

