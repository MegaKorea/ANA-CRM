import { LeadClassificationRuleErrorCode, HttpStatusCode, ParseIntBase, LeadStatus } from '@/constants/enums';
import { AppError } from '@/errors';
import type {
  CreateLeadClassificationRuleInput,
  UpdateLeadClassificationRuleInput,
} from '@/lib/services/lead-classification-rule.service';

const MIN_RECENT_INTERACTION_HOURS = 1;
const MAX_RECENT_INTERACTION_HOURS = 720;

const VALID_LEAD_STATUSES = new Set<string>(Object.values(LeadStatus));

function parseName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(LeadClassificationRuleErrorCode.NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }
  return value.trim();
}

function parseRecentInteractionHours(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < MIN_RECENT_INTERACTION_HOURS ||
    value > MAX_RECENT_INTERACTION_HOURS
  ) {
    throw new AppError(LeadClassificationRuleErrorCode.HOURS_INVALID, HttpStatusCode.BAD_REQUEST);
  }
  return value;
}

function parseRacKqtStatuses(value: unknown): LeadStatus[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(LeadClassificationRuleErrorCode.STATUSES_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }
  for (const status of value) {
    if (typeof status !== 'string' || !VALID_LEAD_STATUSES.has(status)) {
      throw new AppError(LeadClassificationRuleErrorCode.STATUSES_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
  }
  return value as LeadStatus[];
}

export function validateCreateLeadClassificationRuleInput(input: unknown): CreateLeadClassificationRuleInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(LeadClassificationRuleErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  return {
    name: parseName(data.name),
    recentInteractionHours: parseRecentInteractionHours(data.recentInteractionHours),
    racKqtStatuses: parseRacKqtStatuses(data.racKqtStatuses),
  };
}

export function validateUpdateLeadClassificationRuleInput(input: unknown): UpdateLeadClassificationRuleInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(LeadClassificationRuleErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;
  const result: UpdateLeadClassificationRuleInput = {};

  if (data.name !== undefined) result.name = parseName(data.name);
  if (data.recentInteractionHours !== undefined) {
    result.recentInteractionHours = parseRecentInteractionHours(data.recentInteractionHours);
  }
  if (data.racKqtStatuses !== undefined) result.racKqtStatuses = parseRacKqtStatuses(data.racKqtStatuses);

  return result;
}

export function validateLeadClassificationRuleId(id: unknown): number {
  if (typeof id !== 'string') {
    throw new AppError(LeadClassificationRuleErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const parsedId = parseInt(id, ParseIntBase.DECIMAL);

  if (isNaN(parsedId) || parsedId <= 0) {
    throw new AppError(LeadClassificationRuleErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return parsedId;
}
