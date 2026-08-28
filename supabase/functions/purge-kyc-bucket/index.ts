import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let removed = 0
  const walk = async (prefix: string) => {
    const { data, error } = await admin.storage.from('kyc-documents').list(prefix, { limit: 1000 })
    if (error) throw error
    const files: string[] = []
    for (const entry of data ?? []) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) await walk(path)
      else files.push(path)
    }
    if (files.length) {
      const { error: delErr } = await admin.storage.from('kyc-documents').remove(files)
      if (delErr) throw delErr
      removed += files.length
    }
  }

  try {
    await walk('')
    const { error } = await admin.storage.deleteBucket('kyc-documents')
    return new Response(JSON.stringify({ removed, bucketDeleted: !error, bucketError: error?.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), removed }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
