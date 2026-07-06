/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cliente, Pet, Servico, Pacote, PacoteCliente, Agendamento, HistoricoPet } from '../types';

export const INITIAL_SERVICOS: Servico[] = [
  { id: 'srv-1', nome: 'Banho Simples (Porte P)', valor: 45.00 },
  { id: 'srv-2', nome: 'Banho Simples (Porte M)', valor: 55.00 },
  { id: 'srv-3', nome: 'Banho Simples (Porte G)', valor: 70.00 },
  { id: 'srv-4', nome: 'Banho com Tosa Higiênica (P)', valor: 65.00 },
  { id: 'srv-5', nome: 'Banho com Tosa Higiênica (M)', valor: 75.00 },
  { id: 'srv-6', nome: 'Banho com Tosa Higiênica (G)', valor: 95.00 },
  { id: 'srv-7', nome: 'Tosa Geral na Máquina (P)', valor: 85.00 },
  { id: 'srv-8', nome: 'Tosa Geral na Máquina (M)', valor: 100.00 },
  { id: 'srv-9', nome: 'Tosa Geral na Máquina (G)', valor: 120.00 },
  { id: 'srv-10', nome: 'Tosa Tesoura Premium', valor: 140.00 },
  { id: 'srv-11', nome: 'Hidratação de Pelagem', valor: 35.00 },
  { id: 'srv-12', nome: 'Corte de Unhas e Limpeza de Ouvido', valor: 25.00 },
  { id: 'srv-transporte', nome: 'Taxa de Transporte (Leva e Trás)', valor: 5.00 }
];

export const INITIAL_PACOTES: Pacote[] = [
  { id: 'pac-1', nome: 'Plano Bronze: 4 Banhos P', descricao: '4 Banhos Simples para cães de pequeno porte. Válido por 30 dias.', valor: 160.00, totalBanhos: 4 },
  { id: 'pac-2', nome: 'Plano Prata: 4 Banhos M', descricao: '4 Banhos Simples para cães de médio porte. Válido por 30 dias.', valor: 200.00, totalBanhos: 4 },
  { id: 'pac-3', nome: 'Plano Ouro: 4 Banhos G', descricao: '4 Banhos Simples para cães de grande porte. Válido por 30 dias.', valor: 250.00, totalBanhos: 4 },
  { id: 'pac-4', nome: 'Combo Mensal: 4 Banhos + 1 Tosa Higiênica', descricao: 'Para cães de pequeno porte. Inclui 4 Banhos e 1 Tosa Higiênica grátis.', valor: 180.00, totalBanhos: 4 }
];

// Seed Pets first so they can be assigned to Clients
const petChico: Pet = {
  id: 'pet-1',
  clienteId: 'cli-1',
  nome: 'Chico',
  porte: 'pequeno',
  observacao: 'Muito assustado com o soprador de ar. Usar algodão protetor nos ouvidos.'
};

const petNina: Pet = {
  id: 'pet-2',
  clienteId: 'cli-1',
  nome: 'Nina',
  porte: 'pequeno',
  observacao: 'Pele sensível. Utilizar xampu hipoalergênico neutro.'
};

const petThor: Pet = {
  id: 'pet-3',
  clienteId: 'cli-2',
  nome: 'Thor',
  porte: 'grande',
  observacao: 'Super dócil, mas puxa bastante na guia. Gosta de petiscos.'
};

const petMel: Pet = {
  id: 'pet-4',
  clienteId: 'cli-3',
  nome: 'Mel',
  porte: 'medio',
  observacao: 'Idosa de 13 anos. Problema na coluna, manusear com muito cuidado na banheira.'
};

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Carlos de Souza',
    telefone: '(11) 98765-4321',
    endereco: 'Rua das Flores',
    numero: '1200',
    bairro: 'Jardins',
    tipoEndereco: 'predio',
    bloco: 'B',
    torre: 'Torre Ville',
    apartamento: '142',
    pets: [petChico, petNina]
  },
  {
    id: 'cli-2',
    nome: 'Amanda de Lima Cruz',
    telefone: '(11) 97777-8888',
    endereco: 'Avenida das Palmeiras',
    numero: 's/n',
    bairro: 'Alphaville',
    tipoEndereco: 'condominio',
    quadra: 'H',
    lote: '25',
    pets: [petThor]
  },
  {
    id: 'cli-3',
    nome: 'Beatriz da Silva Costa',
    telefone: '(11) 91234-5678',
    endereco: 'Rua General Osório',
    numero: '450',
    bairro: 'Centro',
    tipoEndereco: 'casa',
    pets: [petMel]
  }
];

export const INITIAL_PACOTES_CLIENTE: PacoteCliente[] = [
  {
    id: 'pacc-1',
    clienteId: 'cli-1',
    petId: 'pet-1', // Chico
    pacoteId: 'pac-1',
    nomePacote: 'Plano Bronze: 4 Banhos P',
    dataAquisicao: '2026-06-15',
    banhosTotais: 4,
    banhosUsados: 2,
    status: 'ativo'
  },
  {
    id: 'pacc-2',
    clienteId: 'cli-2',
    petId: 'pet-3', // Thor
    pacoteId: 'pac-3',
    nomePacote: 'Plano Ouro: 4 Banhos G',
    dataAquisicao: '2026-06-20',
    banhosTotais: 4,
    banhosUsados: 1,
    status: 'ativo'
  }
];

