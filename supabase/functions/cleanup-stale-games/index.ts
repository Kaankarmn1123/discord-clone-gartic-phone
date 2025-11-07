// supabase/functions/cleanup-stale-games/index.ts
// Deno-lint-ignore-file no-explicit-any
// FIX: Declare Deno for TypeScript environment
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bu fonksiyonun Supabase Dashboard üzerinden bir cron job ile
// (örneğin her 5 dakikada bir) çalıştırılması hedeflenmiştir.
// Örnek cron schedule: */5 * * * *

serve(async (_req: Request) => {
  // Sadece POST veya cron job tetiklemelerini kabul et
  if (_req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const supabaseAdmin = createClient(
      // FIX: Cast Deno to any to access env variables
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5 dakikadan daha eski, 'lobby' veya 'prompting' durumundaki oturumları bul
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: staleSessions, error: staleError } = await supabaseAdmin
      .from('game_sessions')
      .select('id')
      .in('status', ['lobby', 'prompting'])
      .lt('created_at', fiveMinutesAgo);

    if (staleError) throw staleError;
    if (!staleSessions || staleSessions.length === 0) {
        return new Response(JSON.stringify({ message: 'Temizlenecek eski oturum bulunamadı.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const staleSessionIds = staleSessions.map(s => s.id);
    
    // Bu eski oturumlar içinde oyuncusu olmayanları bul
    const { data: sessionsWithPlayers, error: playersError } = await supabaseAdmin
        .from('game_session_players')
        .select('session_id')
        .in('session_id', staleSessionIds);
        
    if(playersError) throw playersError;

    const sessionsWithPlayersIds = new Set(sessionsWithPlayers.map(p => p.session_id));
    const sessionsToCloseIds = staleSessionIds.filter(id => !sessionsWithPlayersIds.has(id));

    if (sessionsToCloseIds.length === 0) {
        return new Response(JSON.stringify({ message: 'Oyuncusu olmayan eski oturum bulunamadı.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
    
    // Oyuncusu olmayan eski oturumları 'finished' olarak güncelle
    const { count, error: updateError } = await supabaseAdmin
      .from('game_sessions')
      .update({ status: 'finished' })
      .in('id', sessionsToCloseIds);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ message: `${count} adet boşta kalmış oyun oturumu başarıyla temizlendi.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Hayalet oyun temizleme hatası:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
