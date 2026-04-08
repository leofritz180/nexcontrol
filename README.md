# NexControl V4 Completo

## Como rodar

1. Extraia o zip.
2. Abra a pasta no VS Code.
3. Duplique `.env.example` para `.env.local`.
4. Preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. No terminal:
   ```bash
   npm install
   npm run dev
   ```

## Rotas
- `/` Home
- `/login` Login
- `/operator` Painel do operador
- `/admin` Painel admin
- `/meta/[id]` Página da meta

## SQL base sugerido
Veja `supabase-schema.sql`
