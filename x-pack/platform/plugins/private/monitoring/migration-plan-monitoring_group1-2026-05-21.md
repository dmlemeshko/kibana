# FTR to Scout Migration Plan

| Field | Value |
|-------|-------|
| Source | `x-pack/platform/test/functional/apps/monitoring/config.group1.ts` |
| Target module root | `x-pack/platform/plugins/private/monitoring` |
| Generated | 2026-05-21 |
| Deployment targets | stateful (classic) only — Stack Monitoring is not a serverless feature; FTR config is only listed under `.buildkite/ftr-manifests/ftr_platform_stateful_configs.yml` |
| FTR config chain | `apps/monitoring/config.group1.ts` > `../../config.base.ts` > `@kbn/test-suites-src/functional/config.base` > `@kbn/test-suites-src/common/config` |

---

## 1. Test inventory

Sorted by estimated complexity (simple to complex). User-confirmed decisions: aggressive **API-first** downgrade for all data-correctness assertions; **strict 1:1** `_mb`/legacy spec files (no parameterized `describe.each`); **defer** all currently-skipped tests (don't migrate); **full UI parity** for alerts/setup-mode flows; **split** RBAC layer (3 → API, 1 → Jest component test); the empty-cluster denial flow is migrated to a **Jest/RTL component test** of `NoData` + `WeTried` rather than a separate Scout config set.

| # | FTR file (relative to repo root) | Type | Description | `it` count (active / skipped) | Complexity | Decision | Justification |
|---|---|---|---|---|---|---|---|
| 1 | `apps/monitoring/_get_lifecycle_methods.js` | helper | `setup({archive, from, to, useSuperUser, useCreate})` + `tearDown()`: sets roles, sets window size, loads archive, replaces uiSettings, navigates to monitoring app, pauses auto-refresh, sets absolute time range; teardown deletes `.monitoring-*-8-*` data streams and unloads archive | — | — | rewrite as Scout fixture | Becomes `monitoringDataLoader` helper in `test/scout/api/fixtures/helpers.ts` + `test/scout/ui/fixtures/helpers.ts`. No unload (Scout constraint). The `useCreate: true` flag for `_mb` data-stream archives must be preserved per archive in a manifest. |
| 2 | `apps/monitoring/index.group1.js` | index | Top-level `describe('Monitoring app - group 1')` that loads 14 sub-suites | — | — | drop | Each `loadTestFile` becomes its own Scout spec; no top-level wrapper needed in Scout. |
| 3 | `apps/monitoring/feature_controls/index.ts` | index | Wraps `monitoring_security` + `monitoring_spaces`; tags `skipFirefox` | — | — | drop | Each becomes a standalone Scout spec; Scout runs Chromium, `skipFirefox` is moot. |
| 4 | `apps/monitoring/elasticsearch/shards.js` | test | Shard allocation per node / per index legends | 0 / 8 (entire `describe.skip`) | — | **defer** | Whole suite is `describe.skip` due to FLAKY https://github.com/elastic/kibana/issues/47184. Leave FTR file in place; do not migrate. Re-evaluate after flakiness fix. |
| 5 | `apps/monitoring/feature_controls/monitoring_security.ts` (monitoring_user-only `it`) | test | Login as `monitoring_user` → expectForbidden | 1 / 0 | simple | **API test** | Pure RBAC assertion: replace UI login with `apiClient.get('/api/monitoring/v1/check_access')` as that user (or POST to `/api/security/_login`), assert 403/forbidden. |
| 6 | `apps/monitoring/feature_controls/monitoring_security.ts` (global_all `it`) | test | Login as `global_all` (no monitoring privilege) → navlink absent | 1 / 0 | simple | **API test** | Hit `/api/core/capabilities` with that user's cookie, assert `navLinks.monitoring === false`. No browser needed. |
| 7 | `apps/monitoring/feature_controls/monitoring_security.ts` (monitoring_user + global_all `it`) | test | Login as combined role → navlink present | 1 / 0 | simple | **API test** | Same as above; assert `navLinks.monitoring === true`. |
| 8 | `apps/monitoring/feature_controls/monitoring_security.ts` (monitoring_user + kibana_admin `it`) | test | Navigate to monitoring app → no-data page → click setup with self-monitoring → assert denial page (`weTriedContainer`) | 1 / 0 (tag: `skipCloud`) | medium | **Jest component test (RTL)** | The flow is pure component state: clicking `useInternalCollection` toggles `setUseInternalCollection(true)`, the `<NoData>` re-render falls through `NoDataMessage` to `<WeTried />` because `!reason && !isLoading && !isCollectionEnabledUpdated`. Existing `no_data.test.js` already exercises `<NoData>` with mocked `useKibana` + `Legacy.shims`; add a new RTL test that renders `<NoData isLoading={false} enabler={{}} isCollectionEnabledUpdated={false} />`, clicks `useInternalCollection`, and asserts `weTriedContainer` is visible. Eliminates the fresh-cluster requirement entirely — no new Scout config set needed. |
| 9 | `apps/monitoring/feature_controls/monitoring_spaces.ts` (no features disabled, navlink `it`) | test | Custom space with all features → Monitoring navlink present in `/s/custom_space` | 1 / 0 | simple | **API test** | `/api/core/capabilities` for `custom_space` → `navLinks.monitoring === true`. No browser needed. |
| 10 | `apps/monitoring/feature_controls/monitoring_spaces.ts` (no features disabled, navigate `it`) | test | Navigate to monitoring in `/s/custom_space` → `monitoringAppContainer` rendered | 1 / 0 | simple | **UI test** | True browser navigation assertion; needs monitoring data archives loaded so the app renders past the no-data page. Combine with #11 (one spec for "spaces with monitoring enabled"). |
| 11 | `apps/monitoring/feature_controls/monitoring_spaces.ts` (monitoring disabled, navlink `it`) | test | Space with `disabledFeatures: ['monitoring']` → navlink absent | 1 / 0 | simple | **API test** | `/api/core/capabilities` for the disabled space; `navLinks.monitoring === false`. |
| 12 | `apps/monitoring/feature_controls/monitoring_spaces.ts` (monitoring disabled, 404 `it`) | test | Navigate to monitoring in space with monitoring disabled → 404 | 1 / 0 | simple | **UI test** | True UI assertion: `error.expectNotFound()`. Combine with #10 into one parallel spec parameterized over space configurations. |
| 13 | `apps/monitoring/cluster/list.js` (trial cluster table+toolbar) | test | 3 rows; filter narrows; non-existent filter empty | 3 / 0 | medium | **API test** | All three are row-count assertions; hit `POST /api/monitoring/v1/clusters` with archive `multicluster` loaded, assert response shape (3 clusters). Filter logic is client-side text filter → unit test (RTL) if isolatable, otherwise drop (low value). |
| 14 | `apps/monitoring/cluster/list.js` (trial row actions) | test | Click basic cluster row → license-warning toast appears | 1 / 0 | medium | **UI test** | Real UI interaction: click navigates + triggers toast. Keep as UI. |
| 15 | `apps/monitoring/cluster/list.js` (standalone cluster) | test | Standalone cluster + `lfhHkgqfTy2Vy3SvlPSvXg` both present | 1 / 0 | simple | **API test** | `POST /api/monitoring/v1/clusters` returns both cluster_uuids. |
| 16 | `apps/monitoring/cluster/list.js` (basic license row content `skipCloud`) | test | Non-primary basic: all dashes; primary basic: real metrics + license string | 2 / 0 (tag: `skipCloud`) | medium | **API test** | Pure data extraction from `/api/monitoring/v1/clusters` response (nodes, indices, dataSize, license tier). Preserve `skipCloud` intent via tag (the assertion is sensitive to cloud-vs-local). |
| 17 | `apps/monitoring/cluster/list.js` (basic license row actions `skipCloud`) | test | Click non-primary basic → license-warning toast; click primary → navigates to overview + breadcrumb back | 2 / 0 (tag: `skipCloud`) | medium | **UI test** | True UI flow (click → toast / click → navigate + breadcrumb). Combine into one UI spec with `test.step` for each click. |
| 18 | `apps/monitoring/cluster/list.js` (Alerts) | test | Accept modal → migration done → `alertsCreatedToast` appears | 1 / 0 | medium | **UI test** | True UI flow (modal interaction + toast). Keep as UI. Teardown must use Kibana alerting REST API (`monitoringAlerts.deleteAlerts` in FTR) — port to Scout `apiServices` helper. |
| 19 | `apps/monitoring/cluster/list_mb.js` (standalone cluster mb) | test | Same as #15 with `_mb` data-stream archive | 1 / 0 | simple | **API test** | Same endpoint, different archive. Per user decision, keep as separate spec. |
| 20 | `apps/monitoring/cluster/overview.js` (Green/Gold) | test | No ML link (license=Gold); ES panel data; Kibana panel data; Logstash panel data | 4 / 0 | medium | **API test** | All four are exact-value cluster summary assertions. Hit `POST /api/monitoring/v1/clusters/{clusterUuid}` (or `/elasticsearch`, `/kibana`, `/logstash`) and assert numeric fields directly. License-gated panel visibility is also derivable from cluster response. |
| 21 | `apps/monitoring/cluster/overview.js` (Yellow/Platinum) | test | ML jobs visible (Platinum); ES + Kibana panels (no Logstash) | 3 / 0 | medium | **API test** | Same as #20 with different archive. |
| 22 | `apps/monitoring/cluster/overview.js` (Yellow/Basic) | test | No alerts panel (Basic); no ML (Basic); only ES panel | 4 / 0 | medium | **API test** + **UI test** | `getPresentPanels()` (which DOM panels render) is genuinely UI-state — keep that one `it` as a small UI assertion. The other 3 are data → API. |
| 23 | `apps/monitoring/cluster/overview.js` (Alerts → setup mode) | test | Accept alerts modal → toast appears; click setup-mode → `alertsBadge` visible after 1s auto-refresh; exit setup mode | 2 / 0 (nested describe `when create alerts options is selected`) | complex | **UI test** | Per user decision: full UI parity. Combine the two `it`s into one `test()` with `test.step` for modal accept → toast → enter setup mode → assert badge → exit. Auto-refresh is preserved by waiting for the badge locator with a longer timeout (no fixed `setTimeout`). |
| 24 | `apps/monitoring/elasticsearch/overview.js` | test | Cluster summary status; "view logs" link | 2 / 0 | simple | **API test** | `getContent()` returns the same fields as `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch`. The "view logs" link existence depends on logs being indexed — can be asserted from logs availability in the API response. |
| 25 | `apps/monitoring/elasticsearch/overview_mb.js` | test | Same as #24 with `_mb` archive | 2 / 0 | simple | **API test** | Per user decision: keep separate. |
| 26 | `apps/monitoring/elasticsearch/nodes.js` (offline node summary) | test | Cluster summary status with offline node accounting | 1 / 0 | simple | **API test** | `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch/nodes` summary field. |
| 27 | `apps/monitoring/elasticsearch/nodes.js` (skipCloud sorting block) | test | Default sort + sort-by-cpu + sort-by-load with retry-wrapped assertions | 0 / 3 (`describe.skip('skipCloud')`) | — | **defer** | FLAKY https://github.com/elastic/kibana/issues/217665 — entire block skipped. Do not migrate. |
| 28 | `apps/monitoring/elasticsearch/nodes.js` (sort by name/status/memory/disk/shards) | test | Each clicks header twice + asserts row order with retry | 5 / 0 | medium | **UI test** | Sorting is UI behavior; keep as UI. Combine all 5 sorts into one `test('table sorting')` with `test.step` per column (single browser context, ordered steps). |
| 29 | `apps/monitoring/elasticsearch/nodes.js` (only online nodes summary) | test | Cluster summary | 1 / 0 | simple | **API test** | Same as #26 with different time range. |
| 30 | `apps/monitoring/elasticsearch/nodes.js` (only online nodes filter) | test | Filter narrows table; non-existent shows no-data | 2 / 0 | simple | **UI test** | Filter input is UI; keep one small UI spec. Combine both `it`s into one `test('filtering')` with `test.step`. |
| 31 | `apps/monitoring/elasticsearch/nodes_mb.js` (offline node summary) | test | Same as #26 with `_mb` | 1 / 0 | simple | **API test** | Per user decision: keep separate. |
| 32 | `apps/monitoring/elasticsearch/nodes_mb.js` (skipCloud sorting) | test | Same skip as #27 | 0 / 3 | — | **defer** | Same flakiness. |
| 33 | `apps/monitoring/elasticsearch/nodes_mb.js` (sort by name/status/memory/disk/shards) | test | Same as #28 with `_mb` | 5 / 0 | medium | **UI test** | Per user decision: keep separate from #28. |
| 34 | `apps/monitoring/elasticsearch/nodes_mb.js` (online filter) | test | Same as #30 with `_mb` | 2 / 0 | simple | **UI test** | Keep separate. |
| 35 | `apps/monitoring/elasticsearch/node_detail.js` (Active master/data summary + logs link) | test | Click row → assert summary fields for master / data / logs link | 3 / 0 | medium | **API test** | All field values are returned by `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch/nodes/{nodeUuid}`. No need to click through UI to assert values. |
| 36 | `apps/monitoring/elasticsearch/node_detail.js` (Offline node summary) | test | Offline node returns N/A for all metrics | 1 / 0 | medium | **API test** | Same endpoint with offline `nodeUuid`. |
| 37 | `apps/monitoring/elasticsearch/node_detail.js` (Advanced > Active master/data) | test | Click advanced tab → assert advanced summary | 2 / 0 (nested `describe('Advanced').describe('Active Nodes')`) | medium | **API test** | Same endpoint with `?showSystemIndices` / `?advanced` query parameter — investigate which flag the UI passes. If pure UI tab-state, becomes a Jest component test. |
| 38 | `apps/monitoring/elasticsearch/node_detail_mb.js` | test | All three subgroups mirrored from #35–37 with `_mb` archive | 6 / 0 | medium | **API test** | Per user decision: keep separate. |
| 39 | `apps/monitoring/elasticsearch/indices.js` (summary) | test | Cluster summary status | 1 / 0 | simple | **API test** | `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch/indices` summary field. |
| 40 | `apps/monitoring/elasticsearch/indices.js` (sorted-rows table) | test | 20-row table with full data assertion after sort-by-search-rate-desc | 0 / 1 (`it.skip`, EUI issue #1322) | — | **defer** | Skipped on EUI issue. Do not migrate. |
| 41 | `apps/monitoring/elasticsearch/indices.js` (filter narrows / non-existent) | test | Filter → 9 rows; foobar → no-data | 2 / 0 | simple | **UI test** | Filter input UI; combine into one `test('filtering')` with `test.step`. |
| 42 | `apps/monitoring/elasticsearch/indices_mb.js` | test | Mirrors #39 + #40 + #41 with `_mb` | 3 / 1 | simple | **API test (summary)** + **UI test (filter)** | Per user decision: keep separate. Skip the EUI-blocked one. |
| 43 | `apps/monitoring/elasticsearch/index_detail.js` (active indices) | test | Click row by name → assert index summary fields for 3 indices + logs link | 4 / 0 | medium | **API test** | All fields from `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch/indices/{id}`. No UI flow needed. |
| 44 | `apps/monitoring/elasticsearch/index_detail_mb.js` | test | Mirror of #43 with `_mb` | 4 / 0 | medium | **API test** | Per user decision: keep separate. |

### Proposed file splits

The current FTR files contain multiple top-level `describe`s tied to **different archives**. Each archive scenario becomes its own Scout spec (one suite per file, no nested `describe`):

- `cluster/list.js` (4 top-level describes across 3 archives) splits into:
  - **API**: `api/tests/cluster_list_multicluster.spec.ts` (#13, #15 — uses `multicluster`)
  - **API**: `api/tests/cluster_list_multi_basic.spec.ts` (#16 — uses `multi_basic`)
  - **API**: `api/tests/cluster_list_standalone.spec.ts` (rolls in #19 from `list_mb.js` too — both use a standalone archive; tag one `mb`)
  - **UI**: `ui/tests/cluster_list_actions.spec.ts` (#14, #17, #18 — combines all UI click flows; uses `multicluster` + `multi_basic`)
- `cluster/overview.js` (4 top-level describes across 4 archives) splits into:
  - **API**: `api/tests/cluster_overview_green_gold.spec.ts` (#20)
  - **API**: `api/tests/cluster_overview_yellow_platinum.spec.ts` (#21)
  - **API**: `api/tests/cluster_overview_yellow_basic.spec.ts` (#22 data-only `it`s)
  - **UI**: `ui/tests/cluster_overview_panels_yellow_basic.spec.ts` (#22 `getPresentPanels()` only)
  - **UI**: `ui/tests/cluster_overview_alerts_setup_mode.spec.ts` (#23, eliminates the nested `describe`)
- `elasticsearch/nodes.js` (2 top-level describes) splits into:
  - **API**: `api/tests/elasticsearch_nodes_summary.spec.ts` (#26 + #29)
  - **UI**: `ui/tests/elasticsearch_nodes_sorting.spec.ts` (#28 — combine 5 `it`s into one test + steps)
  - **UI**: `ui/tests/elasticsearch_nodes_filtering.spec.ts` (#30 — combine 2 `it`s into one test + steps)
- `elasticsearch/nodes_mb.js` mirrors the same split with `_mb` suffix files.
- `elasticsearch/node_detail.js` (3 top-level describes, one with a nested describe) splits into:
  - **API**: `api/tests/elasticsearch_node_detail_active.spec.ts` (#35)
  - **API**: `api/tests/elasticsearch_node_detail_offline.spec.ts` (#36)
  - **API**: `api/tests/elasticsearch_node_detail_advanced.spec.ts` (#37 — flattens the nested describe)
- `elasticsearch/node_detail_mb.js` mirrors with `_mb` suffix.
- `elasticsearch/indices.js` and `_mb` split into:
  - **API**: `api/tests/elasticsearch_indices_summary[_mb].spec.ts` (#39 / #42 summary)
  - **UI**: `ui/tests/elasticsearch_indices_filtering[_mb].spec.ts` (#41 / #42 filter)
- `elasticsearch/index_detail.js` and `_mb` → single API spec each.
- `feature_controls/monitoring_security.ts` (1 outer + 4 nested describes) splits into:
  - **API**: `api/tests/security_capabilities.spec.ts` (#5, #6, #7 — three role × capability checks parameterized)
  - **Jest/RTL**: `public/components/no_data/no_data_denial.test.js` (#8 — new RTL test next to existing `no_data.test.js`)
- `feature_controls/monitoring_spaces.ts` (1 outer + 2 nested describes) splits into:
  - **API**: `api/tests/spaces_capabilities.spec.ts` (#9 + #11 — capabilities per space, parameterized)
  - **UI**: `ui/tests/spaces_navigation.spec.ts` (#10 + #12 — navigates + asserts 404)

### Tests to drop

- `apps/monitoring/index.group1.js`: the wrapping `describe('Monitoring app - group 1')` is a FTR organisational artifact; Scout has no equivalent.
- `apps/monitoring/feature_controls/index.ts`: same — no Scout equivalent. The `skipFirefox` tag is also moot (Scout runs Chromium).

### Tests to defer

- `elasticsearch/shards.js` (entire suite): FLAKY https://github.com/elastic/kibana/issues/47184. Per user decision: leave FTR file as `describe.skip`, do not migrate.
- `elasticsearch/nodes.js` and `nodes_mb.js` `describe.skip('skipCloud')` sorting blocks: FLAKY https://github.com/elastic/kibana/issues/217665. Do not migrate the skipped `it`s; the remaining `it`s under the same parent describe still need migration (#28 / #33).
- `elasticsearch/indices.js` and `indices_mb.js` `it.skip('should show indices table with correct rows after sorting by Search Rate Desc')`: blocked on EUI issue https://github.com/elastic/eui/issues/1322. Do not migrate the skipped `it`; the other `it`s under the same describe still get migrated (#41 / #42).

---

## 2. Test type routing

### UI tests

| FTR file | Proposed Scout spec path | Key flows covered |
|---|---|---|
| `monitoring_spaces.ts` (2 navigation `it`s) | `test/scout/ui/tests/spaces_navigation.spec.ts` | Per-space navigation (`monitoringAppContainer` rendered in enabled space; 404 in disabled space) |
| `cluster/list.js` (UI flows from #14, #17, #18) | `test/scout/ui/tests/cluster_list_actions.spec.ts` | Click row → license warning toast (trial + basic non-primary), click primary basic → cluster overview navigation + breadcrumb, accept alerts modal → `alertsCreatedToast` |
| `cluster/overview.js` (#22 panel presence) | `test/scout/ui/tests/cluster_overview_panels_yellow_basic.spec.ts` | Only Elasticsearch panel renders for Basic license + single-stack scenario |
| `cluster/overview.js` (#23 alerts + setup mode) | `test/scout/ui/tests/cluster_overview_alerts_setup_mode.spec.ts` | Accept modal → toast, enter setup mode → `alertsBadge` visible, exit setup mode |
| `elasticsearch/nodes.js` (#28 sorting) | `test/scout/ui/tests/elasticsearch_nodes_sorting.spec.ts` | One `test('table sorting')` with `test.step` per column (name/status/memory/disk/shards) |
| `elasticsearch/nodes_mb.js` (#33 sorting) | `test/scout/ui/tests/elasticsearch_nodes_sorting_mb.spec.ts` | Mirror of above with `_mb` data-stream archive |
| `elasticsearch/nodes.js` (#30 filter) | `test/scout/ui/tests/elasticsearch_nodes_filtering.spec.ts` | One `test('filtering')` with step for narrow + no-data |
| `elasticsearch/nodes_mb.js` (#34 filter) | `test/scout/ui/tests/elasticsearch_nodes_filtering_mb.spec.ts` | Mirror with `_mb` archive |
| `elasticsearch/indices.js` (#41 filter) | `test/scout/ui/tests/elasticsearch_indices_filtering.spec.ts` | Filter narrows; foobar → no-data |
| `elasticsearch/indices_mb.js` (#42 filter) | `test/scout/ui/tests/elasticsearch_indices_filtering_mb.spec.ts` | Mirror with `_mb` archive |

### API tests

| FTR file | Proposed Scout spec path | Why API not UI |
|---|---|---|
| `monitoring_security.ts` (#5–#7) | `test/scout/api/tests/security_capabilities.spec.ts` | Three role × capability/check_access assertions — pure RBAC, no UI affordance. Parameterize over `[monitoring_user, global_all, monitoring_user+global_all]`. |
| `monitoring_spaces.ts` (#9, #11) | `test/scout/api/tests/spaces_capabilities.spec.ts` | Per-space capabilities check via `/api/core/capabilities` with space basePath; parameterize over `[no-features-disabled, monitoring-disabled]`. |
| `cluster/list.js` (#13, #15, #16) | `test/scout/api/tests/cluster_list_multicluster.spec.ts`, `cluster_list_standalone.spec.ts`, `cluster_list_multi_basic.spec.ts` | All assertions are on `POST /api/monitoring/v1/clusters` response: row counts, cluster_uuid presence, per-cluster license/nodes/indices/dataSize fields. No UI interaction. |
| `cluster/list_mb.js` (#19) | `test/scout/api/tests/cluster_list_standalone_mb.spec.ts` | Same endpoint, `_mb` data-stream archive. |
| `cluster/overview.js` (#20–#22 data `it`s) | `test/scout/api/tests/cluster_overview_green_gold.spec.ts`, `cluster_overview_yellow_platinum.spec.ts`, `cluster_overview_yellow_basic.spec.ts` | Exact numeric assertions on ES/Kibana/Logstash stats; license-gated panel visibility derivable from cluster API response. |
| `elasticsearch/overview.js` and `_mb` (#24, #25) | `test/scout/api/tests/elasticsearch_overview.spec.ts`, `elasticsearch_overview_mb.spec.ts` | Cluster summary status fields are exactly the cluster API response. |
| `elasticsearch/nodes.js` and `_mb` (#26, #29, #31) | `test/scout/api/tests/elasticsearch_nodes_summary.spec.ts`, `elasticsearch_nodes_summary_mb.spec.ts` | Summary status (nodesCount/memory/totalShards/etc.) is API data. |
| `elasticsearch/node_detail.js` and `_mb` (#35–#38) | `test/scout/api/tests/elasticsearch_node_detail_active.spec.ts`, `..._offline.spec.ts`, `..._advanced.spec.ts` + `_mb` variants | Per-node summary returned by `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch/nodes/{nodeUuid}`. |
| `elasticsearch/indices.js` and `_mb` (#39, #42 summary) | `test/scout/api/tests/elasticsearch_indices_summary.spec.ts`, `..._mb.spec.ts` | Indices listing summary is API data. |
| `elasticsearch/index_detail.js` and `_mb` (#43, #44) | `test/scout/api/tests/elasticsearch_index_detail.spec.ts`, `..._mb.spec.ts` | Per-index summary is API data. |

### Unit tests (RTL/Jest)

| FTR file | Component under test | Proposed test path | What to test |
|---|---|---|---|
| `monitoring_security.ts` (#8 `monitoring_user + kibana_admin` denial flow) | `NoData` (toggles `useInternalCollection`) + `WeTried` | `public/components/no_data/no_data_denial.test.js` (new file, alongside existing `no_data.test.js`) | Render `<NoData isLoading={false} isCollectionEnabledUpdated={false} enabler={{}} />` with the same `useKibana` + `Legacy.shims` mocks that `no_data.test.js` already uses. Locate the `useInternalCollection` button, click it, assert `weTriedContainer` becomes visible. This is exactly the assertion the FTR test was making: when the user without sufficient privileges picks self-monitoring, the `WeTried` denial container renders. No server, no archives, no fresh-cluster needed. Use `renderWithI18nProvider` + `@testing-library/react`'s `screen.getByTestId('useInternalCollection')` / `fireEvent.click` / `screen.findByTestId('weTriedContainer')`. |
| `cluster/list.js` (filter narrowing — if isolatable from server) — *optional* | `EuiInMemoryTable` filter inside `ClusterListing` | `public/components/cluster/listing/listing.test.tsx` | Pure client-side text-filter behavior over an in-memory cluster list fixture (`'clusterone'` narrows to 1; `'foobar'` empty). Only if `ClusterListing` accepts clusters as a prop today; otherwise skip and rely on API test alone. **`NEEDS VERIFICATION`** that `ClusterListing` is testable without a server. |
| `cluster/overview.js` (#37 Advanced tab) — *optional* | `NodeDetailStatus` advanced view | `public/components/elasticsearch/node_detail/advanced/advanced.test.tsx` | If the "Advanced" tab is just an alternate render of the same data, prefer one Jest component test over a Scout API test. **`NEEDS VERIFICATION`** that the advanced response is materially different from the basic response. |

---

## 3. Parallelism plan

### Parallel-safe (can be space-isolated, run via `ui/parallel_tests/` + `spaceTest`)

| Proposed spec | Why parallel-safe |
|---|---|
| `api/tests/security_capabilities.spec.ts` | Only reads `/api/core/capabilities` per-user; no global mutation. |
| `api/tests/spaces_capabilities.spec.ts` | Creates/deletes its own per-test spaces; space ID can suffix `scoutSpace.id` for uniqueness. |
| `api/tests/cluster_list_*.spec.ts`, `api/tests/cluster_overview_*.spec.ts`, `api/tests/elasticsearch_*.spec.ts` | All read-only `POST` against `/api/monitoring/v1/...`. Multiple cluster archives coexist because each has a unique `cluster_uuid` — Scout API tests scope by UUID. |

### Must be sequential (run via `ui/tests/` + `test`)

| Proposed spec | Why sequential |
|---|---|
| `ui/tests/cluster_overview_alerts_setup_mode.spec.ts` | Creates Kibana alerting rules globally; multiple parallel runs would race on the same rules. Cleanup must delete created rules in `afterAll`. |
| `ui/tests/cluster_list_actions.spec.ts` | Mutation flow (accepts alerts modal). Same reason as above. |
| `ui/tests/elasticsearch_nodes_sorting*.spec.ts`, `..._filtering*.spec.ts`, `elasticsearch_indices_filtering*.spec.ts` | Read-only UI but rely on a stable, deterministic dataset and click sequences within a single browser context. Combined-`test.step` flows are inherently sequential within a `test()`; parallel execution across these specs is fine, but they don't need `spaceTest` isolation. |

---

## 4. Test data and setup

### Archives inventory

All archives live under `x-pack/platform/test/fixtures/es_archives/monitoring/`. Each `_mb` variant must load with `useCreate: true` (data-stream API). All non-`_mb` archives index legacy `.monitoring-es-6-*` indices and load with the standard archiver path.

| Archive path | Contents | Used by (FTR files) | Verdict |
|---|---|---|---|
| `monitoring/multicluster` | 3 clusters: trial-license, `6d-9tDFTRe-qT5GoBytdlQ` (basic, unsupported) + 2 others | `cluster/list.js` (trial section + Alerts section) | **Keep** — load once in API + UI globalSetup. |
| `monitoring/standalone_cluster` | Single `__standalone_cluster__` + `lfhHkgqfTy2Vy3SvlPSvXg` | `cluster/list.js` (standalone) | **Keep** |
| `monitoring/standalone_cluster_mb` | Same as above, data-stream form (`useCreate: true`) | `cluster/list_mb.js` | **Keep** (per user) |
| `monitoring/multi_basic` | 4 clusters with basic license: `kH7C358oRzK6bmNzTeLEug` (non-primary), `NDKg6VXAT6-TaGzEK2Zy7g` (primary "production") | `cluster/list.js` (basic license) | **Keep** |
| `monitoring/singlecluster_green_gold` | Green ES cluster with Gold license + Kibana + Logstash | `cluster/overview.js` (Green/Gold) | **Keep** |
| `monitoring/singlecluster_yellow_platinum` | Yellow ES cluster with Platinum license + ML | `cluster/overview.js` (Yellow/Platinum) | **Keep** |
| `monitoring/singlecluster_yellow_basic` | Yellow ES, Basic license, no other stack components | `cluster/overview.js` (Yellow/Basic) | **Keep** |
| `monitoring/singlecluster_three_nodes_shard_relocation` | 3 ES nodes (online + 1 offline at later times), 20 indices, shard relocation | `elasticsearch/{overview,nodes,node_detail,index_detail}.js`, `elasticsearch/shards.js` (deferred) | **Keep** |
| `monitoring/singlecluster_three_nodes_shard_relocation_mb` | Same in data-stream form | `_mb` variants of the above | **Keep** (per user) |
| `monitoring/singlecluster_red_platinum` | Red ES, Platinum license, many indices | `elasticsearch/indices.js`, `elasticsearch/node_detail.js` (Offline) | **Keep** |
| `monitoring/singlecluster_red_platinum_mb` | Same in data-stream form | `elasticsearch/indices_mb.js`, `elasticsearch/node_detail_mb.js` (Offline) | **Keep** |

**Strategy (per user decision):** Load **all 11 archives once** via `api/tests/global.setup.ts` (or equivalent `beforeAll` in a shared API helper) at the start of the API run; load the **subset needed by UI flows** once via `ui/parallel_tests/global.setup.ts` for the UI run. No archive unloading. Tests scope by `cluster_uuid` so coexistence is safe. Underused archives: **none** — every archive listed above is consumed by at least 2 (active or `_mb`) FTR tests.

### UI settings mutations

| FTR call | Semantics | Files |
|---|---|---|
| `kibanaServer.uiSettings.replace({})` | Wipes all settings | `_get_lifecycle_methods.js:46` (runs before every `setup()` call, i.e. once per `describe` archive load) |

In Scout this becomes a single `scoutSpace.uiSettings.set({})` (or omit entirely — the FTR call replaces with `{}` which is a no-op reset). The base config already sets `accessibility:disableAnimations: true` and `dateFormat:tz: UTC` as defaults. Scout's base configs set these too — confirm no extra UI settings are needed.

### Shared constants to extract

Values that appear in ≥2 FTR files and should live in `test/scout/{ui,api}/fixtures/constants.ts`:

| Value | Occurrences | Current locations |
|---|---|---|
| Archive path constants for all 11 archives above | 14 occurrences across 12 files | Hardcoded as string literals in every `setup(...)` call |
| `from: 'Oct 5, 2017 @ 20:31:48.354'` / `to: 'Oct 5, 2017 @ 20:35:30.176'` (shard-relocation time range) | 6 files | `elasticsearch/{overview,nodes,node_detail,index_detail}{,_mb}.js`, `elasticsearch/shards.js` |
| `from: 'Oct 6, 2017 @ 19:53:06.748'` / `to: 'Oct 6, 2017 @ 20:15:30.212'` (red_platinum time range) | 3 files | `elasticsearch/{indices,node_detail{,_mb}}.js` |
| Cluster UUIDs: `6d-9tDFTRe-qT5GoBytdlQ`, `kH7C358oRzK6bmNzTeLEug`, `NDKg6VXAT6-TaGzEK2Zy7g`, `lfhHkgqfTy2Vy3SvlPSvXg`, `__standalone_cluster__` | 5+ files | Inline string literals |
| Node UUIDs: `jUT5KdxfRbORSCWkb5zjmA`, `bwQWH-7IQY-mFPpfoaoFXQ`, `xcP6ue7eRCieNNitFTT0EA`, `1jxg5T33TWub-jJL4qP0Wg` | 4 files | Inline string literals |
| Index names: `avocado-tweets-2017.10.02`, `relocation_test`, `phone-home` | 3 files | `elasticsearch/{index_detail,shards}{,_mb}.js` |
| Window size `1600x1000` | 1 helper file, used by every spec | `_get_lifecycle_methods.js:43` |

Extract to `test/scout/{ui,api}/fixtures/constants.ts` (each constant in the closest-scoped file; archives + time ranges + UUIDs are shared across both UI and API, so consider a `test/scout/common/constants.ts` if both layers import them).

### Fresh server required

None. The one FTR test that needed a clean cluster (`monitoring_security.ts` #8 — `monitoring_kibana_admin_user` denial flow) is migrated to a **Jest/RTL component test** of `<NoData>` (see §2 Unit tests table). The mocked `useKibana` + `Legacy.shims` providers already exist in `no_data.test.js`; the new test renders `<NoData>` and exercises the `useInternalCollection` button click → `WeTried` render path that the FTR test was asserting. No new Scout config set is needed.

---

## 5. Auth and roles

### Role inventory

| Role name | Source | Privileges (summary) | Used by (FTR files) | Notes |
|---|---|---|---|---|
| `superuser` (default) | `config.base.ts:776` | Full cluster + all Kibana features | Every spec via `defaultRoles: ['superuser']`; downgraded by `_get_lifecycle_methods.js:31` to `[monitoring_user, kibana_admin, test_monitoring, test_filebeat_reader]` unless `useSuperUser: true` is passed | Over-privileged for data-correctness API tests. |
| `monitoring_user` (built-in) | Elasticsearch built-in | Read `.monitoring-*`, `metrics-*-mb-*`, cluster monitor | All data-loading specs (via lifecycle helper); `monitoring_security.ts` (#5, #7, #8) | Lifecycle helper's default — keep as Scout default role for monitoring API/UI tests. |
| `kibana_admin` (built-in) | Elasticsearch built-in | All Kibana feature privileges in default space | Lifecycle helper default; `monitoring_security.ts` (#8) | Used in combo with `monitoring_user` for normal monitoring app access. |
| `test_monitoring` | `config.base.ts:229` | `cluster: ['monitor']` | Lifecycle helper default | Custom role granting cluster `monitor` privilege. **Recreate** as Scout custom role descriptor; used by every monitoring test (≥3 files). |
| `test_filebeat_reader` | `config.base.ts:248` | Read `filebeat*` indices | Lifecycle helper default | Custom role for filebeat log indices access (powers the "view logs" link assertions in #24, #35, #43). **Recreate.** |
| `test_logstash_reader` | `config.base.ts:234` | Read `logstash*` indices | Not directly used by group1 specs, but defined in base | Skip. |
| `global_all_role` | `monitoring_security.ts:22` (inline) | `indices: [{names: ['logstash-*'], privileges: ['read', 'view_index_metadata']}]` + `kibana: [{base: ['all'], spaces: ['*']}]` | `monitoring_security.ts` (#6, #7) | Inline-defined; recreate as Scout custom role descriptor in `test/scout/api/fixtures/roles.ts` (also used by UI helper if needed). |

### Over-privileged tests

| File | What it actually exercises | Suggested minimum privilege |
|---|---|---|
| `cluster/list.js`, `cluster/overview.js`, `elasticsearch/**/*.js` (all currently default to `[monitoring_user, kibana_admin, test_monitoring, test_filebeat_reader]`) | Read monitoring app + assert summary fields | `monitoring_user` alone is sufficient for the data assertions; `kibana_admin` only needed if the spec navigates into Kibana spaces or alerting. Drop `kibana_admin` from API-test contexts. |
| `cluster/list.js` (Alerts), `cluster/overview.js` (Alerts) | Creates Kibana alerting rules | `monitoring_user` + `kibana_admin` (kept). |
| `monitoring_security.ts` (#8 — `monitoring_kibana_admin_user`) | Asserts denial when self-monitoring is enabled | The point of the test is exactly that this combo lacks privilege — keep as-is. |

### Roles deserving shared helpers (used in ≥3 files)

- `monitoring_user` + `kibana_admin` combo: used by every data-loading FTR file via lifecycle helper. → `scoutRoles.monitoringReadOnly` / `scoutRoles.monitoringAdmin` helpers in `test/scout/api/fixtures/roles.ts`.
- `test_monitoring`: used by every data-loading FTR file.
- `test_filebeat_reader`: used by every data-loading FTR file (powers logs-link visibility).

### Special auth patterns

- None. No `run_as`, no certificate auth, no custom API-key flows.

---

## 6. Reusability audit

### FTR services and page objects in use

| FTR name | What it does | Used by (FTR files) | Scout equivalent exists? | Hidden assertions? | Recommended scope |
|---|---|---|---|---|---|
| `monitoringClusterList` (`services/monitoring/cluster_list.js`) | Cluster table interactions: assertDefaults, getRows, set/clearFilter, close/acceptAlertsModal, getClusterName/Status/NodesCount/IndicesCount/DataSize/LogstashCount/KibanaCount/License, hasCluster, getClusterLink | `cluster/list.js`, `cluster/list_mb.js` | no | yes (`assertDefaults` throws if `clusterTableContainer` missing; `assertNoData` throws if no-data subj missing) | **plugin-local** Scout page object: `test/scout/ui/fixtures/page_objects/cluster_list_page.ts`. **Drop**: `assertDefaults`, `assertNoData`, `closeAlertsModal` (see §6 hidden-assertion audit H1, H2 and "Alerts modal: localStorage simplification"). **Keep as locators/getters**: `clusterTableContainer`, `noDataLocator`, `rowsLocator`, `setFilter`, `clearFilter`, `acceptAlertsModal`, `confirmWatcherMigrationDone` (only for the explicit-alerts UI specs), `getClusterLink`, `clusterRowLocator(uuid)`, `hasCluster(uuid)`. After API downgrade, most `getClusterX(uuid)` getters are unused — port only what UI specs need. |
| `monitoringClusterOverview` (`services/monitoring/cluster_overview.js`) | Cluster overview navigation + 30+ getter methods for ES/Kibana/Logstash/Beats/EntSearch panels | `cluster/list.js`, `cluster/overview.js`, `elasticsearch/{overview,nodes,node_detail,indices,index_detail}.js` (and `_mb`) | no | yes (`isOnClusterOverview` retries + expects displayed + non-empty text) | **plugin-local** Scout page object: `test/scout/ui/fixtures/page_objects/cluster_overview_page.ts`. **Drop**: `isOnClusterOverview` (see H3), `closeAlertsModal` (localStorage init script — see §6 simplification). **Keep**: `acceptAlertsModal` + `confirmWatcherMigrationDone` (only the explicit-alerts specs use them), `clickEsNodes`/`clickEsIndices`/`clickEsOverview` navigation methods (which `await` their destination locator internally — no `expect`), `getPresentPanels()` (parses panel DOM into a string array — pure state). All ~25 `getEsX/getKbnX/getLsX` value-getter methods become unused after API downgrade and are NOT ported. |
| `monitoringElasticsearchOverview` (`services/monitoring/elasticsearch_overview.js`) | `isOnOverview()` page-ready check | `elasticsearch/overview.js`, `elasticsearch/overview_mb.js` | no | no | After API downgrade, no UI spec uses this — **drop**. |
| `monitoringElasticsearchNodes` (`services/monitoring/elasticsearch_nodes.js`) | `isOnListing`, `clickRowByResolver`, `clickName/Status/Memory/Disk/Shards/Cpu/LoadCol`, `getRows`, `set/clearFilter`, `assertNoData`, `getNodesAll`, `getNodeNames`, `waitForTableToFinishLoading` | `elasticsearch/nodes.js`, `elasticsearch/nodes_mb.js`, `elasticsearch/node_detail.js`, `elasticsearch/node_detail_mb.js` | no | yes (retry-wrapped `isOnListing`, see H5; `clickRowByResolver` retries until destination locator exists, see H7; `assertNoData` throws, see H2; `waitForTableToFinishLoading` waits for EUI loading-class to disappear via retry, see H8) | **plugin-local** Scout page object: `test/scout/ui/fixtures/page_objects/elasticsearch_nodes_page.ts`. **Drop**: `isOnListing` (specs assert directly), `assertNoData` (specs assert directly), `waitForTableToFinishLoading` (Playwright auto-waits on result locator). **Keep as locators/getters**: `listingPageLocator`, `noDataLocator`, `rowsLocator`, `nodeDetailStatusLocator`. **Keep as actions** (just clicks, no internal `expect`): `clickName/Status/Memory/Disk/Shards/Cpu/LoadCol`, `clickRowByResolver` (split into pure click — spec asserts destination). **Keep as state-returning**: `getNodeNames`. **Drop entirely**: `getNodesAll` (replaced by API tests). |
| `monitoringElasticsearchNodeDetail` (`services/monitoring/elasticsearch_node_detail.js`) | `getSummary`, `clickAdvanced`, `viewLogsLinkIsShowing` | `elasticsearch/node_detail.js`, `node_detail_mb.js` | no | no | After API downgrade, drop. (If unit-test for advanced tab is added, drop entirely.) |
| `monitoringElasticsearchSummaryStatus` (`services/monitoring/elasticsearch_summary_status.js`) | `getContent`, `viewLogsLinkIsShowing` | `elasticsearch/{overview,nodes,indices}.js` and `_mb` | no | no | After API downgrade, drop. |
| `monitoringElasticsearchIndices` (`services/monitoring/elasticsearch_indices.js`) | `isOnListing`, `set/clearFilter`, `clickRowByName`, `getRows`, `getIndicesAll`, `assertNoData`, `clickSearchCol` | `elasticsearch/indices.js`, `indices_mb.js`, `elasticsearch/index_detail.js`, `index_detail_mb.js`, `elasticsearch/shards.js` (deferred) | no | yes (retry-wrapped `isOnListing`, see H6; `assertNoData` throws, see H2) | **plugin-local** Scout page object: `test/scout/ui/fixtures/page_objects/elasticsearch_indices_page.ts`. **Drop**: `isOnListing`, `assertNoData` (both moved to spec). **Keep as locators**: `listingPageLocator`, `noDataLocator`, `rowsLocator`. **Keep as actions**: `setFilter`, `clearFilter` (no internal `waitUntilLoadingHasFinished`). **Drop entirely**: `getIndicesAll`, `clickRowByName`, `clickSearchCol` (replaced by API tests; sort UI test is deferred with the EUI-blocked `it.skip`). |
| `monitoringElasticsearchIndexDetail` (`services/monitoring/elasticsearch_index_detail.js`) | `getSummary`, `viewLogsLinkIsShowing` | `elasticsearch/index_detail.js`, `_mb` | no | no | After API downgrade, drop. |
| `monitoringElasticsearchShards` (`services/monitoring/elasticsearch_shards.js`) | Shard allocation getters | only `elasticsearch/shards.js` (deferred) | no | no | Defer with the suite. |
| `monitoringAlerts` (`services/monitoring/alerts.js`) | `deleteAlerts()` — finds monitoring rules + deletes via REST | `cluster/list.js` (Alerts), `cluster/overview.js` (Alerts) | no | no | **plugin-local** Scout API service: `test/scout/ui/fixtures/api_services/monitoring_alerts.ts` (wraps `apiClient`). Used by UI alerts spec teardown. |
| `monitoringSetupMode` (`services/monitoring/setup_mode.js`) | `clickSetupModeBtn`, `clickExitSetupModeBtn`, `doesAlertsTooltipAppear`, etc. | `cluster/overview.js` (Alerts → setup mode) | no | no | **plugin-local** page object: `test/scout/ui/fixtures/page_objects/setup_mode_page.ts`. Only the alerts/setup-mode UI spec uses this. |
| `monitoringNoData` (`services/monitoring/no_data.js`) | `isOnNoDataPage`, `isOnNoDataPageMonitoringEnablementDenied`, `clickSetupWithSelfMonitoring`, `enableMonitoring`, `isMonitoringEnabled` | `monitoring_security.ts` (#8) | no | no | **Drop** — its only consumer (#8) is migrated to a Jest/RTL component test against `<NoData>` directly, which doesn't need a Scout page object. |
| `PageObjects.monitoring` (`page_objects/monitoring_page.ts`) | `closeAlertsModal`, `clickBreadcrumb`, `assertTableNoData`, `tableGetRowsFromContainer`, `tableSetFilter`, `tableClearFilter`, `getAccessDeniedMessage` | All monitoring specs | no | yes (`assertTableNoData` throws, see H2, H10) | **Drop**: `closeAlertsModal` (localStorage init script), `assertTableNoData` (assert in spec), `tableSetFilter` (drops the `waitUntilLoadingHasFinished` global wait, see H11). **Keep**: `clickBreadcrumb`, `tableGetRowsFromContainer` (returns row locators — pure state), `tableClearFilter`, `getAccessDeniedMessage`. Distribute into the appropriate per-page Scout page object rather than maintaining one shared `MonitoringAppPage` (most methods are page-specific). |
| `PageObjects.timePicker` | `pauseAutoRefresh`, `setAbsoluteRange`, `startAutoRefresh` | lifecycle helper, alerts/setup-mode spec | yes — exists in `@kbn/scout` | no | use existing Scout time-picker fixture |
| `PageObjects.security` (FTR) | `login`, `forceLogout` | `monitoring_security.ts` | yes — Scout `browserAuth` | no | use Scout `browserAuth.loginAs(role)` |
| `PageObjects.common.navigateToApp` | App navigation | every spec | yes — `pageObjects.maps`-style or `kbnUrl.navigateToApp` | no | use Scout `pageObjects.app.navigateToApp('monitoring')` |
| `PageObjects.header.waitUntilLoadingHasFinished` | Global loading wait | implicit via FTR services | yes — replace with explicit Playwright locator waits in page objects | no (but global-spinner anti-pattern) | drop global wait; replace with `page.testSubj.locator(...).waitFor()` |
| `PageObjects.error.expectNotFound` | Assert 404 page | `monitoring_spaces.ts` (#12) | yes — Scout has `pageObjects.error` equivalent or simple `expect(page.testSubj.locator('errorMessage')).toBeVisible()` | no | use Scout pattern |
| `getService('appsMenu').readLinks()` | Read top-nav app links | `monitoring_security.ts` (#6, #7), `monitoring_spaces.ts` (#9, #11) | n/a (downgraded to API) | n/a | not needed — capabilities API is the source of truth |
| `getService('spaces').create()/delete()` | Spaces CRUD | `monitoring_spaces.ts` | yes — Scout `apiServices.spaces` | no | use existing |
| `getService('security').role.create()/delete()`, `user.create()/delete()` | Security CRUD | `monitoring_security.ts` | yes — Scout `apiServices.security` / custom-role descriptors | no | use Scout custom role descriptors (no need to CRUD users; use `samlAuth.asInteractiveUser(roleDescriptor)`) |
| `getService('es').transport.request(DELETE _data_stream/...)` | Clean up `.monitoring-*-8-*` data streams | `_get_lifecycle_methods.js:15-25` (teardown) | yes — `esClient.indices.deleteDataStream` | no | **Drop entirely**: Scout does not unload, and the global teardown for the Scout config should handle data-stream cleanup once at the end if needed (`globalTeardownHook` in `parallel_tests/global.teardown.ts`). |
| `getService('browser').setWindowSize(1600, 1000)`, `clearLocalStorage` | Window/local-storage helpers | lifecycle helper, alerts specs | yes — Scout Playwright `page.setViewportSize` + `page.context().clearCookies()` | no | use Playwright primitives |
| `getService('find').existsByCssSelector` | CSS-selector lookup | `monitoring_spaces.ts:55` (`[data-test-subj="monitoringAppContainer"]`) | n/a | no | replace with `page.testSubj.locator('monitoringAppContainer')` (proper testSubj, no CSS) |
| `getService('testSubjects')` | Standard test-subj interactions | every spec | yes — Scout `page.testSubj.*` | no | use existing |
| `getService('retry').try/waitFor/waitForWithTimeout` | Retry wrappers | many specs and services | n/a — replaced by Playwright auto-waits | no | drop |

### EUI components interacted with directly

| Component | Interaction pattern | Files |
|---|---|---|
| `EuiInMemoryTable` (cluster list, ES nodes, ES indices) | Header sort buttons (`tableHeaderSortButton` inside `tableHeaderCell_<field>_<idx>`); row clicks via `clusterRow_<uuid>`, `nodeLink-<resolver>`, `indexLink-<name>`; filter input via `monitoringTableToolBar` test subj | `cluster/list.js`, `elasticsearch/{nodes,indices,nodes_mb,indices_mb}.js` |
| EUI Tooltip / Popover (node cpu/load/memory/disk popovers) | Mouse-move + click + read popover text + ESC | `elasticsearch/nodes.js`, `nodes_mb.js` (in `getNodesAll` — used only by skipped tests) | After API downgrade and skipped-tests deferral, no longer needed. |
| EUI Modal (alerts modal) | Accept/dismiss buttons via `alerts-modal-button`, `alerts-modal-create-button`, `alerts-modal-remind-later-button` | `cluster/list.js`, `cluster/overview.js` |
| EUI Toast (toast notifications) | Existence check via `alertsCreatedToast`, `monitoringLicenseWarning` | `cluster/list.js`, `cluster/overview.js` |

Use Scout's EUI wrappers / Playwright locators in the new page objects.

### Brittle locator strategies

| File | Line | Current locator | Target component | Action |
|---|---|---|---|---|
| `monitoring_spaces.ts` | 55 | `find.existsByCssSelector('[data-test-subj="monitoringAppContainer"]')` | `MonitoringApp` root container | Replace with `page.testSubj.locator('monitoringAppContainer')` — `data-test-subj` already exists, no source change needed. |
| `services/monitoring/elasticsearch_nodes.js` | 64 | `find.waitForDeletedByCssSelector('.euiBasicTable-loading')` | `EuiBasicTable` loading state | Replace with Playwright auto-wait on a stable test-subj (or rely on Scout's EUI table fixture). |
| `services/monitoring/elasticsearch_nodes.js` | 70, 76, 84, 90, 97, 103, 110 | `clickByCssSelector('[data-test-subj="..."] [data-test-subj="tableHeaderSortButton"]')` | EUI table header sort buttons | Replace with `page.testSubj.locator('tableHeaderCell_<col>_<idx>').locator('[data-test-subj="tableHeaderSortButton"]').click()` — already has test-subjs, just rewrite the locator. |
| `services/monitoring/cluster_overview.js` | 100 | `find.allByCssSelector('[data-test-subj^="clusterItemContainer"]')` | Cluster panel containers (`Elasticsearch`, `Kibana`, `Logstash`, ...) | Replace with `page.locator('[data-test-subj^="clusterItemContainer"]')` (Scout Playwright). Source already has test-subj prefix; locator is brittle in the sense of using `^=` attribute matching, but that's the legitimate way to enumerate dynamic panel children. |

### Page objects with hidden assertions — exhaustive audit

**Rule (per user direction):** Scout page objects MUST NOT contain any `expect(...)`, `throw new Error(...)`, or `retry.try(... expect ...)` calls. They expose state (locators, parsed values, navigation methods that wait for stable DOM) and **all** assertions live in spec bodies. The table below catalogues every hidden assertion in the FTR services consumed by the group1 specs, classifies what to do with it during migration, and where the assertion ends up in the new Scout / Jest code.

| # | FTR helper | Method | What it hides today | File:line | Migration action |
|---|---|---|---|---|---|
| H1 | `monitoringClusterList` | `assertDefaults()` | `retry.try`-wrapped `throw new Error('Expected to find the cluster list')` if `clusterTableContainer` missing | `cluster_list.js:21-27` | **Drop the helper entirely.** Replace with `await expect(page.testSubj.locator('clusterTableContainer')).toBeVisible()` in the spec body. Playwright's auto-wait removes the need for `retry.try`. |
| H2 | `monitoringClusterList` | `assertNoData()` → `PageObjects.monitoring.assertTableNoData('monitoringTableNoData')` | `throw new Error('Expected to find the no data message')` if subj missing | `cluster_list.js:29-31`, `monitoring_page.ts:27-31` | **Drop both helpers.** Replace with `await expect(page.testSubj.locator('monitoringTableNoData')).toBeVisible()`. The new `cluster_list_page` exposes a `noDataLocator` getter instead. |
| H3 | `monitoringClusterOverview` | `isOnClusterOverview()` | Returns `true` but only after `retry.try`-wrapped `expect(displayed).to.be(true)` + `expect(text).not.to.be.empty()` | `cluster_overview.js:67-77` | **Drop the boolean return + retry.** Rename to `cluster_overview_page.waitForReady()` which just awaits the locator. Specs assert: `await expect(page.testSubj.locator('overviewTabsclusterName')).toBeVisible()` and `expect(await page.testSubj.locator('overviewTabsclusterName').textContent()).not.toBe('')` if the empty-text check has value (see §6.5 below — likely redundant). |
| H4 | `monitoringElasticsearchOverview` | `isOnOverview()` | `await retry.try(() => testSubjects.find('elasticsearchOverviewPage'))` (`testSubjects.find` throws if absent, masked by retry) | `elasticsearch_overview.js:14-18` | **Drop the helper entirely.** Only consumer (`elasticsearch/overview.js`, `_mb`) is downgraded to an API test that doesn't navigate to the UI page. |
| H5 | `monitoringElasticsearchNodes` | `isOnListing()` | Same `retry.try(() => testSubjects.find('elasticsearchNodesListingPage'))` pattern | `elasticsearch_nodes.js:50-53` | **Move to spec.** `elasticsearch_nodes_page.gotoListing()` navigates and awaits the locator; spec asserts `await expect(page.testSubj.locator('elasticsearchNodesListingPage')).toBeVisible()`. |
| H6 | `monitoringElasticsearchIndices` | `isOnListing()` | Same pattern (`elasticsearchIndicesListingPage`) | `elasticsearch_indices.js:34-37` | Same as H5 for the indices page object. |
| H7 | `monitoringElasticsearchNodes` | `clickRowByResolver(nodeResolver)` | `retry.waitForWithTimeout('redirection to node detail', 30000, ...)` polls until `elasticsearchNodeDetailStatus` exists; throws on timeout | `elasticsearch_nodes.js:55-60` | **Split into action + locator.** New page object exposes `clickNodeRow(resolver)` (just the click) and `nodeDetailStatusLocator` (a Playwright locator). Spec does `await page.testSubj.click('nodeLink-' + resolver); await expect(elasticsearchNodesPage.nodeDetailStatusLocator).toBeVisible()`. |
| H8 | `monitoringElasticsearchNodes` | `waitForTableToFinishLoading()` | `retry.try(() => find.waitForDeletedByCssSelector('.euiBasicTable-loading', 5000))` — throws if loading class still present after retry | `elasticsearch_nodes.js:62-66` | **Drop entirely.** Rely on Playwright auto-wait on the next assertion (e.g. `await expect(locator).toHaveCount(3)`). The whole pattern is "wait for spinner to disappear before reading" which Playwright handles natively when you locate the actual content. |
| H9 | `monitoringNoData` (FTR) | `isOnNoDataPage()` | `await retry.try(() => testSubjects.find('noDataContainer'))` + `return pageId !== null` | `no_data.js:29-32` | **N/A** — service is dropped entirely (only consumer #8 became a Jest test). |
| H10 | `MonitoringPageObject` (FTR) | `assertTableNoData(subj)` | `throw new Error('Expected to find the no data message')` | `monitoring_page.ts:27-31` | Covered by H2. Drop. |
| H11 | `MonitoringPageObject` (FTR) | `tableSetFilter(subj, text)` | Internally calls `await this.header.waitUntilLoadingHasFinished()` — the **global-loading-indicator** anti-pattern, masking errors as page never becomes ready | `monitoring_page.ts:44-48` | **Drop the global wait.** New page object's `setFilter(text)` types into the input and returns. Spec then asserts on the expected result locator (`await expect(rowLocator).toHaveCount(9)`), which Playwright auto-waits for. |

**Non-assertion checks (return booleans) — these are state queries and ARE fine to keep in page objects**

These are listed for completeness; they do NOT contain `expect`/`throw` and should be kept as plain state-getters on the new Scout page objects:

| FTR helper | Method | Return |
|---|---|---|
| `monitoringClusterOverview` | `doesEsMlJobsExist`, `doesClusterAlertsExist`, `getPresentPanels` | `boolean` / `string[]` |
| `monitoringElasticsearchSummaryStatus` | `viewLogsLinkIsShowing` | `boolean` |
| `monitoringElasticsearchNodeDetail` | `viewLogsLinkIsShowing` | `boolean` |
| `monitoringElasticsearchIndexDetail` | `viewLogsLinkIsShowing` | `boolean` |
| `monitoringSetupMode` | `doesSetupModeBtnAppear`, `doesBottomBarAppear`, `doesMetricbeatMigrationTooltipAppear`, `doesAlertsTooltipAppear` | `boolean` |
| `monitoringNoData` (FTR) | `isMonitoringEnabled`, `isOnNoDataPageMonitoringEnablementDenied` | `boolean` |

All these become `Locator` getters in Scout (`get viewLogsLink(): Locator`) and the spec asserts visibility/state directly: `await expect(setupModePage.alertsTooltip).toBeVisible()`. The `getPresentPanels()` getter that parses `data-test-subj` attribute values stays as a returning method (it's parsing UI state, not asserting); spec uses `expect(await page.getPresentPanels()).toEqual(['Elasticsearch'])`.

### Checks that should be dropped, not relocated

These FTR checks add noise without value once the new Scout page objects are written. Calling them out explicitly so the executor does not mechanically port them:

| Check | Where | Why it should be dropped |
|---|---|---|
| `expect(await overview.isOnOverview()).to.be(true)` in `before` hooks | `elasticsearch/overview.js:32`, `overview_mb.js:33` and ~6 similar `expect(isOnListing).to.be(true)` lines across `nodes.js`, `nodes_mb.js`, `node_detail.js`, `node_detail_mb.js`, `indices.js`, `indices_mb.js`, `index_detail.js`, `index_detail_mb.js`, `cluster/list.js` | After Scout's navigation method waits for the destination locator, asserting again that the destination locator is visible is a tautology. The page object getter pattern `await elasticsearchNodesPage.gotoListing()` already implies "we are on the listing". Specs that need a sanity assertion should assert on a **specific** observable that's relevant to the test (e.g. row count), not the page-container existence. |
| `expect(text).not.to.be.empty()` inside `isOnClusterOverview` (`cluster_overview.js:73-75`) | `monitoringClusterOverview` | Asserts cluster-name text is non-empty as a page-readiness proxy. Tautological with "the cluster-name locator is visible and rendered." Drop. |
| `await clusterList.closeAlertsModal()` in every `before` hook | `cluster/list.js`, `cluster/overview.js`, `elasticsearch/*.js` (every spec) — ~12 occurrences | The modal is gated by `window.localStorage.getItem('ALERTS_MODAL_DECISION_MADE') === 'true'` (see `public/application/hooks/use_alerts_modal.ts:20-23`). **Replace all 12 `closeAlertsModal()` calls with a single `await page.addInitScript(() => localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true'))`** in a shared `beforeEach` of the monitoring fixtures. The modal never renders, so there's nothing to close. (This also eliminates the implicit "modal must be visible" assertion hidden inside `testSubjects.click('alerts-modal-remind-later-button')`.) |
| `await PageObjects.timePicker.pauseAutoRefresh()` in lifecycle helper | `_get_lifecycle_methods.js:51-52` | The FTR comment justifies it as "we don't wait any ticks, and we don't want ES to log a warning when data gets wiped out." Since Scout does not wipe data between tests (no unload), and `accessibility:disableAnimations: true` is already set, the pause is only meaningful for the alerts+setup-mode UI spec (#23) where 1s auto-refresh actually triggers an `alertsBadge` re-render. **Keep the pause only in the alerts+setup-mode UI spec** (and re-enable explicitly for that test's setup-mode step); drop it from every other migrated spec. |
| `kibanaServer.uiSettings.replace({})` in lifecycle helper | `_get_lifecycle_methods.js:46` | Wipes all uiSettings then sets `{}` — a factory-reset that's already Scout's default state per request. **Drop entirely.** |
| `browser.setWindowSize(1600, 1000)` in lifecycle helper | `_get_lifecycle_methods.js:43` | Comment claims "provide extra height for the page and avoid clusters sending telemetry during tests" — the telemetry-avoidance claim is implausible (viewport size has no effect on cluster telemetry; this is stale/wrong). **Set viewport once in the Scout Playwright config** (or per spec via `test.use({ viewport: { width: 1600, height: 1000 } })` only for the specs that genuinely need extra vertical room — likely the alerts modal + setup-mode UI test and the cluster-overview panel-presence UI test). Drop the per-spec call. |
| `deleteDataStream('.monitoring-*-8-*')` in lifecycle teardown | `_get_lifecycle_methods.js:15-25, 58` | Runs even for non-`_mb` archives where no `.monitoring-*-8-*` data streams exist (silent no-op). Also runs after every describe in FTR. In Scout, run **once** in `globalTeardownHook` (in `parallel_tests/global.teardown.ts`) only for the `_mb` API + UI suites that actually create data streams; legacy `.monitoring-es-6-*` archives are cleaned up by archiver-internal mechanisms (or left in place — Scout shares ES across runs anyway). |
| `await PageObjects.header.waitUntilLoadingHasFinished()` (called transitively by `monitoringPage.tableSetFilter`) | `monitoring_page.ts:47` and downstream | Global-loading-indicator wait is a known anti-pattern (listed in [`docs/extend/scout/best-practices.md`](../../../../docs/extend/scout/best-practices.md)). It hides real failures (page stuck on spinner = "loading just hasn't finished yet, retry"). Drop everywhere; rely on Playwright auto-wait on the specific result locator. |
| `await security.testUser.restoreDefaults()` in lifecycle teardown | `_get_lifecycle_methods.js:59` | Used to restore the FTR test user's role list after lifecycle helper mutated it via `security.testUser.setRoles(...)`. In Scout, roles are fixture-driven (`samlAuth.asInteractiveUser(role)` per test); no shared mutable user state, so no restore needed. **Drop.** |

### Alerts modal: localStorage simplification

The most impactful simplification across the suite. The current FTR code mass-imports `closeAlertsModal()` into ~12 specs because the alerts modal shows on first navigation to the monitoring app. The modal honours `localStorage.ALERTS_MODAL_DECISION_MADE === 'true'` and never renders when set (verified in `public/application/hooks/use_alerts_modal.ts:20-23`).

**Recommended Scout pattern** (apply in the shared monitoring UI fixture in `test/scout/ui/fixtures/index.ts`):

```ts
// In a worker fixture or test.beforeEach for the monitoring UI tests
await page.addInitScript(() => {
  window.localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true');
});
```

This applies to all UI specs **except** the two alerts/setup-mode specs (#31, #32) that explicitly test the modal flow. Those two specs `addInitScript` the OPPOSITE (or skip the init script) and assert on the modal's visibility/buttons directly.

**Net effect:** removes 12 `before`-hook `closeAlertsModal()` calls, eliminates the implicit "modal must be visible to be closed" assertion they hide, and makes the migrated UI suite resilient to future modal redesigns that change the test-subj.

---

## 7. Server configuration

### FTR server args (full chain)

| Arg | Source config | Category | Notes |
|---|---|---|---|
| `path.repo=/tmp/` | `config.base.ts:38` | snapshot repo | Not used by group1 specs (snapshot/restore is a separate FTR app). Scout default does not need this. |
| `xpack.security.authc.api_key.enabled=true` | `config.base.ts:38` | already in Scout default | no action |
| `--status.allowAnonymous=true` | `config.base.ts:45` | not needed in Scout | drop |
| `--server.uuid=5b2de169-2785-441b-ae8c-186a1936b17d` | `config.base.ts:46` | already in Scout default (Scout generates a stable UUID) | confirm via Scout server config inspection |
| `--xpack.maps.showMapsInspectorAdapter=true` | `config.base.ts:47` | runtime-settable | irrelevant to monitoring |
| `--xpack.maps.preserveDrawingBuffer=true` | `config.base.ts:48` | irrelevant | drop |
| `--xpack.security.encryptionKey=...` | `config.base.ts:49` | already in Scout default | no action |
| `--xpack.encryptedSavedObjects.encryptionKey=...` | `config.base.ts:50` | already in Scout default | no action |
| `--xpack.discoverEnhanced.actions.exploreDataInContextMenu.enabled=true` | `config.base.ts:51` | irrelevant to monitoring | drop |
| `--savedObjects.maxImportPayloadBytes=10485760` | `config.base.ts:52` | irrelevant | drop |
| `--savedObjects.allowHttpApiAccess=false` | `config.base.ts:53` | already in Scout default | no action |
| `--server.restrictInternalApis=false` | `config.base.ts:55` | already in Scout default | no action |
| `--xpack.task_manager.unsafe.exclude_task_types=["Fleet-Metrics-Task"]` | `config.base.ts:57` | runtime arg | irrelevant to monitoring data; drop. |
| `--mockIdpPlugin.enabled=false` (local-only) | `config.base.ts:60` | Scout uses its own auth wiring; not needed | drop |
| `uiSettings.defaults: { 'accessibility:disableAnimations': true, 'dateFormat:tz': 'UTC' }` | `config.base.ts:64-67` | already Scout defaults | no action |
| `uiSettings.globalDefaults: { hideAnnouncements: true }` | `config.base.ts:68-71` | already Scout default | no action |

### ES server args

| Arg | Source config | Notes |
|---|---|---|
| `path.repo=/tmp/` | `config.base.ts:38` | Not needed by group1. |

### Custom server config needed?

**No.** All required ES + Kibana server args are either already in Scout's default `kbn-scout` server config or irrelevant to monitoring. Use Scout's **default** server config set for both the API and UI tests. The one FTR test that needed a fresh cluster (#8) is migrated to Jest/RTL (see §2 Unit tests) and runs entirely outside the Scout runtime, so no additional Scout config set is needed.

---

## 8. Deployment targets

| Proposed spec | Where it should run | Reasoning |
|---|---|---|
| All migrated specs | `tags.stateful.classic` only | Stack Monitoring app is stateful-only (`config.group1.ts` is only in `.buildkite/ftr-manifests/ftr_platform_stateful_configs.yml`; Stack Monitoring features are not present in serverless project tiers). |

### Coverage gaps

None. The original FTR coverage is stateful-only, matched 1:1.

### Cloud portability issues

| File | Line | Issue | Resolution |
|---|---|---|---|
| `cluster/list.js` (basic license row content/actions describes) | 122-124, 154-156 | Tagged `skipCloud` | Preserve `skipCloud` semantics in Scout via tag filtering. Scout currently doesn't have a first-class "skipCloud" tag at the spec level; either keep both tests but document the cloud limitation in a `test.fixme` annotation tied to https://github.com/elastic/stack-monitoring/issues/31, or split into a separate spec that runs only locally (omitted from `tags.stateful.classic` if classic ≈ cloud-runnable). **`NEEDS VERIFICATION`** — confirm Scout's stance on local-only-skipCloud tags. |
| `monitoring_security.ts` (#8 `monitoring_kibana_admin_user`) | 110 | Tagged `skipCloud` | Same pattern as above. |
| `_get_lifecycle_methods.js:43` | window size `1600x1000` | hardcoded viewport — not a cloud-portability issue per se, but reduces parity across local/cloud headless runs | port as a constant; Scout Playwright accepts `viewport` config. |
| `_get_lifecycle_methods.js:15-25` | `DELETE _data_stream/.monitoring-*-8-*` via raw ES transport | uses ES raw transport, not Cloud-blocked but should use `esClient.indices.deleteDataStream` | done in globalTeardownHook (Scout-native); cloud-portable. |

No hardcoded `localhost` URLs, no `path.repo` dependency in group1 specs, no single-node topology assumptions, no cluster-level settings mutations.

---

## 9. FTR test smells

| Smell | File | Lines | Description | Context |
|---|---|---|---|---|
| **Global window resize side effect** | `_get_lifecycle_methods.js` | 43 | `browser.setWindowSize(1600, 1000)` runs on every `setup()` to "provide extra height for the page and avoid clusters sending telemetry during tests" | The "avoid clusters sending telemetry" rationale is suspicious. Replicate via Playwright viewport in Scout config, not per-spec. |
| **Retry wrapper around assertions** | `services/monitoring/cluster_overview.js` | 68-76 | `isOnClusterOverview()` uses `retry.try` around DOM expectations | Scout uses Playwright auto-waits; rewrite as `await expect(page.testSubj.locator(...)).toBeVisible()`. |
| **Retry wrapper around row count** | `elasticsearch/nodes.js`, `nodes_mb.js` | many | `retry.try(() => ...rows.length === 3)` after sort/filter clicks | Replace with `await expect(page.testSubj.locatorAll(...)).toHaveCount(3)`. |
| **Retry wrapper around table loading** | `services/monitoring/elasticsearch_nodes.js` | 62-66 | `waitForDeletedByCssSelector('.euiBasicTable-loading')` | Use Playwright `waitForFunction` or simply rely on auto-wait + visible row assertion. |
| **Sequential journey across `it`s** | `cluster/list.js` Alerts describe | 197-201 | Modal accept → migration confirm → toast | Combine into one `test()` with `test.step` per phase. |
| **Sequential journey across `it`s** | `cluster/overview.js` Alerts > "when create alerts options is selected" | 188-205 | Accept modal → toast; enter setup mode → badge; exit setup mode | Combine into one `test()` with `test.step`. Currently a nested describe + 2 `it`s sharing browser state. |
| **Nested describe blocks** | `monitoring_security.ts` | 18, 47, 67, 88, 109 | Outer `describe('security')` + 4 nested role describes, each with `before`/`after` | Per user direction, **avoid nested describes**: split into separate specs (3 → API, 1 → UI) or use one `test()` per role at a flat level. |
| **Nested describe blocks** | `monitoring_spaces.ts` | 18, 29, 60 | Outer + 2 nested space scenarios | Split into one API spec parameterized over space configs + one UI spec parameterized over space configs. |
| **Nested describe blocks** | `cluster/list.js` | 19, 20, 44, 62, 78, 101, 122, 154, 179 | Outer `describe('Cluster listing')` + 4 archive describes, two of which have inner `describe('cluster table and toolbar'/'cluster row actions'/...)` | Flat split: one spec per archive (#13–#19) + one combined UI spec. |
| **Nested describe blocks** | `cluster/overview.js` | 19, 20, 76, 123, 169, 188 | Outer + 4 archive describes + 1 nested `when create alerts options is selected` | Flat split: one spec per archive (#20–#23). |
| **Nested describe blocks** | `elasticsearch/nodes.js` | 17, 21, 58 (skip), 282 | Outer + 2 archive describes + 1 skip-cloud nested | Flat split: separate spec per archive scenario. |
| **Nested describe blocks** | `elasticsearch/node_detail.js` | 17, 18, 84, 124, 125 | Outer + Active/Offline/Advanced + nested Active inside Advanced | Flat split per scenario (3 specs). |
| **Shared mutable state via FTR services** | every spec | — | `clusterList`, `overview`, `nodesList` etc. captured at module top via `getService`; methods called inside `before`/`it` rely on the implicit browser state across `it`s in the same describe | In Scout each `test()` runs in fresh browser context. Combine same-context flows into `test.step`. |
| **UI-based setup** | every spec via `_get_lifecycle_methods.js` | 48-54 | `before` navigates to monitoring app, pauses auto-refresh, sets time range — all via UI page objects, not API | After API downgrade, most specs need no UI setup at all. UI specs still need this; port as a shared `setupMonitoringApp(page, { from, to })` Playwright helper. |
| **try/catch swallowing** | none found | — | — | — |
| **Conditional test logic** | none found | — | — | — |
| **Hardcoded timeouts** | none in test bodies (only `{ timeout: 2000 }` / `{ timeout: 10000 }` in `testSubjects.exists` calls — Playwright-equivalent is fine) | — | — | — |
| **Duplicate test cases** | _mb suites vs non-mb suites | — | Each `_mb` spec asserts the *same* fields against the *same* expected values as its non-mb counterpart, only the archive name and `useCreate: true` flag differ. Per user decision, keep both (lossless). | Acknowledged. |
| **Missing cleanup** | `cluster/list.js` (Alerts), `cluster/overview.js` (Alerts) | 188-202, 169-186 | Both have `after` hooks that call `alertsService.deleteAlerts()` + `browser.clearLocalStorage()` — these are present but tangled with `tearDown()`. The actual gap: if `acceptAlertsModal` fails mid-test, the partially-created rule may leak. | In Scout, put `monitoringAlerts.deleteAlerts()` in `afterAll` of the UI alerts spec, and verify in CI logs that cleanup runs on failure too. |
| **Onboarding/tour dismissals** | none in group1 (handled globally via `hideAnnouncements: true` in `uiSettings.globalDefaults`) | — | — | — |
| **Brittle CSS selectors** | `monitoring_spaces.ts:55`, `services/monitoring/elasticsearch_nodes.js` (sort header), `services/monitoring/cluster_overview.js:100` | See §6 brittle locators table | Rewrite as proper Scout testSubj locators. |
| **Over-privileged execution** | Every data-loading spec runs with `monitoring_user + kibana_admin + test_monitoring + test_filebeat_reader` | — | After API downgrade, API specs only need `monitoring_user` (+ `test_monitoring` for cluster-monitor privileges + `test_filebeat_reader` for logs-link assertions). Drop `kibana_admin` from API specs. |
| **Lifecycle helper inverts cleanup ordering** | `_get_lifecycle_methods.js:57-61` | — | `tearDown` first deletes `.monitoring-*-8-*` data streams, then restores roles, then unloads archive. Order is OK but the data-stream delete is hard-coded to v8 even when loading v6 archives — silent no-op for the non-`_mb` paths. | Don't port verbatim. Scout teardown drops only what the archive created. |

---

## 10. Migration batches

### Batch 1: Quick wins — API tests, simple

Simple data-correctness assertions against `/api/monitoring/v1/clusters/...`. All depend on archives loaded once in `api/parallel_tests/global.setup.ts` (or a shared `apiTest.beforeAll` if not using parallel).

| # | Proposed spec | From FTR file | Complexity | Notes |
|---|---|---|---|---|
| 1 | `api/tests/spaces_capabilities.spec.ts` | `monitoring_spaces.ts` (#9, #11) | simple | Capabilities API parameterized over 2 space configs. |
| 2 | `api/tests/security_capabilities.spec.ts` | `monitoring_security.ts` (#5, #6, #7) | simple | Capabilities/check_access parameterized over 3 role descriptors. |
| 3 | `api/tests/cluster_list_multicluster.spec.ts` | `cluster/list.js` (#13, #15) | simple | Single archive, single endpoint. |
| 4 | `api/tests/cluster_list_standalone.spec.ts` | `cluster/list.js` (#15 standalone) | simple | Single archive. |
| 5 | `api/tests/cluster_list_standalone_mb.spec.ts` | `cluster/list_mb.js` (#19) | simple | `_mb` archive, `useCreate: true`. |
| 6 | `api/tests/cluster_list_multi_basic.spec.ts` | `cluster/list.js` (#16) | simple | Single archive, license field parsing. |
| 7 | `api/tests/elasticsearch_overview.spec.ts` | `elasticsearch/overview.js` (#24) | simple | Cluster summary fields + logs availability. |
| 8 | `api/tests/elasticsearch_overview_mb.spec.ts` | `elasticsearch/overview_mb.js` (#25) | simple | Mirror with `_mb`. |
| 9 | `api/tests/elasticsearch_indices_summary.spec.ts` | `elasticsearch/indices.js` (#39) | simple | Summary endpoint. |
| 10 | `api/tests/elasticsearch_indices_summary_mb.spec.ts` | `elasticsearch/indices_mb.js` (#42 summary) | simple | Mirror with `_mb`. |
| 11 | `api/tests/elasticsearch_nodes_summary.spec.ts` | `elasticsearch/nodes.js` (#26, #29) | simple | 2 archive scenarios in one spec (both use same endpoint with different time ranges). |
| 12 | `api/tests/elasticsearch_nodes_summary_mb.spec.ts` | `elasticsearch/nodes_mb.js` (#31) | simple | Mirror with `_mb`. |

- **Human involvement**: `autopilot`
- **Dependencies**: API fixture wiring (`apiClient`, `samlAuth`, custom roles, monitoring archive loader helper)
- **Blockers**: none

### Batch 2: Medium — API tests, multi-cluster

| # | Proposed spec | From FTR file | Complexity | Notes |
|---|---|---|---|---|
| 13 | `api/tests/cluster_overview_green_gold.spec.ts` | `cluster/overview.js` (#20) | medium | License-gated ML assertion + ES/Kibana/Logstash panel field assertions. |
| 14 | `api/tests/cluster_overview_yellow_platinum.spec.ts` | `cluster/overview.js` (#21) | medium | Same shape, different archive. |
| 15 | `api/tests/cluster_overview_yellow_basic.spec.ts` | `cluster/overview.js` (#22 data) | medium | Plus license-Basic-no-alerts derivation. |
| 16 | `api/tests/elasticsearch_node_detail_active.spec.ts` | `elasticsearch/node_detail.js` (#35) | medium | 3 `it`s → 3 `apiTest`s parameterized over node UUIDs. |
| 17 | `api/tests/elasticsearch_node_detail_offline.spec.ts` | `elasticsearch/node_detail.js` (#36) | medium | Offline node assertions. |
| 18 | `api/tests/elasticsearch_node_detail_advanced.spec.ts` | `elasticsearch/node_detail.js` (#37) | medium | `NEEDS VERIFICATION` that the advanced endpoint differs from basic. |
| 19 | `api/tests/elasticsearch_node_detail_*_mb.spec.ts` (3 specs) | `elasticsearch/node_detail_mb.js` (#38) | medium | Mirror of 16-18 with `_mb`. |
| 20 | `api/tests/elasticsearch_index_detail.spec.ts` | `elasticsearch/index_detail.js` (#43) | medium | 4 `it`s → 4 `apiTest`s parameterized over index names. |
| 21 | `api/tests/elasticsearch_index_detail_mb.spec.ts` | `elasticsearch/index_detail_mb.js` (#44) | medium | Mirror with `_mb`. |

- **Human involvement**: `autopilot`
- **Dependencies**: Batch 1 helpers + roles
- **Blockers**: `NEEDS VERIFICATION` on Advanced endpoint shape (#18)

### Batch 3: UI tests, simple

| # | Proposed spec | From FTR file | Complexity | Notes |
|---|---|---|---|---|
| 22 | `ui/tests/spaces_navigation.spec.ts` | `monitoring_spaces.ts` (#10, #12) | simple | Two scenarios in two `test()`s: enabled space → app renders; disabled space → 404. Per-space setup via `apiServices.spaces.create()` in `beforeAll`. |
| 23 | `ui/tests/cluster_overview_panels_yellow_basic.spec.ts` | `cluster/overview.js` (#22 UI-only `it`) | simple | Single assertion: `getPresentPanels()` returns `['Elasticsearch']`. |
| 24 | `ui/tests/elasticsearch_indices_filtering.spec.ts` | `elasticsearch/indices.js` (#41) | simple | One `test('filtering')` with `test.step` for narrow + no-data. |
| 25 | `ui/tests/elasticsearch_indices_filtering_mb.spec.ts` | `elasticsearch/indices_mb.js` (#42 filter) | simple | Mirror with `_mb`. |
| 26 | `ui/tests/elasticsearch_nodes_filtering.spec.ts` | `elasticsearch/nodes.js` (#30) | simple | Mirror of #24 for nodes. |
| 27 | `ui/tests/elasticsearch_nodes_filtering_mb.spec.ts` | `elasticsearch/nodes_mb.js` (#34) | simple | Mirror with `_mb`. |

- **Human involvement**: `autopilot`
- **Dependencies**: Plugin-local page objects (`cluster_list_page`, `cluster_overview_page`, `elasticsearch_indices_page`, `elasticsearch_nodes_page`); shared `monitoring_app_setup` helper (load app + set time range + pause auto-refresh)
- **Blockers**: none

### Batch 4: UI tests, medium — sorting + table actions

| # | Proposed spec | From FTR file | Complexity | Notes |
|---|---|---|---|---|
| 28 | `ui/tests/elasticsearch_nodes_sorting.spec.ts` | `elasticsearch/nodes.js` (#28) | medium | One `test('table sorting')` with 5 `test.step`s. |
| 29 | `ui/tests/elasticsearch_nodes_sorting_mb.spec.ts` | `elasticsearch/nodes_mb.js` (#33) | medium | Mirror with `_mb`. |
| 30 | `ui/tests/cluster_list_actions.spec.ts` | `cluster/list.js` (#14, #17 — 2 archives + 3 click flows) | medium | Two `test()`s (one per archive); each combines clicks into `test.step`s. Note: `skipCloud` tag for `multi_basic` flow. |

- **Human involvement**: `autopilot`
- **Dependencies**: Batch 3 page objects
- **Blockers**: `NEEDS VERIFICATION` on Scout's skipCloud tagging stance.

### Batch 5: UI tests, complex — alerts + setup mode

| # | Proposed spec | From FTR file | Complexity | Notes |
|---|---|---|---|---|
| 31 | `ui/tests/cluster_list_alerts.spec.ts` | `cluster/list.js` (#18 Alerts) | medium | Modal accept → migration confirm → assert `alertsCreatedToast`. Cleanup via `monitoringAlerts.deleteAlerts()` API helper in `afterAll`. |
| 32 | `ui/tests/cluster_overview_alerts_setup_mode.spec.ts` | `cluster/overview.js` (#23) | complex | One `test()` with `test.step`s: accept modal → toast → enter setup mode → assert `alertsBadge` (auto-refresh-driven, longer locator timeout) → exit setup mode. Cleanup via `monitoringAlerts.deleteAlerts()`. |

- **Human involvement**: `guided`
- **Dependencies**: `MonitoringAlertsApi` service, `SetupModePage` page object
- **Blockers**: Scout skipCloud-equivalent tagging (open question #3 in §11).

### Batch 6: Jest/RTL — no-data denial

| # | Proposed test | From FTR file | Complexity | Notes |
|---|---|---|---|---|
| 33 | `public/components/no_data/no_data_denial.test.js` | `monitoring_security.ts` (#8) | simple | New file alongside existing `no_data.test.js`. Same mocking pattern (`useKibana`, `Legacy.shims`, `renderWithI18nProvider`). Use `@testing-library/react` to find `useInternalCollection`, fire click, assert `weTriedContainer` appears. No `data-test-subj` source changes needed (both already exist). |

- **Human involvement**: `autopilot`
- **Dependencies**: none — pattern already established in `no_data.test.js`
- **Blockers**: none

---

## 11. Effort summary

| Metric | Value |
|---|---|
| Total FTR test files analyzed | 16 (14 specs + 2 index/wrapper files) |
| > UI tests | 11 specs (Batch 3 × 6 + Batch 4 × 3 + Batch 5 × 2) |
| > API tests | 21 specs (Batch 1 × 12 + Batch 2 × 9) |
| > Unit tests (RTL/Jest) | 1 confirmed (`no_data_denial.test.js` for #8) + 2 optional (`ClusterListing` filter narrowing, Advanced node-detail tab — both `NEEDS VERIFICATION`) |
| > Dropped (FTR organisational wrappers) | 2 (`index.group1.js`, `feature_controls/index.ts`) |
| > Deferred (currently skipped) | 4 sets (`shards.js` whole, `nodes.js` + `nodes_mb.js` skipCloud blocks, `indices.js` + `indices_mb.js` EUI-blocked `it`) |
| New page objects needed | 5 plugin-local: `cluster_list_page`, `cluster_overview_page`, `elasticsearch_nodes_page`, `elasticsearch_indices_page`, `setup_mode_page` (the `no_data_page` is dropped — #8 became a Jest test) |
| New API services needed | 1 plugin-local: `monitoring_alerts_api` (wraps `/api/alerting/rules/_find` + `/api/alerting/rule/{id}` DELETE) |
| `data-test-subj` additions to source code | 0 expected (all assertions already use `data-test-subj`; `weTriedContainer`, `noDataContainer`, `useInternalCollection` are all already in source for the Jest test) |
| Custom server config sets | 0 new / 0 reuse |
| Migration batches | 6 |

### Risks and open questions

- **`NEEDS VERIFICATION` #1**: Does `POST /api/monitoring/v1/clusters/{uuid}/elasticsearch/nodes/{nodeUuid}` accept a query param or body field that toggles "advanced" view, so that the FTR Advanced node-detail tests (#37, #18 in batches) can map cleanly to one extra API request, or is "Advanced" purely a UI-side rendering of the same response? If purely UI-side, downgrade to a Jest component test of `NodeDetailAdvanced`.
- **`NEEDS VERIFICATION` #2**: Scout's stance on the FTR `skipCloud` tag. There is no documented Scout-level "skip on cloud" tag in `docs/extend/scout/deployment-tags.md`. Either (a) port the `skipCloud` `it`s without a Scout-side skip and accept slightly different behavior on Cloud runs, (b) use `test.fixme(...)` annotations referencing https://github.com/elastic/stack-monitoring/issues/31, or (c) split those specific tests into separate spec files that are explicitly excluded by tag from cloud runs.
- **`NEEDS VERIFICATION` #3**: Is `ClusterListing` testable as a pure React component (props-driven) for the filter-narrowing extraction? If not, keep the assertion only at the API level and drop the optional unit-test plan.
- **Risk**: 11 archives loaded into the same cluster at suite startup totals roughly the union of all monitoring sample-data corpus (cluster_uuids overlap is verified to be disjoint across archives). Total ingest time could be significant; if it exceeds Scout's `globalSetup` budget, consider archive-trimming or splitting API specs across two Scout configs (one for legacy `.monitoring-es-6-*`, one for `_mb` data streams). Initial recommendation: load all, measure, then split only if needed.
- **Risk**: The lifecycle helper's silent `useSuperUser: false` default mapped to `[monitoring_user, kibana_admin, test_monitoring, test_filebeat_reader]` — every spec that doesn't opt in to super-user relies on this combo. Make sure the Scout default role descriptor matches exactly; subtle privilege differences could change `/api/monitoring/v1/clusters/...` response shape (e.g. logs link visibility depends on `test_filebeat_reader`).
- **Design decision locked**: Strict 1:1 `_mb` / legacy spec files (no `apiTest.describe.each` parameterization). Per-archive specs are verbatim ports with the archive constant and `useCreate: true` flag swapped. This keeps the diff with the FTR source maximally reviewable at the cost of ~9 extra `_mb` spec files.
