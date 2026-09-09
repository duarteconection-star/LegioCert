/**
 * LegioCert Pro - Base de Datos IndexedDB
 */
const DB = (() => {
  const DB_NAME = 'LegioCertPro';
  const DB_VERSION = 1;
  let db = null;
  const STORES = {
    clientes: { keyPath: 'id', autoIncrement: true, indexes: ['nombre','empresa','cif'] },
    instalaciones: { keyPath: 'id', autoIncrement: true, indexes: ['clienteId','tipo'] },
    tratamientos: { keyPath: 'id', autoIncrement: true, indexes: ['clienteId','instalacionId','fecha'] },
    certificados: { keyPath: 'id', autoIncrement: true, indexes: ['tratamientoId','numero','fecha'] },
    productos: { keyPath: 'id', autoIncrement: true, indexes: ['nombre','lote'] },
    agenda: { keyPath: 'id', autoIncrement: true, indexes: ['fecha','clienteId'] },
    config: { keyPath: 'clave' },
    fotos: { keyPath: 'id', autoIncrement: true, indexes: ['tratamientoId'] },
  };
  const init = () => new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const idb = e.target.result;
      Object.entries(STORES).forEach(([name, schema]) => {
        if (!idb.objectStoreNames.contains(name)) {
          const store = idb.createObjectStore(name, { keyPath: schema.keyPath, autoIncrement: schema.autoIncrement || false });
          (schema.indexes || []).forEach(idx => store.createIndex(idx, idx, { unique: false }));
        }
      });
    };
    request.onsuccess = (e) => { db = e.target.result; resolve(db); };
    request.onerror = (e) => reject(e.target.error);
  });
  const tx = (storeName, mode = 'readonly') => db.transaction(storeName, mode).objectStore(storeName);
  const getAll = (storeName, indexName = null, value = null) => new Promise((resolve, reject) => {
    const store = tx(storeName);
    const request = indexName && value !== null ? store.index(indexName).getAll(value) : store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const getById = (storeName, id) => new Promise((resolve, reject) => {
    const request = tx(storeName).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const add = (storeName, data) => new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').add({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const update = (storeName, data) => new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').put({ ...data, updatedAt: Date.now() });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const remove = (storeName, id) => new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
  const count = (storeName) => new Promise((resolve, reject) => {
    const request = tx(storeName).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const search = (storeName, query, fields) => new Promise((resolve, reject) => {
    const request = tx(storeName).getAll();
    request.onsuccess = () => {
      const q = query.toLowerCase();
      resolve(request.result.filter(item => fields.some(f => item[f] && String(item[f]).toLowerCase().includes(q))));
    };
    request.onerror = () => reject(request.error);
  });
  const exportAll = async () => {
    const data = {};
    for (const storeName of Object.keys(STORES)) data[storeName] = await getAll(storeName);
    return data;
  };
  const importAll = async (data) => {
    for (const [storeName, records] of Object.entries(data)) {
      if (!STORES[storeName]) continue;
      const store = tx(storeName, 'readwrite');
      await new Promise(res => { const r = store.clear(); r.onsuccess = res; });
      for (const record of records) await update(storeName, record);
    }
    return true;
  };
  const getConfig = (clave) => new Promise((resolve, reject) => {
    const request = tx('config').get(clave);
    request.onsuccess = () => resolve(request.result ? request.result.valor : null);
    request.onerror = () => reject(request.error);
  });
  const setConfig = (clave, valor) => new Promise((resolve, reject) => {
    const request = tx('config', 'readwrite').put({ clave, valor });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
  const nextCertNumber = async () => {
    let n = await getConfig('cert_counter');
    n = n ? parseInt(n) + 1 : 1;
    await setConfig('cert_counter', n);
    return `LC-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
  };
  return { init, getAll, getById, add, update, remove, count, search, exportAll, importAll, getConfig, setConfig, nextCertNumber };
})();
window.DB = DB;
