import React, { useState } from 'react';
import { Estabelecimento } from '../types';
import { LOGO_TEMPLATES, getSvgDataUri } from '../utils/logoTemplates';
import { Lock, Mail, Phone, MapPin, Store, ArrowRight, Sparkles, Check, Smile, LayoutGrid, Upload, Image as ImageIcon } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (store: Estabelecimento) => void;
}

const LOGO_EMOJIS = ['🧼', '🐶', '🐱', '✂️', '🐩', '🦴', '🐾', '💖', '🛀', '💈'];
const LOGO_GRADIENTS = [
  { name: 'Sky Indigo', value: 'from-sky-500 to-indigo-600' },
  { name: 'Rose Orange', value: 'from-rose-500 to-orange-500' },
  { name: 'Emerald Teal', value: 'from-emerald-500 to-teal-600' },
  { name: 'Amber Red', value: 'from-amber-500 to-red-600' },
  { name: 'Fuchsia Purple', value: 'from-fuchsia-500 to-purple-600' },
];

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Register Form
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regEndereco, setRegEndereco] = useState('');
  const [logoTab, setLogoTab] = useState<'emoji' | 'gallery' | 'upload'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('🧼');
  const [selectedGradient, setSelectedGradient] = useState('from-sky-500 to-indigo-600');
  const [selectedTemplateId, setSelectedTemplateId] = useState('paw-gold');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Por favor, envie apenas arquivos de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB max
      setError('A imagem do logo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginSenha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao fazer login');
      }

      onLoginSuccess(data.store);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNome || !regEmail || !regSenha) {
      setError('Nome, E-mail e Senha são obrigatórios.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Build final logo configuration depending on active tab
      let finalLogo: any = { color: selectedGradient };
      
      if (logoTab === 'emoji') {
        finalLogo.emoji = selectedEmoji;
      } else if (logoTab === 'gallery') {
        finalLogo.emoji = '';
        finalLogo.image = getSvgDataUri(selectedTemplateId, selectedGradient);
      } else if (logoTab === 'upload') {
        if (!uploadedImage) {
          throw new Error('Por favor, envie uma imagem antes de salvar ou mude de aba.');
        }
        finalLogo.emoji = '';
        finalLogo.image = uploadedImage;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: regNome,
          email: regEmail,
          senha: regSenha,
          telefone: regTelefone,
          endereco: regEndereco,
          logo: finalLogo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no cadastro');
      }

      onLoginSuccess(data.store);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@auau.com', senha: 'senha123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback to offline/mock demo if request fails on first load (e.g. server booting up)
        const mockDemo: Estabelecimento = {
          id: 'demo-store',
          nome: 'AuAu & Cia',
          email: 'demo@auau.com',
          logo: { emoji: '🧼', color: 'from-sky-500 to-indigo-600' },
          telefone: '(11) 98765-4321',
          endereco: 'Rua dos Pets, 123 - Centro'
        };
        onLoginSuccess(mockDemo);
        return;
      }
      onLoginSuccess(data.store);
    } catch (err) {
      // Graceful fallback
      const mockDemo: Estabelecimento = {
        id: 'demo-store',
        nome: 'AuAu & Cia',
        email: 'demo@auau.com',
        logo: { emoji: '🧼', color: 'from-sky-500 to-indigo-600' },
        telefone: '(11) 98765-4321',
        endereco: 'Rua dos Pets, 123 - Centro'
      };
      onLoginSuccess(mockDemo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" id="auth-screen-container">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full space-y-6 z-10">
        {/* Banner Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-md mb-4 animate-bounce">
            🧼
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">AUAU & CIA</h2>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Plataforma Multiloja • Banho & Tosa</p>
        </div>

        {/* Card Main */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-xl">
              {error}
            </div>
          )}

          {!isRegister ? (
            // LOGIN FORM
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-sm font-extrabold text-slate-700 tracking-tight uppercase">Entrar na sua Conta</h3>
                <p className="text-xs text-slate-400">Faça login para gerenciar seu pet shop</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail Comercial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@petshop.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Senha de Acesso</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">ou</span>
              </div>

              {/* Demo Mode Trigger */}
              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={loading}
                className="w-full py-3 bg-linear-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                Acessar Demonstração (AuAu & Cia)
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Não possui cadastro?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                    }}
                    className="text-sky-600 hover:underline font-bold"
                  >
                    Cadastre sua Loja
                  </button>
                </p>
              </div>
            </form>
          ) : (
            // REGISTRATION FORM WITH LOGO DESIGNER
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-sm font-extrabold text-slate-700 tracking-tight uppercase">Cadastrar sua Loja</h3>
                <p className="text-xs text-slate-400">Monte o perfil da sua empresa em segundos</p>
              </div>

              {/* Logo Builder Panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col items-center gap-4">
                <div className="flex w-full items-center gap-3">
                  {(() => {
                    const containerClass = `w-14 h-14 rounded-2xl shadow-xs shrink-0 flex items-center justify-center overflow-hidden`;

                    if (logoTab === 'emoji') {
                      return (
                        <div className={`${containerClass} bg-gradient-to-tr ${selectedGradient} text-white text-2xl font-bold`}>
                          {selectedEmoji}
                        </div>
                      );
                    }

                    if (logoTab === 'gallery') {
                      return (
                        <div className={`${containerClass} bg-slate-100 border border-slate-200`}>
                          <img 
                            src={getSvgDataUri(selectedTemplateId, selectedGradient)} 
                            alt="Logo Preset" 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    }

                    // Upload tab
                    if (uploadedImage) {
                      return (
                        <div className={`${containerClass} bg-slate-100 border border-slate-200`}>
                          <img 
                            src={uploadedImage} 
                            alt="Logo Custom" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    }

                    return (
                      <div className={`${containerClass} bg-slate-100 text-slate-400 border border-dashed border-slate-300`}>
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    );
                  })()}
                  <div className="flex-1 text-left">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Identidade Visual</span>
                    <p className="text-[9px] text-slate-400 font-medium">Configure como sua marca aparecerá no sistema</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-200/60 p-1 rounded-lg w-full">
                  <button
                    type="button"
                    onClick={() => setLogoTab('emoji')}
                    className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      logoTab === 'emoji' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smile className="w-3 h-3" />
                    <span>Emoji</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoTab('gallery')}
                    className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      logoTab === 'gallery' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Galeria</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoTab('upload')}
                    className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      logoTab === 'upload' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                </div>

                {/* Content based on Tab */}
                <div className="w-full border-t border-slate-100 pt-3">
                  {logoTab === 'emoji' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Selecione o Ícone</label>
                        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                          {LOGO_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setSelectedEmoji(emoji)}
                              className={`w-6 h-6 rounded-md text-xs flex items-center justify-center cursor-pointer transition-all ${
                                selectedEmoji === emoji ? 'bg-sky-100 border border-sky-400 scale-110' : 'bg-white hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Degradê do Fundo</label>
                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                          {LOGO_GRADIENTS.map((grad) => (
                            <button
                              key={grad.value}
                              type="button"
                              onClick={() => setSelectedGradient(grad.value)}
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${grad.value} relative cursor-pointer flex items-center justify-center`}
                              title={grad.name}
                            >
                              {selectedGradient === grad.value && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {logoTab === 'gallery' && (
                    <div className="space-y-3">
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Logos Temáticos Vetoriais</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {LOGO_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setSelectedTemplateId(tmpl.id)}
                            className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                              selectedTemplateId === tmpl.id 
                                ? 'border-sky-500 bg-sky-50/50' 
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-7 h-7">
                              <img 
                                src={getSvgDataUri(tmpl.id, selectedGradient)} 
                                alt={tmpl.name} 
                                className="w-full h-full object-contain" 
                              />
                            </div>
                            <span className="text-[7px] font-bold text-slate-500 text-center leading-none truncate w-full">{tmpl.name}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Cor do Logotipo</label>
                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                          {LOGO_GRADIENTS.map((grad) => (
                            <button
                              key={grad.value}
                              type="button"
                              onClick={() => setSelectedGradient(grad.value)}
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${grad.value} relative cursor-pointer flex items-center justify-center`}
                              title={grad.name}
                            >
                              {selectedGradient === grad.value && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {logoTab === 'upload' && (
                    <div className="space-y-3">
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Seu Logotipo Pessoal</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`w-full border-2 border-dashed rounded-lg p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          dragActive 
                            ? 'border-sky-500 bg-sky-50/50' 
                            : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50/50'
                        }`}
                        onClick={() => document.getElementById('reg-logo-picker')?.click()}
                      >
                        <input
                          type="file"
                          id="reg-logo-picker"
                          accept="image/png, image/jpeg, image/jpg"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-black text-slate-700">Clique para Enviar</span>
                        <span className="text-[8px] text-slate-400">PNG ou JPG até 2MB</span>
                      </div>

                      {uploadedImage && (
                        <div className="flex items-center justify-between bg-white p-1.5 border border-slate-100 rounded-md">
                          <div className="flex items-center gap-1.5">
                            <img 
                              src={uploadedImage} 
                              alt="Uploaded Preview" 
                              className="w-7 h-7 object-cover rounded" 
                            />
                            <span className="text-[8px] font-bold text-slate-500">Logo Carregado</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedImage(null)}
                            className="text-[8px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Estabelecimento</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="Ex: Pet Spa Charmoso"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail Comercial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="comercial@petshop.com"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Senha</label>
                  <input
                    type="password"
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={regTelefone}
                    onChange={(e) => setRegTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Comercial</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regEndereco}
                    onChange={(e) => setRegEndereco(e.target.value)}
                    placeholder="Rua, Número - Bairro, Cidade"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {loading ? 'Cadastrando...' : 'Concluir Cadastro & Entrar'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 font-semibold">
                  Já possui conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError(null);
                    }}
                    className="text-sky-600 hover:underline font-bold"
                  >
                    Voltar para Login
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
