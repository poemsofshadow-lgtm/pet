/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Agendamento, Cliente, Pet, Servico, PacoteCliente, StatusAgendamento, AgendamentoItem, HistoricoPet, HorarioFuncionamento } from '../types';
import { Search, Calendar, Clock, Check, Play, Trash2, CheckCircle2, XCircle, Plus, AlertTriangle, ShieldCheck, User, Sparkles, CreditCard, FileText, UploadCloud, Eye, DollarSign, X } from 'lucide-react';

interface AppointmentManagementProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  servicos: Servico[];
  pacotesCliente: PacoteCliente[];
  horarios?: HorarioFuncionamento[];
  onAddAgendamento: (agd: Agendamento) => void;
  onUpdateAgendamentoStatus: (
    id: string,
    status: StatusAgendamento,
    metodoPagamento?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pacote',
    statusPagamento?: 'pendente' | 'pago',
    comprovantePix?: string
  ) => void;
}

export default function AppointmentManagement({
  agendamentos,
  clientes,
  servicos,
  pacotesCliente,
  horarios = [],
  onAddAgendamento,
  onUpdateAgendamentoStatus
}: AppointmentManagementProps) {
  // Navigation internal filter
  const [statusFilter, setStatusFilter] = useState<StatusAgendamento | 'todos'>('todos');
  const [successMessage, setSuccessMessage] = useState('');

  // Payment confirmation modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAgdForPayment, setSelectedAgdForPayment] = useState<Agendamento | null>(null);
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pacote'>('pix');
  const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'pago'>('pago');
  const [comprovantePix, setComprovantePix] = useState<string>('');
  const [receiptViewerUrl, setReceiptViewerUrl] = useState<string | null>(null);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('O comprovante deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprovantePix(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPaymentAndFinalize = () => {
    if (!selectedAgdForPayment) return;
    
    if (metodoPagamento === 'pix' && !comprovantePix) {
      alert('Por favor, envie o comprovante de pagamento via PIX para dar baixa.');
      return;
    }

    onUpdateAgendamentoStatus(
      selectedAgdForPayment.id,
      'finalizado',
      metodoPagamento,
      statusPagamento,
      metodoPagamento === 'pix' ? comprovantePix : undefined
    );

    setPaymentModalOpen(false);
    setSelectedAgdForPayment(null);
    setComprovantePix('');
    showToast('Atendimento finalizado e pagamento registrado com sucesso!');
  };

  // Novo Agendamento Form State
  const [isAgendando, setIsAgendando] = useState(false);
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  // Mapeia petId -> true/false se selecionado para o banho
  const [selectedPetsMap, setSelectedPetsMap] = useState<Record<string, boolean>>({});
  
  // Mapeia petId -> servicoId selecionado
  const [petServicoMap, setPetServicoMap] = useState<Record<string, string>>({});
  
  // Mapeia petId -> se está usando pacote de banho
  const [petUsarPacoteMap, setPetUsarPacoteMap] = useState<Record<string, boolean>>({});

  const [agendamentoData, setAgendamentoData] = useState('');
  const [agendamentoHora, setAgendamentoHora] = useState('');
  const [agendamentoObs, setAgendamentoObs] = useState('');
  const [levaETras, setLevaETras] = useState(false);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filtrar clientes na busca
  const searchedClientes = searchClientQuery.trim() === '' ? [] : clientes.filter(c =>
    c.nome.toLowerCase().includes(searchClientQuery.toLowerCase()) ||
    c.telefone.includes(searchClientQuery)
  );

  const handleSelectCliente = (cli: Cliente) => {
    setSelectedCliente(cli);
    setSearchClientQuery('');
    
    // Resetar seleções de pets
    const initialPetsSel: Record<string, boolean> = {};
    const initialPetServ: Record<string, string> = {};
    const initialPetPac: Record<string, boolean> = {};

    cli.pets.forEach(p => {
      initialPetsSel[p.id] = false;
      initialPetServ[p.id] = servicos[0]?.id || '';
      initialPetPac[p.id] = false;
    });

    setSelectedPetsMap(initialPetsSel);
    setPetServicoMap(initialPetServ);
    setPetUsarPacoteMap(initialPetPac);
  };

  const handleTogglePetCheck = (petId: string) => {
    setSelectedPetsMap(prev => ({ ...prev, [petId]: !prev[petId] }));
  };

  const handlePetServicoChange = (petId: string, srvId: string) => {
    setPetServicoMap(prev => ({ ...prev, [petId]: srvId }));
  };

  const handlePetPacoteToggle = (petId: string) => {
    setPetUsarPacoteMap(prev => ({ ...prev, [petId]: !prev[petId] }));
  };

  const handleStartAgendamento = () => {
    setIsAgendando(true);
    setSelectedCliente(null);
    setSearchClientQuery('');
    setAgendamentoData(new Date().toISOString().split('T')[0]);
    setAgendamentoHora('09:00');
    setAgendamentoObs('');
    setLevaETras(false);
  };

  const getTransportPrice = () => {
    const transportService = servicos.find(s => s.id === 'srv-transporte');
    return transportService ? transportService.valor : 5.00;
  };

  const getLiveTotal = () => {
    const petsSelecionadosIds = Object.keys(selectedPetsMap).filter(id => selectedPetsMap[id]);
    let sum = petsSelecionadosIds.reduce((acc, petId) => {
      const isUsingPacote = petUsarPacoteMap[petId];
      if (isUsingPacote) return acc;
      const srvId = petServicoMap[petId];
      const selectedSrv = servicos.find(s => s.id === srvId);
      return acc + (selectedSrv?.valor || 0);
    }, 0);

    if (levaETras) {
      sum += getTransportPrice();
    }
    return sum;
  };

  const handleSalvarAgendamento = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCliente) {
      alert('Selecione um cliente primeiro.');
      return;
    }

    const petsSelecionadosIds = Object.keys(selectedPetsMap).filter(id => selectedPetsMap[id]);
    if (petsSelecionadosIds.length === 0) {
      alert('Selecione pelo menos um pet para o agendamento.');
      return;
    }

    if (!agendamentoData || !agendamentoHora) {
      alert('Data e hora são obrigatórias.');
      return;
    }

    // Validar se o agendamento está dentro dos horários de funcionamento
    if (horarios && horarios.length > 0) {
      const [year, month, day] = agendamentoData.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const dayOfWeek = selectedDate.getDay();

      const schedule = horarios.find(h => h.diaSemana === dayOfWeek);
      if (schedule) {
        if (!schedule.aberto) {
          alert(`O estabelecimento está FECHADO aos domingos/sábados ou no dia correspondente (${schedule.nomeDia})!`);
          return;
        }

        if (agendamentoHora < schedule.inicio || agendamentoHora > schedule.fim) {
          alert(`Horário fora do expediente! O estabelecimento funciona das ${schedule.inicio} às ${schedule.fim} na ${schedule.nomeDia}.`);
          return;
        }
      }
    }

    // Criar os itens de agendamento
    const itens: AgendamentoItem[] = petsSelecionadosIds.map(petId => {
      const isUsingPacote = petUsarPacoteMap[petId];
      const srvId = petServicoMap[petId];
      const selectedSrv = servicos.find(s => s.id === srvId);
      const petPacoteAtivo = pacotesCliente.find(pc => pc.petId === petId && pc.status === 'ativo');

      return {
        petId,
        servicoId: isUsingPacote ? 'pac-bath' : srvId,
        valor: isUsingPacote ? 0 : (selectedSrv?.valor || 0),
        usouPacote: isUsingPacote,
        ...(isUsingPacote && petPacoteAtivo ? { pacoteClienteId: petPacoteAtivo.id } : {})
      };
    });

    const valorTotal = getLiveTotal();

    const novoAgendamento: Agendamento = {
      id: `agd-${Date.now()}`,
      clienteId: selectedCliente.id,
      data: agendamentoData,
      hora: agendamentoHora,
      status: 'pendente',
      itens,
      valorTotal,
      observacoes: agendamentoObs,
      levaETras
    };

    onAddAgendamento(novoAgendamento);
    showToast('Agendamento realizado com sucesso!');
    setIsAgendando(false);
  };

  // Filtragem dos agendamentos listados
  const filteredAgendamentos = agendamentos
    .filter(agd => statusFilter === 'todos' ? true : agd.status === statusFilter)
    .sort((a, b) => {
      // Ordenar por data e hora decrescente
      const dateDiff = new Date(b.data).getTime() - new Date(a.data).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.hora.localeCompare(a.hora);
    });

  return (
    <div className="space-y-6" id="appointments-section">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {/* Header com botão de Agendar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agendamentos</h2>
          <p className="text-xs text-slate-500 mt-1">Gerencie a fila de atendimento diária, recepção e fluxo de banhos</p>
        </div>
        <button
          onClick={handleStartAgendamento}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
          id="btn-novo-agendamento"
        >
          <Calendar className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {isAgendando ? (
        /* FORMULÁRIO DE NOVO AGENDAMENTO */
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-base">Novo Agendamento de Serviço</h3>
            <button
              onClick={() => setIsAgendando(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Voltar para Lista
            </button>
          </div>

          <form onSubmit={handleSalvarAgendamento} className="space-y-6">
            {/* 1. Busca de Cliente */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">1. Pesquisar Cliente (Tutor) *</label>
              {!selectedCliente ? (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchClientQuery}
                    onChange={(e) => setSearchClientQuery(e.target.value)}
                    className="pl-9 pr-4 py-2.5 w-full text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    placeholder="Digite o nome ou telefone do tutor para buscar..."
                  />
                  {searchedClientes.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchedClientes.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCliente(c)}
                          className="p-3 hover:bg-sky-50/50 cursor-pointer transition-all flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{c.nome}</span>
                            <span className="text-xs text-slate-500 ml-2">({c.telefone})</span>
                          </div>
                          <span className="text-xxs px-2 py-0.5 bg-slate-100 rounded-full font-semibold">
                            {c.pets.length} {c.pets.length === 1 ? 'pet' : 'pets'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-sky-900">{selectedCliente.nome}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedCliente.telefone} • {selectedCliente.bairro} ({selectedCliente.tipoEndereco === 'predio' ? `Torre ${selectedCliente.torre}, Apt ${selectedCliente.apartamento}` : selectedCliente.tipoEndereco === 'condominio' ? `Quadra ${selectedCliente.quadra}, Lote ${selectedCliente.lote}` : 'Casa'})</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCliente(null)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-white px-2 py-1 rounded-md border border-rose-100 shadow-xxs"
                  >
                    Trocar Cliente
                  </button>
                </div>
              )}
            </div>

            {/* 2. Checkboxes de Pets e Seleção de Serviços */}
            {selectedCliente && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">2. Selecione os Pets e os Serviços para o Atendimento *</label>
                
                <div className="space-y-3">
                  {selectedCliente.pets.map(pet => {
                    const isChecked = selectedPetsMap[pet.id];
                    const selectedSrvId = petServicoMap[pet.id];
                    const selectedSrv = servicos.find(s => s.id === selectedSrvId);
                    
                    // Verificar se o pet possui pacote de banho ativo
                    const petPacoteAtivo = pacotesCliente.find(pc => pc.petId === pet.id && pc.status === 'ativo');
                    const hasActivePackage = !!petPacoteAtivo && (petPacoteAtivo.banhosUsados < petPacoteAtivo.banhosTotais);
                    const isUsingPackage = petUsarPacoteMap[pet.id];

                    return (
                      <div
                        key={pet.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-white border-slate-300 shadow-xs'
                            : 'bg-slate-50/50 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePetCheck(pet.id)}
                              className="w-5 h-5 rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                              id={`check-pet-${pet.id}`}
                            />
                            <div>
                              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                🐾 {pet.nome}
                                <span className="text-xxs px-2 py-0.5 font-bold uppercase rounded-full bg-slate-200 text-slate-700">
                                  Porte {pet.porte === 'pequeno' ? 'P' : pet.porte === 'medio' ? 'M' : 'G'}
                                </span>
                              </p>
                              {pet.observacao && (
                                <p className="text-xxs text-slate-500 italic mt-0.5">Nota: "{pet.observacao}"</p>
                              )}
                            </div>
                          </label>
                        </div>

                        {/* Configuração de Serviço (visível apenas se o pet estiver marcado) */}
                        {isChecked && (
                          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pacote Ativo se existir */}
                            {hasActivePackage ? (
                              <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl space-y-2">
                                <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Pacote Ativo Encontrado!</span>
                                </p>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={isUsingPackage}
                                    onChange={() => handlePetPacoteToggle(pet.id)}
                                    className="w-4 h-4 rounded-sm border-amber-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  <span>Abater 1 Banho do plano: <strong>{petPacoteAtivo.nomePacote}</strong> ({petPacoteAtivo.banhosUsados}/{petPacoteAtivo.banhosTotais} usados)</span>
                                </label>
                              </div>
                            ) : (
                              <div className="bg-slate-100 p-3 rounded-xl flex items-center gap-2 text-slate-500 text-xs">
                                <ShieldCheck className="w-4 h-4 text-slate-400" />
                                <span>Cobrança avulsa (Sem pacotes ativos para este pet).</span>
                              </div>
                            )}

                            {/* Seletor de Serviço (desabilitado se usar pacote) */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-600">Serviço Pretendido</label>
                              {isUsingPackage ? (
                                <div className="p-2.5 bg-emerald-50 text-emerald-800 font-bold text-sm rounded-lg border border-emerald-200">
                                  Banho Consumido do Pacote (R$ 0,00)
                                </div>
                              ) : (
                                <select
                                  value={selectedSrvId}
                                  onChange={(e) => handlePetServicoChange(pet.id, e.target.value)}
                                  className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                                >
                                  {servicos.filter(srv => srv.id !== 'srv-transporte').map(srv => (
                                    <option key={srv.id} value={srv.id}>{srv.nome} - R$ {srv.valor.toFixed(2)}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Data e Hora */}
            {selectedCliente && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">3. Data & Hora do Agendamento *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Data do Atendimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={agendamentoData}
                        onChange={(e) => setAgendamentoData(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Hora do Atendimento</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="time"
                        required
                        value={agendamentoHora}
                        onChange={(e) => setAgendamentoHora(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Serviço de Transporte (Leva e Trás) */}
            {selectedCliente && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">4. Serviço de Transporte (Opcional)</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="input-leva-e-tras"
                      checked={levaETras}
                      onChange={(e) => setLevaETras(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="input-leva-e-tras" className="cursor-pointer select-none">
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        🚗 Deseja Serviço de Transporte (Leva e Trás)?
                      </p>
                      <p className="text-xxs text-slate-500 mt-0.5">
                        Buscamos o pet e entregamos de volta após o serviço ser realizado.
                      </p>
                    </label>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                      + R$ {getTransportPrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Observações gerais */}
            {selectedCliente && (
              <div className="space-y-1 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">5. Observações do Atendimento</label>
                <textarea
                  value={agendamentoObs}
                  onChange={(e) => setAgendamentoObs(e.target.value)}
                  rows={2}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all resize-none"
                  placeholder="Ex: Observações adicionais sobre comportamento do pet, preferências de horário, etc."
                />
              </div>
            )}

            {/* 6. Resumo Dinâmico de Valores */}
            {selectedCliente && Object.keys(selectedPetsMap).some(id => selectedPetsMap[id]) && (
              <div className="pt-4 border-t border-slate-100">
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Resumo do Agendamento</h4>
                    <span className="text-xxs text-slate-400 font-mono">Cálculo em Tempo Real</span>
                  </div>
                  <div className="divide-y divide-slate-200/60 text-xs">
                    {Object.keys(selectedPetsMap).filter(id => selectedPetsMap[id]).map(petId => {
                      const pet = selectedCliente.pets.find(p => p.id === petId);
                      const isUsingPacote = petUsarPacoteMap[petId];
                      const srvId = petServicoMap[petId];
                      const selectedSrv = servicos.find(s => s.id === srvId);
                      
                      return (
                        <div key={petId} className="py-2.5 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-semibold">🐾 {pet?.nome}</span>
                            <span className="text-xxs text-slate-500">
                              {isUsingPacote ? 'Abater do Pacote Mensal de Banhos' : `Serviço: ${selectedSrv?.nome || 'Não definido'}`}
                            </span>
                          </div>
                          <span className="font-bold text-slate-800">
                            {isUsingPacote ? 'R$ 0,00' : `R$ ${(selectedSrv?.valor || 0).toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })}
                    
                    {levaETras && (
                      <div className="py-2.5 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-semibold">🚗 Transporte (Leva e Trás)</span>
                          <span className="text-xxs text-slate-500">Taxa fixa de busca e entrega</span>
                        </div>
                        <span className="font-bold text-slate-800">R$ {getTransportPrice().toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="py-3 flex justify-between items-center text-sm font-extrabold text-slate-950 pt-3">
                      <span>VALOR TOTAL ESTIMADO:</span>
                      <span className="text-base text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1 rounded-lg">
                        R$ {getLiveTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Form */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAgendando(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedCliente}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Confirmar Agendamento
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* LISTAGEM DE AGENDAMENTOS */
        <div className="space-y-4">
          {/* Seletor de filtro de Status */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-xxs overflow-x-auto gap-1">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'todos' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({agendamentos.length})
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'pendente' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pendentes ({agendamentos.filter(a => a.status === 'pendente').length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'confirmado' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Confirmados ({agendamentos.filter(a => a.status === 'confirmado').length})
            </button>
            <button
              onClick={() => setStatusFilter('em_andamento')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'em_andamento' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Em Andamento ({agendamentos.filter(a => a.status === 'em_andamento').length})
            </button>
            <button
              onClick={() => setStatusFilter('finalizado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'finalizado' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Finalizados ({agendamentos.filter(a => a.status === 'finalizado').length})
            </button>
            <button
              onClick={() => setStatusFilter('falta')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'falta' ? 'bg-purple-100 text-purple-850 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Faltas ({agendamentos.filter(a => a.status === 'falta').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'cancelado' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cancelados ({agendamentos.filter(a => a.status === 'cancelado').length})
            </button>
          </div>

          {/* Cards dos Agendamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAgendamentos.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-xl border border-slate-100 shadow-xs text-center text-slate-400 text-sm">
                Nenhum agendamento encontrado nesta categoria.
              </div>
            ) : (
              filteredAgendamentos.map(agd => {
                const tutor = clientes.find(c => c.id === agd.clienteId);
                const isToday = agd.data === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={agd.id}
                    className={`bg-white rounded-xl border p-5 flex flex-col justify-between gap-4 transition-all shadow-xxs hover:shadow-xs ${
                      isToday ? 'border-sky-300 ring-2 ring-sky-100/50' : 'border-slate-150'
                    }`}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xxs font-bold uppercase rounded-md tracking-wider ${
                            agd.status === 'finalizado' ? 'bg-emerald-100 text-emerald-800' :
                            agd.status === 'em_andamento' ? 'bg-indigo-100 text-indigo-800' :
                            agd.status === 'confirmado' ? 'bg-sky-100 text-sky-800' :
                            agd.status === 'falta' ? 'bg-purple-100 text-purple-800' :
                            agd.status === 'cancelado' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {agd.status === 'finalizado' ? 'Concluído' :
                             agd.status === 'em_andamento' ? 'Em Banho/Tosa' :
                             agd.status === 'confirmado' ? 'Confirmado' :
                             agd.status === 'falta' ? 'Falta' :
                             agd.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 bg-sky-500 text-white rounded-md text-xxs font-extrabold animate-pulse">HOJE</span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{agd.data.split('-').reverse().join('/')} às {agd.hora}</span>
                        </p>
                      </div>
                      <span className="text-base font-extrabold text-slate-800">
                        {agd.valorTotal > 0 ? `R$ ${agd.valorTotal.toFixed(2)}` : 'R$ 0,00'}
                      </span>
                    </div>

                    {/* Informações dos Pets e Serviços inclusos */}
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500">
                        Cliente: <strong className="text-slate-700">{tutor?.nome || 'Cliente Excluído'}</strong>
                      </p>

                      <div className="space-y-2">
                        {agd.itens.map((item, idx) => {
                          const pet = tutor?.pets.find(p => p.id === item.petId);
                          const srv = servicos.find(s => s.id === item.servicoId);

                          return (
                            <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-semibold text-slate-700">🐾 {pet?.nome || 'Pet'}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-xxs">
                                  {item.usouPacote ? 'Usou Pacote de Banhos' : (srv?.nome || 'Serviço')}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-xxs font-bold ${
                                  item.usouPacote ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {item.usouPacote ? 'Plano' : `R$ ${item.valor.toFixed(2)}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {agd.levaETras && (
                        <div className="flex items-center gap-1.5 text-xxs font-extrabold text-amber-700 bg-amber-50 border border-amber-100/60 rounded-lg p-2">
                          <span>🚗 Serviço de Transporte (Leva e Trás) + R$ {getTransportPrice().toFixed(2)}</span>
                        </div>
                      )}

                      {agd.observacoes && (
                        <p className="text-xxs text-slate-500 bg-slate-50/50 border border-slate-100 p-2 rounded-lg italic">
                          "{agd.observacoes}"
                        </p>
                      )}

                      {/* Status de Pagamento */}
                      <div className="flex items-center justify-between border-t border-slate-100/60 pt-2.5">
                        <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Pagamento</span>
                        <div className="flex items-center gap-1.5">
                          {agd.statusPagamento === 'pago' || agd.status === 'finalizado' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200/50 text-emerald-800 rounded-md text-xxs font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3px]" />
                              <span>
                                Pago
                                {agd.metodoPagamento ? ` (${
                                  agd.metodoPagamento === 'pix' ? 'PIX' :
                                  agd.metodoPagamento === 'cartao_credito' ? 'Cartão Crédito' :
                                  agd.metodoPagamento === 'cartao_debito' ? 'Cartão Débito' :
                                  agd.metodoPagamento === 'dinheiro' ? 'Dinheiro' :
                                  agd.metodoPagamento === 'pacote' ? 'Consumo Pacote' : agd.metodoPagamento
                                })` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 border border-amber-200/50 text-amber-800 rounded-md text-xxs font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pendente</span>
                            </span>
                          )}

                          {agd.metodoPagamento === 'pix' && agd.comprovantePix && (
                            <button
                              onClick={() => setReceiptViewerUrl(agd.comprovantePix || null)}
                              className="px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-md text-xxs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Visualizar Comprovante PIX"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>Comprovante</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação para o Ciclo de Vida do Agendamento */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100 justify-end">
                      {/* Se Pendente */}
                      {agd.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => onUpdateAgendamentoStatus(agd.id, 'cancelado')}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Recusar</span>
                          </button>
                          <button
                            onClick={() => onUpdateAgendamentoStatus(agd.id, 'confirmado')}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xxs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmar</span>
                          </button>
                        </>
                      )}

                      {/* Se Confirmado */}
                      {agd.status === 'confirmado' && (
                        <>
                          <button
                            onClick={() => {
                              if (window.confirm('Deseja registrar FALTA do cliente para este agendamento? Caso o cliente utilize pacote de banhos, um banho será automaticamente descontado do seu plano.')) {
                                onUpdateAgendamentoStatus(agd.id, 'falta');
                              }
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Registrar falta"
                          >
                            <span>Registrar Falta</span>
                          </button>
                          <button
                            onClick={() => onUpdateAgendamentoStatus(agd.id, 'cancelado')}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Cancelar</span>
                          </button>
                          <button
                            onClick={() => onUpdateAgendamentoStatus(agd.id, 'em_andamento')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xxs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Iniciar Banho</span>
                          </button>
                        </>
                      )}

                      {/* Se Em Andamento */}
                      {agd.status === 'em_andamento' && (
                        <button
                          onClick={() => {
                            setSelectedAgdForPayment(agd);
                            setMetodoPagamento('pix');
                            setStatusPagamento('pago');
                            setComprovantePix('');
                            setPaymentModalOpen(true);
                          }}
                          className="w-full justify-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xxs"
                        >
                          <Check className="w-4 h-4 stroke-[3px]" />
                          <span>Concluir e Confirmar Pagamento</span>
                        </button>
                      )}

                      {/* Se Falta */}
                      {agd.status === 'falta' && (
                        <div className="text-purple-700 font-bold text-xxs flex items-center gap-1 py-1.5 pr-1">
                          <XCircle className="w-3.5 h-3.5 text-purple-600" />
                          <span>Falta Registrada (Descontado do Pacote)</span>
                        </div>
                      )}

                      {/* Se Finalizado */}
                      {agd.status === 'finalizado' && (
                        <div className="text-emerald-700 font-bold text-xxs flex items-center gap-1 py-1.5 pr-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Atendimento Finalizado</span>
                        </div>
                      )}

                      {/* Se Cancelado */}
                      {agd.status === 'cancelado' && (
                        <div className="text-rose-700 font-bold text-xxs flex items-center gap-1 py-1.5 pr-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE PAGAMENTO */}
      {paymentModalOpen && selectedAgdForPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl overflow-hidden flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Confirmar Pagamento
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Finalizar atendimento do Pet
                </p>
              </div>
              <button
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedAgdForPayment(null);
                  setComprovantePix('');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Valor Total:</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    R$ {selectedAgdForPayment.valorTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Controle financeiro do banho e tosa
                </p>
              </div>

              {/* Seletor de Método */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pix', label: 'PIX (Comprovante)', icon: '🧼' },
                    { id: 'cartao_credito', label: 'C. Crédito', icon: '💳' },
                    { id: 'cartao_debito', label: 'C. Débito', icon: '💳' },
                    { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
                    { id: 'pacote', label: 'Pacote de Plano', icon: '🐾' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMetodoPagamento(m.id as any);
                        if (m.id === 'pacote') {
                          setStatusPagamento('pago');
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        metodoPagamento === m.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100/50'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="text-xs font-bold leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Se for PIX, pede upload */}
              {metodoPagamento === 'pix' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Comprovante PIX (Obrigatório)</span>
                    <span className="text-rose-500 lowercase">*obrigatório</span>
                  </label>
                  
                  {!comprovantePix ? (
                    <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 bg-slate-50/50 rounded-xl p-4 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-sky-500 transition-colors" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Clique para enviar</p>
                        <p className="text-[10px] text-slate-400 font-medium">JPEG, PNG ou PDF (Max 2MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-150 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-300">
                          <img src={comprovantePix} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">comprovante_pix.png</p>
                          <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Enviado</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setComprovantePix('')}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-600 font-semibold leading-normal bg-amber-50 border border-amber-100 p-2 rounded-lg">
                    ⚠️ Conforme solicitado, pagamentos via PIX exigem o upload do comprovante para permitir dar baixa como concluído.
                  </p>
                </div>
              ) : (
                /* Outros Métodos: Sinalização Manual */
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sinalizar Status de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusPagamento('pago')}
                      className={`p-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        statusPagamento === 'pago'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pago</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusPagamento('pendente')}
                      disabled={metodoPagamento === 'pacote'}
                      className={`p-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        statusPagamento === 'pendente'
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Pendente</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold leading-normal uppercase tracking-wide text-center pt-1.5">
                    💡 O proprietário pode sinalizar manualmente o pagamento como pago ou pendente.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedAgdForPayment(null);
                  setComprovantePix('');
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentAndFinalize}
                disabled={metodoPagamento === 'pix' && !comprovantePix}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-lg text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>Confirmar e Concluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISUALIZADOR DE COMPROVANTE */}
      {receiptViewerUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={() => setReceiptViewerUrl(null)}
              className="p-2.5 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center border border-slate-700 shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-3xl w-full max-h-[80vh] flex items-center justify-center bg-transparent overflow-hidden rounded-xl">
            <img src={receiptViewerUrl} alt="Comprovante de Pagamento PIX" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-700" referrerPolicy="no-referrer" />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-slate-200">Comprovante de Pagamento PIX</p>
            <p className="text-xs text-slate-400 mt-1">Clique no botão fechar no canto superior direito para voltar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
