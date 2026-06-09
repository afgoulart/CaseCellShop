const MAX_RETRIES = 3;

function getConfig() {
  return {
    failureRate: parseFloat(process.env.ERP_FAILURE_RATE ?? '0.2'),
    maxDelay: parseInt(process.env.ERP_MAX_DELAY_MS ?? '4000', 10),
    minDelay: parseInt(process.env.ERP_MIN_DELAY_MS ?? '500', 10),
  };
}

async function callErp(orderId: string): Promise<{ invoice: string }> {
  const { failureRate, maxDelay, minDelay } = getConfig();
  const delay = minDelay + Math.random() * (maxDelay - minDelay);
  await new Promise(resolve => setTimeout(resolve, delay));
  if (Math.random() < failureRate) throw new Error('ERP temporarily unavailable');
  return { invoice: `INV-${Date.now()}-${orderId.slice(0, 8).toUpperCase()}` };
}

export async function processOrderInERP(orderId: string): Promise<{ invoice: string }> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callErp(orderId);
      console.log(`[erp] order=${orderId} attempt=${attempt} success invoice=${result.invoice}`);
      return result;
    } catch (err) {
      lastError = err as Error;
      console.warn(`[erp] order=${orderId} attempt=${attempt} failed: ${lastError.message}`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 300 * attempt));
    }
  }
  throw lastError ?? new Error('ERP failed after retries');
}
