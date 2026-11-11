-- =============================================================
-- Lyra CRM · Dados de exemplo (opcional, escolhido no onboarding)
-- =============================================================

create or replace function private.seed_demo_data(p_org uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pipeline uuid;
  s_novo uuid;
  s_contato uuid;
  s_qualificado uuid;
  s_proposta uuid;
  s_negociacao uuid;
  s_ganho uuid;
  s_perdido uuid;
  p_diagnostico uuid;
  p_implantacao uuid;
  p_gestao uuid;
  p_treinamento uuid;
  p_suporte uuid;
  l_patricia uuid;
  l_thiago uuid;
  l_juliana uuid;
  l_carlos uuid;
  l_lucas uuid;
  l_beatriz uuid;
  c_martins uuid;
  c_bemestar uuid;
  c_vertice uuid;
  c_aurora uuid;
  c_nexo uuid;
  c_solaris uuid;
  v_prop uuid;
  v_today timestamptz := date_trunc('hour', now());
begin
  select id into v_pipeline
  from public.pipelines
  where organization_id = p_org and is_default
  order by position
  limit 1;

  if v_pipeline is null then
    return;
  end if;

  select id into s_novo from public.pipeline_stages where pipeline_id = v_pipeline and position = 0;
  select id into s_contato from public.pipeline_stages where pipeline_id = v_pipeline and position = 1;
  select id into s_qualificado from public.pipeline_stages where pipeline_id = v_pipeline and position = 2;
  select id into s_proposta from public.pipeline_stages where pipeline_id = v_pipeline and position = 3;
  select id into s_negociacao from public.pipeline_stages where pipeline_id = v_pipeline and position = 4;
  select id into s_ganho from public.pipeline_stages where pipeline_id = v_pipeline and position = 5;
  select id into s_perdido from public.pipeline_stages where pipeline_id = v_pipeline and position = 6;

  -- Catálogo ---------------------------------------------------
  insert into public.products (organization_id, name, description, unit_price, unit, billing)
  values (p_org, 'Diagnóstico comercial', 'Mapeamento do processo de vendas, gargalos e oportunidades de receita.', 4500, 'projeto', 'one_time')
  returning id into p_diagnostico;
  insert into public.products (organization_id, name, description, unit_price, unit, billing)
  values (p_org, 'Implantação', 'Configuração do processo, integrações e migração de dados.', 3200, 'projeto', 'one_time')
  returning id into p_implantacao;
  insert into public.products (organization_id, name, description, unit_price, unit, billing)
  values (p_org, 'Gestão comercial mensal', 'Acompanhamento semanal, rituais de pipeline e relatórios.', 2800, 'mês', 'monthly')
  returning id into p_gestao;
  insert into public.products (organization_id, name, description, unit_price, unit, billing)
  values (p_org, 'Treinamento da equipe', 'Workshop prático de 4 horas para até 15 pessoas.', 1200, 'turma', 'one_time')
  returning id into p_treinamento;
  insert into public.products (organization_id, name, description, unit_price, unit, billing)
  values (p_org, 'Suporte premium', 'Atendimento prioritário com SLA de 4 horas úteis.', 900, 'mês', 'monthly')
  returning id into p_suporte;

  -- Leads -------------------------------------------------------
  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at)
  values
    (p_org, v_pipeline, s_novo, 1000, 'Mariana Costa', 'Grupo Horizonte', 'Diretora de Operações', 'mariana@grupohorizonte.example', '(11) 90000-0101', 'site',
      12000, 'warm', false, true, true, false, array['varejo'], p_user, p_user, now() - interval '2 days', now() - interval '2 days'),
    (p_org, v_pipeline, s_novo, 2000, 'Rafael Mendes', 'Mendes Logística', 'Gerente Comercial', 'rafael@mendeslog.example', '(21) 90000-0102', 'linkedin',
      8500, 'cold', false, false, true, false, array['logística'], p_user, p_user, now() - interval '1 day', now() - interval '1 day'),
    (p_org, v_pipeline, s_novo, 3000, 'Gustavo Pereira', 'Pereira Transportes', 'Sócio', 'gustavo@pereiratransportes.example', '(31) 90000-0103', 'whatsapp',
      6000, 'cold', false, true, false, false, array['logística'], p_user, p_user, now() - interval '5 hours', now() - interval '5 hours');

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at)
  values (p_org, v_pipeline, s_contato, 1000, 'Juliana Prado', 'Clínica Vitta', 'Diretora Administrativa', 'juliana@clinicavitta.example', '(11) 90000-0104', 'indicacao',
      15000, 'hot', true, true, true, false, array['saúde'], p_user, p_user, now() - interval '9 days', now() - interval '3 days')
  returning id into l_juliana;

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at)
  values (p_org, v_pipeline, s_contato, 2000, 'Carlos Eduardo Lima', 'Lima Engenharia', 'CEO', 'carlos@limaengenharia.example', '(19) 90000-0105', 'evento',
      22000, 'warm', false, true, true, true, array['construção'], p_user, p_user, now() - interval '12 days', now() - interval '6 days')
  returning id into l_carlos;

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at)
  values (p_org, v_pipeline, s_qualificado, 1000, 'Beatriz Nogueira', 'Studio Nogueira', 'Fundadora', 'beatriz@studionogueira.example', '(41) 90000-0106', 'instagram',
      9800, 'hot', true, true, true, true, array['serviços'], p_user, p_user, now() - interval '16 days', now() - interval '4 days')
  returning id into l_beatriz;

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at)
  values
    (p_org, v_pipeline, s_qualificado, 2000, 'André Ferraz', 'Ferraz Advocacia', 'Sócio-diretor', 'andre@ferrazadv.example', '(61) 90000-0107', 'indicacao',
      18000, 'warm', true, true, false, true, array['jurídico'], p_user, p_user, now() - interval '20 days', now() - interval '8 days'),
    (p_org, v_pipeline, s_negociacao, 2000, 'Fernanda Ribeiro', 'Ribeiro Imóveis', 'Diretora Comercial', 'fernanda@ribeiroimoveis.example', '(48) 90000-0108', 'google_ads',
      27500, 'warm', true, true, true, false, array['imobiliário'], p_user, p_user, now() - interval '30 days', now() - interval '5 days'),
    (p_org, v_pipeline, s_perdido, 1000, 'Camila Duarte', 'Duarte Cosméticos', 'Head de Marketing', 'camila@duartecosmeticos.example', '(11) 90000-0109', 'linkedin',
      14000, 'cold', false, true, true, false, array['varejo'], p_user, p_user, now() - interval '34 days', now() - interval '10 days');

  update public.leads set lost_reason = 'Escolheu um concorrente com preço menor'
  where organization_id = p_org and name = 'Camila Duarte';

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at, expected_close_date)
  values (p_org, v_pipeline, s_proposta, 1000, 'Patrícia Almeida', 'Almeida Foods', 'Diretora Geral', 'patricia@almeidafoods.example', '(11) 90000-0110', 'site',
      32000, 'hot', true, true, true, true, array['alimentos'], p_user, p_user, now() - interval '22 days', now() - interval '2 days', current_date + 14)
  returning id into l_patricia;

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at, expected_close_date)
  values (p_org, v_pipeline, s_negociacao, 1000, 'Thiago Rocha', 'Rocha Tech', 'CTO', 'thiago@rochatech.example', '(11) 90000-0111', 'outbound',
      45000, 'hot', true, true, true, true, array['tecnologia'], p_user, p_user, now() - interval '28 days', now() - interval '3 days', current_date + 7)
  returning id into l_thiago;

  insert into public.leads (organization_id, pipeline_id, stage_id, position, name, company, job_title, email, phone, source,
    estimated_value, temperature, qual_budget, qual_authority, qual_need, qual_timing, tags, owner_id, created_by, created_at, stage_changed_at)
  values (p_org, v_pipeline, s_ganho, 1000, 'Lucas Martins', 'Martins Varejo', 'Sócio-diretor', 'lucas@martinsvarejo.example', '(11) 90000-0112', 'indicacao',
      19000, 'hot', true, true, true, true, array['varejo'], p_user, p_user, now() - interval '260 days', now() - interval '240 days')
  returning id into l_lucas;

  -- Clientes ----------------------------------------------------
  insert into public.clients (organization_id, name, legal_name, kind, document, email, phone, website, industry, city, state,
    status, status_changed_at, position, monthly_value, customer_since, tags, owner_id, lead_id, created_by, created_at)
  values (p_org, 'Martins Varejo', 'Martins Comércio Varejista Ltda.', 'company', '12.345.678/0001-90', 'contato@martinsvarejo.example',
      '(11) 90000-0201', 'martinsvarejo.example', 'Varejo', 'São Paulo', 'SP',
      'active', now() - interval '200 days', 1000, 3700, current_date - 240, array['varejo'], p_user, l_lucas, p_user, now() - interval '240 days')
  returning id into c_martins;

  update public.leads set converted_client_id = c_martins, converted_at = now() - interval '240 days' where id = l_lucas;

  insert into public.clients (organization_id, name, legal_name, kind, document, email, phone, website, industry, city, state,
    status, status_changed_at, position, monthly_value, customer_since, tags, owner_id, created_by, created_at)
  values (p_org, 'Clínica Bem Estar', 'Bem Estar Serviços Médicos Ltda.', 'company', '23.456.789/0001-01', 'adm@clinicabemestar.example',
      '(31) 90000-0202', 'clinicabemestar.example', 'Saúde', 'Belo Horizonte', 'MG',
      'onboarding', now() - interval '12 days', 1000, 2800, current_date - 12, array['saúde'], p_user, p_user, now() - interval '12 days')
  returning id into c_bemestar;

  insert into public.clients (organization_id, name, legal_name, kind, document, email, phone, website, industry, city, state,
    status, status_changed_at, position, monthly_value, customer_since, tags, owner_id, created_by, created_at)
  values (p_org, 'Vértice Construtora', 'Vértice Engenharia e Construções S.A.', 'company', '34.567.890/0001-12', 'contato@verticeconstrutora.example',
      '(19) 90000-0203', 'verticeconstrutora.example', 'Construção civil', 'Campinas', 'SP',
      'active', now() - interval '380 days', 2000, 6500, current_date - 410, array['construção'], p_user, p_user, now() - interval '410 days')
  returning id into c_vertice;

  insert into public.clients (organization_id, name, legal_name, kind, document, email, phone, website, industry, city, state,
    status, status_changed_at, position, monthly_value, customer_since, tags, owner_id, created_by, created_at)
  values (p_org, 'Aurora Educação', 'Aurora Ensino e Tecnologia Ltda.', 'company', '45.678.901/0001-23', 'coordenacao@auroraeducacao.example',
      '(41) 90000-0204', 'auroraeducacao.example', 'Educação', 'Curitiba', 'PR',
      'at_risk', now() - interval '6 days', 1000, 1900, current_date - 300, array['educação'], p_user, p_user, now() - interval '300 days')
  returning id into c_aurora;

  insert into public.clients (organization_id, name, legal_name, kind, document, email, phone, website, industry, city, state,
    status, status_changed_at, position, monthly_value, customer_since, tags, owner_id, created_by, created_at)
  values (p_org, 'Nexo Contabilidade', 'Nexo Assessoria Contábil Ltda.', 'company', '56.789.012/0001-34', 'socios@nexocontabil.example',
      '(51) 90000-0205', 'nexocontabil.example', 'Serviços contábeis', 'Porto Alegre', 'RS',
      'paused', now() - interval '40 days', 1000, 0, current_date - 520, array['serviços'], p_user, p_user, now() - interval '520 days')
  returning id into c_nexo;

  insert into public.clients (organization_id, name, legal_name, kind, document, email, phone, website, industry, city, state,
    status, status_changed_at, position, monthly_value, customer_since, tags, owner_id, created_by, created_at)
  values (p_org, 'Solaris Energia', 'Solaris Energia Renovável Ltda.', 'company', '67.890.123/0001-45', 'marketing@solarisenergia.example',
      '(81) 90000-0206', 'solarisenergia.example', 'Energia solar', 'Recife', 'PE',
      'churned', now() - interval '90 days', 1000, 0, current_date - 700, array['energia'], p_user, p_user, now() - interval '700 days')
  returning id into c_solaris;

  -- Contatos ----------------------------------------------------
  insert into public.contacts (organization_id, client_id, name, job_title, email, phone, is_primary) values
    (p_org, c_martins, 'Lucas Martins', 'Sócio-diretor', 'lucas@martinsvarejo.example', '(11) 90000-0112', true),
    (p_org, c_bemestar, 'Helena Souza', 'Diretora clínica', 'helena@clinicabemestar.example', '(31) 90000-0301', true),
    (p_org, c_bemestar, 'Marcos Paulo', 'Gerente administrativo', 'marcos@clinicabemestar.example', '(31) 90000-0302', false),
    (p_org, c_vertice, 'Ricardo Vasconcelos', 'Diretor comercial', 'ricardo@verticeconstrutora.example', '(19) 90000-0303', true),
    (p_org, c_aurora, 'Sílvia Rezende', 'Coordenadora pedagógica', 'silvia@auroraeducacao.example', '(41) 90000-0304', true),
    (p_org, c_nexo, 'Paulo Henrique', 'Sócio', 'paulo@nexocontabil.example', '(51) 90000-0305', true),
    (p_org, c_solaris, 'Renata Campos', 'Gerente de marketing', 'renata@solarisenergia.example', '(81) 90000-0306', true);

  -- Propostas ---------------------------------------------------
  insert into public.proposals (organization_id, title, lead_id, status, valid_until, intro, sections, terms,
    sent_at, viewed_at, owner_id, created_by, created_at)
  values (
    p_org, 'Estruturação comercial — Almeida Foods', l_patricia, 'viewed', current_date + 13,
    'Olá, Patrícia! Conforme conversamos, preparamos esta proposta para estruturar o processo comercial da Almeida Foods, com foco em previsibilidade de receita e produtividade do time.',
    jsonb_build_array(
      jsonb_build_object('id', 'contexto', 'title', 'Contexto',
        'body', 'Hoje o time comercial trabalha com planilhas e cada vendedor segue um processo próprio. Isso dificulta prever a receita do mês e entender onde as oportunidades se perdem.'),
      jsonb_build_object('id', 'escopo', 'title', 'Escopo',
        'body', E'- Diagnóstico do funil atual e definição das etapas de venda\n- Implantação do processo no CRM com importação da base\n- Rituais semanais de pipeline com a liderança\n- Treinamento prático para o time'),
      jsonb_build_object('id', 'cronograma', 'title', 'Cronograma',
        'body', E'Semanas 1 e 2 — diagnóstico e desenho do processo\nSemanas 3 e 4 — implantação e treinamento\nA partir do mês 2 — gestão comercial contínua')
    ),
    E'Implantação: 50% na assinatura e 50% na entrega.\nMensalidade com vencimento todo dia 10.\nContrato mínimo de 6 meses.',
    now() - interval '2 days', now() - interval '1 day', p_user, p_user, now() - interval '3 days'
  )
  returning id into v_prop;

  insert into public.proposal_items (organization_id, proposal_id, product_id, name, description, quantity, unit_price, discount_pct, billing, position) values
    (p_org, v_prop, p_diagnostico, 'Diagnóstico comercial', 'Mapeamento do processo de vendas, gargalos e oportunidades de receita.', 1, 4500, 0, 'one_time', 0),
    (p_org, v_prop, p_implantacao, 'Implantação', 'Configuração do processo, integrações e migração de dados.', 1, 3200, 10, 'one_time', 1),
    (p_org, v_prop, p_treinamento, 'Treinamento da equipe', 'Workshop prático de 4 horas para até 15 pessoas.', 2, 1200, 0, 'one_time', 2),
    (p_org, v_prop, p_gestao, 'Gestão comercial mensal', 'Acompanhamento semanal, rituais de pipeline e relatórios.', 1, 2800, 0, 'monthly', 3);

  insert into public.proposals (organization_id, title, client_id, status, valid_until, intro, sections, terms,
    sent_at, viewed_at, responded_at, response_name, owner_id, created_by, created_at)
  values (
    p_org, 'Expansão do suporte — Vértice Construtora', c_vertice, 'accepted', current_date - 10,
    'Ricardo, seguindo a conversa sobre a nova filial de Campinas, segue a proposta de expansão do suporte e treinamento das novas equipes.',
    jsonb_build_array(
      jsonb_build_object('id', 'objetivo', 'title', 'Objetivo',
        'body', 'Garantir que as equipes da nova filial tenham o mesmo nível de atendimento e domínio do processo que a matriz.')
    ),
    'Pagamento em até 2x no boleto. Suporte com vigência de 12 meses.',
    now() - interval '24 days', now() - interval '23 days', now() - interval '20 days', 'Ricardo Vasconcelos', p_user, p_user, now() - interval '25 days'
  )
  returning id into v_prop;

  insert into public.proposal_items (organization_id, proposal_id, product_id, name, description, quantity, unit_price, discount_pct, billing, position) values
    (p_org, v_prop, p_treinamento, 'Treinamento da equipe', 'Workshop prático de 4 horas para até 15 pessoas.', 2, 1200, 0, 'one_time', 0),
    (p_org, v_prop, p_suporte, 'Suporte premium', 'Atendimento prioritário com SLA de 4 horas úteis.', 1, 900, 0, 'monthly', 1);

  insert into public.proposals (organization_id, title, lead_id, status, valid_until, intro, sections, terms, owner_id, created_by, created_at)
  values (
    p_org, 'Proposta comercial — Rocha Tech', l_thiago, 'draft', current_date + 15,
    'Thiago, obrigado pela reunião de diagnóstico. Abaixo está a nossa recomendação para acelerar o time de vendas da Rocha Tech.',
    jsonb_build_array(
      jsonb_build_object('id', 'contexto', 'title', 'Contexto', 'body', 'A Rocha Tech dobrou o time comercial em 2026 e precisa de um processo único de qualificação.'),
      jsonb_build_object('id', 'escopo', 'title', 'Escopo', 'body', E'- Diagnóstico comercial\n- Gestão mensal com rituais de forecast\n- Suporte premium para o time')
    ),
    'Condições a definir na negociação.',
    p_user, p_user, now() - interval '1 day'
  )
  returning id into v_prop;

  insert into public.proposal_items (organization_id, proposal_id, product_id, name, description, quantity, unit_price, discount_pct, billing, position) values
    (p_org, v_prop, p_diagnostico, 'Diagnóstico comercial', 'Mapeamento do processo de vendas, gargalos e oportunidades de receita.', 1, 4500, 0, 'one_time', 0),
    (p_org, v_prop, p_gestao, 'Gestão comercial mensal', 'Acompanhamento semanal, rituais de pipeline e relatórios.', 1, 2800, 5, 'monthly', 1),
    (p_org, v_prop, p_suporte, 'Suporte premium', 'Atendimento prioritário com SLA de 4 horas úteis.', 1, 900, 0, 'monthly', 2);

  -- Atividades e tarefas ---------------------------------------
  insert into public.activities (organization_id, lead_id, client_id, type, title, body, due_at, completed_at, created_by, created_at) values
    (p_org, l_juliana, null, 'call', 'Primeira conversa', 'Interesse em reestruturar o atendimento das três unidades. Pediu uma apresentação.', null, null, p_user, now() - interval '1 day'),
    (p_org, l_juliana, null, 'task', 'Enviar apresentação institucional', null, v_today + interval '1 day', null, p_user, now() - interval '1 day'),
    (p_org, l_carlos, null, 'task', 'Agendar demonstração com a diretoria', null, v_today - interval '1 day', null, p_user, now() - interval '4 days'),
    (p_org, l_thiago, null, 'meeting', 'Reunião de diagnóstico', 'Time comercial com 14 vendedores, ciclo médio de 45 dias. Dor principal: previsibilidade.', null, null, p_user, now() - interval '3 days'),
    (p_org, l_thiago, null, 'task', 'Revisar condições de pagamento', null, v_today + interval '2 days', null, p_user, now() - interval '2 days'),
    (p_org, l_patricia, null, 'email', 'Proposta enviada', 'Proposta enviada com cópia para o financeiro.', null, null, p_user, now() - interval '2 days'),
    (p_org, l_patricia, null, 'task', 'Follow-up da proposta', null, v_today + interval '4 days', null, p_user, now() - interval '2 days'),
    (p_org, l_beatriz, null, 'whatsapp', 'Mensagem no WhatsApp', 'Pediu exemplos de cases do segmento de estúdios.', null, null, p_user, now() - interval '5 hours'),
    (p_org, null, c_aurora, 'note', 'Baixa adoção pela equipe', 'Apenas 4 de 12 coordenadores estão usando o processo. Precisamos de um plano de reengajamento.', null, null, p_user, now() - interval '2 days'),
    (p_org, null, c_aurora, 'task', 'Reunião de alinhamento com a coordenação', null, v_today + interval '3 days', null, p_user, now() - interval '2 days'),
    (p_org, null, c_bemestar, 'task', 'Kickoff de implantação', null, v_today + interval '1 day', null, p_user, now() - interval '10 days'),
    (p_org, null, c_vertice, 'note', 'Cliente satisfeito', 'Abriu espaço para expansão na filial de Campinas no próximo semestre.', null, null, p_user, now() - interval '6 days'),
    (p_org, null, c_martins, 'meeting', 'Revisão trimestral', 'Resultados acima da meta. Avaliar upsell de suporte premium.', null, null, p_user, now() - interval '15 days');
end;
$$;

revoke all on function private.seed_demo_data(uuid, uuid) from public;
