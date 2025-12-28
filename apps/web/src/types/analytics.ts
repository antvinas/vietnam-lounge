export type PlanShareType = 'copy' | 'webshare' | 'ics' | 'print';

export type AnalyticsEvent =
  | 'plan_create_clicked'
  | 'plan_template_clicked'
  | 'plan_share_clicked'
  | 'plan_save'
  | 'plan_open'
  | 'plan_continue_banner';

export type AnalyticsParams =
  | { event: 'plan_template_clicked'; id: string }
  | { event: 'plan_share_clicked'; type: PlanShareType }
  | { event: 'plan_save'; planId?: string; items?: number; cost?: number }
  | { event: 'plan_open'; planId?: string }
  | { event: 'plan_create_clicked' }
  | { event: 'plan_continue_banner'; planId?: string }
  | { event: string; [k: string]: unknown };

export interface AnalyticsClient {
  track: (event: AnalyticsEvent | string, params?: Record<string, unknown>) => void;
}
