import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('./.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}))
const svc=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}})
function withTimeout(p,ms,label){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('TIMEOUT '+ms+'ms')),ms))]).then(v=>({label,ok:true,v})).catch(e=>({label,ok:false,e:e.message}))}
const t0=Date.now()
const r1=await withTimeout(svc.from('profiles').select('id',{head:true,count:'exact'}),8000,'profiles-count')
console.log(r1.label, r1.ok?('OK '+(r1.v.count)+' ('+(Date.now()-t0)+'ms)'):('FALHOU: '+r1.e))
const t1=Date.now()
const r2=await withTimeout(svc.from('subscriptions').select('tenant_id,status,expires_at').eq('status','active').limit(3),8000,'subs')
console.log(r2.label, r2.ok?('OK ('+(Date.now()-t1)+'ms)'):('FALHOU: '+r2.e))
