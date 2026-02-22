/*
  Inkura V15 - Deployment env guard
  - Fail fast if critical env vars are missing
  - Print warnings for optional integrations
*/

function pick(keys) {
  const out = {};
  for (const k of keys) out[k] = process.env[k];
  return out;
}

function isTruthy(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function checkEnv() {
  const vercelEnv = process.env.VERCEL_ENV || '(not vercel)';
  const nodeEnv = process.env.NODE_ENV || '(unset)';

  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  // Optional but strongly recommended for Inkura features
  const recommended = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_BASE_URL',
  ];

  const optional = [
    'RESEND_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
  ];

  const missingRequired = required.filter((k) => !isTruthy(process.env[k]));
  const missingRecommended = recommended.filter((k) => !isTruthy(process.env[k]));

  console.log(`[deploy:check-env] VERCEL_ENV=${vercelEnv} NODE_ENV=${nodeEnv}`);

  if (missingRequired.length) {
    console.error('[deploy:check-env] Missing REQUIRED env vars:');
    for (const k of missingRequired) console.error(`  - ${k}`);
    console.error('[deploy:check-env] Set these in Vercel Project Settings → Environment Variables.');
    return { ok: false, missingRequired, missingRecommended };
  }

  if (missingRecommended.length) {
    console.warn('[deploy:check-env] Missing recommended env vars (some features may be disabled/broken):');
    for (const k of missingRecommended) console.warn(`  - ${k}`);
  }

  // Print a small hint for common misconfig: NEXTAUTH_URL must be https in prod
  if (process.env.VERCEL_ENV === 'production' && isTruthy(process.env.NEXTAUTH_URL)) {
    const v = process.env.NEXTAUTH_URL.trim();
    if (!v.startsWith('https://')) {
      console.warn('[deploy:check-env] NEXTAUTH_URL in production should usually start with https://');
    }
  }

  // Avoid logging secrets. We only log which optional keys exist.
  const optionalPresence = pick(optional);
  const presentOptional = Object.entries(optionalPresence)
    .filter(([, v]) => isTruthy(v))
    .map(([k]) => k);

  if (presentOptional.length) {
    console.log('[deploy:check-env] Optional integrations detected:', presentOptional.join(', '));
  }

  console.log('[deploy:check-env] OK');
  return { ok: true, missingRequired: [], missingRecommended };
}

function checkEnvOrExit() {
  const res = checkEnv();
  if (!res.ok) process.exit(1);
}

module.exports = { checkEnv, checkEnvOrExit };

if (require.main === module) {
  checkEnvOrExit();
}
