export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export const SETTING_KEYS = {
  ANTHROPIC_API_KEY: "anthropic_api_key",
  FOLLOW_UP_DAYS: "follow_up_days",
  DAILY_APPLICATION_TARGET: "daily_application_target",
  IMPORT_COMPLETED: "import_completed",
  BASE_URL: "base_url",
} as const;
