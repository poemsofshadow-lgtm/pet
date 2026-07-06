/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cliente, Pet, PortePet, TipoEndereco } from '../types';
import { Plus, Trash2, Search, UserPlus, FileText, Phone, MapPin, Edit, Eye, ShieldAlert, Check } from 'lucide-react';

interface ClientManagementProps {
  clientes: Cliente[];
  onAddCliente: (cliente: Cliente) => void;
  onUpdateCliente: (cliente: Cliente) => void;
  onSelectPetForHistory: (petId: string) => void;
}

export default function ClientManagement({
  clientes,
  onAddCliente,
  onUpdateCliente,
  onSelectPetForHistory
}: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [tipoEndereco, setTipoEndereco] = useState<TipoEndereco>('casa');
  
  // Prédio especificidades
  const [bloco, setBloco] = useState('');
  const [torre, setTorre] = useState('');
  const [apartamento, setApartamento] = useState('');
  
  // Condomínio especificidades
  const [quadra, setQuadra] = useState('');
  const [lote, setLote] = useState('');

  // Pets Temp List
  const [tempPets, setTempPets] = useState<Omit<Pet, 'id' | 'clienteId'>[]>([
    { nome: '', porte: 'pequeno', observacao: '' }
  ]);

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddTempPet = () => {
    setTempPets([...tempPets, { nome: '', porte: 'pequeno', observacao: '' }]);
  };

  const handleRemoveTempPet = (index: number) => {
    if (tempPets.length > 1) {
      setTempPets(tempPets.filter((_, i) => i !== index));
    } else {
      setTempPets([{ nome: '', porte: 'pequeno', observacao: '' }]);
    }
  };

  const handleTempPetChange = (index: number, field: keyof Omit<Pet, 'id' | 'clienteId'>, value: string) => {
    const updated = [...tempPets];
    updated[index] = { ...updated[index], [field]: value };
    setTempPets(updated);
  };

  const startNewCliente = () => {
    setIsEditing(true);
    setEditingClienteId(null);
    setNome('');
    setTelefone('');
    setEndereco('');
    setNumero('');
    setBairro('');
    setTipoEndereco('casa');
    setBloco('');
    setTorre('');
    setApartamento('');
    setQuadra('');
    setLote('');
    setTempPets([{ nome: '', porte: 'pequeno', observacao: '' }]);
  };

  const startEditCliente = (cli: Cliente) => {
    setIsEditing(true);
    setEditingClienteId(cli.id);
    setNome(cli.nome);
    setTelefone(cli.telefone);
    setEndereco(cli.endereco);
    setNumero(cli.numero);
    setBairro(cli.bairro);
    setTipoEndereco(cli.tipoEndereco);
    setBloco(cli.bloco || '');
    setTorre(cli.torre || '');
    setApartamento(cli.apartamento || '');
    setQuadra(cli.quadra || '');
    setLote(cli.lote || '');
    
    // Mapeia os pets já cadastrados do cliente
    setTempPets(cli.pets.map(p => ({
      nome: p.nome,
      porte: p.porte,
      observacao: p.observacao
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !telefone.trim() || !endereco.trim()) {
      alert('Por favor, preencha nome, telefone e endereço principal.');
      return;
    }

    // Filtrar pets vazios
    const validPets = tempPets.filter(p => p.nome.trim() !== '');
    if (validPets.length === 0) {
      alert('Por favor, adicione pelo menos um Pet com nome.');
      return;
    }

    const clienteId = editingClienteId || `cli-${Date.now()}`;

    // Construir lista final de pets
    const finalPets: Pet[] = validPets.map((p, idx) => ({
      id: editingClienteId ? (clientes.find(c => c.id === editingClienteId)?.pets[idx]?.id || `pet-${Date.now()}-${idx}`) : `pet-${Date.now()}-${idx}`,
      clienteId,
      nome: p.nome,
      porte: p.porte as PortePet,
      observacao: p.observacao
    }));

    const novoCliente: Cliente = {
      id: clienteId,
      nome,
      telefone,
      endereco,
      numero,
      bairro,
      tipoEndereco,
      pets: finalPets,
      ...(tipoEndereco === 'predio' ? { bloco, torre, apartamento } : {}),
      ...(tipoEndereco === 'condominio' ? { quadra, lote } : {})
    };

    if (editingClienteId) {
      onUpdateCliente(novoCliente);
      showToast('Cliente atualizado com sucesso!');
    } else {
      onAddCliente(novoCliente);
      showToast('Cliente cadastrado com sucesso!');
    }

    setIsEditing(false);
    setEditingClienteId(null);
    setSelectedCliente(novoCliente);
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredClientes = clientes.filter(c => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const tokens = searchLower.split(/\s+/).filter(Boolean);
    
    const tutorName = c.nome.toLowerCase();
    const phone = c.telefone.toLowerCase();
    const cleanPhone = c.telefone.replace(/\D/g, '');
    const petNames = c.pets.map(p => p.nome.toLowerCase()).join(' ');
    
    const combinedFields = `${tutorName} ${phone} ${cleanPhone} ${petNames}`;
    
    return tokens.every(token => {
      const cleanToken = token.replace(/\D/g, '');
      if (cleanToken && /^\d+$/.test(cleanToken)) {
        return cleanPhone.includes(cleanToken) || phone.includes(token);
      }
      return combinedFields.includes(token);
    });
  });

  return (
    <div className="space-y-6" id="client-management-section">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {/* Header com busca */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clientes & Pets</h2>
          <p className="text-xs text-slate-500 mt-1">Gerencie tutores e seus respectivos animais de estimação</p>
        </div>
        <div className="flex items-center gap-3 font-sans">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tutor, telefone ou pet (ex: Rex 99988)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={startNewCliente}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-xs cursor-pointer"
            id="btn-novo-cliente"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listagem de Clientes */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">Lista de Clientes ({filteredClientes.length})</h3>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredClientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">Nenhum cliente encontrado.</p>
              </div>
            ) : (
              filteredClientes.map(cli => (
                <div
                  key={cli.id}
                  onClick={() => setSelectedCliente(cli)}
                  className={`p-4 transition-all cursor-pointer hover:bg-slate-50 flex items-start justify-between gap-2 ${
                    selectedCliente?.id === cli.id ? 'bg-sky-50/50 border-l-4 border-sky-600 pl-3' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800 text-sm">{cli.nome}</p>
                    <div className="flex items-center text-slate-500 text-xs gap-1.5">
                      <Phone className="w-3 h-3" />
                      <span>{cli.telefone}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cli.pets.map(p => (
                        <span key={p.id} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xxs font-medium bg-sky-100 text-sky-800">
                          🐾 {p.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditCliente(cli);
                    }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Editar Cliente"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detalhes ou Formulário de Edição */}
        <div className="lg:col-span-2">
          {isEditing ? (
            /* FORMULÁRIO DE CADASTRO/EDIÇÃO */
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-800 text-base">
                  {editingClienteId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* Informações Pessoais */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados do Tutor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="Ex: Carlos de Souza"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço Inteligente */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereço</h4>
                  {/* Tipo de Residência */}
                  <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                    {(['casa', 'predio', 'condominio'] as TipoEndereco[]).map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setTipoEndereco(tipo)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                          tipoEndereco === tipo
                            ? 'bg-white text-slate-800 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tipo === 'predio' ? 'Prédio' : tipo === 'condominio' ? 'Condomínio' : 'Casa'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Logradouro / Rua *</label>
                    <input
                      type="text"
                      required
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="Ex: Rua das Rosas"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Número *</label>
                    <input
                      type="text"
                      required
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="Ex: 123 ou s/n"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Bairro *</label>
                    <input
                      type="text"
                      required
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      placeholder="Ex: Jardim Paulista"
                    />
                  </div>

                  {/* Detalhes se Prédio */}
                  {tipoEndereco === 'predio' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Bloco</label>
                        <input
                          type="text"
                          value={bloco}
                          onChange={(e) => setBloco(e.target.value)}
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                          placeholder="Ex: Bloco A"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Torre</label>
                        <input
                          type="text"
                          value={torre}
                          onChange={(e) => setTorre(e.target.value)}
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                          placeholder="Ex: Torre Sul"
                        />
                      </div>
                      <div className="space-y-1 md:col-start-2">
                        <label className="text-xs font-semibold text-slate-600">Apartamento</label>
                        <input
                          type="text"
                          value={apartamento}
                          onChange={(e) => setApartamento(e.target.value)}
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                          placeholder="Ex: Apt 42"
                        />
                      </div>
                    </>
                  )}

                  {/* Detalhes se Condomínio */}
                  {tipoEndereco === 'condominio' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Quadra</label>
                        <input
                          type="text"
                          value={quadra}
                          onChange={(e) => setQuadra(e.target.value)}
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                          placeholder="Ex: Quadra C"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Lote</label>
                        <input
                          type="text"
                          value={lote}
                          onChange={(e) => setLote(e.target.value)}
                          className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                          placeholder="Ex: Lote 15"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pets do Cliente */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pets Associados ({tempPets.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddTempPet}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-bold transition-all cursor-pointer"
                    id="btn-adicionar-pet"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar outro pet</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {tempPets.map((pet, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative flex flex-col md:flex-row gap-4">
                      {tempPets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTempPet(idx)}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600">Nome do Pet *</label>
                            <input
                              type="text"
                              required={idx === 0 || pet.nome.length > 0}
                              value={pet.nome}
                              onChange={(e) => handleTempPetChange(idx, 'nome', e.target.value)}
                              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                              placeholder="Ex: Floquinho"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Porte *</label>
                            <select
                              value={pet.porte}
                              onChange={(e) => handleTempPetChange(idx, 'porte', e.target.value)}
                              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
                            >
                              <option value="pequeno">Pequeno (Porte P)</option>
                              <option value="medio">Médio (Porte M)</option>
                              <option value="grande">Grande (Porte G)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-600">Observações / Alergias / Temperamento</label>
                          <textarea
                            value={pet.observacao}
                            onChange={(e) => handleTempPetChange(idx, 'observacao', e.target.value)}
                            rows={2}
                            className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all resize-none"
                            placeholder="Ex: Alérgico a perfumes, dócil mas medroso com secador."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {editingClienteId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          ) : selectedCliente ? (
            /* DETALHES DO CLIENTE SELECIONADO */
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedCliente.nome}</h3>
                  <p className="text-xs text-slate-400">ID Tutor: {selectedCliente.id}</p>
                </div>
                <button
                  onClick={() => startEditCliente(selectedCliente)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contatos e Endereço */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contato & Localização</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xxs text-slate-400 font-bold uppercase">Telefone</p>
                        <p className="text-sm font-semibold text-slate-800">{selectedCliente.telefone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xxs text-slate-400 font-bold uppercase">Endereço ({selectedCliente.tipoEndereco === 'predio' ? 'Prédio' : selectedCliente.tipoEndereco === 'condominio' ? 'Condomínio' : 'Casa'})</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedCliente.endereco}, N° {selectedCliente.numero}
                        </p>
                        <p className="text-xs text-slate-500">Bairro: {selectedCliente.bairro}</p>
                        
                        {/* Detalhes de Prédio */}
                        {selectedCliente.tipoEndereco === 'predio' && (
                          <div className="mt-1.5 flex gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {selectedCliente.bloco && <span><strong>Bloco:</strong> {selectedCliente.bloco}</span>}
                            {selectedCliente.torre && <span><strong>Torre:</strong> {selectedCliente.torre}</span>}
                            {selectedCliente.apartamento && <span><strong>Apt:</strong> {selectedCliente.apartamento}</span>}
                          </div>
                        )}

                        {/* Detalhes de Condomínio */}
                        {selectedCliente.tipoEndereco === 'condominio' && (
                          <div className="mt-1.5 flex gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {selectedCliente.quadra && <span><strong>Quadra:</strong> {selectedCliente.quadra}</span>}
                            {selectedCliente.lote && <span><strong>Lote:</strong> {selectedCliente.lote}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pets Cadastrados */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pets Registrados ({selectedCliente.pets.length})</h4>
                  
                  <div className="space-y-3">
                    {selectedCliente.pets.map(p => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col justify-between gap-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                            <span>🐾</span> {p.nome}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                            p.porte === 'grande' ? 'bg-orange-100 text-orange-800' :
                            p.porte === 'medio' ? 'bg-yellow-100 text-yellow-850' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            Porte {p.porte === 'pequeno' ? 'P' : p.porte === 'medio' ? 'M' : 'G'}
                          </span>
                        </div>

                        {p.observacao ? (
                          <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                            "{p.observacao}"
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Sem observações específicas.</p>
                        )}

                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => onSelectPetForHistory(p.id)}
                            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Histórico e Banhos no Mês</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PLACEHOLDER INICIAL */
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center h-[350px]">
              <div className="p-3 bg-sky-100 text-sky-600 rounded-full mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-slate-600 font-medium text-sm">Selecione um cliente para ver os detalhes</p>
              <p className="text-slate-400 text-xs mt-1 max-w-xs">Ou clique em "Novo Cliente" para realizar um cadastro do tutor e seus pets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