// Today is 2026-07-03. Banhos in July 2026 will show in current month statistics.
export const INITIAL_AGENDAMENTOS: Agendamento[] = [
  // Completed in June
  {
    id: 'agd-1',
    clienteId: 'cli-1',
    data: '2026-06-18',
    hora: '10:00',
    status: 'finalizado',
    itens: [
      { petId: 'pet-1', servicoId: 'srv-1', valor: 45.00, usouPacote: true, pacoteClienteId: 'pacc-1' },
      { petId: 'pet-2', servicoId: 'srv-4', valor: 65.00, usouPacote: false }
    ],
    valorTotal: 65.00, // Chico consumed package, Nina paid regular price
    observacoes: 'Chico tomou primeiro banho do pacote. Nina fez tosa higiênica.'
  },
  // Completed in late June
  {
    id: 'agd-2',
    clienteId: 'cli-2',
    data: '2026-06-24',
    hora: '14:30',
    status: 'finalizado',
    itens: [
      { petId: 'pet-3', servicoId: 'srv-3', valor: 70.00, usouPacote: true, pacoteClienteId: 'pacc-2' }
    ],
    valorTotal: 0.00, // Thor consumed package
    observacoes: 'Thor tomou o primeiro banho do plano Ouro.'
  },
  // Completed in July (This month!)
  {
    id: 'agd-3',
    clienteId: 'cli-1',
    data: '2026-07-01',
    hora: '09:00',
    status: 'finalizado',
    itens: [
      { petId: 'pet-1', servicoId: 'srv-1', valor: 45.00, usouPacote: true, pacoteClienteId: 'pacc-1' }
    ],
    valorTotal: 0.00, // Chico used package (2nd bath used)
    observacoes: 'Segundo banho do pacote do Chico.'
  },
  {
    id: 'agd-4',
    clienteId: 'cli-3',
    data: '2026-07-02',
    hora: '11:00',
    status: 'finalizado',
    itens: [
      { petId: 'pet-4', servicoId: 'srv-5', valor: 75.00, usouPacote: false }
    ],
    valorTotal: 75.00, // Paid regular price
    observacoes: 'Mel se comportou super bem. Banho com higiênica finalizado.'
  },
  // Scheduled for today or future
  {
    id: 'agd-5',
    clienteId: 'cli-1',
    data: '2026-07-03',
    hora: '15:00',
    status: 'confirmado',
    itens: [
      { petId: 'pet-2', servicoId: 'srv-1', valor: 45.00, usouPacote: false }
    ],
    valorTotal: 45.00,
    observacoes: 'Nina agendada para banho simples hoje à tarde.'
  },
  {
    id: 'agd-6',
    clienteId: 'cli-2',
    data: '2026-07-04',
    hora: '10:30',
    status: 'pendente',
    itens: [
      { petId: 'pet-3', servicoId: 'srv-3', valor: 70.00, usouPacote: true, pacoteClienteId: 'pacc-2' } // Thor wants to use package
    ],
    valorTotal: 0.00,
    observacoes: 'Thor agendado para usar mais um banho do plano.'
  }
];

export const INITIAL_HISTORICO: HistoricoPet[] = [
  {
    id: 'hist-1',
    petId: 'pet-1',
    petNome: 'Chico',
    clienteId: 'cli-1',
    clienteNome: 'Carlos de Souza',
    data: '2026-06-18',
    servicoNome: 'Banho Simples (Porte P)',
    valor: 45.00,
    usouPacote: true,
    agendamentoId: 'agd-1'
  },
  {
    id: 'hist-2',
    petId: 'pet-2',
    petNome: 'Nina',
    clienteId: 'cli-1',
    clienteNome: 'Carlos de Souza',
    data: '2026-06-18',
    servicoNome: 'Banho com Tosa Higiênica (P)',
    valor: 65.00,
    usouPacote: false,
    agendamentoId: 'agd-1'
  },
  {
    id: 'hist-3',
    petId: 'pet-3',
    petNome: 'Thor',
    clienteId: 'cli-2',
    clienteNome: 'Amanda de Lima Cruz',
    data: '2026-06-24',
    servicoNome: 'Banho Simples (Porte G)',
    valor: 70.00,
    usouPacote: true,
    agendamentoId: 'agd-2'
  },
  {
    id: 'hist-4',
    petId: 'pet-1',
    petNome: 'Chico',
    clienteId: 'cli-1',
    clienteNome: 'Carlos de Souza',
    data: '2026-07-01',
    servicoNome: 'Banho Simples (Porte P)',
    valor: 45.00,
    usouPacote: true,
    agendamentoId: 'agd-3'
  },
  {
    id: 'hist-5',
    petId: 'pet-4',
    petNome: 'Mel',
    clienteId: 'cli-3',
    clienteNome: 'Beatriz da Silva Costa',
    data: '2026-07-02',
    servicoNome: 'Banho com Tosa Higiênica (M)',
    valor: 75.00,
    usouPacote: false,
    agendamentoId: 'agd-4'
  }
];
