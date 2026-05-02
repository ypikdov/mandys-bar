[CmdletBinding()]
param(
  [ValidateSet('core', 'prisma', 'uploads', 'content', 'full')]
  [string]$Scope = 'full'
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..\..\..')).Path
$BackendRoot = Join-Path $RepoRoot 'backend'
$ClientRoot = Join-Path $RepoRoot 'apps\client'
$AdminRoot = Join-Path $RepoRoot 'apps\admin'
$script:Failures = 0

function Resolve-FirstExistingPath {
  param([string[]]$Candidates)

  foreach ($candidate in $Candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $Candidates[0]
}

$TscCli = Resolve-FirstExistingPath @(
  (Join-Path $BackendRoot 'node_modules\.bin\tsc.cmd'),
  (Join-Path $RepoRoot 'node_modules\.bin\tsc.cmd')
)

$PrismaCli = Resolve-FirstExistingPath @(
  (Join-Path $BackendRoot 'node_modules\.bin\prisma.cmd'),
  (Join-Path $RepoRoot 'node_modules\.bin\prisma.cmd')
)

$PrismaSchemaEngine = Resolve-FirstExistingPath @(
  (Join-Path $BackendRoot 'node_modules\@prisma\engines\schema-engine-windows.exe'),
  (Join-Path $RepoRoot 'node_modules\@prisma\engines\schema-engine-windows.exe')
)

function Write-Check {
  param([string]$Message)
  Write-Host "[CHECK] $Message"
}

function Write-Pass {
  param([string]$Message)
  Write-Host "[PASS]  $Message" -ForegroundColor Green
}

function Write-Fail {
  param([string]$Message)
  Write-Host "[FAIL]  $Message" -ForegroundColor Red
  $script:Failures++
}

function Assert-Path {
  param(
    [string]$Path,
    [string]$Label
  )

  if (Test-Path -LiteralPath $Path) {
    Write-Pass $Label
  } else {
    Write-Fail "$Label (`"$Path`" no existe)"
  }
}

function Assert-Pattern {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Fail "$Label (archivo faltante: $Path)"
    return
  }

  $content = Get-Content -LiteralPath $Path -Raw
  if ($content -match $Pattern) {
    Write-Pass $Label
  } else {
    Write-Fail "$Label (patron no encontrado en $Path)"
  }
}

function Invoke-ExternalCheck {
  param(
    [string]$Label,
    [string]$Executable,
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  if (-not (Test-Path -LiteralPath $Executable)) {
    Write-Fail "$Label (falta ejecutable: $Executable)"
    return
  }

  Push-Location $WorkingDirectory
  try {
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = & $Executable @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorAction
    if ($exitCode -eq 0) {
      Write-Pass $Label
      if ($output) {
        $output | ForEach-Object { Write-Host "        $_" }
      }
    } else {
      Write-Fail $Label
      if ($output) {
        $output | ForEach-Object { Write-Host "        $_" }
      }
    }
  } finally {
    Pop-Location
  }
}

function Test-CoreScope {
  Write-Check 'Scope core'

  Assert-Path (Join-Path $BackendRoot 'src\index.ts') 'Existe backend/src/index.ts'
  Assert-Path (Join-Path $BackendRoot 'src\middlewares\auth.ts') 'Existe middleware auth'
  Assert-Path (Join-Path $BackendRoot 'src\middlewares\security.ts') 'Existe middleware security'
  Assert-Path (Join-Path $BackendRoot 'src\middlewares\rateLimiter.ts') 'Existe middleware rateLimiter'
  Assert-Pattern (Join-Path $BackendRoot 'src\index.ts') "app\.use\('/api/products', productRoutes\)" 'index.ts monta /api/products'
  Assert-Pattern (Join-Path $BackendRoot 'src\index.ts') "app\.use\('/api/orders', orderRateLimiter, orderRoutes\)" 'index.ts monta /api/orders con rate limiter'
  Assert-Pattern (Join-Path $BackendRoot 'src\index.ts') "app\.use\('/api/site-content', siteContentRoutes\)" 'index.ts monta /api/site-content'
  Assert-Pattern (Join-Path $BackendRoot 'src\index.ts') "app\.use\('/uploads', express\.static\(UPLOADS_DIR\)\)" 'index.ts expone /uploads'
  Assert-Pattern (Join-Path $BackendRoot 'src\index.ts') "app\.get\('/api/healthz'" 'index.ts expone /api/healthz'
  Invoke-ExternalCheck 'TypeScript backend (noEmit)' $TscCli @('-p', (Join-Path $BackendRoot 'tsconfig.json'), '--noEmit', '--pretty', 'false') $RepoRoot
}

function Test-PrismaScope {
  Write-Check 'Scope prisma'

  $schemaPath = Join-Path $BackendRoot 'prisma\schema.prisma'
  Assert-Path $schemaPath 'Existe backend/prisma/schema.prisma'
  Assert-Path (Join-Path $BackendRoot 'prisma\seed.ts') 'Existe backend/prisma/seed.ts'
  Assert-Pattern $schemaPath 'model User' 'Schema contiene model User'
  Assert-Pattern $schemaPath 'model Product' 'Schema contiene model Product'
  Assert-Pattern $schemaPath 'model Order' 'Schema contiene model Order'
  Assert-Pattern $schemaPath 'model Reservation' 'Schema contiene model Reservation'
  Assert-Pattern $schemaPath 'model SiteSetting' 'Schema contiene model SiteSetting'
  Assert-Pattern $schemaPath 'model GalleryItem' 'Schema contiene model GalleryItem'

  $previousSchemaEngine = $env:PRISMA_SCHEMA_ENGINE_BINARY
  $previousIgnoreChecksum = $env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING
  try {
    if (Test-Path -LiteralPath $PrismaSchemaEngine) {
      $env:PRISMA_SCHEMA_ENGINE_BINARY = $PrismaSchemaEngine
      $env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1'
    }

    Invoke-ExternalCheck 'Prisma validate' $PrismaCli @('validate', '--schema', $schemaPath) $RepoRoot
  } finally {
    $env:PRISMA_SCHEMA_ENGINE_BINARY = $previousSchemaEngine
    $env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = $previousIgnoreChecksum
  }
}

function Test-UploadsScope {
  Write-Check 'Scope uploads'

  $uploadRoutePath = Join-Path $BackendRoot 'src\routes\uploadRoutes.ts'
  $reservationRoutePath = Join-Path $BackendRoot 'src\modules\reservations\reservations.routes.ts'

  Assert-Path $uploadRoutePath 'Existe uploadRoutes.ts'
  Assert-Path (Join-Path $BackendRoot 'src\utils\convertToWebp.ts') 'Existe convertToWebp.ts'
  Assert-Pattern $uploadRoutePath "upload\.single\('image'\)" 'uploadRoutes usa field image'
  Assert-Pattern $uploadRoutePath 'authenticate' 'uploadRoutes exige authenticate'
  Assert-Pattern $uploadRoutePath 'isValidImageMime' 'uploadRoutes valida magic bytes'
  Assert-Pattern $uploadRoutePath 'convertToWebp' 'uploadRoutes intenta convertir a WebP'
  Assert-Pattern (Join-Path $BackendRoot 'src\index.ts') "app\.use\('/api/upload', uploadRoutes\)" 'index.ts monta /api/upload'
  Assert-Pattern $reservationRoutePath "uploadAnulacion\.single\('imagen_anulacion'\)" 'reservations usa field imagen_anulacion para cancelacion'
}

function Test-ContentScope {
  Write-Check 'Scope content'

  $siteContentRoutePath = Join-Path $BackendRoot 'src\modules\site-content\site-content.routes.ts'
  $clientServicePath = Join-Path $ClientRoot 'src\modules\site-content\services\siteContentService.ts'
  $clientRealtimePath = Join-Path $ClientRoot 'src\modules\site-content\hooks\useSiteContentRealtime.ts'

  Assert-Path $siteContentRoutePath 'Existe site-content.routes.ts'
  Assert-Path (Join-Path $BackendRoot 'src\modules\site-content\site-content.controller.ts') 'Existe site-content.controller.ts'
  Assert-Path $clientServicePath 'Existe siteContentService.ts en cliente'
  Assert-Path $clientRealtimePath 'Existe useSiteContentRealtime.ts en cliente'
  Assert-Path (Join-Path $AdminRoot 'src\modules\site-content') 'Existe modulo site-content en admin'
  Assert-Pattern $siteContentRoutePath "router\.get\('/public'" 'site-content expone /public'
  Assert-Pattern $siteContentRoutePath "router\.get\('/gallery'" 'site-content expone /gallery'
  Assert-Pattern $siteContentRoutePath "router\.get\('/drafts'" 'site-content expone /drafts'
  Assert-Pattern $siteContentRoutePath "router\.put\('/drafts/:id/publish'" 'site-content expone publish draft'
  Assert-Pattern $siteContentRoutePath "router\.put\('/'" 'site-content expone save site content'
  Assert-Pattern $clientServicePath "/api/site-content/public" 'cliente consume /api/site-content/public'
  Assert-Pattern $clientRealtimePath 'site_settings' 'realtime cliente escucha site_settings'
  Assert-Pattern $clientRealtimePath 'site_events' 'realtime cliente escucha site_events'
  Assert-Pattern $clientRealtimePath 'gallery_items' 'realtime cliente escucha gallery_items'
}

switch ($Scope) {
  'core' { Test-CoreScope }
  'prisma' { Test-PrismaScope }
  'uploads' { Test-UploadsScope }
  'content' { Test-ContentScope }
  'full' {
    Test-CoreScope
    Test-PrismaScope
    Test-UploadsScope
    Test-ContentScope
  }
}

if ($script:Failures -gt 0) {
  Write-Host ""
  Write-Host "Resultado: $($script:Failures) check(s) fallaron." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host 'Resultado: todos los checks del scope pasaron.' -ForegroundColor Green
exit 0
