/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, ShieldCheck, Check, AlertTriangle } from 'lucide-react';
import { Cliente, Servico, Pacote, PacoteCliente, Agendamento, HistoricoPet } from '../types';

interface BackupRestoreProps {
  clientes: Cliente[];
  servicos: Servico[];
  pacotes: Pacote[];
  pacotesCliente: PacoteCliente[];
  agendamentos: Agendamento[];
  historico: HistoricoPet[];
  onImportBackup: (data: {
    clientes: Cliente[];
    servicos: Servico[];
    pacotes: Pacote[];
    pacotesCliente: PacoteCliente[];
    agendamentos: Agendamento[];
    historico: HistoricoPet[];
  }) => void;
  onResetDatabase: () => void;
}

export default function BackupRestore({
  clientes,
  servicos,
  pacotes,
  pacotesCliente,
  agendamentos,
  historico,
  onImportBackup,
  onResetDatabase
}: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleDownloadZip = async (pwd: string) => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      // Usamos cache: 'no-store' e parâmetro dinâmico para garantir que o navegador ou proxy
      // não sirva uma página HTML antiga em cache (o que causava o erro de arquivo corrompido)
      const response = await fetch(`/api/download-zip?password=${encodeURIComponent(pwd)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Senha de administrador incorreta.');
        }
        throw new Error('Erro ao gerar ou baixar o arquivo ZIP.');
      }
      const blob = await response.blob();
      
      // Criamos um link local Blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'projeto.zip');
      document.body.appendChild(link);
      link.click();
      
      // Limpeza imediata
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);

      // Limpar estados em caso de sucesso
      setShowPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError(null);
    } catch (err: any) {
      console.error(err);
      setDownloadError(err.message || 'Falha ao baixar o projeto.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExport = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      clientes,
      servicos,
      pacotes,
      pacotesCliente,
      agendamentos,
      historico
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_banho_e_tosa_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          !parsed.clientes ||
          !parsed.servicos ||
          !parsed.pacotes ||
          !parsed.pacotesCliente ||
          !parsed.agendamentos ||
          !parsed.historico
        ) {
          throw new Error('Formato de arquivo de backup inválido.');
        }

        onImportBackup({
          clientes: parsed.clientes,
          servicos: parsed.servicos,
          pacotes: parsed.pacotes,
          pacotesCliente: parsed.pacotesCliente,
          agendamentos: parsed.agendamentos,
          historico: parsed.historico
        });

        setSuccess(true);
        setError('');
        setTimeout(() => setSuccess(false), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao ler o backup.');
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6" id="backup-restore-section">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Backup & Manutenção</h2>
        <p className="text-xs text-slate-500 mt-1">
          Proteja seus dados comerciais salvando backups locais ou redefinindo o banco de dados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar e Importar */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Importação e Exportação de Dados</span>
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Como os dados são salvos com segurança no banco de dados SQLite local, recomendamos que você faça o download de um backup periódico para evitar perda acidental de dados em caso de reinstalação do sistema.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Backup (JSON)</span>
            </button>
            
            <button
              onClick={triggerFileInput}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Importar Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </div>

          {success && (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
              <span>Backup importado com sucesso! Todo o banco de dados foi atualizado.</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-800 p-3 rounded-lg text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Zona de Perigo / Redefinição */}
        <div className="p-5 rounded-xl border border-rose-100 bg-rose-50/20 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Zona de Redefinição</span>
            </h3>
            <p className="text-xs text-rose-700/85 leading-relaxed">
              Deseja zerar os agendamentos e cadastros do sistema ou reinstalar os dados fictícios de demonstração originais? Esta ação é irreversível e apagará todas as modificações atuais que não foram salvas em backup.
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm('ATENÇÃO: Você realmente deseja redefinir o sistema para o estado inicial? Isso excluirá seus cadastros personalizados.')) {
                onResetDatabase();
                alert('Sistema redefinido com sucesso com dados padrão!');
              }
            }}
            id="btn-restaurar-dados"
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs w-fit mt-4"
          >
            <Trash2 className="w-4 h-4" />
            <span>Restaurar Dados Originais</span>
          </button>
        </div>
      </div>

      {/* Exportar Código Fonte */}
      <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/10 space-y-4" id="exportar-codigo-section">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Baixar Todo o Código Fonte do Projeto (.ZIP)</span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Para hospedar este projeto em outros servidores (como Netlify, Vercel ou VPS), ou simplesmente guardar uma cópia local, você pode baixar o código fonte atualizado. O pacote conterá toda a estrutura do app (React + Vite + Tailwind + Express) pronta para ser executada.
        </p>

        <div className="pt-1 space-y-3">
          {!showPasswordPrompt ? (
            <button
              onClick={() => {
                setShowPasswordPrompt(true);
                setPasswordError(null);
                setPasswordInput('');
              }}
              disabled={isDownloading}
              className={`inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs decoration-none ${
                isDownloading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Preparando arquivo ZIP...' : 'Baixar Projeto Completo (projeto.zip)'}</span>
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput !== '369251' && passwordInput !== 'Ifsenha=369251') {
                  setPasswordError('Senha incorreta! Digite a senha correta para autorizar o download.');
                  return;
                }
                setPasswordError(null);
                handleDownloadZip(passwordInput);
              }}
              className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200 max-w-md animate-fade-in"
            >
              <p className="text-xs font-medium text-slate-700">
                Esta ação requer autenticação de Administrador:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Senha de administrador"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isDownloading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPasswordInput('');
                    setPasswordError(null);
                  }}
                  className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-600 font-medium">{passwordError}</p>
              )}
            </form>
          )}
          
          {downloadError && (
            <p className="text-xs text-rose-600 font-medium">
              Erro: {downloadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
