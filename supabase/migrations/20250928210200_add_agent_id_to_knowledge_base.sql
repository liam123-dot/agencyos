
alter table knowledge_base add column agent_id uuid references agents(id);