/*
  Inkura V15 - Vercel pipeline guard
  - Ensures Prisma Client is generated
  - Runs prisma migrate deploy safely
  - Builds Next.js

  Preview deployments:
  - By default, migrations are SKIPPED to avoid accidentally migrating a shared/prod DB.
  - To enable migrations on preview, set: INKURA_MIGRATE_PREVIEW=1
*/

const { spawnSync } = require('child_process');
const { checkEnvOrExit } = require('./check-env');

function run(cmd, args, opts = {}) {
  const pretty = [cmd, ...args].join(' ');
  console.log(`\n[vercel-build] $ ${pretty}`);
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    ...opts,
  });
  if (res.status !== 0) {
    console.error(`\n[vercel-build] Command failed (${res.status}): ${pretty}`);
    process.exit(res.status || 1);
  }
}

function main() {
  const vercelEnv = process.env.VERCEL_ENV || '(not vercel)';
  const migratePreview = process.env.INKURA_MIGRATE_PREVIEW === '1';

  checkEnvOrExit();

  // Always generate client (safe + fast)
  run('prisma', ['generate']);

  const shouldMigrate =
    vercelEnv === 'production' ||
    vercelEnv === 'development' ||
    (vercelEnv === 'preview' && migratePreview);

  if (shouldMigrate) {
    run('prisma', ['migrate', 'deploy']);
  } else {
    console.log(
      `\n[vercel-build] Skipping migrations for VERCEL_ENV=${vercelEnv}. ` +
        `Set INKURA_MIGRATE_PREVIEW=1 to enable on preview (recommended only with a separate preview DB).`
    );
  }

  run('next', ['build']);
}

main();
