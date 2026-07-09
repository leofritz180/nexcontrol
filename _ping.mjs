import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('./.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}))
const svc=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}})
try{
  const t=Date.now()
  const {data,error,count}=await svc.from('profiles').select('id',{count:'exact',head:true})
  console.log('Supabase profiles ->', error?('ERRO: '+error.message):('OK, '+count+' perfis, '+(Date.now()-t)+'ms'))
}catch(e){console.log('Supabase EXCEPTION:', e.message)}
try{
  const {error}=await svc.from('metas').select('id',{count:'exact',head:true})
  console.log('Supabase metas ->', error?('ERRO: '+error.message):'OK')
}catch(e){console.log('metas EXCEPTION:', e.message)}
