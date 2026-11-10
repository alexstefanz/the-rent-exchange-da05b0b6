import { withCors, PRIMARY_ORIGIN } from "../_shared/cors.ts";
import { requireCaller, unauthorizedResponse } from '../_shared/authGuard.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": PRIMARY_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const MODEL = 'google/gemini-3-flash-preview'
const CONDITIONS = ['new', 'very_good', 'good', 'used']

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

async function callAI(messages: unknown[], tool: { name: string; parameters: unknown }) {
  const key = Deno.env.get('LOVABLE_API_KEY')
  if (!key) return { error: 'LOVABLE_API_KEY lipsă', status: 500 }
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: [{ type: 'function', function: { name: tool.name, description: tool.name, parameters: tool.parameters } }],
      tool_choice: { type: 'function', function: { name: tool.name } },
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    console.error('AI error', res.status, txt)
    const msg = res.status === 429 ? 'Prea multe cereri. Încearcă din nou în câteva momente.'
      : res.status === 402 ? 'Creditele AI s-au epuizat.' : 'Serviciul AI nu este disponibil momentan.'
    return { error: msg, status: res.status }
  }
  const data = await res.json()
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
  if (!args) return { error: 'AI-ul nu a putut analiza produsul.', status: 422 }
  try { return { result: JSON.parse(args) } } catch { return { error: 'Răspuns AI invalid.', status: 422 } }
}

Deno.serve(withCors(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const caller = await requireCaller(req)
  if (!caller) return unauthorizedResponse(corsHeaders)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'JSON invalid' }, 400) }
  const action = body?.action

  if (action === 'autofill') {
    const images: string[] = Array.isArray(body.images) ? body.images.filter((u: unknown) => typeof u === 'string' && /^https:\/\//.test(u as string)).slice(0, 3) : []
    const cats = Array.isArray(body.categories) ? body.categories.slice(0, 40) : []
    if (!images.length) return json({ error: 'Adaugă cel puțin o poză.' }, 400)
    const catList = cats.map((c: any) => `- ${String(c.name)}: ${(c.subcategories || []).map((s: unknown) => String(s)).join(', ')}`).join('\n')
    const out = await callAI([
      { role: 'system', content: `Ești asistent pentru marketplace-ul de închirieri Rentli din România. Analizează pozele și completează anunțul în limba română. Categoriile și subcategoriile permise (folosește EXACT aceste nume):\n${catList}\nReguli: titlu max 60 caractere cu brand/model dacă se vede; descriere 2–4 propoziții prietenoase, fără preț, fără date de contact, fără limbaj vulgar; starea dedusă din poză: new (nou, sigilat), very_good (foarte bun), good (bun), used (cu urme de utilizare).` },
      { role: 'user', content: [{ type: 'text', text: 'Completează anunțul pentru produsul din poze.' }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))] },
    ], {
      name: 'fill_listing',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' }, category: { type: 'string' }, subcategory: { type: 'string' },
          description: { type: 'string' }, condition: { type: 'string', enum: CONDITIONS },
        },
        required: ['title', 'category', 'subcategory', 'description', 'condition'],
        additionalProperties: false,
      },
    })
    if ('error' in out) return json({ error: out.error }, out.status)
    const r = out.result
    const cat = cats.find((c: any) => c.name === r.category)
    return json({
      title: String(r.title || '').slice(0, 60),
      category: cat ? cat.name : '',
      subcategory: cat && (cat.subcategories || []).includes(r.subcategory) ? r.subcategory : '',
      description: String(r.description || '').slice(0, 1500),
      condition: CONDITIONS.includes(r.condition) ? r.condition : '',
    })
  }

  if (action === 'estimate') {
    const s = (v: unknown, n: number) => String(v ?? '').slice(0, n)
    const title = s(body.title, 120)
    if (!title) return json({ error: 'Completează titlul pentru estimare.' }, 400)
    const out = await callAI([
      { role: 'system', content: 'Ești expert în prețuri pentru piața din România (închirieri peer-to-peer). Estimezi valoarea de piață a bunului (preț second-hand/nou corespunzător stării) și prețul recomandat de închiriere pe zi, în RON, numere întregi. Prețul pe zi tipic 2–8% din valoare, ajustat după categorie și cerere. Nota: o singură propoziție în română.' },
      { role: 'user', content: `Titlu: ${title}\nCategorie: ${s(body.category, 80)} / ${s(body.subcategory, 80)}\nStare: ${s(body.condition, 20)}\nDescriere: ${s(body.description, 1500)}` },
    ], {
      name: 'price_estimate',
      parameters: {
        type: 'object',
        properties: {
          value_min: { type: 'integer' }, value_max: { type: 'integer' },
          daily_suggested: { type: 'integer' }, daily_min: { type: 'integer' }, daily_max: { type: 'integer' },
          note: { type: 'string' },
        },
        required: ['value_min', 'value_max', 'daily_suggested', 'daily_min', 'daily_max', 'note'],
        additionalProperties: false,
      },
    })
    if ('error' in out) return json({ error: out.error }, out.status)
    const r = out.result
    const i = (v: unknown) => Math.max(0, Math.round(Number(v) || 0))
    return json({
      value_min: i(r.value_min), value_max: i(r.value_max),
      daily_suggested: Math.max(2, i(r.daily_suggested)), daily_min: i(r.daily_min), daily_max: i(r.daily_max),
      note: String(r.note || '').slice(0, 300),
    })
  }

  return json({ error: 'Acțiune necunoscută' }, 400)
}, "POST, OPTIONS"))
