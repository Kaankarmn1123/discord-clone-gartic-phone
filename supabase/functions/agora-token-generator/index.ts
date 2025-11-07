// supabase/functions/agora-token-generator/index.ts
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token';
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) {
      throw userError || new Error('User not found from JWT');
    }
    const userIdFromJwt = user.id;

    const body = await req.json();
    const { channelName, uid: requestedUid } = body;

    if (!channelName) {
      return new Response(JSON.stringify({ error: 'channelName is a required parameter.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
      });
    }

    const appId = (Deno as any).env.get('AGORA_APP_ID');
    const appCertificate = (Deno as any).env.get('AGORA_APP_CERTIFICATE');

    if (!appId || !appCertificate) {
        console.error('Agora App ID or Certificate is not set in Supabase Function secrets.');
        return new Response(JSON.stringify({ error: 'Server configuration error: Agora secrets are missing.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    const uidForToken = requestedUid || userIdFromJwt;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 saat
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uidForToken,
      role,
      privilegeExpiredTs
    );
    
    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in function process:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
