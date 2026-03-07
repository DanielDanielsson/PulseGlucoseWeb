import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { PulseApiClientError, fetchConsumerProfile } from '@/lib/pulse-api/client';

export default async function DashboardSettingsPage() {
  let profile = null;
  let message: string | null = null;

  try {
    const response = await fetchConsumerProfile();
    profile = response.profile;
  } catch (error) {
    message =
      error instanceof PulseApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to load settings';
  }

  if (!profile) {
    return <DashboardErrorState title="Settings unavailable" message={message || 'Failed to load settings'} />;
  }

  return <SettingsForm initialProfile={profile} />;
}
