/**
 * LegioCert Pro - Módulo de Agenda
 */
const AgendaModule = (() => {
  let currentYear, currentMonth, eventos=[], currentEdit=null;

  const render = () => {
    const now = new Date();
    currentYear = now.getFullYear(); currentMonth = now.getMonth();
    return `
    <div class="module-header">
      <h2><i class="icon">📅</i> Agenda</h2>
      <button class="btn btn-primary" onclick="AgendaModule.openForm()">➕ Nueva revisión</button>
    </div>
    <div class="agenda-layout">
      <div class="calendar-panel">
        <div class="cal-nav">
          <button class="btn-icon" onclick="AgendaModule.prevMonth()">◀</button>
          <h3 id="cal_titulo"></h3>
          <button class="btn-icon" onclick="AgendaModule.nextMonth()">▶</button>
        </div>
        <div class="cal-weekdays"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
        <div id="cal_grid" class="cal-grid"></div>
      </div>
      <div class="agenda-list-panel">
        <h3 id="agenda_list_titulo">Próximas revisiones</h3>
        <div id="agenda_list"></div>
      </div>
    </div>
    <div id="agendaModal" class="modal hidden">
      <div class="modal-backdrop" onclick="AgendaModule.closeForm()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="agendaModalTitle">Nueva revisión</h3>
          <button class="btn-close" onclick="AgendaModule.closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group"><label>Fecha *</label><input type="date" id="ag_fecha"></div>
            <div class="form-group"><label>Hora</label><input type="time" id="ag_hora"></div>
            <div class="form-group"><label>Cliente</label><select id="ag_clienteId"><option value="">Sin cliente</option></select></div>
            <div class="form-group"><label>Tipo</label>
              <select id="ag_tipo">
                <option value="revision">Revisión periódica</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="muestreo">Toma de muestras</option>
                <option value="choque">Choque</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group form-full"><label>Descripción</label><input type="text" id="ag_descripcion" placeholder="Descripción de la revisión"></div>
            <div class="form-group form-full"><label>Observaciones</label><textarea id="ag_observaciones" rows="2" placeholder="Notas…"></textarea></div>
            <div class="form-group"><label>Aviso previo</label>
              <select id="ag_aviso"><option value="0">Sin aviso</option><option value="1">1 día antes</option><option value="3" selected>3 días antes</option><option value="7">1 semana antes</option></select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="AgendaModule.closeForm()">Cancelar</button>
          <button class="btn btn-primary" onclick="AgendaModule.save()">💾 Guardar</button>
        </div>
      </div>
    </div>`;
  };

  const load = async () => {
    eventos = await DB.getAll('agenda');
    const clientes = await DB.getAll('clientes');
    const sel = document.getElementById('ag_clienteId');
    if (sel) sel.innerHTML = '<option value="">Sin cliente</option>' + clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
    renderCalendar();
    renderProximas(clientes);
    checkAvisos(eventos, clientes);
  };

  const renderCalendar = () => {
    const titulo = document.getElementById('cal_titulo');
    if (titulo) titulo.textContent = new Date(currentYear,currentMonth).toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    const grid = document.getElementById('cal_grid');
    if (!grid) return;
    const firstDay = new Date(currentYear,currentMonth,1).getDay();
    const daysInMonth = new Date(currentYear,currentMonth+1,0).getDate();
    const offset = (firstDay+6)%7;
    const hoy = new Date().toISOString().split('T')[0];
    const evByDay={};
    eventos.forEach(ev=>{
      if (!ev.fecha) return;
      const d=ev.fecha;
      if (d.startsWith(`${currentYear}-${String(currentMonth+1).padStart(2,'0')}`)){
        const dia=parseInt(d.split('-')[2]);
        if(!evByDay[dia]) evByDay[dia]=[];
        evByDay[dia].push(ev);
      }
    });
    let html='';
    for(let i=0;i<offset;i++) html+='<div class="cal-day empty"></div>';
    for(let d=1;d<=daysInMonth;d++){
      const ds=`${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const esHoy=ds===hoy, esPasado=ds<hoy, evs=evByDay[d]||[];
      html+=`<div class="cal-day ${esHoy?'today':''} ${esPasado?'past':''} ${evs.length?'has-events':''}" onclick="AgendaModule.selectDay('${ds}')">
        <span class="cal-day-num">${d}</span>
        ${evs.slice(0,2).map(ev=>`<div class="cal-event-dot">${(ev.descripcion||ev.tipo||'Rev').slice(0,6)}</div>`).join('')}
        ${evs.length>2?`<div class="cal-event-more">+${evs.length-2}</div>`:''}
      </div>`;
    }
    grid.innerHTML = html;
  };

  const renderProximas = async (clientes) => {
    if (!clientes) clientes = await DB.getAll('clientes');
    const cm={};clientes.forEach(c=>{cm[c.id]=c;});
    const hoy = new Date().toISOString().split('T')[0];
    const proximas = eventos.filter(e=>e.fecha>=hoy).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,15);
    const el=document.getElementById('agenda_list');
    const titulo=document.getElementById('agenda_list_titulo');
    if (titulo) titulo.textContent=`Próximas revisiones (${proximas.length})`;
    if (!el) return;
    if (proximas.length===0){el.innerHTML='<div class="empty-state"><div class="empty-icon">📅</div><p>Sin revisiones programadas</p></div>';return;}
    const colores={revision:'blue',mantenimiento:'teal',muestreo:'purple',choque:'red',otro:'gray'};
    el.innerHTML = proximas.map(ev=>{
      const fecha=new Date(ev.fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'2-digit',month:'short'});
      const dias=Math.ceil((new Date(ev.fecha)-new Date())/86400000);
      return `<div class="agenda-item ${dias<=3?'urgente':''}">
        <div class="agenda-fecha"><div class="agenda-dia">${fecha.split(' ')[1]}</div><div class="agenda-mes">${fecha.split(' ')[2]||''}</div></div>
        <div class="agenda-info">
          <div class="agenda-desc">${ev.descripcion||ev.tipo||'Revisión'}</div>
          <div class="agenda-cliente">${cm[ev.clienteId]?.nombre||'Sin cliente'}</div>
          ${ev.hora?`<div class="agenda-hora">🕐 ${ev.hora}</div>`:''}
          <div class="agenda-dias ${dias<=3?'text-danger':'text-muted'}">${dias===0?'¡Hoy!':dias===1?'¡Mañana!':`En ${dias} días`}</div>
        </div>
        <span class="badge badge-${colores[ev.tipo]||'blue'}">${ev.tipo||'rev.'}</span>
        <div class="agenda-actions">
          <button class="btn-icon" onclick="AgendaModule.openForm(${ev.id})">✏️</button>
          <button class="btn-icon danger" onclick="AgendaModule.eliminar(${ev.id})">🗑️</button>
        </div>
      </div>`;
    }).join('');
  };

  const selectDay = (dateStr) => {
    const evsDia = eventos.filter(e=>e.fecha===dateStr);
    if (evsDia.length===0) { openForm(null, dateStr); return; }
    const titulo=document.getElementById('agenda_list_titulo');
    if (titulo) titulo.textContent=`Eventos del ${new Date(dateStr+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'long'})}`;
    const el=document.getElementById('agenda_list');
    if (el) el.innerHTML=evsDia.map(ev=>`<div class="agenda-item"><div class="agenda-info"><div class="agenda-desc">${ev.descripcion||ev.tipo}</div>${ev.hora?`<div class="agenda-hora">🕐 ${ev.hora}</div>`:''}</div><div class="agenda-actions"><button class="btn-icon" onclick="AgendaModule.openForm(${ev.id})">✏️</button><button class="btn-icon danger" onclick="AgendaModule.eliminar(${ev.id})">🗑️</button></div></div>`).join('')+`<button class="btn btn-sm btn-primary" onclick="AgendaModule.openForm(null,'${dateStr}')" style="margin-top:10px">+ Añadir evento</button>`;
  };

  const prevMonth = () => { currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} renderCalendar(); };
  const nextMonth = () => { currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} renderCalendar(); };

  const openForm = async (id=null, fechaDefault=null) => {
    currentEdit=id;
    document.getElementById('agendaModalTitle').textContent = id?'Editar revisión':'Nueva revisión';
    ['fecha','hora','descripcion','observaciones'].forEach(f=>{const el=document.getElementById(`ag_${f}`);if(el)el.value='';});
    document.getElementById('ag_tipo').value='revision';
    document.getElementById('ag_aviso').value='3';
    document.getElementById('ag_fecha').value = fechaDefault||new Date().toISOString().split('T')[0];
    if (id) {
      const ev=await DB.getById('agenda',id);
      if(ev){['fecha','hora','descripcion','observaciones'].forEach(f=>{const el=document.getElementById(`ag_${f}`);if(el)el.value=ev[f]||'';});document.getElementById('ag_tipo').value=ev.tipo||'revision';document.getElementById('ag_aviso').value=ev.aviso||'3';document.getElementById('ag_clienteId').value=ev.clienteId||'';}
    }
    document.getElementById('agendaModal').classList.remove('hidden');
  };

  const closeForm = () => { document.getElementById('agendaModal').classList.add('hidden'); currentEdit=null; };

  const save = async () => {
    const fecha=document.getElementById('ag_fecha').value;
    if(!fecha){App.toast('La fecha es obligatoria','error');return;}
    const data={fecha,hora:document.getElementById('ag_hora').value,clienteId:parseInt(document.getElementById('ag_clienteId').value)||null,tipo:document.getElementById('ag_tipo').value,descripcion:document.getElementById('ag_descripcion').value.trim(),observaciones:document.getElementById('ag_observaciones').value.trim(),aviso:parseInt(document.getElementById('ag_aviso').value)||0};
    if(currentEdit){await DB.update('agenda',{...data,id:currentEdit});App.toast('Revisión actualizada','success');}
    else{await DB.add('agenda',data);App.toast('Revisión creada','success');}
    closeForm(); await load(); App.refreshDashboard();
  };

  const eliminar = (id) => App.confirm('¿Eliminar esta revisión?', async () => {
    await DB.remove('agenda',id); App.toast('Revisión eliminada','info'); await load(); App.refreshDashboard();
  });

  const checkAvisos = (eventos, clientes) => {
    const hoy=new Date(), cm={};clientes.forEach(c=>{cm[c.id]=c;});
    eventos.forEach(ev=>{
      if(!ev.aviso||ev.aviso===0) return;
      const dias=Math.ceil((new Date(ev.fecha+'T12:00:00')-hoy)/86400000);
      if(dias>=0&&dias<=ev.aviso) App.toast(`⚠️ ${ev.descripcion||'Revisión'} ${cm[ev.clienteId]?.nombre?`· ${cm[ev.clienteId].nombre}`:''} en ${dias} días`,'warning',6000);
    });
  };

  return { render, load, prevMonth, nextMonth, selectDay, openForm, closeForm, save, eliminar };
})();
window.AgendaModule = AgendaModule;
