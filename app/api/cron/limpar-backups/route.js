import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cronAutorizado } from '../../../../lib/cron-auth'
import { limparAntigas } from '../../../../lib/zerar'

export const maxDuration = 60

// As cópias de "zerar a operação" (lib/zerar.js) vivem 7 dias no Storage.
// Este cron apaga as vencidas, uma vez por dia.
export async function GET(req) {
  if (!cronAutorizado(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const removidas = await limparAntigas(sb)
    return NextResponse.json({ ok: true, removidas })
  } catch (e) {
    console.error('[limpar-backups]', e?.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
