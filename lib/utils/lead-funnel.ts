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

function safeRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function buildLeadFunnelMetrics(input: {
  messages: number;
  data: number;
  appointments: number;
  success: number;
  messagesSource: FunnelStepSource;
  dataSource: FunnelStepSource;
  successSource: FunnelStepSource;
}): LeadFunnelMetrics {
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
      rateFromPrevious: safeRate(data, messages),
      source: input.dataSource,
    },
    {
      key: 'appointments',
      label: 'Đặt lịch hẹn',
      value: appointments,
      rateFromPrevious: safeRate(appointments, data),
      source: 'crm',
    },
    {
      key: 'success',
      label: 'Thành công',
      value: success,
      rateFromPrevious: safeRate(success, appointments),
      source: input.successSource,
    },
  ];

  return {
    steps,
    overallConversionRate: safeRate(success, messages) ?? 0,
  };
}
