import React, { useState } from 'react';
import { Estabelecimento } from '../types';
import { LOGO_TEMPLATES, getSvgDataUri } from '../utils/logoTemplates';
import { Shield, Mail, Phone, MapPin, Store, Check, RefreshCw, Key, Upload, Image as ImageIcon, Smile, Palette, LayoutGrid } from 'lucide-react';

interface CompanyProfileProps {
  store: Estabelecimento;
  onProfileUpdate: (updatedStore: Estabelecimento) => void;
  onLogout: () => void;
}

const LOGO_EMOJIS = ['🧼', '🐶', '🐱', '✂️', '🐩', '🦴', '🐾', '💖', '🛀', '💈'];
const LOGO_GRADIENTS = [
  { name: 'Sky Indigo', value: 'from-sky-500 to-indigo-600' },
  { name: 'Rose Orange', value: 'from-rose-500 to-orange-500' },
  { name: 'Emerald Teal', value: 'from-emerald-500 to-teal-600' },
  { name: 'Amber Red', value: 'from-amber-500 to-red-600' },
  { name: 'Fuchsia Purple', value: 'from-fuchsia-500 to-purple-600' },
];

export default function CompanyProfile({ store, onProfileUpdate, onLogout }: CompanyProfileProps) {
  const [nome, setNome] = useState(store.nome || '');
  const [telefone, setTelefone] = useState(store.telefone || '');
  const [endereco, setEndereco] = useState(store.endereco || '');

  // Tab control: 'emoji' | 'gallery' | 'upload'
  const [logoTab, setLogoTab] = useState<'emoji' | 'gallery' | 'upload'>(() => {
    if (store.logo?.image) {
      if (store.logo.image.includes('svg+xml')) {
        return 'gallery';
      }
      return 'upload';
    }
    return 'emoji';
  });

  const [selectedEmoji, setSelectedEmoji] = useState(store.logo?.emoji || '🧼');
  const [selectedGradient, setSelectedGradient] = useState(store.logo?.color || 'from-sky-500 to-indigo-600');
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    if (store.logo?.image && store.logo.image.includes('svg+xml')) {
      const match = LOGO_TEMPLATES.find(t => store.logo.image?.includes(t.id));
      if (match) return match.id;
    }
    return 'paw-gold';
  });

  // Custom uploaded logo (Base64)
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
    if (store.logo?.image && !store.logo.image.includes('svg+xml')) {
      return store.logo.image;
    }
    return null;
  });

  const [dragActive, setDragActive] = useState(false);
  const [senha, setSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg('Por favor, envie apenas arquivos de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB max
      setErrorMsg('A imagem do logo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string);
        setErrorMsg(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome do estabelecimento é obrigatório.');
      return;
    }
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Build the specialized logo payload
      let finalLogo: any = { color: selectedGradient };
      
      if (logoTab === 'emoji') {
        finalLogo.emoji = selectedEmoji;
      } else if (logoTab === 'gallery') {
        finalLogo.emoji = '';
        finalLogo.image = getSvgDataUri(selectedTemplateId, selectedGradient);
      } else if (logoTab === 'upload') {
        if (!uploadedImage) {
          throw new Error('Por favor, envie uma imagem antes de salvar no modo Upload.');
        }
        finalLogo.emoji = '';
        finalLogo.image = uploadedImage;
      }

      const payload: any = {
        id: store.id,
        email: store.email,
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        logo: finalLogo
      };

      if (senha.trim()) {
        payload.senha = senha.trim();
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Loja-ID': store.id
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao atualizar dados');
      }

      onProfileUpdate(data.store);
      setSuccessMsg('Perfil da empresa atualizado com sucesso!');
      setSenha(''); // Clear password field
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to render active logo preview
  const renderLogoPreview = (size: 'sm' | 'lg') => {
    const containerClass = size === 'sm' 
      ? `w-14 h-14 rounded-2xl` 
      : `w-20 h-20 rounded-3xl shadow-md`;

    if (logoTab === 'emoji') {
      return (
        <div className={`${containerClass} bg-gradient-to-tr ${selectedGradient} flex items-center justify-center text-white text-3xl font-bold`}>
          {selectedEmoji}
        </div>
      );
    }

    if (logoTab === 'gallery') {
      return (
        <div className={`${containerClass} bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100`}>
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
        <div className={`${containerClass} bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100`}>
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
      <div className={`${containerClass} bg-slate-100 flex items-center justify-center text-slate-400 border border-dashed border-slate-300`}>
        <ImageIcon className="w-8 h-8" />
      </div>
    );
  };

  return (
    <div className="space-y-6" id="company-profile-manager">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          {renderLogoPreview('sm')}
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight uppercase">{store.nome}</h2>
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Painel de Identidade & Tenant ID: <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{store.id}</span></p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
        >
          Sair da Conta (Logout)
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-4 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* DETAILED FORM */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: LOGO BUILDER & PREVIEW */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-5">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <span>Identidade da Logo</span>
          </h3>

          {/* Logo Live Preview */}
          <div className="flex flex-col items-center py-6 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
            {renderLogoPreview('lg')}
            <div className="text-center">
              <span className="text-xs font-extrabold text-slate-700">{nome || store.nome}</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visualização no Header</p>
            </div>
          </div>

          {/* Tabs para Tipo de Logo */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setLogoTab('emoji')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                logoTab === 'emoji' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Emoji</span>
            </button>
            <button
              type="button"
              onClick={() => setLogoTab('gallery')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                logoTab === 'gallery' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Galeria</span>
            </button>
            <button
              type="button"
              onClick={() => setLogoTab('upload')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                logoTab === 'upload' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {/* TAB 1: EMOJI DESIGNER */}
          {logoTab === 'emoji' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selecione o Emoji</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {LOGO_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer transition-all ${
                        selectedEmoji === emoji ? 'bg-sky-100 border-2 border-sky-500 scale-105 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Paleta Degradê</label>
                <div className="space-y-1.5">
                  {LOGO_GRADIENTS.map((grad) => (
                    <button
                      key={grad.value}
                      type="button"
                      onClick={() => setSelectedGradient(grad.value)}
                      className={`w-full p-2 rounded-lg bg-gradient-to-tr ${grad.value} text-white font-bold text-xs flex items-center justify-between cursor-pointer`}
                    >
                      <span>{grad.name}</span>
                      {selectedGradient === grad.value && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VECTOR GALLERY */}
          {logoTab === 'gallery' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logotipos Temáticos</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOGO_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        selectedTemplateId === tmpl.id 
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/10' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center">
                        <img 
                          src={getSvgDataUri(tmpl.id, selectedGradient)} 
                          alt={tmpl.name} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-700 text-center leading-tight">{tmpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient still customizable for the vector templates! */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cor Temática do Logotipo</label>
                <div className="space-y-1.5">
                  {LOGO_GRADIENTS.map((grad) => (
                    <button
                      key={grad.value}
                      type="button"
                      onClick={() => setSelectedGradient(grad.value)}
                      className={`w-full p-2 rounded-lg bg-gradient-to-tr ${grad.value} text-white font-bold text-xs flex items-center justify-between cursor-pointer`}
                    >
                      <span>{grad.name}</span>
                      {selectedGradient === grad.value && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM IMAGE FILE UPLOAD */}
          {logoTab === 'upload' && (
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sua Galeria de Imagens</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-sky-500 bg-sky-50/50' 
                    : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50/50'
                }`}
                onClick={() => document.getElementById('logo-file-picker')?.click()}
              >
                <input
                  type="file"
                  id="logo-file-picker"
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                  onChange={handleFileInput}
                />
                
                <Upload className="w-7 h-7 text-slate-400 mb-2 animate-pulse" />
                <span className="text-xs font-extrabold text-slate-700 leading-snug">
                  Arraste seu Logo ou Clique aqui
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1">
                  Suporta PNG, JPG de até 2MB
                </span>
              </div>

              {uploadedImage && (
                <div className="flex items-center justify-between bg-slate-50 p-2 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded Preview" 
                      className="w-10 h-10 object-cover rounded-md" 
                    />
                    <span className="text-[10px] font-bold text-slate-500">Logo Carregado</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMNS: INFORMATIONS */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-5">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
            Dados de Cadastro & Localização
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Fantasia da Loja</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail de Contato (Não Alterável)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={store.email}
                  readOnly
                  disabled
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-450 rounded-xl text-xs font-mono cursor-not-allowed focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone / WhatsApp Comercial</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Físico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, Número - Bairro, Cidade"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              Segurança
            </h4>
            
            <div className="max-w-xs">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alterar Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite se desejar alterar"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-medium focus:outline-hidden transition-all"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-1">Deixe em branco para manter a senha atual.</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Salvando Alterações...' : 'Salvar Alterações do Perfil'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
