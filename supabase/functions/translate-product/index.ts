import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireCaller, unauthorizedResponse } from '../_shared/authGuard.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const __caller = await requireCaller(req);
  if (!__caller) return unauthorizedResponse(corsHeaders);



  try {
    const { productId, force = false } = await req.json()
    if (!productId || typeof productId !== 'string') {
      return new Response(JSON.stringify({ error: 'productId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('id, title, description, included_items, title_en, description_en, included_items_en')
      .eq('id', productId)
      .maybeSingle()

    if (fetchErr || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const needTitle = !!product.title && (force || !product.title_en)
    const needDesc = !!product.description && (force || !product.description_en)
    const hasIncluded = Array.isArray(product.included_items) && product.included_items.length > 0
    const needIncluded =
      hasIncluded && (force || !Array.isArray(product.included_items_en) || product.included_items_en.length !== product.included_items.length)

    if (!needTitle && !needDesc && !needIncluded) {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt =
      'You are a professional translator for a peer-to-peer rental marketplace. Translate from Romanian to natural, concise English. Preserve product names, brand names, model numbers, and units (cm, mm, kg, RON, V, W, Hz). Keep the same tone. Return ONLY the translated text — no quotes, no explanations, no prefixes.'

    async function translate(text: string, kind: 'title' | 'description'): Promise<string> {
      const userPrompt =
        kind === 'title'
          ? `Translate this product title to English (max 100 chars, no trailing punctuation):\n\n${text}`
          : `Translate this product description to English, preserving line breaks:\n\n${text}`

      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })

      if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(`AI gateway ${resp.status}: ${errText}`)
      }

      const data = await resp.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content || typeof content !== 'string') {
        throw new Error('Empty AI response')
      }
      return content.trim()
    }

    async function translateItems(items: string[]): Promise<string[]> {
      const userPrompt =
        `Translate each item in this JSON array from Romanian to short English (1-3 words each, lowercase unless proper noun). Preserve order and length. Return ONLY a JSON array of strings, no prose.\n\n${JSON.stringify(items)}`

      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })
      if (!resp.ok) throw new Error(`AI gateway ${resp.status}: ${await resp.text()}`)
      const data = await resp.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content || typeof content !== 'string') throw new Error('Empty AI response')
      const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(cleaned)
      if (!Array.isArray(parsed) || parsed.length !== items.length || !parsed.every((s) => typeof s === 'string')) {
        throw new Error('Invalid translated array')
      }
      return parsed.map((s) => s.trim())
    }

    const updates: Record<string, string | string[]> = {}

    if (needTitle) {
      try {
        updates.title_en = await translate(product.title, 'title')
      } catch (e) {
        console.error('Title translation failed', e)
      }
    }
    if (needDesc) {
      try {
        updates.description_en = await translate(product.description!, 'description')
      } catch (e) {
        console.error('Description translation failed', e)
      }
    }
    if (needIncluded) {
      try {
        updates.included_items_en = await translateItems(product.included_items as string[])
      } catch (e) {
        console.error('Included items translation failed', e)
      }
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'All translations failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (updateErr) {
      console.error('Update failed', updateErr)
      return new Response(JSON.stringify({ error: 'Failed to save translations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, updated: Object.keys(updates) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('translate-product error', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}, "POST, OPTIONS"))