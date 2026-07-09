-- Network v13: índice pra baratear a query de "não lidas" (/api/network/status),
-- que ordena as mensagens recentes por created_at ignorando as deletadas.
-- Sem isso o Postgres varre/ordena a tabela toda a cada poll. Com o índice parcial
-- vira uma leitura barata. Ajuda o banco independente da caixinha flutuante.
create index if not exists idx_network_messages_recent
  on network_messages (created_at desc)
  where deleted_at is null;
