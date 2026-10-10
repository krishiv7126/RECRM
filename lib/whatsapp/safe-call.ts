/**
 * Runs a WhatsApp server action from the browser and turns a thrown error
 * (network drop, server misconfiguration) into the same { ok: false } shape
 * the actions return, so a spinner never gets stuck.
 */
export async function safeCall<T extends { ok: boolean }>(fn: () => Promise<T>): Promise<T | { ok: false; message: string }> {
  try {
    return await fn()
  } catch {
    return { ok: false, message: 'WhatsApp is not available right now. Please try again.' }
  }
}
