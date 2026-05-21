# Stack Monitoring — Scout Tests

Migrated from `x-pack/platform/test/functional/apps/monitoring/config.group1.ts`.

## Structure

```
test/scout/
├── api/          # Scout API tests (no browser)
│   ├── fixtures/ # constants, helpers, apiTest re-export
│   └── tests/    # spec files
└── ui/           # Scout UI tests (Playwright browser)
    ├── fixtures/ # constants, page objects, test fixture extension
    └── tests/    # spec files
```

## Running

### API tests
```bash
node scripts/scout run-tests \
  --arch stateful --domain classic \
  --config x-pack/platform/plugins/private/monitoring/test/scout/api/playwright.config.ts
```

### UI tests
```bash
node scripts/scout run-tests \
  --arch stateful --domain classic \
  --config x-pack/platform/plugins/private/monitoring/test/scout/ui/playwright.config.ts
```

## Migration decisions

- **API-first**: All data-correctness assertions hit the monitoring REST API directly.
- **1:1 _mb / legacy**: Each `_mb` (data-stream) archive has its own spec file.
- **Deferred**: `elasticsearch/shards.js` (FLAKY #47184) and `skipCloud` sorting blocks (FLAKY #217665).
- **Jest/RTL**: `monitoring_user + kibana_admin` denial flow → `public/components/no_data/no_data_denial.test.js`.
- **No archive unloading**: All archives are loaded once in `global.setup.ts` via `loadAllMonitoringArchives` (`_mb` paths get `useCreate` automatically); tests scope to cluster UUID.
- **Alerts modal**: Suppressed in most UI tests via `localStorage.setItem('ALERTS_MODAL_DECISION_MADE', 'true')` in `page.addInitScript`.
