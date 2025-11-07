// supabase/functions/get-admin-stats/index.ts
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  (Deno as any).env.get('SUPABASE_URL') ?? '',
  (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Check for JWT and authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) {
      throw userError || new Error('User not found from JWT');
    }

    // 2. Authorize: Only the admin can access this function
    if (user.email !== 'kaankaramann55@gmail.com') {
      return new Response(JSON.stringify({ error: 'Permission denied.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
      });
    }

    // 3. Fetch all stats in parallel
    const [
      { count: totalUsers, error: usersError },
      { count: onlineUsers, error: onlineError },
      { count: totalMessages, error: messagesError },
      { count: totalServers, error: serversError },
      { data: allUsersData, error: allUsersError },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'online'),
      supabaseAdmin.from('messages').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('servers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*').order('username', { ascending: true }),
    ]);

    const errors = { usersError, onlineError, messagesError, serversError, allUsersError };
    for (const key in errors) {
        const error = (errors as any)[key];
        if (error) throw new Error(`Error fetching ${key}: ${error.message}`);
    }

    // 4. Construct the response payload
    const responsePayload = {
      stats: {
        totalUsers: totalUsers ?? 0,
        onlineUsers: onlineUsers ?? 0,
        totalMessages: totalMessages ?? 0,
        totalServers: totalServers ?? 0,
      },
      allUsers: allUsersData || [],
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-admin-stats function:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
