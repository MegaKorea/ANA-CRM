import { NextRequest, NextResponse } from 'next/server';
import { requireReportsAccess } from '@/lib/api/reports-access';
import {
  fetchAllLeadClassificationRules,
  createLeadClassificationRule,
} from '@/lib/services/lead-classification-rule.service';
import { validateCreateLeadClassificationRuleInput } from '@/lib/validators/lead-classification-rule.validator';
import { HttpStatusCode, LeadClassificationRuleErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const rules = await fetchAllLeadClassificationRules();
    return NextResponse.json(rules, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadClassificationRuleErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const body = await request.json();
    const input = validateCreateLeadClassificationRuleInput(body);
    const rule = await createLeadClassificationRule(input);
    return NextResponse.json(rule, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, LeadClassificationRuleErrorCode.INTERNAL_SERVER_ERROR);
  }
}
