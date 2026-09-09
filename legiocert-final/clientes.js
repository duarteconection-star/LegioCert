/**
 * LegioCert Pro - Módulo de Clientes
 */
const ClientesModule = (() => {
  let currentEdit = null;
  const render = () => `
    <div class="module-header">
      <h2><i class="icon">👥</i> Clientes</h2>
      <button class="btn btn-primary" onclick="ClientesModule.openForm()">➕ Nuevo Cliente</button>
    </div>
    <div class="search-bar">
      <input type="text" id="clienteSearch" placeholder="🔍 Buscar por nombre, empresa, CIF…" oninput="ClientesModule.search(this.value)" class="input-search">
    </div>
    <div id="clientesList" class="cards-grid"></div>
    <div id="clienteModal" class="modal hidden">
      <div class="modal-backdrop" onclick="ClientesModule.closeForm()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="clienteModalTitle">Nuevo Cliente</h3>
          <button class="btn-close" onclick="ClientesModule.closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group"><label>Nombre *</label><input type="text" id="c_nombre" placeholder="Nombre completo"></div>
            <div class="form-group"><label>Empresa</label><input type="text" id="c_empresa" placeholder="Razón social"></div>
            <div class="form-group"><label>CIF / NIF</label><input type="text" id="c_cif" placeholder="B12345678"></div>
            <div class="form-group"><label>Teléfono</label><input type="tel" id="c_telefono" placeholder="600 000 000"></div>
            <div class="form-group"><label>Email</label><input type="email" id="c_email" placeholder="cliente@empresa.com"></div>
            <div class="form-group"><label>Persona de contacto</label><input type="text" id="c_contacto" placeholder="Nombre del contacto"></div>
            <div class="form-group form-full"><label>Dirección</label><input type="text" id="c_direccion" placeholder="Calle, número, piso…"></div>
            <div class="form-group"><label>Provincia</label>
              <select id="c_provincia"><option value="">Seleccionar...</option>${CONFIG.PROVINCIAS.map(p=>`<option value="${p}">${p}</option>`).join('')}</select>
            </div>
            <div class="form-group form-full"><label>Observaciones</label><textarea id="c_observaciones" rows="3" placeholder="Notas adicionales…"></textarea></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="ClientesModule.closeForm()">Cancelar</button>
          <button class="btn btn-primary" onclick="ClientesModule.save()">💾 Guardar</button>
        </div>
      </div>
    </div>`;
  const load = async () => renderList(await DB.getAll('clientes'));
  const renderList = async (clientes) => {
    const container = document.getElementById('clientesList');
    if (!container) return;
    if (clientes.length === 0) { container.innerHTML=`<div class="empty-state"><div class="empty-icon">👥</div><p>No hay clientes registrados</p><button class="btn btn-primary" onclick="ClientesModule.openForm()">Añadir primer cliente</button></div>`; return; }
    const instalaciones = await DB.getAll('instalaciones'), tratamientos = await DB.getAll('tratamientos');
    const cI={}, cT={};
    instalaciones.forEach(i=>{cI[i.clienteId]=(cI[i.clienteId]||0)+1;});
    tratamientos.forEach(t=>{cT[t.clienteId]=(cT[t.clienteId]||0)+1;});
    container.innerHTML = clientes.map(c=>`
      <div class="card" onclick="ClientesModule.viewDetail(${c.id})">
        <div class="card-avatar">${(c.nombre||c.empresa||'?')[0].toUpperCase()}</div>
        <div class="card-body">
          <h4 class="card-title">${c.nombre||'—'}</h4>
          <p class="card-subtitle">${c.empresa||'Sin empresa'}</p>
          <p class="card-meta">${c.cif?`CIF: ${c.cif}`:''}</p>
          <div class="card-stats"><span class="stat-badge">🏢 ${cI[c.id]||0}</span><span class="stat-badge">🧪 ${cT[c.id]||0}</span></div>
        </div>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" onclick="ClientesModule.openForm(${c.id})">✏️</button>
          <button class="btn-icon danger" onclick="ClientesModule.confirmDelete(${c.id})">🗑️</button>
        </div>
      </div>`).join('');
  };
  const search = async (q) => { if (!q.trim()) { load(); return; } renderList(await DB.search('clientes', q, ['nombre','empresa','cif','email','telefono'])); };
  const openForm = async (id=null) => {
    currentEdit = id;
    document.getElementById('clienteModalTitle').textContent = id ? 'Editar Cliente' : 'Nuevo Cliente';
    ['nombre','empresa','cif','telefono','email','contacto','direccion','provincia','observaciones'].forEach(f=>{const el=document.getElementById(`c_${f}`);if(el)el.value='';});
    if (id) { const c=await DB.getById('clientes',id); if(c) ['nombre','empresa','cif','telefono','email','contacto','direccion','provincia','observaciones'].forEach(f=>{const el=document.getElementById(`c_${f}`);if(el)el.value=c[f]||'';}); }
    document.getElementById('clienteModal').classList.remove('hidden');
  };
  const closeForm = () => { document.getElementById('clienteModal').classList.add('hidden'); currentEdit=null; };
  const save = async () => {
    const nombre = document.getElementById('c_nombre').value.trim();
    if (!nombre) { App.toast('El nombre es obligatorio','error'); return; }
    const data = { nombre, empresa:document.getElementById('c_empresa').value.trim(), cif:document.getElementById('c_cif').value.trim(), telefono:document.getElementById('c_telefono').value.trim(), email:document.getElementById('c_email').value.trim(), contacto:document.getElementById('c_contacto').value.trim(), direccion:document.getElementById('c_direccion').value.trim(), provincia:document.getElementById('c_provincia').value, observaciones:document.getElementById('c_observaciones').value.trim() };
    if (currentEdit) { await DB.update('clientes',{...data,id:currentEdit}); App.toast('Cliente actualizado','success'); }
    else { await DB.add('clientes',data); App.toast('Cliente creado','success'); }
    closeForm(); load(); App.refreshDashboard();
  };
  const confirmDelete = (id) => App.confirm('¿Eliminar este cliente y todos sus datos?', async () => {
    for (const i of await DB.getAll('instalaciones','clienteId',id)) await DB.remove('instalaciones',i.id);
    for (const t of await DB.getAll('tratamientos','clienteId',id)) await DB.remove('tratamientos',t.id);
    await DB.remove('clientes',id); App.toast('Cliente eliminado','info'); load(); App.refreshDashboard();
  });
  const viewDetail = (id) => App.navigate('instalaciones',{clienteId:id});
  return { render, load, search, openForm, closeForm, save, confirmDelete, viewDetail };
})();
window.ClientesModule = ClientesModule;
