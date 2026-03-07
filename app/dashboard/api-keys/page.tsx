import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state';
import { ApiKeysManager } from '@/components/dashboard/api-keys-manager';
import { PulseApiClientError, listApiKeys } from '@/lib/pulse-api/client';

export default async function DashboardApiKeysPage() {
  let items = null;
  let message: string | null = null;

  try {
    const response = await listApiKeys();
    items = response.items;
  } catch (error) {
    message =
      error instanceof PulseApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to load API keys';
  }

  if (!items) {
    return <DashboardErrorState title="API keys unavailable" message={message || 'Failed to load API keys'} />;
  }

  return <ApiKeysManager initialItems={items} />;
}
