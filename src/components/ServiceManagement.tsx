/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Servico, Pacote, PacoteCliente, Cliente, Pet } from '../types';
import { Plus, Trash2, Edit, ShoppingCart, Percent, DollarSign, Briefcase, Sparkles, User, Check, AlertCircle } from 'lucide-react';

interface ServiceManagementProps {
  servicos: Servico[];
  pacotes: Pacote[];
  pacotesCliente: PacoteCliente[];
  clientes: Cliente[];
  onAddServico: (servico: Servico) => void;
  onUpdateServico: (servico: Servico) => void;
  onDeleteServico: (id: string) => void;
  onAddPacote: (pacote: Pacote) => void;
  onUpdatePacote: (pacote: Pacote) => void;
  onDeletePacote: (id: string) => void;
  onVenderPacote: (venda: PacoteCliente) => void;
  onFinalizarPacote: (id: string) => void;
  onDeductFalta: (id: string, payload: { clienteId: string; clienteNome: string; petId: string; petNome: string }) => Promise<void>;
}

export default function ServiceManagement({
  servicos,
  pacotes,
  pacotesCliente,
  clientes,
  onAddServico,
  onUpdateServico,
  onDeleteServico,
  onAddPacote,
  onUpdatePacote,
  onDeletePacote,
  onVenderPacote,
  onFinalizarPacote,
  onDeductFalta
}: ServiceManagementProps) {
  // Tabs: 'servicos', 'pacotes', 'vendas'
  const [activeTab, setActiveTab] = useState<'servicos' | 'pacotes' | 'vendas'>('servicos');
  const [successMessage, setSuccessMessage] = useState('');

  // Servico form states
  const [isEditingServico, setIsEditingServico] = useState(false);
  const [editingServicoId, setEditingServicoId] = useState<string | null>(null);
  const [servicoNome, setServicoNome] = useState('');
  const [servicoValor, setServicoValor] = useState(0);

  // Pacote form states
  const [isEditingPacote, setIsEditingPacote] = useState(false);
  const [editingPacoteId, setEditingPacoteId] = useState<string | null>(null);
  const [pacoteNome, setPacoteNome] = useState('');
  const [pacoteDescricao, setPacoteDescricao] = useState('');
  const [pacoteValor, setPacoteValor] = useState(0);
  const [pacoteTotalBanhos, setPacoteTotalBanhos] = useState(4);

  // Venda de Pacote states
  const [isVendendo, setIsVendendo] = useState(false);
  const [vendaClienteId, setVendaClienteId] = useState('');
  const [vendaPetId, setVendaPetId] = useState('');
  const [vendaPacoteId, setVendaPacoteId] = useState('');
  const [vendaBanhosTotais, setVendaBanhosTotais] = useState<number>(4);
  const [vendaValor, setVendaValor] = useState<number>(0);
  const [vendaSemanas, setVendaSemanas] = useState<'4' | '5' | 'custom'>('4');
  const [vendaValorUnitarioBanho, setVendaValorUnitarioBanho] = useState<number>(0);
  const [vendaAdicionais, setVendaAdicionais] = useState<{ id: string; servicoId: string; nome: string; valor: number; qtd: number }[]>([]);
  const [vendaNovoAdicionalServicoId, setVendaNovoAdicionalServicoId] = useState<string>('');
  const [vendaNovoAdicionalValor, setVendaNovoAdicionalValor] = useState<number>(0);
  const [vendaNovoAdicionalQtd, setVendaNovoAdicionalQtd] = useState<number>(1);

  const handleSemanasChange = (tipo: '4' | '5' | 'custom', pacId: string) => {
    setVendaSemanas(tipo);
    const pac = pacotes.find(p => p.id === pacId);
    if (!pac) return;

    if (tipo === '4') {
      setVendaBanhosTotais(pac.totalBanhos);
      const vu = parseFloat((pac.valor / pac.totalBanhos).toFixed(2));
      setVendaValorUnitarioBanho(vu);
      setVendaValor(pac.valor);
    } else if (tipo === '5') {
      const novosBanhos = pac.totalBanhos === 4 ? 5 : pac.totalBanhos + 1;
      setVendaBanhosTotais(novosBanhos);
      const vu = parseFloat((pac.valor / pac.totalBanhos).toFixed(2));
      setVendaValorUnitarioBanho(vu);
      setVendaValor(parseFloat((vu * novosBanhos).toFixed(2)));
    }
  };

  const handleAdicionalServicoChange = (srvId: string) => {
    setVendaNovoAdicionalServicoId(srvId);
    const srv = servicos.find(s => s.id === srvId);
    if (srv) {
      setVendaNovoAdicionalValor(srv.valor);
    } else {
      setVendaNovoAdicionalValor(0);
    }
  };

  const handleAddAdicional = () => {
    if (!vendaNovoAdicionalServicoId) return;
    const srv = servicos.find(s => s.id === vendaNovoAdicionalServicoId);
    if (!srv) return;

    const existingIndex = vendaAdicionais.findIndex(a => a.servicoId === srv.id);
    if (existingIndex > -1) {
      const updated = [...vendaAdicionais];
      updated[existingIndex].qtd += vendaNovoAdicionalQtd;
      setVendaAdicionais(updated);
    } else {
      setVendaAdicionais([
        ...vendaAdicionais,
        {
          id: `add-${Date.now()}`,
          servicoId: srv.id,
          nome: srv.nome,
          valor: vendaNovoAdicionalValor,
          qtd: vendaNovoAdicionalQtd
        }
      ]);
    }

    setVendaNovoAdicionalServicoId('');
    setVendaNovoAdicionalValor(0);
    setVendaNovoAdicionalQtd(1);
  };

  const handleRemoveAdicional = (id: string) => {
    setVendaAdicionais(vendaAdicionais.filter(a => a.id !== id));
  };

  // Transport service state
  const transportService = servicos.find(s => s.id === 'srv-transporte');
  const currentTransportValor = transportService ? transportService.valor : 5.00;
  const [transportValor, setTransportValor] = useState<number>(currentTransportValor);

  useEffect(() => {
    if (transportService) {
      setTransportValor(transportService.valor);
    }
  }, [currentTransportValor]);

  const handleSaveTransporte = () => {
    if (transportValor < 0) {
      alert('A taxa de transporte não pode ser negativa.');
      return;
    }
    onUpdateServico({
      id: 'srv-transporte',
      nome: 'Taxa de Transporte (Leva e Trás)',
      valor: transportValor
    });
    showToast('Taxa de transporte atualizada com sucesso!');
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Servicos Submit
  const handleServicoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoNome.trim() || servicoValor <= 0) {
      alert('Nome inválido ou valor deve ser maior que zero.');
      return;
    }

    if (editingServicoId) {
      onUpdateServico({ id: editingServicoId, nome: servicoNome, valor: servicoValor });
      showToast('Serviço atualizado com sucesso!');
    } else {
      onAddServico({ id: `srv-${Date.now()}`, nome: servicoNome, valor: servicoValor });
      showToast('Serviço cadastrado com sucesso!');
    }

    setIsEditingServico(false);
    setEditingServicoId(null);
    setServicoNome('');
    setServicoValor(0);
  };

  // Pacotes Submit
  const handlePacoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacoteNome.trim() || pacoteValor <= 0 || pacoteTotalBanhos <= 0) {
      alert('Preencha os campos corretamente.');
      return;
    }

    if (editingPacoteId) {
      onUpdatePacote({
        id: editingPacoteId,
        nome: pacoteNome,
        descricao: pacoteDescricao,
        valor: pacoteValor,
        totalBanhos: pacoteTotalBanhos
      });
      showToast('Pacote de banhos atualizado!');
    } else {
      onAddPacote({
        id: `pac-${Date.now()}`,
        nome: pacoteNome,
        descricao: pacoteDescricao,
        valor: pacoteValor,
        totalBanhos: pacoteTotalBanhos
      });
      showToast('Novo pacote de banhos criado!');
    }

    setIsEditingPacote(false);
    setEditingPacoteId(null);
    setPacoteNome('');
    setPacoteDescricao('');
    setPacoteValor(0);
    setPacoteTotalBanhos(4);
  };

  // Vender Pacote Submit
  const handleVendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaClienteId || !vendaPetId || !vendaPacoteId) {
      alert('Selecione o Cliente, o Pet e o Pacote.');
      return;
    }

    const selectedCli = clientes.find(c => c.id === vendaClienteId);
    const selectedPet = selectedCli?.pets.find(p => p.id === vendaPetId);
    const selectedPac = pacotes.find(p => p.id === vendaPacoteId);

    if (!selectedCli || !selectedPet || !selectedPac) {
      alert('Erro ao recuperar dados da venda.');
      return;
    }

    // Verificar se o pet já possui pacote ativo
    const petPacoteAtivo = pacotesCliente.find(p => p.petId === vendaPetId && p.status === 'ativo');
    if (petPacoteAtivo) {
      const confirmText = `${selectedPet.nome} já possui o pacote ativo "${petPacoteAtivo.nomePacote}" (${petPacoteAtivo.banhosUsados}/${petPacoteAtivo.banhosTotais} usados). Deseja vender outro pacote ativo mesmo assim?`;
      if (!window.confirm(confirmText)) {
        return;
      }
    }

    const subtotalBanhos = vendaBanhosTotais * (vendaValorUnitarioBanho || 0);
    const subtotalAdicionais = vendaAdicionais.reduce((acc, curr) => acc + (curr.valor * curr.qtd), 0);
    const calculadoVendaValor = parseFloat((subtotalBanhos + subtotalAdicionais).toFixed(2));

    // Formatar nome do pacote de forma clara
    let finalNomePacote = `${selectedPac.nome} (${vendaBanhosTotais} Banhos`;
    if (vendaAdicionais.length > 0) {
      finalNomePacote += ` + ${vendaAdicionais.map(a => `${a.qtd}x ${a.nome}`).join(', ')}`;
    }
    finalNomePacote += `)`;

    const novaVenda: PacoteCliente = {
      id: `pacc-${Date.now()}`,
      clienteId: vendaClienteId,
      petId: vendaPetId,
      pacoteId: vendaPacoteId,
      nomePacote: finalNomePacote,
      dataAquisicao: new Date().toISOString().split('T')[0],
      banhosTotais: vendaBanhosTotais,
      banhosUsados: 0,
      status: 'ativo',
      valorPago: calculadoVendaValor
    };

    onVenderPacote(novaVenda);
    showToast(`Pacote vendido com sucesso para ${selectedPet.nome}!`);
    setIsVendendo(false);
    setVendaClienteId('');
    setVendaPetId('');
    setVendaPacoteId('');
    setVendaBanhosTotais(4);
    setVendaValor(0);
    setVendaSemanas('4');
    setVendaValorUnitarioBanho(0);
    setVendaAdicionais([]);
  };

  const selectedCliente = clientes.find(c => c.id === vendaClienteId);

  return (
    <div className="space-y-6" id="service-management-section">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {/* Header com Navegação interna */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Serviços & Pacotes</h2>
          <p className="text-xs text-slate-500 mt-1">Configure os preços de banho, tosa e gerencie os pacotes de fidelidade</p>
        </div>

        {/* Seletor de Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('servicos')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'servicos' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Serviços Avulsos</span>
          </button>
          <button
            onClick={() => setActiveTab('pacotes')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pacotes' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Planos de Pacotes</span>
          </button>
          <button
            onClick={() => setActiveTab('vendas')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vendas' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Pacotes de Clientes</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SERVIÇOS AVULSOS */}
      {activeTab === 'servicos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Formulário de Cadastro/Edição de Serviço */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs h-fit">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>{editingServicoId ? 'Editar Serviço' : 'Cadastrar Serviço'}</span>
              </h3>

              <form onSubmit={handleServicoSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Descrição do Serviço *</label>
                  <input
                    type="text"
                    required
                    value={servicoNome}
                    onChange={(e) => setServicoNome(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    placeholder="Ex: Banho Completo + Tosa Higiênica"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Valor do Serviço (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={servicoValor || ''}
                      onChange={(e) => setServicoValor(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingServicoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingServico(false);
                        setEditingServicoId(null);
                        setServicoNome('');
                        setServicoValor(0);
                      }}
                      className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all cursor-pointer ${
                      editingServicoId ? 'w-1/2' : 'w-full'
                    }`}
                  >
                    {editingServicoId ? 'Salvar Alterações' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>

            {/* Configuração de Taxa de Transporte */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="text-base">🚗</span>
                <span>Configurar Leva e Trás</span>
              </h3>
              <p className="text-xxs text-slate-500 leading-relaxed">
                Ajuste o valor padrão cobrado pela taxa de busca e entrega (Leva e Trás). Esta taxa será somada ao total do agendamento sempre que o transporte for marcado.
              </p>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Taxa de Transporte (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-semibold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transportValor || ''}
                    onChange={(e) => setTransportValor(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                    placeholder="5.00"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveTransporte}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Atualizar Valor do Transporte</span>
              </button>
            </div>
          </div>

          {/* Listagem de Serviços */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs h-fit">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">Serviços Cadastrados ({servicos.filter(s => s.id !== 'srv-transporte').length})</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {servicos.filter(s => s.id !== 'srv-transporte').length === 0 ? (
                <p className="p-6 text-slate-400 text-sm text-center">Nenhum serviço avulso cadastrado.</p>
              ) : (
                servicos.filter(s => s.id !== 'srv-transporte').map(srv => (
                  <div key={srv.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-all">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{srv.nome}</p>
                      <p className="text-xxs text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">ID: {srv.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg">
                        R$ {srv.valor.toFixed(2)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setIsEditingServico(true);
                            setEditingServicoId(srv.id);
                            setServicoNome(srv.nome);
                            setServicoValor(srv.valor);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Editar Serviço"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja mesmo remover o serviço "${srv.nome}"?`)) {
                              onDeleteServico(srv.id);
                              showToast('Serviço removido com sucesso!');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Excluir Serviço"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMBOS DE PLANOS / PACOTES */}
      {activeTab === 'pacotes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Cadastro/Edição de Pacotes */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-xs h-fit">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>{editingPacoteId ? 'Editar Plano' : 'Criar Plano de Pacote'}</span>
            </h3>

            <form onSubmit={handlePacoteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nome do Plano *</label>
                <input
                  type="text"
                  required
                  value={pacoteNome}
                  onChange={(e) => setPacoteNome(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  placeholder="Ex: Plano Mensal Bronze"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Descrição do Plano</label>
                <textarea
                  value={pacoteDescricao}
                  onChange={(e) => setPacoteDescricao(e.target.value)}
                  rows={2}
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all resize-none"
                  placeholder="Ex: Inclui 4 Banhos simples com busca grátis"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Qtd Banhos *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pacoteTotalBanhos}
                    onChange={(e) => setPacoteTotalBanhos(parseInt(e.target.value) || 4)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Preço do Plano *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-3 text-xs font-semibold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={pacoteValor || ''}
                      onChange={(e) => setPacoteValor(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingPacoteId && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPacote(false);
                      setEditingPacoteId(null);
                      setPacoteNome('');
                      setPacoteDescricao('');
                      setPacoteValor(0);
                      setPacoteTotalBanhos(4);
                    }}
                    className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className={`py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all cursor-pointer ${
                    editingPacoteId ? 'w-1/2' : 'w-full'
                  }`}
                >
                  {editingPacoteId ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>

          {/* Listagem de Pacotes */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">Planos de Fidelidade Cadastrados ({pacotes.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {pacotes.length === 0 ? (
                <p className="p-6 text-slate-400 text-sm text-center">Nenhum plano de pacotes cadastrado.</p>
              ) : (
                pacotes.map(pac => (
                  <div key={pac.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-all">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span>✨</span> {pac.nome}
                      </p>
                      <p className="text-xs text-slate-500">{pac.descricao || 'Sem descrição cadastrada.'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-bold bg-emerald-100 text-emerald-800">
                          {pac.totalBanhos} Banhos Inclusos
                        </span>
                        <span className="text-xxs text-slate-400 font-semibold">Custo unitário aprox: R$ {(pac.valor / pac.totalBanhos).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        R$ {pac.valor.toFixed(2)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setIsEditingPacote(true);
                            setEditingPacoteId(pac.id);
                            setPacoteNome(pac.nome);
                            setPacoteDescricao(pac.descricao);
                            setPacoteValor(pac.valor);
                            setPacoteTotalBanhos(pac.totalBanhos);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Editar Plano"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja realmente remover o plano "${pac.nome}"?`)) {
                              onDeletePacote(pac.id);
                              showToast('Plano de pacotes removido!');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Excluir Plano"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GERENCIAMENTO DE PACOTES ADQUIRIDOS / CLIENTES */}
      {activeTab === 'vendas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário para Vender Pacote */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-xs h-fit">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-600" />
              <span>Vender Novo Pacote</span>
            </h3>

            <form onSubmit={handleVendaSubmit} className="space-y-4">
              {/* Escolher Tutor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Selecione o Cliente (Tutor) *</label>
                <select
                  required
                  value={vendaClienteId}
                  onChange={(e) => {
                    setVendaClienteId(e.target.value);
                    setVendaPetId(''); // limpa pet anterior
                  }}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                >
                  <option value="">-- Escolha um tutor --</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nome} ({cli.telefone})</option>
                  ))}
                </select>
              </div>

              {/* Escolher Pet */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Selecione o Pet *</label>
                <select
                  required
                  disabled={!vendaClienteId}
                  value={vendaPetId}
                  onChange={(e) => setVendaPetId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:opacity-50 transition-all"
                >
                  <option value="">-- Escolha o animal --</option>
                  {selectedCliente?.pets.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} (Porte {p.porte === 'pequeno' ? 'P' : p.porte === 'medio' ? 'M' : 'G'})</option>
                  ))}
                </select>
              </div>

              {/* Escolher Pacote */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Escolha o Pacote *</label>
                <select
                  required
                  value={vendaPacoteId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVendaPacoteId(val);
                    setVendaSemanas('4');
                    const selectedPac = pacotes.find(p => p.id === val);
                    if (selectedPac) {
                      setVendaBanhosTotais(selectedPac.totalBanhos);
                      setVendaValorUnitarioBanho(parseFloat((selectedPac.valor / selectedPac.totalBanhos).toFixed(2)));
                      setVendaValor(selectedPac.valor);
                      setVendaAdicionais([]);
                    } else {
                      setVendaBanhosTotais(4);
                      setVendaValor(0);
                      setVendaValorUnitarioBanho(0);
                      setVendaAdicionais([]);
                    }
                  }}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                >
                  <option value="">-- Escolha o plano contratado --</option>
                  {pacotes.map(pac => (
                    <option key={pac.id} value={pac.id}>{pac.nome} - R$ {pac.valor.toFixed(2)} ({pac.totalBanhos} banhos)</option>
                  ))}
                </select>
              </div>

              {vendaPacoteId && (
                <div className="space-y-5 pt-3 border-t border-slate-100/60 animate-in fade-in">
                  
                  {/* Seletor de Semanas/Meses */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <span>Duração (Meses de 4 ou 5 Semanas)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSemanasChange('4', vendaPacoteId)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          vendaSemanas === '4'
                            ? 'bg-sky-50 text-sky-700 border-sky-500 ring-2 ring-sky-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        4 Semanas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSemanasChange('5', vendaPacoteId)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          vendaSemanas === '5'
                            ? 'bg-sky-50 text-sky-700 border-sky-500 ring-2 ring-sky-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        5 Semanas
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendaSemanas('custom')}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          vendaSemanas === 'custom'
                            ? 'bg-sky-50 text-sky-700 border-sky-500 ring-2 ring-sky-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Customizado
                      </button>
                    </div>
                  </div>

                  {/* Detalhes de Banhos e Valor */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Configuração dos Banhos</span>
                      <span className="text-xxs bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-sm font-bold">Subtotal: R$ {(vendaBanhosTotais * vendaValorUnitarioBanho).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total de Banhos</label>
                        <input
                          type="number"
                          min="1"
                          disabled={vendaSemanas !== 'custom'}
                          value={vendaBanhosTotais}
                          onChange={(e) => setVendaBanhosTotais(parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-75 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Unitário do Banho (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={vendaValorUnitarioBanho}
                          onChange={(e) => setVendaValorUnitarioBanho(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-semibold italic flex justify-center bg-white py-1 rounded-md border border-slate-100">
                      📝 {vendaBanhosTotais} banhos x R$ {vendaValorUnitarioBanho.toFixed(2)} = R$ {(vendaBanhosTotais * vendaValorUnitarioBanho).toFixed(2)}
                    </p>

                    {vendaSemanas === '5' && (
                      <p className="text-[10px] text-sky-600 font-semibold leading-normal bg-sky-50 p-2 rounded-lg border border-sky-100/50">
                        💡 Ajuste automático para 5 Semanas ativo. Um banho adicional foi incluído proporcionalmente.
                      </p>
                    )}
                  </div>

                  {/* Adicionar Serviços Adicionais no Pacote (Tosa, etc.) */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Serviços Adicionais no Mês (Tosa, Hidratação, etc.)</span>
                    
                    <div className="space-y-2">
                      <select
                        value={vendaNovoAdicionalServicoId}
                        onChange={(e) => handleAdicionalServicoChange(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">-- Adicionar Tosa ou outro serviço --</option>
                        {servicos.filter(s => s.id !== 'srv-transporte').map(s => (
                          <option key={s.id} value={s.id}>{s.nome} (Padrão: R$ {s.valor.toFixed(2)})</option>
                        ))}
                      </select>

                      {vendaNovoAdicionalServicoId && (
                        <div className="grid grid-cols-3 gap-2 items-end bg-white p-2 rounded-lg border border-slate-100 animate-in slide-in-from-top-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valor (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={vendaNovoAdicionalValor}
                              onChange={(e) => setVendaNovoAdicionalValor(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-semibold px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Qtd no Mês</label>
                            <input
                              type="number"
                              min="1"
                              value={vendaNovoAdicionalQtd}
                              onChange={(e) => setVendaNovoAdicionalQtd(parseInt(e.target.value) || 1)}
                              className="w-full text-xs font-semibold px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddAdicional}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold py-1.5 rounded-md cursor-pointer transition-all text-center"
                          >
                            Incluir
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lista de Adicionais Incluídos */}
                    {vendaAdicionais.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-200/50">
                        {vendaAdicionais.map(adicional => (
                          <div key={adicional.id} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-xxs animate-in fade-in">
                            <span className="font-medium text-slate-600">{adicional.qtd}x {adicional.nome}</span>
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                              <span>R$ {(adicional.valor * adicional.qtd).toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAdicional(adicional.id)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer text-[13px] font-extrabold px-1"
                                title="Remover"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumo do Fechamento do Pacote do Mês */}
                  <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-2">
                    <h4 className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-sm">🧮</span>
                      <span>Fechamento do Pacote Mensal</span>
                    </h4>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Banhos ({vendaBanhosTotais}x R$ {vendaValorUnitarioBanho.toFixed(2)}):</span>
                        <span className="font-semibold">R$ {(vendaBanhosTotais * vendaValorUnitarioBanho).toFixed(2)}</span>
                      </div>
                      {vendaAdicionais.length > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Serviços Adicionais:</span>
                          <span className="font-semibold">R$ {vendaAdicionais.reduce((acc, curr) => acc + (curr.valor * curr.qtd), 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-sky-100 flex justify-between text-slate-800 font-extrabold text-sm">
                        <span className="text-sky-900">Total a Pagar no Mês:</span>
                        <span className="text-sky-950 bg-sky-100/80 px-2 py-0.5 rounded-md">
                          R$ {parseFloat((vendaBanhosTotais * vendaValorUnitarioBanho + vendaAdicionais.reduce((acc, curr) => acc + (curr.valor * curr.qtd), 0)).toFixed(2)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-sky-700/80 leading-normal font-medium bg-white/60 p-2 rounded-lg border border-sky-100/30">
                      👉 <strong>Nome que aparecerá no pet:</strong> {`${pacotes.find(p => p.id === vendaPacoteId)?.nome} (${vendaBanhosTotais} Banhos${vendaAdicionais.length > 0 ? ` + ${vendaAdicionais.map(a => `${a.qtd}x ${a.nome}`).join(', ')}` : ''})`}
                    </p>
                  </div>

                </div>
              )}

              <button
                type="submit"
                disabled={!vendaClienteId || !vendaPetId || !vendaPacoteId}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-lg text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Confirmar Venda de Pacote</span>
              </button>
            </form>
          </div>

          {/* Pacotes Ativos / Vendidos */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col h-[520px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-700 text-sm">Controle de Pacotes Vendidos</h3>
              <div className="flex gap-2">
                <span className="text-xxs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">Ativos: {pacotesCliente.filter(p => p.status === 'ativo').length}</span>
                <span className="text-xxs px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full">Finalizados: {pacotesCliente.filter(p => p.status === 'finalizado').length}</span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {pacotesCliente.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Nenhum cliente possui pacotes contratados. Use o formulário ao lado para realizar a primeira venda!
                </div>
              ) : (
                pacotesCliente.map(pacc => {
                  const tutor = clientes.find(c => c.id === pacc.clienteId);
                  const pet = tutor?.pets.find(pt => pt.id === pacc.petId);
                  const usagePercent = (pacc.banhosUsados / pacc.banhosTotais) * 100;

                  return (
                    <div key={pacc.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xxs font-bold uppercase rounded-md tracking-wider ${
                            pacc.status === 'ativo' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {pacc.status === 'ativo' ? 'Ativo' : 'Concluído'}
                          </span>
                          <span className="text-slate-400 text-xxs">Adquirido em {pacc.dataAquisicao}</span>
                        </div>
                        
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span>{pacc.nomePacote}</span>
                          {pacc.valorPago !== undefined && pacc.valorPago !== null && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                              R$ {pacc.valorPago.toFixed(2)}
                            </span>
                          )}
                        </p>
                        
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Pet: <strong>{pet?.nome || 'Pet excluído'}</strong> (Tutor: {tutor?.nome || 'Excluído'})</span>
                        </p>

                        {/* Barra de Progresso */}
                        <div className="space-y-1 pt-1.5 max-w-sm">
                          <div className="flex justify-between text-xxs font-bold text-slate-500">
                            <span>Consumo de Banhos</span>
                            <span>{pacc.banhosUsados} de {pacc.banhosTotais} banhos</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                pacc.status === 'finalizado' ? 'bg-slate-400' :
                                usagePercent >= 75 ? 'bg-rose-500' :
                                usagePercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {pacc.status === 'ativo' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const petNome = pet?.nome || 'Pet';
                              const msg = `Deseja registrar uma falta para o pet "${petNome}" e descontar 1 banho do pacote "${pacc.nomePacote}"?`;
                              
                              if (window.confirm(msg)) {
                                await onDeductFalta(pacc.id, {
                                  clienteId: pacc.clienteId,
                                  clienteNome: tutor?.nome || 'Cliente',
                                  petId: pacc.petId,
                                  petNome: petNome
                                });
                                showToast(`Falta registrada para ${petNome}. 1 banho descontado do pacote!`);
                              }
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-100/50 transition-all flex items-center gap-1 cursor-pointer"
                            title="Registrar Falta e descontar 1 banho"
                          >
                            <span className="text-rose-500 font-extrabold">✕</span>
                            <span>Registrar Falta</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja marcar o pacote de "${pet?.nome}" como Finalizado manualmente?`)) {
                                onFinalizarPacote(pacc.id);
                                showToast('Pacote finalizado com sucesso!');
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-600 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Finalizar Plano"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Encerrar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
