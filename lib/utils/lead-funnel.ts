export type FunnelStepKey = 'messages' | 'data' | 'appointments' | 'success';

export type FunnelStepSource = 'smax' | 'crm' | 'facebook' | 'mixed';

export interface FunnelStep {
  key: FunnelStepKey;
  label: string;
  value: number;
  rateFromPrevious: number | null;
  source: FunnelStepSource;
}

export interface LeadFunnelMetrics {
  steps: FunnelStep[];
  overallConversionRate: number;
}

export type BuildLeadFunnelInput = {
  messages: number;
  data: number;
  appointments: number;
  success: number;
  messagesSource: FunnelStepSource;
  dataSource: FunnelStepSource;
  successSource: FunnelStepSource;
};

/** Percent to 1 decimal; null when denominator is 0. */
export function percentRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** % change vs previous period; 100 when previous was 0 and current > 0. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function buildLeadFunnelMetrics(input: BuildLeadFunnelInput): LeadFunnelMetrics {
  const messages = Math.max(0, input.messages);
  const data = Math.max(0, input.data);
  const appointments = Math.max(0, input.appointments);
  const success = Math.max(0, input.success);

  const steps: FunnelStep[] = [
    {
      key: 'messages',
      label: 'Khách nhắn tin',
      value: messages,
      rateFromPrevious: null,
      source: input.messagesSource,
    },
    {
      key: 'data',
      label: 'Data',
      value: data,
      rateFromPrevious: percentRate(data, messages),
      source: input.dataSource,
    },
    {
      key: 'appointments',
      label: 'Đặt lịch hẹn',
      value: appointments,
      rateFromPrevious: percentRate(appointments, data),
      source: 'crm',
    },
    {
      key: 'success',
      label: 'Thành công',
      value: success,
      rateFromPrevious: percentRate(success, appointments),
      source: input.successSource,
    },
  ];

  return {
    steps,
    overallConversionRate: percentRate(success, messages) ?? 0,
  };
}
