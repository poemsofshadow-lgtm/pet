/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HistoricoPet, Cliente, Pet } from '../types';
import { Search, Calendar, Award, Scissors, ShoppingBag, ShieldAlert, Sparkles, Filter, DollarSign, UserCheck } from 'lucide-react';

interface PetHistoryProps {
  historico: HistoricoPet[];
  clientes: Cliente[];
  selectedPetId?: string | null;
  onClearSelectedPetId?: () => void;
}

export default function PetHistory({
  historico,
  clientes,
  selectedPetId,
  onClearSelectedPetId
}: PetHistoryProps) {
  const [activePetId, setActivePetId] = useState<string>('');

  // Sincronizar se houver alteração externa (por exemplo, vindo da tela de Clientes)
  useEffect(() => {
    if (selectedPetId) {
      setActivePetId(selectedPetId);
    }
  }, [selectedPetId]);

  // Obter lista completa de todos os pets cadastrados para o dropdown/busca
  const todosOsPets = clientes.flatMap(c => c.pets.map(p => ({
    ...p,
    tutorNome: c.nome,
    tutorTelefone: c.telefone
  })));

  const selectedPetInfo = todosOsPets.find(p => p.id === activePetId);
  
  // Filtrar histórico do pet selecionado
  const petHistoryList = historico
    .filter(h => h.petId === activePetId)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Calcular banhos no mês atual (Julho de 2026)
  const currentYearMonth = '2026-07'; // baseado no ADDITIONAL_METADATA '2026-07-03'
  
  const banhosNoMes = petHistoryList.filter(h => {
    // Verificar se é no mês atual
    const isThisMonth = h.data.startsWith(currentYearMonth);
    // Verificar se é serviço de banho ou consumiu pacote (pacotes de fidelidade são sempre banhos)
    const isBath = h.servicoNome.toLowerCase().includes('banho') || h.usouPacote;
    return isThisMonth && isBath;
  }).length;

  // Estatísticas gerais do pet
  const totalAtendimentos = petHistoryList.length;
  const faturamentoPet = petHistoryList.reduce((sum, h) => sum + (h.usouPacote ? 0 : h.valor), 0);

  return (
    <div className="space-y-6" id="pet-history-section">
      {/* Seletor de Pet */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Histórico de Atendimentos</h2>
          <p className="text-xs text-slate-500 mt-1">Busque um pet específico para auditar histórico completo e verificar banhos no mês</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 shrink-0">Selecionar Pet:</label>
          <select
            value={activePetId}
            onChange={(e) => {
              setActivePetId(e.target.value);
              if (onClearSelectedPetId) onClearSelectedPetId();
            }}
            className="text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all w-64 cursor-pointer"
          >
            <option value="">-- Escolha um Pet --</option>
            {todosOsPets.map(p => (
              <option key={p.id} value={p.id}>
                🐾 {p.nome} ({p.tutorNome})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activePetId && selectedPetInfo ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Informações e Métricas do Pet */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ficha do Pet */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>Ficha Cadastral</span>
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase ${
                  selectedPetInfo.porte === 'grande' ? 'bg-orange-100 text-orange-800' :
                  selectedPetInfo.porte === 'medio' ? 'bg-yellow-100 text-yellow-850' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  Porte {selectedPetInfo.porte === 'pequeno' ? 'P' : selectedPetInfo.porte === 'medio' ? 'M' : 'G'}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Nome do Pet:</span>
                  <strong className="text-slate-800">{selectedPetInfo.nome}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Tutor Responsável:</span>
                  <strong className="text-slate-800">{selectedPetInfo.tutorNome}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="text-slate-800 font-semibold">{selectedPetInfo.tutorTelefone}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs">Observações e Recomendações:</span>
                  <div className="bg-amber-50 text-amber-900 border border-amber-100 p-3 rounded-lg text-xs italic">
                    {selectedPetInfo.observacao ? `"${selectedPetInfo.observacao}"` : 'Nenhuma observação específica cadastrada.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Contador de Banhos no Mês (Super destacado como pedido!) */}
            <div className="bg-linear-to-br from-sky-600 to-indigo-700 p-6 rounded-xl text-white shadow-xs relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] text-white opacity-10">
                <Calendar className="w-32 h-32 stroke-[3px]" />
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 rounded-md text-xxs font-extrabold tracking-wide uppercase">Indicador Mensal</span>
                  <span className="text-sky-100 text-xxs">Julho 2026</span>
                </div>
                
                <div>
                  <p className="text-xxs font-bold text-sky-100 uppercase tracking-wider">Banhos Atendidos neste Mês</p>
                  <h4 className="text-5xl font-extrabold mt-1 tracking-tight">
                    {banhosNoMes} <span className="text-lg font-normal text-sky-200">atendimentos</span>
                  </h4>
                </div>

                <p className="text-xs text-sky-100/95 pt-2 border-t border-white/20">
                  {banhosNoMes === 0 ? 'Este pet ainda não realizou banhos no mês atual.' : 
                   banhosNoMes === 1 ? 'Pet registrou 1 banho neste mês. Mantenha a frequência!' :
                   `Pet frequente! Registrou ${banhosNoMes} banhos neste mês.`}
                </p>
              </div>
            </div>

            {/* Métricas Acumuladas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xxs">
                <p className="text-xxs font-bold text-slate-400 uppercase">Visitas Totais</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{totalAtendimentos}</p>
                <span className="text-slate-400 text-xxs">Histórico completo</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xxs">
                <p className="text-xxs font-bold text-slate-400 uppercase">Total Pago Avulso</p>
                <p className="text-xl font-black text-emerald-600 mt-1">R$ {faturamentoPet.toFixed(2)}</p>
                <span className="text-slate-400 text-xxs">Exclui plano pré-pago</span>
              </div>
            </div>
          </div>

          {/* Histórico Cronológico */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col h-[520px]">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">Linha do Tempo de Atendimentos</h3>
            </div>

            <div className="overflow-y-auto flex-1 p-6 relative">
              {petHistoryList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <ShieldAlert className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-sm">Nenhum atendimento finalizado para este pet.</p>
                </div>
              ) : (
                /* Timeline UI */
                <div className="relative border-l-2 border-slate-150 ml-4 space-y-6">
                  {petHistoryList.map(hist => (
                    <div key={hist.id} className="relative pl-6">
                      {/* Círculo da linha do tempo */}
                      <span className={`absolute left-[-9px] top-1.5 w-4 h-4 rounded-full border-4 border-white ${
                        hist.usouPacote ? 'bg-amber-500' : 'bg-sky-600'
                      }`} />

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/65 hover:border-slate-300 transition-all space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {hist.data.split('-').reverse().join('/')}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {hist.usouPacote ? (
                              <span className="px-2 py-0.5 rounded-md text-xxs font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3" />
                                Consumo de Pacote
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-800">
                                R$ {hist.valor.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-slate-800 text-sm">{hist.servicoNome}</p>
                          <p className="text-xxs text-slate-400 mt-0.5 font-medium uppercase">Agendamento Ref: {hist.agendamentoId}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* PLACEHOLDER INICIAL */
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-12 text-center flex flex-col items-center justify-center h-[350px]">
          <div className="p-3 bg-sky-100 text-sky-600 rounded-full mb-3">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-medium text-sm">Nenhum pet selecionado</p>
          <p className="text-slate-400 text-xs mt-1 max-w-sm">Use o seletor no topo direito da página para escolher um pet e visualizar seu histórico e contagem de banhos no mês.</p>
        </div>
      )}
    </div>
  );
}
