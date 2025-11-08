import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('credit_balance, subscription_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      balance: profile?.credit_balance || 0,
      subscription: profile?.subscription_status || 'free',
    });
  } catch (error: any) {
    console.error('Get credit balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
