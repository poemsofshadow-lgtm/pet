/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PortePet = 'pequeno' | 'medio' | 'grande';
export type TipoEndereco = 'casa' | 'predio' | 'condominio';
export type StatusAgendamento = 'pendente' | 'confirmado' | 'em_andamento' | 'finalizado' | 'cancelado' | 'falta';
export type StatusPacote = 'ativo' | 'finalizado';

export interface Pet {
  id: string;
  clienteId: string;
  nome: string;
  porte: PortePet;
  observacao: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  numero: string;
  bairro: string;
  tipoEndereco: TipoEndereco;
  // Se for prédio
  bloco?: string;
  torre?: string;
  apartamento?: string;
  // Se for condomínio
  quadra?: string;
  lote?: string;
  // ID dos pets associados
  pets: Pet[];
}

export interface Servico {
  id: string;
  nome: string;
  valor: number;
}

export interface Pacote {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  totalBanhos: number;
}

export interface PacoteCliente {
  id: string;
  clienteId: string;
  petId: string;
  pacoteId: string;
  nomePacote: string; // denormalizado para facilidade
  dataAquisicao: string;
  banhosTotais: number;
  banhosUsados: number;
  status: StatusPacote;
  valorPago?: number;
}

export interface AgendamentoItem {
  petId: string;
  servicoId: string;
  valor: number;
  usouPacote: boolean;
  pacoteClienteId?: string;
}

export interface Agendamento {
  id: string;
  clienteId: string;
  data: string;
  hora: string;
  status: StatusAgendamento;
  itens: AgendamentoItem[];
  valorTotal: number;
  observacoes?: string;
  levaETras?: boolean;
  metodoPagamento?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'pacote';
  statusPagamento?: 'pendente' | 'pago';
  comprovantePix?: string;
}

export interface HistoricoPet {
  id: string;
  petId: string;
  petNome: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  servicoNome: string;
  valor: number;
  usouPacote: boolean;
  agendamentoId: string;
}

export interface HorarioFuncionamento {
  id?: string; // document id
  diaSemana: number; // 0 = Domingo, 1 = Segunda, etc.
  nomeDia: string;
  aberto: boolean;
  inicio: string; // e.g., "08:00"
  fim: string; // e.g., "18:00"
}

export interface Estabelecimento {
  id: string;
  nome: string;
  email: string;
  logo: { emoji: string; color: string; image?: string };
  telefone: string;
  endereco: string;
  senha?: string;
}

