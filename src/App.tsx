/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cliente, Servico, Pacote, PacoteCliente, Agendamento, HistoricoPet, StatusAgendamento, HorarioFuncionamento, Estabelecimento } from './types';
import {
  INITIAL_CLIENTES,
  INITIAL_SERVICOS,
  INITIAL_PACOTES,
  INITIAL_PACOTES_CLIENTE,
  INITIAL_AGENDAMENTOS,
  INITIAL_HISTORICO
} from './data/initialData';

// Subcomponentes
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import ServiceManagement from './components/ServiceManagement';
import AppointmentManagement from './components/AppointmentManagement';
import PetHistory from './components/PetHistory';
import BackupRestore from './components/BackupRestore';
import ScheduleSettings from './components/ScheduleSettings';
import AuthScreen from './components/AuthScreen';
import CompanyProfile from './components/CompanyProfile';

// Icones
import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  Settings,
  History,
  Scissors,
  CheckCircle2,
  Database,
  Clock,
  Building2
} from 'lucide-react';

export default function App() {
  // Controle do estabelecimento logado
  const [currentStore, setCurrentStore] = useState<Estabelecimento | null>(() => {
    const saved = localStorage.getItem('pet_shop_store');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Controle de Abas: 'dashboard' | 'agenda' | 'clientes' | 'servicos' | 'historico' | 'backup' | 'horarios' | 'empresa'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'servicos' | 'historico' | 'backup' | 'horarios' | 'empresa'>('dashboard');
  
  // ID do Pet pré-selecionado para abrir o histórico diretamente
  const [selectedPetHistoryId, setSelectedPetHistoryId] = useState<string | null>(null);

  // Estados principais do Banco de Dados SQLite
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacotesCliente, setPacotesCliente] = useState<PacoteCliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [historico, setHistorico] = useState<HistoricoPet[]>([]);
  const [horarios, setHorarios] = useState<HorarioFuncionamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais do SQLite
  const fetchDbState = async () => {
    if (!currentStore) return;
    try {
      const res = await fetch('/api/db-state', {
        headers: {
          'X-Loja-ID': currentStore.id
        }
      });
      const data = await res.json();
      setClientes(data.clientes || []);
      setServicos(data.servicos || []);
      setPacotes(data.pacotes || []);
      setPacotesCliente(data.pacotesCliente || []);
      setAgendamentos(data.agendamentos || []);
      setHistorico(data.historico || []);
      setHorarios(data.horarios || []);
    } catch (err) {
      console.error('Error fetching SQLite state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHorarios = async (novosHorarios: HorarioFuncionamento[]) => {
    if (!currentStore) return;
    try {
      const res = await fetch('/api/horarios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify({ horarios: novosHorarios })
      });
      if (!res.ok) {
        throw new Error('Falha ao atualizar horários');
      }
      await fetchDbState();
    } catch (err) {
      console.error('Error saving schedules:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (currentStore) {
      setLoading(true);
      fetchDbState();
    } else {
      setLoading(false);
    }
  }, [currentStore]);

  // MUTATORS: CLIENTES
  const handleAddCliente = async (novo: Cliente) => {
    if (!currentStore) return;
    try {
      await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(novo)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCliente = async (editado: Cliente) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/clientes/${editado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(editado)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  // MUTATORS: SERVIÇOS
  const handleAddServico = async (novo: Servico) => {
    if (!currentStore) return;
    try {
      await fetch('/api/servicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(novo)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateServico = async (editado: Servico) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/servicos/${editado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(editado)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteServico = async (id: string) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/servicos/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Loja-ID': currentStore.id
        }
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  // MUTATORS: PLANOS DE PACOTES
  const handleAddPacote = async (novo: Pacote) => {
    if (!currentStore) return;
    try {
      await fetch('/api/pacotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(novo)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePacote = async (editado: Pacote) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/pacotes/${editado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(editado)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePacote = async (id: string) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/pacotes/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Loja-ID': currentStore.id
        }
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  // MUTATORS: VENDA DE PACOTES PARA CLIENTE
  const handleVenderPacote = async (novaVenda: PacoteCliente) => {
    if (!currentStore) return;
    try {
      await fetch('/api/pacotes-cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(novaVenda)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizarPacoteManualmente = async (id: string) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/pacotes-cliente/${id}/finalizar`, {
        method: 'PUT',
        headers: {
          'X-Loja-ID': currentStore.id
        }
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeductFaltaPacote = async (id: string, payload: { clienteId: string; clienteNome: string; petId: string; petNome: string }) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/pacotes-cliente/${id}/falta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(payload)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  // MUTATORS: AGENDAMENTOS
  const handleAddAgendamento = async (novo: Agendamento) => {
    if (!currentStore) return;
    try {
      await fetch('/api/agendamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(novo)
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  // CORE STATE TRANSITION ENGINE: ATUALIZAR STATUS DO AGENDAMENTO IN SQLITE
  const handleUpdateAgendamentoStatus = async (
    agdId: string,
    status: StatusAgendamento,
    metodoPagamento?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pacote',
    statusPagamento?: 'pendente' | 'pago',
    comprovantePix?: string
  ) => {
    if (!currentStore) return;
    try {
      await fetch(`/api/agendamentos/${agdId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify({ status, metodoPagamento, statusPagamento, comprovantePix })
      });
      await fetchDbState();
    } catch (err) {
      console.error(err);
    }
  };

  // BACKUP & RESET METHODS
  const handleImportBackup = async (data: {
    clientes: Cliente[];
    servicos: Servico[];
    pacotes: Pacote[];
    pacotesCliente: PacoteCliente[];
    agendamentos: Agendamento[];
    historico: HistoricoPet[];
  }) => {
    if (!currentStore) return;
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': currentStore.id
        },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.state) {
        setClientes(responseData.state.clientes || []);
        setServicos(responseData.state.servicos || []);
        setPacotes(responseData.state.pacotes || []);
        setPacotesCliente(responseData.state.pacotesCliente || []);
        setAgendamentos(responseData.state.agendamentos || []);
        setHistorico(responseData.state.historico || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDatabase = async () => {
    if (!currentStore) return;
    try {
      const res = await fetch('/api/backup/reset', {
        method: 'POST',
        headers: {
          'X-Loja-ID': currentStore.id
        }
      });
      const responseData = await res.json();
      if (responseData.state) {
        setClientes(responseData.state.clientes || []);
        setServicos(responseData.state.servicos || []);
        setPacotes(responseData.state.pacotes || []);
        setPacotesCliente(responseData.state.pacotesCliente || []);
        setAgendamentos(responseData.state.agendamentos || []);
        setHistorico(responseData.state.historico || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Navegar de forma direcionada com seleção de pet
  const handleSelectPetForHistory = (petId: string) => {
    setSelectedPetHistoryId(petId);
    setActiveTab('historico');
  };

  // Auth Guard
  if (!currentStore) {
    return <AuthScreen onLoginSuccess={(store) => {
      localStorage.setItem('pet_shop_store', JSON.stringify(store));
      setCurrentStore(store);
    }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">Sincronizando Loja...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 flex flex-col antialiased">
      {/* HEADER PRINCIPAL */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo do Pet Shop */}
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 bg-linear-to-tr ${currentStore.logo?.color || 'from-sky-500 to-indigo-600'} rounded-lg flex items-center justify-center text-white font-extrabold text-base shadow-sm overflow-hidden`}>
                {currentStore.logo?.image ? (
                  <img src={currentStore.logo.image} alt="Logo" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                ) : (
                  currentStore.logo?.emoji || '🧼'
                )}
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-slate-800 uppercase">{currentStore.nome}</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestão de Banho & Tosa</p>
              </div>
            </div>

            {/* Informações de Localização e Hora no Margem */}
            <div className="hidden lg:flex items-center gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 flex items-center gap-2 text-slate-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Base Local Estável</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-750">Julho 2026</p>
                <p className="text-[10px] text-slate-400">Atendimento Ativo</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTAINER DO LAYOUT */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* MENU LATERAL DE NAVEGAÇÃO COMPACTO */}
        <nav className="md:w-60 lg:w-64 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible bg-white md:bg-transparent p-1 md:p-0 rounded-xl md:rounded-none border md:border-0 border-slate-100 gap-1 md:gap-1.5 shrink-0 self-start w-full" id="navigation-sidebar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Painel de Negócios</span>
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'agenda'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Fila & Agendamentos</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'clientes'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Clientes & Pets</span>
          </button>

          <button
            onClick={() => setActiveTab('servicos')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'servicos'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Preços & Pacotes</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'historico'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Consultar Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('horarios')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'horarios'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Configurações de Horários</span>
          </button>

          <button
            onClick={() => setActiveTab('empresa')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'empresa'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Minha Empresa</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-sky-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup e Redefinição</span>
          </button>
        </nav>

        {/* CONTAINER DO CONTEÚDO ATIVO */}
        <section className="flex-1 min-w-0" id="main-content-display">
          {activeTab === 'dashboard' && (
            <Dashboard
              agendamentos={agendamentos}
              clientes={clientes}
              historico={historico}
              pacotesCliente={pacotesCliente}
              onNavigateToTab={setActiveTab}
              onSelectPetForHistory={handleSelectPetForHistory}
            />
          )}

          {activeTab === 'agenda' && (
            <AppointmentManagement
              agendamentos={agendamentos}
              clientes={clientes}
              servicos={servicos}
              pacotesCliente={pacotesCliente}
              horarios={horarios}
              onAddAgendamento={handleAddAgendamento}
              onUpdateAgendamentoStatus={handleUpdateAgendamentoStatus}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientManagement
              clientes={clientes}
              onAddCliente={handleAddCliente}
              onUpdateCliente={handleUpdateCliente}
              onSelectPetForHistory={handleSelectPetForHistory}
            />
          )}

          {activeTab === 'servicos' && (
            <ServiceManagement
              servicos={servicos}
              pacotes={pacotes}
              pacotesCliente={pacotesCliente}
              clientes={clientes}
              onAddServico={handleAddServico}
              onUpdateServico={handleUpdateServico}
              onDeleteServico={handleDeleteServico}
              onAddPacote={handleAddPacote}
              onUpdatePacote={handleUpdatePacote}
              onDeletePacote={handleDeletePacote}
              onVenderPacote={handleVenderPacote}
              onFinalizarPacote={handleFinalizarPacoteManualmente}
              onDeductFalta={handleDeductFaltaPacote}
            />
          )}

          {activeTab === 'historico' && (
            <PetHistory
              historico={historico}
              clientes={clientes}
              selectedPetId={selectedPetHistoryId}
              onClearSelectedPetId={() => setSelectedPetHistoryId(null)}
            />
          )}

          {activeTab === 'horarios' && (
            <ScheduleSettings
              horarios={horarios}
              onUpdateHorarios={handleUpdateHorarios}
            />
          )}

          {activeTab === 'empresa' && (
            <CompanyProfile
              store={currentStore}
              onProfileUpdate={(updated) => {
                localStorage.setItem('pet_shop_store', JSON.stringify(updated));
                setCurrentStore(updated);
              }}
              onLogout={() => {
                localStorage.removeItem('pet_shop_store');
                setCurrentStore(null);
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestore
              clientes={clientes}
              servicos={servicos}
              pacotes={pacotes}
              pacotesCliente={pacotesCliente}
              agendamentos={agendamentos}
              historico={historico}
              onImportBackup={handleImportBackup}
              onResetDatabase={handleResetDatabase}
            />
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          {currentStore.nome} © 2026 • Sistema de Gestão Inteligente para Banho e Tosa • Português (Brasil)
        </div>
      </footer>
    </div>
  );
}
