import { NextRequest, NextResponse } from 'next/server';
import { requireReportsAccess } from '@/lib/api/reports-access';
import {
  updateLeadClassificationRuleById,
  deleteLeadClassificationRuleById,
} from '@/lib/services/lead-classification-rule.service';
import {
  validateLeadClassificationRuleId,
  validateUpdateLeadClassificationRuleInput,
} from '@/lib/validators/lead-classification-rule.validator';
import { HttpStatusCode, LeadClassificationRuleErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { id } = await params;
    const ruleId = validateLeadClassificationRuleId(id);
    const body = await request.json();
    const input = validateUpdateLeadClassificationRuleInput(body);
    const rule = await updateLeadClassificationRuleById(ruleId, input);
    return NextResponse.json(rule, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadClassificationRuleErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { id } = await params;
    const ruleId = validateLeadClassificationRuleId(id);
    await deleteLeadClassificationRuleById(ruleId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadClassificationRuleErrorCode.INTERNAL_SERVER_ERROR);
  }
}
