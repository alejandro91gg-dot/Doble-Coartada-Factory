$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

$required = @(
  'AGENTS.md',
  'FACTORY_PHASE0_BASELINE_REPORT_v1.0.md',
  'FACTORY_PHASE1_SCHEMA_DESIGN_v1.0.md',
  'FACTORY_PHASE1_ROLLBACK_PLAN_v1.0.md',
  'CHANGELOG_PHASE0_PHASE1_v1.0.md',
  'CODEX_RETURN_TO_A0_PHASE0_PHASE1_v1.0.md',
  'supabase\migrations\202609190001_factory_v2_phase1_state.sql',
  'supabase\rollback\202609190001_factory_v2_phase1_state_rollback.sql',
  'tests\sql\factory_v2_phase1_contract.sql',
  'edge-functions\factory-api-v2-read\index.ts'
)

foreach ($relative in $required) {
  $path = Join-Path $root $relative
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Missing required artifact: $relative"
  }
}

$migration = Get-Content -Raw -LiteralPath (Join-Path $root 'supabase\migrations\202609190001_factory_v2_phase1_state.sql')
$api = Get-Content -Raw -LiteralPath (Join-Path $root 'edge-functions\factory-api-v2-read\index.ts')

foreach ($authorityType in @('CASE_CANON','CASE_LOGIC','PRODUCTION_STATE')) {
  if ($migration -notmatch [regex]::Escape($authorityType)) { throw "Missing authority type: $authorityType" }
}
foreach ($edition in @('ECONOMICO','ESTANDAR','PREMIUM')) {
  if ($migration -notmatch [regex]::Escape($edition)) { throw "Missing edition: $edition" }
}
if ($migration -match "insert\s+into\s+public\.factory_authority" -or $migration -match "update\s+public\.factory_authority") {
  throw 'Migration contains an authority mutation.'
}
if ($api -match "\.insert\(|\.update\(|\.delete\(|\.upsert\(") {
  throw 'Read-only API contains a Supabase write method.'
}
if ($api -notmatch "GET" -or $api -notmatch "OPTIONS") { throw 'Read-only HTTP methods are not explicit.' }

Write-Output 'PASS: Phase 0/1 files, authority vocabulary, edition vocabulary, and read-only API static contract.'
