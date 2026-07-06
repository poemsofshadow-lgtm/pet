const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

async function main() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.log('No config file.');
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('Project ID:', config.projectId);
  console.log('Database ID:', config.firestoreDatabaseId);

  try {
    const db = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId || '(default)'
    });
    console.log('Attempting to read "clientes" collection...');
    const snapshot = await db.collection('clientes').limit(1).get();
    console.log('SUCCESS! Read documents count:', snapshot.size);
    snapshot.forEach(doc => {
      console.log('Doc:', doc.id, doc.data());
    });
  } catch (err) {
    console.error('FAILED to connect native Firestore:', err.message);
  }
}

main();
