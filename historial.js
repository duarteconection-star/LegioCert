/**
 * LegioCert Pro - Módulo de Historial
 */
const HistorialModule = (() => {
  const render = () => `
    <div class="module-header">
      <h2><i class="icon">📋</i> Historial de Tratamientos</h2>
      <button class="btn btn-primary" onclick="App.navigate('legionella')">➕ Nuevo</button>
    </div>
    <div class="filter-bar" style="flex-wrap:wrap;gap:8px">
      <select id="h_filtroCliente" onchange="HistorialModule.load()" class="select-filter"><option value="">Todos los clientes</option></select>
      <select id="h_filtroTipo" onchange="HistorialModule.load()" class="select-filter">
        <option value="">Todos los tipos</option>
        <option value="mantenimiento">Mantenimiento</option>
        <option value="desinfeccion">Desinfección</option>
        <option value="choque">Choque</option>
        <option value="revision">Revisión</option>
        <option value="muestreo">Muestreo</option>
      </select>
      <input type="date" id="h_filtroDesde" onchange="HistorialModule.load()" class="input-filter">
      <input type="date" id="h_filtroHasta" onchange="HistorialModule.load()" class="input-filter">
      <div class="export-btns">
        <button class="btn btn-sm btn-ghost" onclick="HistorialModule.exportar('csv')">CSV</button>
        <button class="btn btn-sm btn-ghost" onclick="HistorialModule.exportar('json')">JSON</button>
        <button class="btn btn-sm btn-primary" onclick="HistorialModule.exportar('pdf')">📄 PDF</button>
      </div>
    </div>
    <div id="historialList" class="historial-list"></div>`;

  const load = async () => {
    const clientes = await DB.getAll('clientes');
    const sel = document.getElementById('h_filtroCliente');
    if (sel && sel.options.length <= 1) sel.innerHTML = '<option value="">Todos los clientes</option>' + clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
    const cm={}, im={};
    clientes.forEach(c=>{cm[c.id]=c;});
    (await DB.getAll('instalaciones')).forEach(i=>{im[i.id]=i;});
    let trats = await DB.getAll('tratamientos');
    trats.sort((a,b)=>(b.fecha||'')<(a.fecha||'')?-1:1);
    const fc=document.getElementById('h_filtroCliente')?.value, ft=document.getElementById('h_filtroTipo')?.value;
    const fd=document.getElementById('h_filtroDesde')?.value, fh=document.getElementById('h_filtroHasta')?.value;
    if (fc) trats=trats.filter(t=>String(t.clienteId)===fc);
    if (ft) trats=trats.filter(t=>t.tipo===ft);
    if (fd) trats=trats.filter(t=>t.fecha>=fd);
    if (fh) trats=trats.filter(t=>t.fecha<=fh);
    const container = document.getElementById('historialList');
    if (!container) return;
    if (trats.length===0) { container.innerHTML=`<div class="empty-state"><div class="empty-icon">📋</div><p>No hay tratamientos registrados</p><button class="btn btn-primary" onclick="App.navigate('legionella')">Registrar tratamiento</button></div>`; return; }
    const iconos={mantenimiento:'🟡',desinfeccion:'🟠',choque:'🔴',revision:'🔵',muestreo:'🟣'};
    const labels={mantenimiento:'Mantenimiento',desinfeccion:'Desinfección',choque:'Choque',revision:'Revisión',muestreo:'Muestreo'};
    container.innerHTML = trats.map(t=>{
      const c=cm[t.clienteId]||{}, i=im[t.instalacionId]||{};
      const fecha=t.fecha?new Date(t.fecha+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}):'—';
      return `
        <div class="historial-item">
          <div class="historial-icon">${iconos[t.tipo]||'⚪'}</div>
          <div class="historial-info">
            <div class="historial-top"><span class="historial-tipo">${labels[t.tipo]||t.tipo||'Tratamiento'}</span><span class="historial-fecha">${fecha}</span></div>
            <div class="historial-cliente">${c.nombre||'Sin cliente'}${c.empresa?` · ${c.empresa}`:''}</div>
            <div class="historial-inst">${i.nombre||i.tipo||'Sin instalación'}</div>
            <div class="historial-params">
              ${t.cloroLibreFinal?`<span class="param-chip">Cl libre: ${t.cloroLibreFinal} ppm</span>`:''}
              ${t.phFinal?`<span class="param-chip">pH: ${t.phFinal}</span>`:''}
              ${t.temperatura?`<span class="param-chip">T°: ${t.temperatura}°C</span>`:''}
            </div>
          </div>
          <div class="historial-actions">
            <button class="btn-icon" onclick="HistorialModule.verDetalle(${t.id})">👁️</button>
            <button class="btn-icon" onclick="PDFModule.generarCertificado(${t.id})">📄</button>
            <button class="btn-icon danger" onclick="HistorialModule.eliminar(${t.id})">🗑️</button>
          </div>
        </div>`;
    }).join('');
  };

  const verDetalle = async (id) => {
    const t = await DB.getById('tratamientos',id);
    if (!t) return;
    const c = t.clienteId ? await DB.getById('clientes',t.clienteId) : null;
    const i = t.instalacionId ? await DB.getById('instalaciones',t.instalacionId) : null;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="modal-content modal-large">
        <div class="modal-header"><h3>Detalle del Tratamiento</h3><button class="btn-close" onclick="this.closest('.modal').remove()">✕</button></div>
        <div class="modal-body">
          <div class="detalle-grid">
            <div class="detalle-item"><span>Cliente</span><strong>${c?.nombre||'—'}</strong></div>
            <div class="detalle-item"><span>Instalación</span><strong>${i?.nombre||i?.tipo||'—'}</strong></div>
            <div class="detalle-item"><span>Fecha</span><strong>${t.fecha||'—'}</strong></div>
            <div class="detalle-item"><span>Tipo</span><strong>${t.tipo||'—'}</strong></div>
            <div class="detalle-item"><span>Técnico</span><strong>${t.tecnico||'—'}</strong></div>
            <div class="detalle-item"><span>Producto</span><strong>${t.producto||'—'}</strong></div>
            <div class="detalle-item"><span>pH inicial/final</span><strong>${t.phInicial||'—'} / ${t.phFinal||'—'}</strong></div>
            <div class="detalle-item"><span>Cl libre final</span><strong>${t.cloroLibreFinal?`${t.cloroLibreFinal} ppm`:'—'}</strong></div>
            <div class="detalle-item"><span>Temperatura</span><strong>${t.temperatura?`${t.temperatura}°C`:'—'}</strong></div>
            <div class="detalle-item"><span>Cantidad</span><strong>${t.cantidad?`${t.cantidad} ${t.cantidadUnidad}`:'—'}</strong></div>
          </div>
          ${t.observaciones?`<div style="margin-top:12px"><strong>Observaciones:</strong><p style="margin-top:6px;color:var(--c-text-muted)">${t.observaciones}</p></div>`:''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Cerrar</button>
          <button class="btn btn-primary" onclick="PDFModule.generarCertificado(${t.id});this.closest('.modal').remove()">📄 Generar PDF</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  };

  const eliminar = (id) => App.confirm('¿Eliminar este tratamiento?', async () => {
    await DB.remove('tratamientos',id); App.toast('Tratamiento eliminado','info'); load(); App.refreshDashboard();
  });

  const exportar = async (formato) => {
    const trats = await DB.getAll('tratamientos');
    const clientes = await DB.getAll('clientes');
    const cm={};clientes.forEach(c=>{cm[c.id]=c;});
    const datos = trats.map(t=>({...t,clienteNombre:cm[t.clienteId]?.nombre||'',fotos:undefined,firmaTecnico:undefined,firmaCliente:undefined}));
    if (formato==='json') {
      const blob=new Blob([JSON.stringify(datos,null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`LegioCert_${new Date().toISOString().split('T')[0]}.json`;a.click();
    } else if (formato==='csv') {
      const cols=['id','fecha','clienteNombre','tipo','producto','cantidad','cantidadUnidad','temperatura','phInicial','phFinal','cloroLibreInicial','cloroLibreFinal','tecnico'];
      const content=[cols.join(';'),...datos.map(t=>cols.map(c=>`"${t[c]??''}"`).join(';'))].join('\n');
      const blob=new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8;'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`LegioCert_${new Date().toISOString().split('T')[0]}.csv`;a.click();
    } else if (formato==='pdf') {
      const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Historial</title><style>body{font-family:Arial,sans-serif;font-size:9pt}h1{color:#0A2342;border-bottom:2px solid #0A2342;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#0A2342;color:white;padding:6px;text-align:left;font-size:8pt}td{padding:5px 8px;border-bottom:1px solid #eee;font-size:8pt}@media print{@page{margin:10mm}}</style></head><body><h1>Historial – LegioCert Pro</h1><p style="color:#666">Generado: ${new Date().toLocaleString('es-ES')} · ${datos.length} tratamientos</p><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Producto</th><th>Cl libre</th><th>pH final</th><th>Técnico</th></tr></thead><tbody>${datos.map(t=>`<tr><td>${t.fecha||'—'}</td><td>${t.clienteNombre||'—'}</td><td>${t.tipo||'—'}</td><td>${t.producto||'—'}</td><td>${t.cloroLibreFinal?`${t.cloroLibreFinal} ppm`:'—'}</td><td>${t.phFinal||'—'}</td><td>${t.tecnico||'—'}</td></tr>`).join('')}</tbody></table><button onclick="window.print()" style="margin-top:16px;padding:8px 20px;background:#0A2342;color:white;border:none;border-radius:6px;cursor:pointer">🖨️ Imprimir</button></body></html>`;
      const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();}
    }
    App.toast(`Exportado como ${formato.toUpperCase()}`,'success');
  };

  return { render, load, verDetalle, eliminar, exportar };
})();
window.HistorialModule = HistorialModule;
