import { NextRequest, NextResponse } from 'next/server';
import { requireReportsAccess } from '@/lib/api/reports-access';
import { activateLeadClassificationRuleById } from '@/lib/services/lead-classification-rule.service';
import { validateLeadClassificationRuleId } from '@/lib/validators/lead-classification-rule.validator';
import { HttpStatusCode, LeadClassificationRuleErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { id } = await params;
    const ruleId = validateLeadClassificationRuleId(id);
    const rule = await activateLeadClassificationRuleById(ruleId);
    return NextResponse.json(rule, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadClassificationRuleErrorCode.INTERNAL_SERVER_ERROR);
  }
}
