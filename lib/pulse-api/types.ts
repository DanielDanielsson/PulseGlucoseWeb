export interface PulseApiReading {
  timestamp: string;
  valueMmolL: number;
  valueMgDl: number;
  trend: string;
  status?: string;
  source?: string;
}

export interface PulseApiSourceStatus {
  stable: boolean;
  connected: boolean;
  latestReading: PulseApiReading | null;
  sourceToDbLagMinutes: number | null;
  latestReadingAgeMinutes: number | null;
  syncLagMinutes?: number | null;
}

export interface PulseApiStatusReport {
  generatedAt: string;
  official: PulseApiSourceStatus;
  share: PulseApiSourceStatus;
}

export interface AlarmSound {
  id: string;
  name: string;
  url: string;
}

export interface ConsumerProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  timezone: string;
  glucoseUnit: 'mmol/L' | 'mg/dL';
  profileImageUrl: string | null;
  profileImageDataUrl: string | null;
  alarmSounds: AlarmSound[];
  defaultAlarmSoundId: string | null;
  updatedAt: string;
  updatedBy: {
    apiKeyId: string | null;
    apiKeyName: string | null;
  };
}

export interface ConsumerProfileResponse {
  profile: ConsumerProfile;
}

export interface ConsumerProfileUpdatePayload {
  firstName: string;
  lastName: string;
  timezone: string;
  glucoseUnit: 'mmol/L' | 'mg/dL';
  profileImageUrl: string | null;
  profileImageDataUrl: string | null;
  alarmSounds: AlarmSound[];
  defaultAlarmSoundId: string | null;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface ApiKeyListResponse {
  items: ApiKeySummary[];
}

export interface ApiKeyCreateResponse {
  id: string;
  name: string;
  apiKey: string;
}

export interface PulseApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}
