/**
 * LegioCert Pro - Módulo de Instalaciones
 */
const InstalacionesModule = (() => {
  let currentEdit = null;
  let filterClienteId = null;

  const render = (params={}) => {
    filterClienteId = params.clienteId || null;
    return `
    <div class="module-header">
      <h2><i class="icon">🏢</i> Instalaciones</h2>
      <button class="btn btn-primary" onclick="InstalacionesModule.openForm()">➕ Nueva Instalación</button>
    </div>
    <div class="filter-bar">
      <select id="instClienteFilter" onchange="InstalacionesModule.filterByCliente(this.value)" class="select-filter">
        <option value="">Todos los clientes</option>
      </select>
      <input type="text" id="instSearch" placeholder="🔍 Buscar…" oninput="InstalacionesModule.search(this.value)" class="input-search" style="flex:1">
    </div>
    <div id="instalacionesList" class="cards-grid"></div>
    <div id="instModal" class="modal hidden">
      <div class="modal-backdrop" onclick="InstalacionesModule.closeForm()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="instModalTitle">Nueva Instalación</h3>
          <button class="btn-close" onclick="InstalacionesModule.closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group form-full"><label>Cliente *</label><select id="inst_clienteId"><option value="">Seleccionar cliente...</option></select></div>
            <div class="form-group form-full"><label>Nombre / Descripción *</label><input type="text" id="inst_nombre" placeholder="Ej: ACS Edificio A"></div>
            <div class="form-group"><label>Tipo de instalación *</label>
              <select id="inst_tipo"><option value="">Seleccionar...</option>${CONFIG.TIPOS_INSTALACION.map(t=>`<option value="${t}">${t}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Volumen (litros)</label><input type="number" id="inst_volumen" placeholder="0" min="0"></div>
            <div class="form-group"><label>Material</label>
              <select id="inst_material"><option value="">Seleccionar...</option>${CONFIG.MATERIALES.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Año de instalación</label><input type="number" id="inst_anio" placeholder="${new Date().getFullYear()}"></div>
            <div class="form-group"><label>Ubicación</label><input type="text" id="inst_ubicacion" placeholder="Ej: Planta baja"></div>
            <div class="form-group form-full"><label>Observaciones</label><textarea id="inst_observaciones" rows="3"></textarea></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="InstalacionesModule.closeForm()">Cancelar</button>
          <button class="btn btn-primary" onclick="InstalacionesModule.save()">💾 Guardar</button>
        </div>
      </div>
    </div>`;
  };

  const load = async () => {
    const clientes = await DB.getAll('clientes');
    const sel = document.getElementById('instClienteFilter');
    if (sel) {
      sel.innerHTML = '<option value="">Todos los clientes</option>' + clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
      if (filterClienteId) sel.value = filterClienteId;
    }
    const instalaciones = filterClienteId ? await DB.getAll('instalaciones','clienteId',filterClienteId) : await DB.getAll('instalaciones');
    renderList(instalaciones, clientes);
  };

  const renderList = async (instalaciones, clientes) => {
    const container = document.getElementById('instalacionesList');
    if (!container) return;
    if (instalaciones.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏢</div><p>No hay instalaciones registradas</p><button class="btn btn-primary" onclick="InstalacionesModule.openForm()">Añadir instalación</button></div>`;
      return;
    }
    if (!clientes) clientes = await DB.getAll('clientes');
    const clienteMap = {};
    clientes.forEach(c => { clienteMap[c.id] = c; });
    const tratamientos = await DB.getAll('tratamientos');
    const countTrat = {};
    tratamientos.forEach(t => { countTrat[t.instalacionId] = (countTrat[t.instalacionId]||0)+1; });
    const iconos = {'ACS':'🚿','AFCH':'💧','Depósito':'🪣','Piscina':'🏊','SPA':'♨️','Torre':'🏗️','Humectador':'💨','Fuente':'⛲'};
    container.innerHTML = instalaciones.map(inst => {
      const cliente = clienteMap[inst.clienteId] || {};
      const iconKey = Object.keys(iconos).find(k=>(inst.tipo||'').includes(k));
      return `
        <div class="card" onclick="InstalacionesModule.openTratamiento(${inst.id})">
          <div class="card-avatar inst-avatar">${iconKey?iconos[iconKey]:'🏢'}</div>
          <div class="card-body">
            <h4 class="card-title">${inst.nombre||inst.tipo||'Instalación'}</h4>
            <p class="card-subtitle">${cliente.nombre||'Sin cliente'}</p>
            <div class="inst-meta">
              ${inst.tipo?`<span class="badge badge-blue">${inst.tipo}</span>`:''}
              ${inst.volumen?`<span class="badge badge-teal">${inst.volumen.toLocaleString()} L</span>`:''}
            </div>
            <div class="card-stats"><span class="stat-badge">🧪 ${countTrat[inst.id]||0} tratamientos</span></div>
          </div>
          <div class="card-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" onclick="InstalacionesModule.openForm(${inst.id})">✏️</button>
            <button class="btn-icon" onclick="InstalacionesModule.openTratamiento(${inst.id})">🧪</button>
            <button class="btn-icon danger" onclick="InstalacionesModule.confirmDelete(${inst.id})">🗑️</button>
          </div>
        </div>`;
    }).join('');
  };

  const filterByCliente = (clienteId) => { filterClienteId = clienteId ? parseInt(clienteId) : null; load(); };

  const search = async (q) => {
    if (!q.trim()) { load(); return; }
    let results = await DB.search('instalaciones', q, ['nombre','tipo','material','ubicacion']);
    if (filterClienteId) results = results.filter(i => i.clienteId === filterClienteId);
    renderList(results);
  };

  const openForm = async (id=null) => {
    currentEdit = id;
    document.getElementById('instModalTitle').textContent = id ? 'Editar Instalación' : 'Nueva Instalación';
    const clientes = await DB.getAll('clientes');
    document.getElementById('inst_clienteId').innerHTML = '<option value="">Seleccionar cliente...</option>' + clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
    ['nombre','tipo','volumen','material','anio','ubicacion','observaciones'].forEach(f=>{const el=document.getElementById(`inst_${f}`);if(el)el.value='';});
    if (filterClienteId) document.getElementById('inst_clienteId').value = filterClienteId;
    if (id) {
      const inst = await DB.getById('instalaciones', id);
      if (inst) {
        document.getElementById('inst_clienteId').value = inst.clienteId||'';
        ['nombre','tipo','volumen','material','anio','ubicacion','observaciones'].forEach(f=>{const el=document.getElementById(`inst_${f}`);if(el&&inst[f]!==null&&inst[f]!==undefined)el.value=inst[f];});
      }
    }
    document.getElementById('instModal').classList.remove('hidden');
  };

  const closeForm = () => { document.getElementById('instModal').classList.add('hidden'); currentEdit=null; };

  const save = async () => {
    const clienteId = parseInt(document.getElementById('inst_clienteId').value);
    const nombre = document.getElementById('inst_nombre').value.trim();
    const tipo = document.getElementById('inst_tipo').value;
    if (!clienteId) { App.toast('Selecciona un cliente','error'); return; }
    if (!nombre && !tipo) { App.toast('Indica nombre o tipo','error'); return; }
    const data = { clienteId, nombre, tipo, volumen:parseFloat(document.getElementById('inst_volumen').value)||null, material:document.getElementById('inst_material').value, anio:parseInt(document.getElementById('inst_anio').value)||null, ubicacion:document.getElementById('inst_ubicacion').value.trim(), observaciones:document.getElementById('inst_observaciones').value.trim() };
    if (currentEdit) { await DB.update('instalaciones',{...data,id:currentEdit}); App.toast('Instalación actualizada','success'); }
    else { await DB.add('instalaciones',data); App.toast('Instalación creada','success'); }
    closeForm(); load(); App.refreshDashboard();
  };

  const confirmDelete = (id) => App.confirm('¿Eliminar esta instalación y sus tratamientos?', async () => {
    for (const t of await DB.getAll('tratamientos','instalacionId',id)) await DB.remove('tratamientos',t.id);
    await DB.remove('instalaciones',id); App.toast('Instalación eliminada','info'); load(); App.refreshDashboard();
  });

  const openTratamiento = (instalacionId) => App.navigate('legionella',{instalacionId});
  return { render, load, search, filterByCliente, openForm, closeForm, save, confirmDelete, openTratamiento };
})();
window.InstalacionesModule = InstalacionesModule;
