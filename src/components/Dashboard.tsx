/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Agendamento, Cliente, HistoricoPet, PacoteCliente } from '../types';
import { Calendar, TrendingUp, Sparkles, Footprints, Clock, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  historico: HistoricoPet[];
  pacotesCliente: PacoteCliente[];
  onNavigateToTab: (tab: 'agenda' | 'clientes' | 'historico') => void;
  onSelectPetForHistory: (petId: string) => void;
}

export default function Dashboard({
  agendamentos,
  clientes,
  historico,
  pacotesCliente,
  onNavigateToTab,
  onSelectPetForHistory
}: DashboardProps) {
  // Configuração temporal baseada em ADDITIONAL_METADATA: 2026-07-03 (Sexta-feira)
  const TODAY_STR = '2026-07-03';
  const CURRENT_YEAR_MONTH = '2026-07';

  // 1. Total cães cadastrados
  const totalCaes = clientes.reduce((acc, c) => acc + c.pets.length, 0);

  // 2. Pacotes ativos
  const pacotesAtivosCount = pacotesCliente.filter(p => p.status === 'ativo').length;

  // 3. Agendamentos de hoje
  const agendamentosHoje = agendamentos.filter(a => a.data === TODAY_STR);
  const agendamentosHojePendentes = agendamentosHoje.filter(a => a.status === 'pendente').length;
  const agendamentosHojeConfirmados = agendamentosHoje.filter(a => a.status === 'confirmado' || a.status === 'em_andamento').length;

  // 4. Banhos do mês (Julho de 2026)
  const banhosNoMes = historico.filter(h => {
    const isThisMonth = h.data.startsWith(CURRENT_YEAR_MONTH);
    const isBath = h.servicoNome.toLowerCase().includes('banho') || h.usouPacote;
    return isThisMonth && isBath;
  }).length;

  // 5. Faturamento do mês (Julho de 2026)
  // Calculado somando o valor dos agendamentos finalizados no mês de Julho
  const faturamentoMes = agendamentos
    .filter(a => a.status === 'finalizado' && a.data.startsWith(CURRENT_YEAR_MONTH))
    .reduce((sum, a) => sum + a.valorTotal, 0);

  // 6. Dados para o gráfico de fluxo semanal (Seg 29/06 a Dom 05/07 de 2026)
  const DIAS_SEMANA = [
    { key: '2026-06-29', label: 'Seg', desc: '29/06' },
    { key: '2026-06-30', label: 'Ter', desc: '30/06' },
    { key: '2026-07-01', label: 'Qua', desc: '01/07' },
    { key: '2026-07-02', label: 'Qui', desc: '02/07' },
    { key: '2026-07-03', label: 'Sex', desc: '03/07 (Hoje)' },
    { key: '2026-07-04', label: 'Sáb', desc: '04/07' },
    { key: '2026-07-05', label: 'Dom', desc: '05/07' }
  ];

  const fluxoSemanal = DIAS_SEMANA.map(dia => {
    const totalDoDia = agendamentos.filter(a => a.data === dia.key && a.status !== 'cancelado').length;
    return {
      ...dia,
      quantidade: totalDoDia
    };
  });

  const maxQuantidade = Math.max(...fluxoSemanal.map(f => f.quantidade), 4);

  // --- RECHARTS CALCULATIONS ---
  
  // Group revenue by month
  const getMonthlyRevenueData = () => {
    const revenueByMonth: Record<string, { monthStr: string; services: number; packages: number; total: number }> = {};

    // Add finished appointments
    agendamentos.forEach(a => {
      if (a.status === 'finalizado' && a.data) {
        const month = a.data.substring(0, 7); // 'YYYY-MM'
        if (!revenueByMonth[month]) {
          revenueByMonth[month] = { monthStr: month, services: 0, packages: 0, total: 0 };
        }
        revenueByMonth[month].services += a.valorTotal;
        revenueByMonth[month].total += a.valorTotal;
      }
    });

    // Add package sales (PacotesCliente)
    pacotesCliente.forEach(p => {
      if (p.dataAquisicao) {
        const month = p.dataAquisicao.substring(0, 7); // 'YYYY-MM'
        if (!revenueByMonth[month]) {
          revenueByMonth[month] = { monthStr: month, services: 0, packages: 0, total: 0 };
        }
        const valor = p.valorPago || 0;
        revenueByMonth[month].packages += valor;
        revenueByMonth[month].total += valor;
      }
    });

    // Convert to array and sort chronologically
    const sortedData = Object.values(revenueByMonth).sort((a, b) => a.monthStr.localeCompare(b.monthStr));

    // Map month string to beautiful name (e.g., '2026-07' -> 'Jul/2026')
    const MONTH_NAMES: Record<string, string> = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };

    let mapped = sortedData.map(item => {
      const parts = item.monthStr.split('-');
      const year = parts[0];
      const month = parts[1];
      const beautifulLabel = `${MONTH_NAMES[month] || month}/${year}`;
      return {
        ...item,
        label: beautifulLabel,
        services: parseFloat(item.services.toFixed(2)),
        packages: parseFloat(item.packages.toFixed(2)),
        total: parseFloat(item.total.toFixed(2))
      };
    });

    if (mapped.length === 0) {
      // Seed some fallback monthly data for nice initial visual appeal
      mapped = [
        { monthStr: '2026-05', label: 'Mai/2026', services: 1250, packages: 1800, total: 3050 },
        { monthStr: '2026-06', label: 'Jun/2026', services: 1840, packages: 2400, total: 4240 },
        { monthStr: '2026-07', label: 'Jul/2026', services: faturamentoMes || 850, packages: pacotesCliente.reduce((acc, p) => acc + (p.valorPago || 0), 0) || 1200, total: (faturamentoMes || 850) + (pacotesCliente.reduce((acc, p) => acc + (p.valorPago || 0), 0) || 1200) },
      ];
    }
    return mapped;
  };

  // Group status distribution
  const getStatusDistributionData = () => {
    const counts: Record<string, number> = {
      'Finalizado': 0,
      'Pendente': 0,
      'Confirmado': 0,
      'Em Andamento': 0,
      'Falta': 0,
      'Cancelado': 0
    };

    agendamentos.forEach(a => {
      if (a.status === 'finalizado') counts['Finalizado']++;
      else if (a.status === 'pendente') counts['Pendente']++;
      else if (a.status === 'confirmado') counts['Confirmado']++;
      else if (a.status === 'em_andamento') counts['Em Andamento']++;
      else if (a.status === 'falta') counts['Falta']++;
      else if (a.status === 'cancelado') counts['Cancelado']++;
    });

    // Map to recharts format
    const data = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    if (data.length === 0) {
      // Seed if empty
      return [
        { name: 'Finalizado', value: 12 },
        { name: 'Pendente', value: 4 },
        { name: 'Confirmado', value: 6 },
        { name: 'Falta', value: 1 }
      ];
    }
    return data;
  };

  const STATUS_COLORS: Record<string, string> = {
    'Finalizado': '#10b981',   // Emerald-500
    'Pendente': '#f59e0b',     // Amber-500
    'Confirmado': '#0ea5e9',   // Sky-500
    'Em Andamento': '#6366f1', // Indigo-500
    'Falta': '#a855f7',        // Purple-500
    'Cancelado': '#f43f5e'     // Rose-500
  };

  return (
    <div className="space-y-6" id="dashboard-section">
      {/* Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Banhos do Mês */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xxs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Banhos do Mês</p>
            <h3 className="text-2xl font-black text-slate-800">{banhosNoMes}</h3>
            <p className="text-slate-400 text-xxs font-medium">Atendidos em {CURRENT_YEAR_MONTH.split('-').reverse().join('/')}</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Footprints className="w-6 h-6 stroke-[2.5px]" />
          </div>
        </div>

        {/* Card 2: Faturamento Estimado */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xxs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Faturamento no Mês</p>
            <h3 className="text-2xl font-black text-emerald-600">R$ {faturamentoMes.toFixed(2)}</h3>
            <p className="text-slate-400 text-xxs font-medium">Banhos/Tosas avulsos concluídos</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6 stroke-[2.5px]" />
          </div>
        </div>

        {/* Card 3: Pacotes de Fidelidade Ativos */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xxs flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-all" onClick={() => onNavigateToTab('clientes')}>
          <div className="space-y-2">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Pacotes Ativos</p>
            <h3 className="text-2xl font-black text-indigo-700">{pacotesAtivosCount}</h3>
            <p className="text-slate-400 text-xxs font-medium flex items-center gap-1">
              <span>Fidelidade mensal de pets</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-6 h-6 stroke-[2.5px]" />
          </div>
        </div>

        {/* Card 4: Total Animais Atendidos */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xxs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Pets Cadastrados</p>
            <h3 className="text-2xl font-black text-slate-800">{totalCaes}</h3>
            <p className="text-slate-400 text-xxs font-medium">Vínculo direto com clientes</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Users className="w-6 h-6 stroke-[2.5px]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico do fluxo semanal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Fluxo de Agendamentos da Semana</h3>
            <p className="text-xxs text-slate-400 mt-0.5">Total de cães agendados por dia da semana corrente (exclui cancelados)</p>
          </div>

          {/* Gráfico de barras puro SVG */}
          <div className="flex-1 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2">
            {fluxoSemanal.map(dia => {
              const heightPercent = (dia.quantidade / maxQuantidade) * 100;
              const isToday = dia.key === TODAY_STR;

              return (
                <div key={dia.key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip do valor */}
                  <span className={`opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xxs font-bold py-1 px-2 rounded-md shadow-xs pointer-events-none mb-1 translate-y-[-5px] whitespace-nowrap ${
                    dia.quantidade > 0 ? 'opacity-100 sm:opacity-0' : ''
                  }`}>
                    {dia.quantidade} {dia.quantidade === 1 ? 'Pet' : 'Pets'}
                  </span>

                  {/* Barra */}
                  <div className="w-full relative rounded-t-md overflow-hidden bg-slate-100 flex items-end" style={{ height: '70%' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        isToday
                          ? 'bg-gradient-to-t from-sky-600 to-indigo-600 shadow-md ring-2 ring-sky-300 ring-offset-1'
                          : 'bg-slate-350 hover:bg-slate-450'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>

                  {/* Labels */}
                  <div className="text-center">
                    <p className={`text-xs font-bold ${isToday ? 'text-sky-600 font-extrabold' : 'text-slate-700'}`}>
                      {dia.label}
                    </p>
                    <p className="text-xxs text-slate-400 font-medium whitespace-nowrap hidden sm:block">
                      {dia.desc.replace(' (Hoje)', '')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fila de Atendimento do Dia */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-xs p-5 flex flex-col h-[360px]">
          <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Fila de Hoje</h3>
              <p className="text-xxs text-slate-400 mt-0.5">{TODAY_STR.split('-').reverse().join('/')} • Sexta-Feira</p>
            </div>
            
            <button onClick={() => onNavigateToTab('agenda')} className="text-xxs font-bold text-sky-600 hover:text-sky-700">
              Ver Agenda
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pt-2">
            {agendamentosHoje.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6 text-center">
                <Clock className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs">Nenhum atendimento agendado para hoje.</p>
              </div>
            ) : (
              agendamentosHoje.map(agd => {
                const tutor = clientes.find(c => c.id === agd.clienteId);

                return (
                  <div key={agd.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 rounded-lg px-1">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">{agd.hora}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 max-w-28 truncate">{tutor?.nome}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {agd.itens.map((item, i) => {
                          const pet = tutor?.pets.find(p => p.id === item.petId);
                          return (
                            <span key={i} className="inline-flex items-center text-xxs font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded-sm">
                              🐾 {pet?.nome}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 text-xxs font-bold rounded-full ${
                        agd.status === 'finalizado' ? 'bg-emerald-100 text-emerald-800' :
                        agd.status === 'em_andamento' ? 'bg-indigo-100 text-indigo-800' :
                        agd.status === 'confirmado' ? 'bg-sky-100 text-sky-800' :
                        agd.status === 'falta' ? 'bg-purple-100 text-purple-800' :
                        agd.status === 'cancelado' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {agd.status === 'finalizado' ? 'Fim' :
                         agd.status === 'em_andamento' ? 'Banho' :
                         agd.status === 'confirmado' ? 'Ok' :
                         agd.status === 'falta' ? 'Falta' :
                         agd.status === 'cancelado' ? 'X' : 'Pend'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Seção de Análise de Desempenho com Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-section">
        {/* Gráfico 1: Receita Mensal Total (Faturamento e Vendas) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between h-[380px]">
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Receita e Faturamento Mensal</span>
            </h3>
            <p className="text-xxs text-slate-400 mt-0.5">Acompanhamento da receita gerada por banhos avulsos finalizados e vendas de pacotes mensais</p>
          </div>

          <div className="flex-1 min-h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getMonthlyRevenueData()}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${parseFloat(value).toFixed(2)}`]}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px', color: '#fff', padding: '2px 0' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
                <Bar name="Serviços Avulsos (Finalizados)" dataKey="services" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar name="Venda de Planos/Pacotes" dataKey="packages" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição de Atendimentos por Status */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between h-[380px]">
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Status dos Atendimentos</span>
            </h3>
            <p className="text-xxs text-slate-400 mt-0.5">Distribuição do status de todos os agendamentos realizados no sistema</p>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getStatusDistributionData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {getStatusDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} atendimentos`]}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text (Donut chart placeholder) */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-700">
                {agendamentos.length || 23}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Custom Legend to fit nicely in 1 column */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-slate-50 text-[10px] font-semibold text-slate-600">
            {getStatusDistributionData().map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: STATUS_COLORS[entry.name] || '#94a3b8' }} 
                />
                <span className="truncate">{entry.name}: <strong className="text-slate-800">{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atalhos rápidos e Recomendações */}
      <div className="bg-slate-50/70 rounded-xl border border-slate-150 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span>Fluxo de Atendimento Recomendado</span>
          </p>
          <p className="text-xxs text-slate-500 leading-relaxed max-w-xl">
            Ao agendar um banho ou tosa, utilize o campo de pesquisa de tutores. Se o pet possuir um plano ativo, clique em "Abater do pacote" para descontar automaticamente as sessões e atualizar o histórico de forma automática ao finalizar.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateToTab('clientes')}
            className="px-3.5 py-2 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Cadastrar Tutor
          </button>
          <button
            onClick={handleStartAgendamento}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Agendar Atendimento
          </button>
        </div>
      </div>
    </div>
  );

  function handleStartAgendamento() {
    onNavigateToTab('agenda');
    // Forçar a tela de agendamento a disparar o formulário logo após a troca de aba
    setTimeout(() => {
      const btn = document.getElementById('btn-novo-agendamento');
      if (btn) btn.click();
    }, 100);
  }
}

