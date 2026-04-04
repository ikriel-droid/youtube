export function logAction(event: string, payload: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.info(`[LocalTube] ${timestamp} ${event}`, JSON.stringify(payload));
}
