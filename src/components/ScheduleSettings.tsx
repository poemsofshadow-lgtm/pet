/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HorarioFuncionamento } from '../types';
import { Clock, Save, AlertTriangle, ShieldCheck, CheckCircle2, Calendar, Coffee } from 'lucide-react';

interface ScheduleSettingsProps {
  horarios: HorarioFuncionamento[];
  onUpdateHorarios: (novosHorarios: HorarioFuncionamento[]) => Promise<void>;
}

const DEFAULT_HORARIOS: HorarioFuncionamento[] = [
  { diaSemana: 0, nomeDia: 'Domingo', aberto: false, inicio: '08:00', fim: '12:00' },
  { diaSemana: 1, nomeDia: 'Segunda-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 2, nomeDia: 'Terça-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 3, nomeDia: 'Quarta-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 4, nomeDia: 'Quinta-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 5, nomeDia: 'Sexta-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 6, nomeDia: 'Sábado', aberto: true, inicio: '08:00', fim: '14:00' },
];

export default function ScheduleSettings({
  horarios,
  onUpdateHorarios
}: ScheduleSettingsProps) {
  const [localHorarios, setLocalHorarios] = useState<HorarioFuncionamento[]>(() => {
    if (horarios && horarios.length > 0) {
      return JSON.parse(JSON.stringify(horarios));
    }
    return JSON.parse(JSON.stringify(DEFAULT_HORARIOS));
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Sync state when props arrive asynchronously
  useEffect(() => {
    if (horarios && horarios.length > 0) {
      setLocalHorarios(JSON.parse(JSON.stringify(horarios)));
    }
  }, [horarios]);

  // Handle toggling open/closed status for a day
  const handleToggleOpen = (diaSemana: number) => {
    setLocalHorarios(prev =>
      prev.map(h => h.diaSemana === diaSemana ? { ...h, aberto: !h.aberto } : h)
    );
  };

  // Handle changing hours
  const handleTimeChange = (diaSemana: number, field: 'inicio' | 'fim', val: string) => {
    setLocalHorarios(prev =>
      prev.map(h => h.diaSemana === diaSemana ? { ...h, [field]: val } : h)
    );
  };

  // Validate and submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Validation
    for (const h of localHorarios) {
      if (h.aberto) {
        if (!h.inicio || !h.fim) {
          setErrorMsg(`Por favor, preencha o horário de início e fim para ${h.nomeDia}.`);
          return;
        }
        if (h.inicio >= h.fim) {
          setErrorMsg(`O horário de início em ${h.nomeDia} deve ser menor que o horário de término.`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      await onUpdateHorarios(localHorarios);
      setSuccessMsg('Configurações de horários salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset to default
  const handleRestoreDefaults = () => {
    setLocalHorarios(JSON.parse(JSON.stringify(DEFAULT_HORARIOS)));
    setSuccessMsg('Horários redefinidos para o padrão. Clique em "Salvar Configurações" para confirmar.');
    setShowConfirmReset(false);
  };

  return (
    <div className="space-y-6" id="schedule-settings-section">
      {/* Alerts */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Sucesso!</p>
            <p className="text-xs text-emerald-700/90 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Atenção</p>
            <p className="text-xs text-rose-700/90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Configurações de Horários</h2>
          <p className="text-xs text-slate-500 mt-1">Defina os dias de funcionamento e horários para limitar e validar as marcações de agendamentos no sistema</p>
        </div>
        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-350 px-3.5 py-2 rounded-lg bg-white transition-all cursor-pointer"
        >
          Redefinir Padrões
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal de Horários */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-xs p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="text-sm font-bold text-slate-700 pb-3 border-b border-slate-100">
              Expediente Semanal
            </h3>

            <div className="divide-y divide-slate-100 space-y-4">
              {localHorarios.map((day) => (
                <div key={day.diaSemana} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 first:pt-0">
                  {/* Nome do Dia & Status */}
                  <div className="flex items-center gap-3 w-40">
                    <div className="text-sm font-bold text-slate-700">{day.nomeDia}</div>
                  </div>

                  {/* Botão de Toggle Aberto/Fechado */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleOpen(day.diaSemana)}
                      className={`px-3 py-1.5 rounded-full text-xxs font-extrabold transition-all cursor-pointer border ${
                        day.aberto
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {day.aberto ? '🟢 ABERTO' : '🔴 FECHADO'}
                    </button>
                  </div>

                  {/* Campos de Entrada de Horários */}
                  <div className="flex items-center gap-3 flex-1 justify-end max-w-xs">
                    {day.aberto ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Das</span>
                          <input
                            type="time"
                            required
                            value={day.inicio}
                            onChange={(e) => handleTimeChange(day.diaSemana, 'inicio', e.target.value)}
                            className="px-2.5 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Até</span>
                          <input
                            type="time"
                            required
                            value={day.fim}
                            onChange={(e) => handleTimeChange(day.diaSemana, 'fim', e.target.value)}
                            className="px-2.5 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-center"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-400/80 bg-slate-50 border border-slate-150/50 rounded-lg px-4 py-1.5 w-full text-center tracking-wide uppercase">
                        Não há expediente
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Configurações'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Informações Extras & Resumo */}
        <div className="space-y-6">
          {/* Card: Como Funciona */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-sky-600" />
              <span>Validação Automática</span>
            </h4>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              O sistema utiliza estas configurações para validar cada novo agendamento. Se o tutor selecionar um dia fechado ou um horário fora do expediente:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-black mt-0.5">•</span>
                <span>O agendamento será <strong>bloqueado</strong> com um aviso amigável.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-black mt-0.5">•</span>
                <span>Evita furos na agenda e horários impróprios de atendimento.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-black mt-0.5">•</span>
                <span>Garante que toda a equipe trabalhe apenas nos dias de funcionamento pretendidos.</span>
              </li>
            </ul>
          </div>

          {/* Card: Quadro de Horários de Hoje */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visualização Rápida</h4>
            <div className="divide-y divide-slate-50 text-xs">
              {localHorarios.map((day) => (
                <div key={day.diaSemana} className="flex justify-between py-2 text-slate-600 font-semibold">
                  <span>{day.nomeDia}</span>
                  {day.aberto ? (
                    <span className="text-emerald-600">{day.inicio} - {day.fim}</span>
                  ) : (
                    <span className="text-rose-600">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
