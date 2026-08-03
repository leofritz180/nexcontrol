-- Tipo da captura: 'deposito' (default) ou 'saque'. Deixa o card de Saque
-- pronto no backend — a extensao envia tipo='saque' quando ler a tela de saque.
alter table deposit_captures add column if not exists tipo text not null default 'deposito';
