/**
 * instrumentation.ts
 *
 * In the split frontend/backend layout, the scheduler runs from the backend package.
 * The frontend entry keeps this hook lightweight so the Next app remains isolated.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    return;
  }
}
