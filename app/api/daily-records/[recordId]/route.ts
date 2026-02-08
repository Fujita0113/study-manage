import { NextRequest, NextResponse } from 'next/server';
import { updateDailyRecord } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = await params;
    const body = await request.json();
    const { achievementLevel, doText, journalText, recoveryAchieved } = body;

    // 更新
    const updatedRecord = await updateDailyRecord(recordId, {
      achievementLevel,
      doText,
      journalText,
      recoveryAchieved,
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating daily record:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
