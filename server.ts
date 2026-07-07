/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { Firestore } from '@google-cloud/firestore';
import { createServer as createViteServer } from 'vite';
let Database: any = null;
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection as clientCollection, 
  doc as clientDoc, 
  getDoc as clientGetDoc, 
  getDocs as clientGetDocs, 
  setDoc as clientSetDoc, 
  updateDoc as clientUpdateDoc, 
  deleteDoc as clientDeleteDoc, 
  query as clientQuery, 
  where as clientWhere, 
  limit as clientLimit, 
  writeBatch as clientWriteBatch 
} from 'firebase/firestore';

import {
  INITIAL_CLIENTES,
  INITIAL_SERVICOS,
  INITIAL_PACOTES,
  INITIAL_PACOTES_CLIENTE,
  INITIAL_AGENDAMENTOS,
  INITIAL_HISTORICO
} from './src/data/initialData';

import firebaseConfigJson from './firebase-applet-config.json';

export const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Initialize Firestore from config file
const firebaseConfig: any = firebaseConfigJson;

class DocumentSnapshot {
  constructor(public id: string, private _data: any, public ref: any) {}
  get exists() { return this._data !== null && this._data !== undefined; }
  data() { return this._data; }
}

class QuerySnapshot {
  constructor(public docs: DocumentSnapshot[]) {}
  get size() { return this.docs.length; }
  get empty() { return this.docs.length === 0; }
  forEach(callback: (doc: DocumentSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

class DocumentReference {
  constructor(public collectionName: string, public docId: string, private db: any) {}
  get ref() { return this; }
  async get() {
    return this.db.getDoc(this.collectionName, this.docId);
  }
  async set(data: any) {
    return this.db.setDoc(this.collectionName, this.docId, data);
  }
  async update(data: any) {
    return this.db.updateDoc(this.collectionName, this.docId, data);
  }
  async delete() {
    return this.db.deleteDoc(this.collectionName, this.docId);
  }
}

class CollectionReference {
  private wheres: Array<{ field: string, operator: string, value: any }> = [];
  private limitCount: number | null = null;

  constructor(private collectionName: string, private db: any) {}

  doc(id: string) {
    return new DocumentReference(this.collectionName, id, this.db);
  }

  where(field: string, operator: string, value: any) {
    const clone = new CollectionReference(this.collectionName, this.db);
    clone.wheres = [...this.wheres, { field, operator, value }];
    clone.limitCount = this.limitCount;
    return clone;
  }

  limit(n: number) {
    const clone = new CollectionReference(this.collectionName, this.db);
    clone.wheres = [...this.wheres];
    clone.limitCount = n;
    return clone;
  }

  async get() {
    return this.db.getDocs(this.collectionName, this.wheres, this.limitCount);
  }

  async add(data: any) {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.db.setDoc(this.collectionName, id, data);
    return { id };
  }
}

class WriteBatch {
  private ops: Array<() => Promise<void>> = [];
  constructor(private db: any) {}

  set(docRef: DocumentReference, data: any) {
    this.ops.push(async () => {
      await docRef.set(data);
    });
  }

  delete(docRef: DocumentReference) {
    this.ops.push(async () => {
      await docRef.delete();
    });
  }

  async commit() {
    await this.db.runTransaction(this.ops);
  }
}

class SQLiteFirestoreEngine {
  private _sqliteDb: any = null;

  constructor() {}

  private get sqliteDb() {
    if (!this._sqliteDb) {
      if (!Database) {
        try {
          Database = require('better-sqlite3');
        } catch (e: any) {
          console.error('Failed to load better-sqlite3 dynamically:', e.message);
          throw new Error('SQLite database engine is not available in this environment.');
        }
      }
      const dbPath = process.env.VERCEL ? '/tmp/data.db' : 'data.db';
      try {
        this._sqliteDb = new Database(dbPath);
        this._sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS firestore_data (
            collection TEXT,
            id TEXT,
            data TEXT,
            PRIMARY KEY (collection, id)
          )
        `);
      } catch (err: any) {
        console.error('Failed to initialize SQLite file:', err.message);
        throw err;
      }
    }
    return this._sqliteDb;
  }

  async getDoc(collectionName: string, docId: string) {
    const stmt = this.sqliteDb.prepare('SELECT data FROM firestore_data WHERE collection = ? AND id = ?');
    const row = stmt.get(collectionName, docId);
    const docRef = new DocumentReference(collectionName, docId, this);
    if (!row) {
      return new DocumentSnapshot(docId, null, docRef);
    }
    return new DocumentSnapshot(docId, JSON.parse(row.data), docRef);
  }

  async setDoc(collectionName: string, docId: string, data: any) {
    const stmt = this.sqliteDb.prepare('INSERT OR REPLACE INTO firestore_data (collection, id, data) VALUES (?, ?, ?)');
    stmt.run(collectionName, docId, JSON.stringify(data));
  }

  async updateDoc(collectionName: string, docId: string, data: any) {
    const existingSnap = await this.getDoc(collectionName, docId);
    const existingData = existingSnap.data() || {};
    const mergedData = { ...existingData, ...data };
    await this.setDoc(collectionName, docId, mergedData);
  }

  async deleteDoc(collectionName: string, docId: string) {
    const stmt = this.sqliteDb.prepare('DELETE FROM firestore_data WHERE collection = ? AND id = ?');
    stmt.run(collectionName, docId);
  }

  async getDocs(collectionName: string, wheres: any[], limitCount: number | null) {
    const stmt = this.sqliteDb.prepare('SELECT id, data FROM firestore_data WHERE collection = ?');
    const rows = stmt.all(collectionName);
    
    let docs = rows.map((r: any) => {
      const docRef = new DocumentReference(collectionName, r.id, this);
      return new DocumentSnapshot(r.id, JSON.parse(r.data), docRef);
    });
    
    for (const filter of wheres) {
      docs = docs.filter((doc: any) => {
        const data = doc.data();
        if (!data) return false;
        
        const val = data[filter.field];
        switch (filter.operator) {
          case '==':
            return val === filter.value;
          case '!=':
            return val !== filter.value;
          case '>':
            return val > filter.value;
          case '>=':
            return val >= filter.value;
          case '<':
            return val < filter.value;
          case '<=':
            return val <= filter.value;
          case 'array-contains':
            return Array.isArray(val) && val.includes(filter.value);
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(val);
          default:
            return false;
        }
      });
    }

    if (limitCount !== null) {
      docs = docs.slice(0, limitCount);
    }

    return new QuerySnapshot(docs);
  }

  async runTransaction(ops: Array<() => Promise<void>>) {
    this.sqliteDb.prepare('BEGIN').run();
    try {
      for (const op of ops) {
        await op();
      }
      this.sqliteDb.prepare('COMMIT').run();
    } catch (err) {
      this.sqliteDb.prepare('ROLLBACK').run();
      throw err;
    }
  }
}

class ClientWriteBatch {
  private batch: any;
  constructor(private engine: any, private clientDbInstance: any) {
    this.batch = clientWriteBatch(clientDbInstance);
  }

  set(docRef: DocumentReference, data: any) {
    const clientDocRef = clientDoc(this.clientDbInstance, docRef.collectionName, docRef.docId);
    this.batch.set(clientDocRef, data);
  }

  delete(docRef: DocumentReference) {
    const clientDocRef = clientDoc(this.clientDbInstance, docRef.collectionName, docRef.docId);
    this.batch.delete(clientDocRef);
  }

  async commit() {
    await this.batch.commit();
  }
}

class ClientFirestoreEngine {
  public db: any;

  constructor() {
    const app = getApps().length === 0 ? initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId
    }) : getApp();
    this.db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }

  async getDoc(collectionName: string, docId: string) {
    const docRef = clientDoc(this.db, collectionName, docId);
    const snap = await clientGetDoc(docRef);
    const customDocRef = new DocumentReference(collectionName, docId, this);
    return new DocumentSnapshot(docId, snap.exists() ? snap.data() : null, customDocRef);
  }

  async setDoc(collectionName: string, docId: string, data: any) {
    const docRef = clientDoc(this.db, collectionName, docId);
    await clientSetDoc(docRef, data);
  }

  async updateDoc(collectionName: string, docId: string, data: any) {
    const docRef = clientDoc(this.db, collectionName, docId);
    await clientUpdateDoc(docRef, data);
  }

  async deleteDoc(collectionName: string, docId: string) {
    const docRef = clientDoc(this.db, collectionName, docId);
    await clientDeleteDoc(docRef);
  }

  async getDocs(collectionName: string, wheres: any[], limitCount: number | null) {
    const collRef = clientCollection(this.db, collectionName);
    const queryConstraints: any[] = [];
    for (const w of wheres) {
      queryConstraints.push(clientWhere(w.field, w.operator, w.value));
    }
    if (limitCount !== null) {
      queryConstraints.push(clientLimit(limitCount));
    }

    const q = clientQuery(collRef, ...queryConstraints);
    const snap = await clientGetDocs(q);
    
    const docs = snap.docs.map(docSnap => {
      const customDocRef = new DocumentReference(collectionName, docSnap.id, this);
      return new DocumentSnapshot(docSnap.id, docSnap.data(), customDocRef);
    });

    return new QuerySnapshot(docs);
  }
}

class SelfHealingDb {
  private nativeDb: Firestore;
  private sqliteEngine: SQLiteFirestoreEngine;
  private clientEngine: ClientFirestoreEngine | null = null;
  public mode: 'native' | 'client' | 'sqlite' = process.env.VERCEL ? 'client' : 'native';

  constructor() {
    this.nativeDb = new Firestore({
      projectId: firebaseConfig.projectId || 'demo-project',
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    });
    this.sqliteEngine = new SQLiteFirestoreEngine();
    try {
      if (firebaseConfig.apiKey) {
        this.clientEngine = new ClientFirestoreEngine();
      }
    } catch (e) {
      console.error('Failed to initialize ClientFirestoreEngine:', e);
    }
  }

  collection(name: string): any {
    if (this.mode === 'client' && this.clientEngine) {
      return new CollectionReference(name, this.clientEngine);
    }
    if (this.mode === 'sqlite') {
      return new CollectionReference(name, this.sqliteEngine);
    }
    return this.nativeDb.collection(name);
  }

  batch(): any {
    if (this.mode === 'client' && this.clientEngine) {
      return new ClientWriteBatch(this.clientEngine, this.clientEngine.db);
    }
    if (this.mode === 'sqlite') {
      return new WriteBatch(this.sqliteEngine);
    }
    return this.nativeDb.batch();
  }
}

const firestoreDb = new SelfHealingDb();

const DEFAULT_HORARIOS = [
  { diaSemana: 0, nomeDia: 'Domingo', aberto: false, inicio: '08:00', fim: '12:00' },
  { diaSemana: 1, nomeDia: 'Segunda-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 2, nomeDia: 'Terça-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 3, nomeDia: 'Quarta-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 4, nomeDia: 'Quinta-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 5, nomeDia: 'Sexta-feira', aberto: true, inicio: '08:00', fim: '18:00' },
  { diaSemana: 6, nomeDia: 'Sábado', aberto: true, inicio: '08:00', fim: '14:00' },
];

// Helper to clear a collection safely in chunks of 400
async function clearCollection(collectionName: string) {
  const collRef = firestoreDb.collection(collectionName);
  const snapshot = await collRef.get();
  if (snapshot.size === 0) return;

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const chunk = docs.slice(i, i + 400);
    const batch = firestoreDb.batch();
    chunk.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}



const getLojaId = (req: express.Request): string => {
  return (req.headers['x-loja-id'] || req.query.lojaId || 'demo-store') as string;
};

// Seed store default schedules, services and packages using an atomic WriteBatch to maximize speed and prevent timeouts on Vercel
async function seedStoreDefaults(lojaId: string) {
  const batch = firestoreDb.batch();

  // Insert default working hours
  for (const h of DEFAULT_HORARIOS) {
    const docRef = firestoreDb.collection('horarios').doc(`day-${h.diaSemana}-${lojaId}`);
    batch.set(docRef, {
      diaSemana: h.diaSemana,
      nomeDia: h.nomeDia,
      aberto: h.aberto,
      inicio: h.inicio,
      fim: h.fim,
      lojaId
    });
  }

  // Insert default services
  for (const s of INITIAL_SERVICOS) {
    const docRef = firestoreDb.collection('servicos').doc(`${s.id}-${lojaId}`);
    batch.set(docRef, {
      nome: s.nome,
      valor: s.valor,
      lojaId
    });
  }

  // Ensure srv-transporte exists
  const transDocRef = firestoreDb.collection('servicos').doc(`srv-transporte-${lojaId}`);
  batch.set(transDocRef, {
    nome: 'Taxa de Transporte (Leva e Trás)',
    valor: 5.00,
    lojaId
  });

  // Insert default packages
  for (const p of INITIAL_PACOTES) {
    const docRef = firestoreDb.collection('pacotes').doc(`${p.id}-${lojaId}`);
    batch.set(docRef, {
      nome: p.nome,
      descricao: p.descricao,
      valor: p.valor,
      totalBanhos: p.totalBanhos,
      lojaId
    });
  }

  await batch.commit();
}

// Seeding function
async function seedDatabase(lojaId: string = 'demo-store') {
  console.log(`Seeding Firestore database with initial data for ${lojaId}...`);
  
  // Clear existing collections first (only for global reset or demo initialization)
  await clearCollection('agendamentos');
  await clearCollection('pacotes_cliente');
  await clearCollection('pacotes');
  await clearCollection('servicos');
  await clearCollection('pets');
  await clearCollection('clientes');
  await clearCollection('historico');
  await clearCollection('horarios');

  // Insert default working hours
  for (const h of DEFAULT_HORARIOS) {
    await firestoreDb.collection('horarios').doc(`day-${h.diaSemana}-${lojaId}`).set({
      ...h,
      lojaId
    });
  }

  // Insert services
  for (const s of INITIAL_SERVICOS) {
    await firestoreDb.collection('servicos').doc(`${s.id}-${lojaId}`).set({
      nome: s.nome,
      valor: s.valor,
      lojaId
    });
  }

  // Ensure srv-transporte exists
  await firestoreDb.collection('servicos').doc(`srv-transporte-${lojaId}`).set({
    nome: 'Taxa de Transporte (Leva e Trás)',
    valor: 5.00,
    lojaId
  });

  // Insert pacotes
  for (const p of INITIAL_PACOTES) {
    await firestoreDb.collection('pacotes').doc(`${p.id}-${lojaId}`).set({
      nome: p.nome,
      descricao: p.descricao,
      valor: p.valor,
      totalBanhos: p.totalBanhos,
      lojaId
    });
  }

  // Insert clients and pets
  for (const c of INITIAL_CLIENTES) {
    await firestoreDb.collection('clientes').doc(`${c.id}-${lojaId}`).set({
      nome: c.nome,
      telefone: c.telefone,
      endereco: c.endereco,
      numero: c.numero,
      bairro: c.bairro,
      tipoEndereco: c.tipoEndereco,
      bloco: c.bloco || null,
      torre: c.torre || null,
      apartamento: c.apartamento || null,
      quadra: c.quadra || null,
      lote: c.lote || null,
      lojaId
    });

    for (const p of c.pets) {
      await firestoreDb.collection('pets').doc(`${p.id}-${lojaId}`).set({
        clienteId: `${c.id}-${lojaId}`,
        nome: p.nome,
        porte: p.porte,
        observacao: p.observacao,
        lojaId
      });
    }
  }

  // Insert pacotes_cliente
  for (const pc of INITIAL_PACOTES_CLIENTE) {
    await firestoreDb.collection('pacotes_cliente').doc(`${pc.id}-${lojaId}`).set({
      clienteId: `${pc.clienteId}-${lojaId}`,
      petId: `${pc.petId}-${lojaId}`,
      pacoteId: `${pc.pacoteId}-${lojaId}`,
      nomePacote: pc.nomePacote,
      dataAquisicao: pc.dataAquisicao,
      banhosTotais: pc.banhosTotais,
      banhosUsados: pc.banhosUsados,
      status: pc.status,
      lojaId
    });
  }

  // Insert agendamentos & items (embedded inside the agendamentos document)
  for (const a of INITIAL_AGENDAMENTOS) {
    const itens = a.itens.map(item => ({
      petId: `${item.petId}-${lojaId}`,
      servicoId: `${item.servicoId}-${lojaId}`,
      valor: item.valor,
      usouPacote: !!item.usouPacote,
      pacoteClienteId: item.pacoteClienteId ? `${item.pacoteClienteId}-${lojaId}` : null
    }));

    await firestoreDb.collection('agendamentos').doc(`${a.id}-${lojaId}`).set({
      clienteId: `${a.clienteId}-${lojaId}`,
      data: a.data,
      hora: a.hora,
      status: a.status,
      valorTotal: a.valorTotal,
      observacoes: a.observacoes || null,
      levaETras: false,
      itens: itens,
      lojaId
    });
  }

  // Insert historico
  for (const h of INITIAL_HISTORICO) {
    await firestoreDb.collection('historico').doc(`${h.id}-${lojaId}`).set({
      petId: `${h.petId}-${lojaId}`,
      petNome: h.petNome,
      clienteId: `${h.clienteId}-${lojaId}`,
      clienteNome: h.clienteNome,
      data: h.data,
      servicoNome: h.servicoNome,
      valor: h.valor,
      usouPacote: !!h.usouPacote,
      agendamentoId: h.agendamentoId ? `${h.agendamentoId}-${lojaId}` : null,
      lojaId
    });
  }

  // Ensure default demo store exists
  const demoEstRef = firestoreDb.collection('estabelecimentos').doc('demo-store');
  const demoEstDoc = await demoEstRef.get();
  if (!demoEstDoc.exists) {
    await demoEstRef.set({
      id: 'demo-store',
      nome: 'AuAu & Cia',
      email: 'demo@auau.com',
      senha: 'senha123',
      logo: { emoji: '🧼', color: 'from-sky-500 to-indigo-600' },
      telefone: '(11) 98765-4321',
      endereco: 'Rua dos Pets, 123 - Centro'
    });
  }

  console.log('Firestore database seeded successfully!');
}

// Function to assemble complete database state
async function getDatabaseState(lojaId: string = 'demo-store') {
  const [
    clientesSnap,
    petsSnap,
    servicosSnap,
    pacotesSnap,
    pacotesClienteSnap,
    agendamentosSnap,
    historicoSnap,
    horariosSnap
  ] = await Promise.all([
    firestoreDb.collection('clientes').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('pets').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('servicos').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('pacotes').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('pacotes_cliente').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('agendamentos').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('historico').where('lojaId', '==', lojaId).get(),
    firestoreDb.collection('horarios').where('lojaId', '==', lojaId).get()
  ]);

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
  
  const clientes = clientesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      pets: petsList.filter(p => p.clienteId === doc.id)
    };
  });

  const servicos = servicosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const pacotes = pacotesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const pacotesCliente = pacotesClienteSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const agendamentos = agendamentosSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      levaETras: !!data.levaETras,
      itens: (data.itens || []).map((item: any) => ({
        petId: item.petId,
        servicoId: item.servicoId,
        valor: item.valor,
        usouPacote: !!item.usouPacote,
        pacoteClienteId: item.pacoteClienteId || undefined
      }))
    };
  });

  const historico = historicoSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      usouPacote: !!data.usouPacote
    };
  });

  let horarios = horariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
  if (horarios.length === 0) {
    horarios = DEFAULT_HORARIOS;
  } else {
    horarios.sort((a, b) => a.diaSemana - b.diaSemana);
  }

  return {
    clientes,
    servicos,
    pacotes,
    pacotesCliente,
    agendamentos,
    historico,
    horarios
  };
}

// API ENDPOINTS

// Auth Endpoints

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    if (!email || !senha) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
      return;
    }
    const emailKey = email.toLowerCase().trim();
    const storeDoc = await firestoreDb.collection('estabelecimentos').doc(emailKey).get();
    if (!storeDoc.exists) {
      res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
      return;
    }
    const store = storeDoc.data() as any;
    if (store.senha !== senha) {
      res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
      return;
    }
    res.json({ success: true, store });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { nome, email, senha, telefone, endereco, logo } = req.body;
  try {
    if (!nome || !email || !senha) {
      res.status(400).json({ error: 'Nome, E-mail e Senha são obrigatórios' });
      return;
    }
    const emailKey = email.toLowerCase().trim();
    const existingDoc = await firestoreDb.collection('estabelecimentos').doc(emailKey).get();
    if (existingDoc.exists) {
      res.status(400).json({ error: 'Este e-mail já está cadastrado em nossa base.' });
      return;
    }

    const storeId = `store-${Date.now()}`;
    const newStore = {
      id: storeId,
      nome,
      email: emailKey,
      senha,
      telefone: telefone || '',
      endereco: endereco || '',
      logo: logo || { emoji: '🧼', color: 'from-sky-500 to-indigo-600' }
    };

    // Save company profile
    await firestoreDb.collection('estabelecimentos').doc(emailKey).set(newStore);

    // Seed default services, packages and schedules for this new tenant/store!
    await seedStoreDefaults(storeId);

    res.json({ success: true, store: newStore });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.put('/api/auth/profile', async (req, res) => {
  const { id, email, nome, telefone, endereco, logo } = req.body;
  try {
    if (!id || !email || !nome) {
      res.status(400).json({ error: 'Informações incompletas para atualizar o perfil.' });
      return;
    }
    const emailKey = email.toLowerCase().trim();
    const storeDocRef = firestoreDb.collection('estabelecimentos').doc(emailKey);
    const storeDoc = await storeDocRef.get();
    if (!storeDoc.exists) {
      res.status(404).json({ error: 'Empresa não encontrada.' });
      return;
    }
    const currentData = storeDoc.data() as any;
    const updatedStore = {
      ...currentData,
      nome,
      telefone: telefone || '',
      endereco: endereco || '',
      logo: logo || currentData.logo || { emoji: '🧼', color: 'from-sky-500 to-indigo-600' }
    };

    await storeDocRef.set(updatedStore);
    res.json({ success: true, store: updatedStore });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Project ZIP downloader endpoint
app.get('/api/download-zip', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const zipPath = path.join(process.cwd(), 'projeto.zip');

    // Executamos o script python que cria o arquivo zip de forma assíncrona e segura
    const pythonCmd = `python3 -c "
import os, zipfile
zip_filename = 'projeto.zip'
if os.path.exists(zip_filename):
    os.remove(zip_filename)
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.git', '.cache', '__pycache__')]
        for file in files:
            if file in (zip_filename, 'projeto.tar.gz', 'data.db', 'data.db-journal', 'data.db-shm', 'data.db-wal'):
                continue
            filePath = os.path.join(root, file)
            archivePath = os.path.relpath(filePath, '.')
            zipf.write(filePath, archivePath)
"`;

    exec(pythonCmd, (error) => {
      if (error) {
        console.error('Error creating zip:', error);
        return res.status(500).send('Erro ao gerar o arquivo ZIP do projeto.');
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=projeto.zip');
      res.download(zipPath, 'projeto.zip', (downloadErr) => {
        if (downloadErr) {
          console.error('Download error:', downloadErr);
        }
      });
    });
  } catch (err: any) {
    res.status(500).send('Erro interno do servidor ao gerar download: ' + err.message);
  }
});

// Get total database state
app.get('/api/db-state', async (req, res) => {
  const lojaId = getLojaId(req);
  try {
    const state = await getDatabaseState(lojaId);
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update working hours
app.put('/api/horarios', async (req, res) => {
  const { horarios } = req.body;
  const lojaId = getLojaId(req);
  try {
    const batch = firestoreDb.batch();
    for (const h of horarios) {
      const docRef = firestoreDb.collection('horarios').doc(`day-${h.diaSemana}-${lojaId}`);
      batch.set(docRef, {
        diaSemana: h.diaSemana,
        nomeDia: h.nomeDia,
        aberto: !!h.aberto,
        inicio: h.inicio,
        fim: h.fim,
        lojaId
      });
    }
    await batch.commit();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clientes endpoints
app.post('/api/clientes', async (req, res) => {
  const { id, nome, telefone, endereco, numero, bairro, tipoEndereco, bloco, torre, apartamento, quadra, lote, pets } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('clientes').doc(id).set({
      nome,
      telefone,
      endereco,
      numero,
      bairro,
      tipoEndereco,
      bloco: bloco || null,
      torre: torre || null,
      apartamento: apartamento || null,
      quadra: quadra || null,
      lote: lote || null,
      lojaId
    });
    
    for (const p of pets) {
      await firestoreDb.collection('pets').doc(p.id).set({
        clienteId: id,
        nome: p.nome,
        porte: p.porte,
        observacao: p.observacao,
        lojaId
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, telefone, endereco, numero, bairro, tipoEndereco, bloco, torre, apartamento, quadra, lote, pets } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('clientes').doc(id).set({
      nome,
      telefone,
      endereco,
      numero,
      bairro,
      tipoEndereco,
      bloco: bloco || null,
      torre: torre || null,
      apartamento: apartamento || null,
      quadra: quadra || null,
      lote: lote || null,
      lojaId
    });
    
    // Sync pets: Delete old ones and insert new ones
    const petsSnap = await firestoreDb.collection('pets')
      .where('clienteId', '==', id)
      .where('lojaId', '==', lojaId)
      .get();
    const batch = firestoreDb.batch();
    petsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    for (const p of pets) {
      await firestoreDb.collection('pets').doc(p.id).set({
        clienteId: id,
        nome: p.nome,
        porte: p.porte,
        observacao: p.observacao,
        lojaId
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serviços endpoints
app.post('/api/servicos', async (req, res) => {
  const { id, nome, valor } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('servicos').doc(id).set({ nome, valor, lojaId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/servicos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, valor } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('servicos').doc(id).set({ nome, valor, lojaId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servicos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await firestoreDb.collection('servicos').doc(id).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pacotes planos endpoints
app.post('/api/pacotes', async (req, res) => {
  const { id, nome, descricao, valor, totalBanhos } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('pacotes').doc(id).set({ nome, descricao, valor, totalBanhos, lojaId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pacotes/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, valor, totalBanhos } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('pacotes').doc(id).set({ nome, descricao, valor, totalBanhos, lojaId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pacotes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await firestoreDb.collection('pacotes').doc(id).delete();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pacotes Cliente (venda de pacote)
app.post('/api/pacotes-cliente', async (req, res) => {
  const { id, clienteId, petId, pacoteId, nomePacote, dataAquisicao, banhosTotais, banhosUsados, status, valorPago } = req.body;
  const lojaId = getLojaId(req);
  try {
    await firestoreDb.collection('pacotes_cliente').doc(id).set({
      clienteId,
      petId,
      pacoteId,
      nomePacote,
      dataAquisicao,
      banhosTotais,
      banhosUsados,
      status,
      valorPago: valorPago || null,
      lojaId
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pacotes-cliente/:id/finalizar', async (req, res) => {
  const { id } = req.params;
  try {
    await firestoreDb.collection('pacotes_cliente').doc(id).update({ status: 'finalizado' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pacotes-cliente/:id/falta', async (req, res) => {
  const { id } = req.params;
  const { clienteId, clienteNome, petId, petNome } = req.body;
  const lojaId = getLojaId(req);
  try {
    const pcRef = firestoreDb.collection('pacotes_cliente').doc(id);
    const pcDoc = await pcRef.get();
    if (!pcDoc.exists) {
      res.status(404).json({ error: 'Pacote não encontrado' });
      return;
    }
    const pc = pcDoc.data() as any;
    const novosUsados = (pc.banhosUsados || 0) + 1;
    const novoStatus = novosUsados >= (pc.banhosTotais || 0) ? 'finalizado' : 'ativo';
    await pcRef.update({
      banhosUsados: novosUsados,
      status: novoStatus
    });

    // Create history record
    const histId = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    await firestoreDb.collection('historico').doc(histId).set({
      petId,
      petNome,
      clienteId,
      clienteNome,
      data: new Date().toISOString().split('T')[0],
      servicoNome: `Falta - Desconto de 1 Banho (${pc.nomePacote})`,
      valor: 0,
      usouPacote: true,
      agendamentoId: null,
      lojaId
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Agendamentos endpoints
app.post('/api/agendamentos', async (req, res) => {
  const {
    id,
    clienteId,
    data,
    hora,
    status,
    itens,
    valorTotal,
    observacoes,
    levaETras,
    metodoPagamento,
    statusPagamento,
    comprovantePix
  } = req.body;
  const lojaId = getLojaId(req);
  try {
    const firestoreItens = itens.map((item: any) => ({
      petId: item.petId,
      servicoId: item.servicoId,
      valor: item.valor,
      usouPacote: !!item.usouPacote,
      pacoteClienteId: item.pacoteClienteId || null
    }));

    await firestoreDb.collection('agendamentos').doc(id).set({
      clienteId,
      data,
      hora,
      status,
      valorTotal,
      observacoes: observacoes || null,
      levaETras: !!levaETras,
      itens: firestoreItens,
      metodoPagamento: metodoPagamento || null,
      statusPagamento: statusPagamento || 'pendente',
      comprovantePix: comprovantePix || null,
      lojaId
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Complete State Transition Engine (Appointment Status and triggers)
app.put('/api/agendamentos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, metodoPagamento, statusPagamento, comprovantePix } = req.body;
  const lojaId = getLojaId(req);

  try {
    const agdRef = firestoreDb.collection('agendamentos').doc(id);
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (metodoPagamento !== undefined) updateData.metodoPagamento = metodoPagamento;
    if (statusPagamento !== undefined) updateData.statusPagamento = statusPagamento;
    if (comprovantePix !== undefined) updateData.comprovantePix = comprovantePix;

    await agdRef.update(updateData);

    // If finished or customer is absent (falta), trigger logs & package deductions
    if (status === 'finalizado' || status === 'falta') {
      const agdDoc = await agdRef.get();
      if (agdDoc.exists) {
        const agd = agdDoc.data() as any;

        const clientDoc = await firestoreDb.collection('clientes').doc(agd.clienteId).get();
        if (clientDoc.exists) {
          const client = clientDoc.data() as any;
          const items = agd.itens || [];

          for (const item of items) {
            const petDoc = await firestoreDb.collection('pets').doc(item.petId).get();
            const srvDoc = await firestoreDb.collection('servicos').doc(item.servicoId).get();

            const pet = petDoc.exists ? petDoc.data() : null;
            const srv = srvDoc.exists ? srvDoc.data() : null;

            // Insert history
            const histId = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const servicoNome = status === 'falta' 
              ? 'Falta - Desconto de 1 Banho do Pacote' 
              : (item.usouPacote ? 'Banho (Consumo de Pacote)' : (srv?.nome || 'Serviço Avulso'));

            await firestoreDb.collection('historico').doc(histId).set({
              petId: item.petId,
              petNome: pet?.nome || 'Pet excluído',
              clienteId: agd.clienteId,
              clienteNome: client.nome,
              data: agd.data,
              servicoNome,
              valor: status === 'falta' ? 0 : item.valor,
              usouPacote: !!item.usouPacote,
              agendamentoId: id,
              lojaId
            });

            // If consumed package, deduct
            if (item.usouPacote && item.pacoteClienteId) {
              const pcRef = firestoreDb.collection('pacotes_cliente').doc(item.pacoteClienteId);
              const pcDoc = await pcRef.get();
              if (pcDoc.exists) {
                const pc = pcDoc.data() as any;
                const novosUsados = (pc.banhosUsados || 0) + 1;
                const novoStatus = novosUsados >= (pc.banhosTotais || 0) ? 'finalizado' : 'ativo';
                await pcRef.update({
                  banhosUsados: novosUsados,
                  status: novoStatus
                });
              }
            }
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database maintenance & Restore original data
app.post('/api/backup/reset', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, state: await getDatabaseState() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import entire backup state
app.post('/api/backup/import', async (req, res) => {
  const { clientes, servicos, pacotes, pacotesCliente, agendamentos, historico } = req.body;
  try {
    // Clear all
    await clearCollection('agendamentos');
    await clearCollection('pacotes_cliente');
    await clearCollection('pacotes');
    await clearCollection('servicos');
    await clearCollection('pets');
    await clearCollection('clientes');
    await clearCollection('historico');

    // Services
    for (const s of servicos) {
      await firestoreDb.collection('servicos').doc(s.id).set({
        nome: s.nome,
        valor: s.valor
      });
    }

    // Pacotes
    for (const p of pacotes) {
      await firestoreDb.collection('pacotes').doc(p.id).set({
        nome: p.nome,
        descricao: p.descricao,
        valor: p.valor,
        totalBanhos: p.totalBanhos
      });
    }

    // Clients & Pets
    for (const c of clientes) {
      await firestoreDb.collection('clientes').doc(c.id).set({
        nome: c.nome,
        telefone: c.telefone,
        endereco: c.endereco,
        numero: c.numero,
        bairro: c.bairro,
        tipoEndereco: c.tipoEndereco,
        bloco: c.bloco || null,
        torre: c.torre || null,
        apartamento: c.apartamento || null,
        quadra: c.quadra || null,
        lote: c.lote || null
      });
      for (const p of c.pets || []) {
        await firestoreDb.collection('pets').doc(p.id).set({
          clienteId: c.id,
          nome: p.nome,
          porte: p.porte,
          observacao: p.observacao
        });
      }
    }

    // Pacotes Cliente
    for (const pc of pacotesCliente) {
      await firestoreDb.collection('pacotes_cliente').doc(pc.id).set({
        clienteId: pc.clienteId,
        petId: pc.petId,
        pacoteId: pc.pacoteId,
        nomePacote: pc.nomePacote,
        dataAquisicao: pc.dataAquisicao,
        banhosTotais: pc.banhosTotais,
        banhosUsados: pc.banhosUsados,
        status: pc.status
      });
    }

    // Agendamentos & Items
    for (const a of agendamentos) {
      const itens = (a.itens || []).map((item: any) => ({
        petId: item.petId,
        servicoId: item.servicoId,
        valor: item.valor,
        usouPacote: !!item.usouPacote,
        pacoteClienteId: item.pacoteClienteId || null
      }));

      await firestoreDb.collection('agendamentos').doc(a.id).set({
        clienteId: a.clienteId,
        data: a.data,
        hora: a.hora,
        status: a.status,
        valorTotal: a.valorTotal,
        observacoes: a.observacoes || null,
        levaETras: !!a.levaETras,
        itens,
        metodoPagamento: a.metodoPagamento || null,
        statusPagamento: a.statusPagamento || 'pendente',
        comprovantePix: a.comprovantePix || null
      });
    }

    // Historico
    for (const h of historico) {
      await firestoreDb.collection('historico').doc(h.id).set({
        petId: h.petId,
        petNome: h.petNome,
        clienteId: h.clienteId,
        clienteNome: h.clienteNome,
        data: h.data,
        servicoNome: h.servicoNome,
        valor: h.valor,
        usouPacote: !!h.usouPacote,
        agendamentoId: h.agendamentoId
      });
    }

    res.json({ success: true, state: await getDatabaseState() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Integration as Middleware
async function startServer() {
  if (process.env.VERCEL) {
    console.log('Running on Vercel: skipping startup database testing/seeding to optimize cold start times.');
    return;
  }

  // Test native Firestore connection and fallback to Client SDK or SQLite as needed
  try {
    console.log('Testing native Firestore connection...');
    await firestoreDb['nativeDb'].collection('clientes').limit(1).get();
    console.log('Successfully connected to Firestore! Using cloud database with Native SDK.');
    firestoreDb.mode = 'native';
  } catch (error: any) {
    console.warn('Native Firestore is not accessible or permission is denied. Attempting to fall back to Firebase Client SDK...', error.message);
    
    // Now let's test the Client SDK connection
    try {
      if (firestoreDb['clientEngine']) {
        console.log('Testing Firebase Client SDK connection...');
        await firestoreDb['clientEngine'].getDocs('clientes', [], 1);
        console.log('Successfully connected via Firebase Client SDK! Using cloud database.');
        firestoreDb.mode = 'client';
      } else {
        throw new Error('Client engine is not initialized.');
      }
    } catch (clientError: any) {
      console.warn('Firebase Client SDK is also not accessible or failed. Seamlessly falling back to local SQLite database:', clientError.message);
      firestoreDb.mode = 'sqlite';
    }
  }

  // Check and seed Firestore database on startup if it's completely empty
  try {
    const clientesSnap = await firestoreDb.collection('clientes').limit(1).get();
    if (clientesSnap.empty) {
      await seedDatabase('demo-store');
    } else {
      // Ensure srv-transporte exists in servicos
      const srvTransDoc = await firestoreDb.collection('servicos').doc('srv-transporte-demo-store').get();
      if (!srvTransDoc.exists) {
        await firestoreDb.collection('servicos').doc('srv-transporte-demo-store').set({
          nome: 'Taxa de Transporte (Leva e Trás)',
          valor: 5.00,
          lojaId: 'demo-store'
        });
      }

      // Ensure horarios are populated if they don't exist
      const horariosSnap = await firestoreDb.collection('horarios').limit(1).get();
      if (horariosSnap.empty) {
        console.log('Seeding missing horarios collection on startup...');
        for (const h of DEFAULT_HORARIOS) {
          await firestoreDb.collection('horarios').doc(`day-${h.diaSemana}-demo-store`).set({
            ...h,
            lojaId: 'demo-store'
          });
        }
      }

      // Ensure servicos are populated if they don't exist
      const servicosSnap = await firestoreDb.collection('servicos').where('lojaId', '==', 'demo-store').limit(1).get();
      if (servicosSnap.empty) {
        console.log('Seeding missing servicos collection on startup...');
        for (const s of INITIAL_SERVICOS) {
          await firestoreDb.collection('servicos').doc(`${s.id}-demo-store`).set({
            nome: s.nome,
            valor: s.valor,
            lojaId: 'demo-store'
          });
        }
      }

      // Ensure pacotes are populated if they don't exist
      const pacotesSnap = await firestoreDb.collection('pacotes').where('lojaId', '==', 'demo-store').limit(1).get();
      if (pacotesSnap.empty) {
        console.log('Seeding missing pacotes collection on startup...');
        for (const p of INITIAL_PACOTES) {
          await firestoreDb.collection('pacotes').doc(`${p.id}-demo-store`).set({
            nome: p.nome,
            descricao: p.descricao,
            valor: p.valor,
            totalBanhos: p.totalBanhos,
            lojaId: 'demo-store'
          });
        }
      }

      // Ensure clientes and pets are populated if they don't exist
      const clientesSnapLocal = await firestoreDb.collection('clientes').where('lojaId', '==', 'demo-store').limit(1).get();
      if (clientesSnapLocal.empty) {
        console.log('Seeding missing clientes/pets collections on startup...');
        for (const c of INITIAL_CLIENTES) {
          await firestoreDb.collection('clientes').doc(`${c.id}-demo-store`).set({
            nome: c.nome,
            telefone: c.telefone,
            endereco: c.endereco,
            numero: c.numero,
            bairro: c.bairro,
            tipoEndereco: c.tipoEndereco,
            bloco: c.bloco || null,
            torre: c.torre || null,
            apartamento: c.apartamento || null,
            quadra: c.quadra || null,
            lote: c.lote || null,
            lojaId: 'demo-store'
          });

          for (const p of c.pets) {
            await firestoreDb.collection('pets').doc(`${p.id}-demo-store`).set({
              clienteId: `${c.id}-demo-store`,
              nome: p.nome,
              porte: p.porte,
              observacao: p.observacao,
              lojaId: 'demo-store'
            });
          }
        }
      }

      // Ensure pacotes_cliente are populated if they don't exist
      const pacotesClienteSnap = await firestoreDb.collection('pacotes_cliente').where('lojaId', '==', 'demo-store').limit(1).get();
      if (pacotesClienteSnap.empty) {
        console.log('Seeding missing pacotes_cliente collection on startup...');
        for (const pc of INITIAL_PACOTES_CLIENTE) {
          await firestoreDb.collection('pacotes_cliente').doc(`${pc.id}-demo-store`).set({
            clienteId: `${pc.clienteId}-demo-store`,
            petId: `${pc.petId}-demo-store`,
            pacoteId: `${pc.pacoteId}-demo-store`,
            nomePacote: pc.nomePacote,
            dataAquisicao: pc.dataAquisicao,
            banhosTotais: pc.banhosTotais,
            banhosUsados: pc.banhosUsados,
            status: pc.status,
            lojaId: 'demo-store'
          });
        }
      }

      // Ensure agendamentos are populated if they don't exist
      const agendamentosSnap = await firestoreDb.collection('agendamentos').where('lojaId', '==', 'demo-store').limit(1).get();
      if (agendamentosSnap.empty) {
        console.log('Seeding missing agendamentos collection on startup...');
        for (const a of INITIAL_AGENDAMENTOS) {
          const itens = a.itens.map(item => ({
            petId: `${item.petId}-demo-store`,
            servicoId: `${item.servicoId}-demo-store`,
            valor: item.valor,
            usouPacote: !!item.usouPacote,
            pacoteClienteId: item.pacoteClienteId ? `${item.pacoteClienteId}-demo-store` : null
          }));

          await firestoreDb.collection('agendamentos').doc(`${a.id}-demo-store`).set({
            clienteId: `${a.clienteId}-demo-store`,
            data: a.data,
            hora: a.hora,
            status: a.status,
            valorTotal: a.valorTotal,
            observacoes: a.observacoes || null,
            levaETras: false,
            itens: itens,
            lojaId: 'demo-store'
          });
        }
      }

      // Ensure historico are populated if they don't exist
      const historicoSnap = await firestoreDb.collection('historico').where('lojaId', '==', 'demo-store').limit(1).get();
      if (historicoSnap.empty) {
        console.log('Seeding missing historico collection on startup...');
        for (const h of INITIAL_HISTORICO) {
          await firestoreDb.collection('historico').doc(`${h.id}-demo-store`).set({
            petId: `${h.petId}-demo-store`,
            petNome: h.petNome,
            clienteId: `${h.clienteId}-demo-store`,
            clienteNome: h.clienteNome,
            data: h.data,
            servicoNome: h.servicoNome,
            valor: h.valor,
            usouPacote: !!h.usouPacote,
            agendamentoId: h.agendamentoId ? `${h.agendamentoId}-demo-store` : null,
            lojaId: 'demo-store'
          });
        }
      }
    }

    // Also check and seed default establishment 'demo-store' if not exists
    const demoEstRef = firestoreDb.collection('estabelecimentos').doc('demo-store');
    const demoEstDoc = await demoEstRef.get();
    if (!demoEstDoc.exists) {
      await demoEstRef.set({
        id: 'demo-store',
        nome: 'AuAu & Cia',
        email: 'demo@auau.com',
        senha: 'senha123',
        logo: { emoji: '🧼', color: 'from-sky-500 to-indigo-600' },
        telefone: '(11) 98765-4321',
        endereco: 'Rua dos Pets, 123 - Centro'
      });
    }
  } catch (error) {
    console.error('Error during Firestore initialization/seeding:', error);
  }

  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
