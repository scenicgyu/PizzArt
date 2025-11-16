import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin (check Firebase admin_users collection)
    // For now, we'll fetch revenue stats

    // Get total revenue (all time)
    const { data: totalStats, error: totalError } = await supabase
      .from('revenue_stats')
      .select('total_revenue, total_orders, successful_payments')
      .order('date', { ascending: false });

    if (totalError) {
      throw new Error('Failed to fetch revenue stats');
    }

    const totalRevenue = totalStats?.reduce((sum, stat) => sum + Number(stat.total_revenue), 0) || 0;
    const totalOrders = totalStats?.reduce((sum, stat) => sum + stat.total_orders, 0) || 0;
    const totalPayments = totalStats?.reduce((sum, stat) => sum + stat.successful_payments, 0) || 0;

    // Get today's revenue
    const today = new Date().toISOString().split('T')[0];
    const { data: todayStats } = await supabase
      .from('revenue_stats')
      .select('*')
      .eq('date', today)
      .single();

    // Get last 30 days stats
    const { data: recentStats } = await supabase
      .from('revenue_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    // Get pending payments count
    const { count: pendingCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          total_payments: totalPayments,
          today: todayStats || { total_revenue: 0, total_orders: 0, successful_payments: 0 },
          recent: recentStats || [],
          pending_payments: pendingCount || 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});