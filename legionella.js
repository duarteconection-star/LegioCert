/**
 * LegioCert Pro - Módulo de Tratamientos v3
 * Campos actualizados según certificado oficial RD 487/2022
 */
const LegionellaModule = (() => {
  let currentTratamiento = null;
  let timerInterval = null;
  let _timerSeconds = 0;
  let medidas = [];

  const render = (params={}) => `
    <div class="module-header"><h2><i class="icon">🧪</i> Nuevo Tratamiento</h2></div>
    <div class="tratamiento-form">
      <div class="form-section">
        <h3 class="section-title">📋 Datos Generales</h3>
        <div class="form-grid">
          <div class="form-group"><label>Cliente *</label><select id="t_clienteId" onchange="LegionellaModule.onClienteChange(this.value)"><option value="">Seleccionar cliente…</option></select></div>
          <div class="form-group"><label>Instalación *</label><select id="t_instalacionId"><option value="">Primero selecciona cliente</option></select></div>
          <div class="form-group"><label>Fecha *</label><input type="date" id="t_fecha"></div>
          <div class="form-group"><label>Nombre del circuito</label><input type="text" id="t_circuito" placeholder="Ej: Red ACS planta baja"></div>
          <div class="form-group"><label>Motivo del tratamiento</label>
            <select id="t_motivo">
              <option value="mantenimiento">Mantenimiento programado</option>
              <option value="aislamiento">Aislamiento de Legionella</option>
              <option value="correctora">Medida correctora</option>
              <option value="brote">Brote / Caso</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group"><label>Normativa</label>
            <select id="t_normativa">
              <option value="RD487">RD 487/2022</option>
              <option value="RD614">RD 614/2024</option>
              <option value="UNE">UNE 100030</option>
            </select>
          </div>
        </div>
      </div>
      <div class="form-section">
        <h3 class="section-title">👷 Datos del Técnico Aplicador</h3>
        <div class="form-grid">
          <div class="form-group"><label>Nombre del técnico</label><input type="text" id="t_tecnico" placeholder="Nombre completo"></div>
          <div class="form-group"><label>DNI del técnico</label><input type="text" id="t_tecnicoDni" placeholder="12345678X"></div>
          <div class="form-group form-full"><label>Titulación / Acreditación</label><input type="text" id="t_tecnicoTitulacion" placeholder="Ej: Curso mantenimiento higiénico-sanitario Legionella 2022"></div>
          <div class="form-group"><label>Responsable técnico</label><input type="text" id="t_responsable" placeholder="Nombre del responsable técnico"></div>
          <div class="form-group"><label>DNI responsable técnico</label><input type="text" id="t_responsableDni" placeholder="12345678X"></div>
          <div class="form-group form-full"><label>Titulación responsable técnico</label><input type="text" id="t_responsableTitulacion" placeholder="Ej: Curso segunda actualización Legionella 2022"></div>
        </div>
      </div>
      <div class="form-section">
        <h3 class="section-title">🏗️ Estado de la Instalación</h3>
        <div class="form-grid">
          <div class="form-group"><label>Estado de conservación</label>
            <select id="t_estadoConservacion">
              <option value="correcto">Correcto</option>
              <option value="corrosion">Con corrosión</option>
              <option value="incrustaciones">Con incrustaciones / biocapa / algas</option>
              <option value="deficiente">Deficiente</option>
            </select>
          </div>
          <div class="form-group"><label>Notificada a autoridad competente</label>
            <select id="t_notificada"><option value="no">No</option><option value="si">Sí</option></select>
          </div>
          <div class="form-group"><label>Fecha de notificación</label><input type="date" id="t_fechaNotificacion"></div>
          <div class="form-group"><label>Plano esquema hidráulico actualizado</label>
            <select id="t_planoHidraulico"><option value="no">No</option><option value="si">Sí</option></select>
          </div>
          <div class="form-group"><label>Se ha parado la instalación</label>
            <select id="t_paradaInstalacion"><option value="si">Sí</option><option value="no">No</option><option value="parcialmente">Parcialmente</option></select>
          </div>
          <div class="form-group"><label>Se ha vaciado previamente</label>
            <select id="t_vaciado"><option value="si">Sí</option><option value="no">No</option><option value="parcialmente">Parcialmente</option></select>
          </div>
          <div class="form-group"><label>Se ha limpiado antes del biocida</label>
            <select id="t_limpiezaPrevia"><option value="si">Sí</option><option value="no">No</option><option value="parcialmente">Parcialmente</option></select>
          </div>
          <div class="form-group"><label>Se han limpiado los depósitos acumuladores</label>
            <select id="t_limpiezaDepositos"><option value="si">Sí</option><option value="no">No</option><option value="parcialmente">Parcialmente</option></select>
          </div>
        </div>
      </div>
      <div class="form-section">
        <h3 class="section-title">⏱️ Tiempos</h3>
        <div class="form-grid">
          <div class="form-group"><label>Hora inicio</label><input type="time" id="t_horaInicio"><button class="btn btn-sm btn-ghost" onclick="LegionellaModule.ahora('t_horaInicio')" style="margin-top:4px">Ahora</button></div>
          <div class="form-group"><label>Hora fin</label><input type="time" id="t_horaFin"><button class="btn btn-sm btn-ghost" onclick="LegionellaModule.ahora('t_horaFin')" style="margin-top:4px">Ahora</button></div>
          <div class="form-group"><label>Tiempo de recirculación del biocida</label><input type="text" id="t_tiempoRecirculacion" placeholder="Ej: 2 horas"></div>
          <div class="form-group form-full">
            <div class="cronometro">
              <div id="cronometro_display" class="cronometro-display">00:00:00</div>
              <div class="cronometro-btns">
                <button class="btn btn-primary" onclick="LegionellaModule.iniciarCronometro()">▶ Iniciar</button>
                <button class="btn btn-ghost" onclick="LegionellaModule.pararCronometro()">⏹ Parar</button>
                <button class="btn btn-ghost" onclick="LegionellaModule.resetCronometro()">↺ Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="form-section">
        <h3 class="section-title">🧴 Producto Utilizado</h3>
        <div class="form-grid">
          <div class="form-group"><label>Producto principal (biocida)</label>
            <select id="t_producto" onchange="LegionellaModule.onProductoChange()">
              <option value="">Seleccionar…</option>
              <option value="Cloro granulado 65%">Cloro granulado 65%</option>
              <option value="Hipoclorito sódico 12%">Hipoclorito sódico 12%</option>
              <option value="Hipoclorito sódico 20%">Hipoclorito sódico 20%</option>
              <option value="Dióxido de cloro">Dióxido de cloro</option>
              <option value="custom">Otro (especificar)</option>
            </select>
          </div>
          <div class="form-group" id="t_producto_custom_row" style="display:none"><label>Nombre del producto</label><input type="text" id="t_productoCustom" placeholder="Nombre del producto"></div>
          <div class="form-group"><label>Nº Registro sanitario del biocida</label><input type="text" id="t_productoRegistro" placeholder="Ej: 18-20/40-09716-HA"></div>
          <div class="form-group"><label>Producto secundario (anticorrosivo, etc.)</label><input type="text" id="t_productoSecundario" placeholder="Ej: ADIC LP Reductor: ADIC PC026"></div>
          <div class="form-group"><label>Concentración de choque</label><input type="text" id="t_concentracionChoque" placeholder="Ej: 20 ppm durante 2 horas"></div>
          <div class="form-group"><label>Nº Lote</label><input type="text" id="t_lote" placeholder="LOT-2024-001"></div>
          <div class="form-group"><label>Fecha caducidad</label><input type="date" id="t_caducidad"></div>
          <div class="form-group"><label>Cantidad utilizada</label><input type="number" id="t_cantidad" placeholder="0" step="0.01" min="0"></div>
          <div class="form-group"><label>Unidad</label>
            <select id="t_cantidadUnidad"><option value="g">Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="mL">Mililitros (mL)</option><option value="L">Litros (L)</option></select>
          </div>
          <div class="form-group"><label>Coste del producto (€)</label><input type="number" id="t_costeProducto" placeholder="0.00" step="0.01" min="0"></div>
        </div>
      </div>
      <div class="form-section">
        <h3 class="section-title">📍 Partes donde se realiza el tratamiento</h3>
        <textarea id="t_partesInstalacion" rows="3" placeholder="Especificar las partes donde se realiza el tratamiento, niveles obtenidos y medidas correctoras. Ej: Depósito 10.000 litros, acumulador 500 litros, red AFCH-ACS y elementos terminales" class="textarea-full"></textarea>
      </div>
      <div class="form-section">
        <h3 class="section-title">📊 Tabla de Medidas - Anexo I</h3>
        <p class="text-muted" style="margin-bottom:12px;font-size:13px">Medidas de temperatura y concentración de desinfectante en puntos de la instalación.</p>
        <div id="tablaMedias_filas"></div>
        <button class="btn btn-sm btn-ghost" onclick="LegionellaModule.agregarMedida()" style="margin-top:10px">➕ Añadir medida</button>
      </div>
      <div class="form-section">
        <h3 class="section-title">🔬 Parámetros Generales</h3>
        <div class="form-grid">
          <div class="form-group"><label>Temperatura en puntos finales (°C)</label><input type="number" id="t_temperatura" placeholder="60" step="0.1"></div>
          <div class="form-group"><label>pH inicial</label><input type="number" id="t_phInicial" placeholder="7.2" step="0.01" min="0" max="14"></div>
          <div class="form-group"><label>pH final</label><input type="number" id="t_phFinal" placeholder="7.0" step="0.01" min="0" max="14"></div>
          <div class="form-group"><label>Cloro libre inicial (ppm)</label><input type="number" id="t_cloroLibreInicial" placeholder="0" step="0.01" min="0"></div>
          <div class="form-group"><label>Cloro libre final (ppm)</label><input type="number" id="t_cloroLibreFinal" placeholder="0" step="0.01" min="0"></div>
          <div class="form-group"><label>Cloro combinado (ppm)</label><input type="number" id="t_cloroCombinado" placeholder="0" step="0.01" min="0"></div>
        </div>
      </div>
      <div class="form-section">
        <h3 class="section-title">💶 Costes del Servicio</h3>
        <div class="form-grid">
          <div class="form-group"><label>Horas de trabajo</label><input type="number" id="t_horas" placeholder="0" step="0.5" min="0" oninput="LegionellaModule.calcularCoste()"></div>
          <div class="form-group"><label>Precio hora (€)</label><input type="number" id="t_precioHora" value="${CONFIG.COSTES.MANO_OBRA_HORA}" step="0.5" oninput="LegionellaModule.calcularCoste()"></div>
          <div class="form-group"><label>Km desplazamiento</label><input type="number" id="t_km" placeholder="0" step="1" min="0" oninput="LegionellaModule.calcularCoste()"></div>
          <div class="form-group"><label>Precio km (€)</label><input type="number" id="t_precioKm" value="${CONFIG.COSTES.DESPLAZAMIENTO_KM}" step="0.01" oninput="LegionellaModule.calcularCoste()"></div>
          <div class="form-group"><label>Margen (%)</label><input type="number" id="t_margen" value="${CONFIG.COSTES.MARGEN_DEFECTO}" step="1" min="0" oninput="LegionellaModule.calcularCoste()"></div>
        </div>
        <div id="coste_resumen" class="coste-resumen"></div>
      </div>
      <div class="form-section">
        <h3 class="section-title">📝 Observaciones</h3>
        <textarea id="t_observaciones" rows="4" placeholder="Observaciones del tratamiento…" class="textarea-full"></textarea>
      </div>
      <div class="form-section">
        <h3 class="section-title">📸 Fotografías</h3>
        <div id="fotos_container"></div>
      </div>
      <div class="form-section">
        <h3 class="section-title">📍 Ubicación GPS</h3>
        <div id="gps_container"></div>
      </div>
      <div class="form-section">
        <h3 class="section-title">✍️ Firmas</h3>
        <div class="firmas-grid">
          <div><label class="firma-label-titulo">Técnico aplicador</label><div id="firma_tecnico"></div></div>
          <div><label class="firma-label-titulo">Responsable técnico</label><div id="firma_responsable"></div></div>
          <div><label class="firma-label-titulo">Titular / Responsable instalación</label><div id="firma_cliente"></div></div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" onclick="App.navigate('historial')">Cancelar</button>
        <button class="btn btn-secondary" onclick="LegionellaModule.guardar(false)">💾 Guardar borrador</button>
        <button class="btn btn-primary" onclick="LegionellaModule.guardar(true)">📄 Guardar y generar certificado</button>
      </div>
    </div>`;

  const agregarMedida = () => {
    medidas.push({ fecha: new Date().toISOString().split('T')[0], hora: '', elemento: '', ubicacion: '', biocida: '', temperatura: '', ph: '' });
    renderTablaMedias();
  };

  const renderTablaMedias = () => {
    const container = document.getElementById('tablaMedias_filas');
    if (!container) return;
    if (medidas.length === 0) { container.innerHTML = '<p class="text-muted" style="font-size:13px">Sin medidas. Pulsa "Añadir medida".</p>'; return; }
    container.innerHTML = medidas.map((m, idx) => `
      <div style="background:var(--c-surface2);border:1px solid var(--c-border);border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong style="font-size:13px">Medida ${idx+1}</strong>
          <button class="btn-icon danger" onclick="LegionellaModule.eliminarMedida(${idx})">🗑️</button>
        </div>
        <div class="form-grid">
          <div class="form-group"><label>Fecha</label><input type="date" value="${m.fecha}" oninput="LegionellaModule.actualizarMedida(${idx},'fecha',this.value)"></div>
          <div class="form-group"><label>Hora</label><input type="time" value="${m.hora}" oninput="LegionellaModule.actualizarMedida(${idx},'hora',this.value)"></div>
          <div class="form-group"><label>Elemento</label><input type="text" value="${m.elemento}" placeholder="Ej: Grifo AFCH" oninput="LegionellaModule.actualizarMedida(${idx},'elemento',this.value)"></div>
          <div class="form-group"><label>Ubicación</label><input type="text" value="${m.ubicacion}" placeholder="Ej: Terminal 1" oninput="LegionellaModule.actualizarMedida(${idx},'ubicacion',this.value)"></div>
          <div class="form-group"><label>Biocida (ppm)</label><input type="number" value="${m.biocida}" placeholder="0" step="0.1" oninput="LegionellaModule.actualizarMedida(${idx},'biocida',this.value)"></div>
          <div class="form-group"><label>Temperatura (°C)</label><input type="number" value="${m.temperatura}" placeholder="0" step="0.1" oninput="LegionellaModule.actualizarMedida(${idx},'temperatura',this.value)"></div>
          <div class="form-group"><label>pH</label><input type="number" value="${m.ph}" placeholder="7.0" step="0.01" oninput="LegionellaModule.actualizarMedida(${idx},'ph',this.value)"></div>
        </div>
      </div>`).join('');
  };

  const actualizarMedida = (idx, campo, valor) => { if (medidas[idx]) medidas[idx][campo] = valor; };
  const eliminarMedida = (idx) => { medidas.splice(idx, 1); renderTablaMedias(); };

  const load = async (params={}) => {
    medidas = [];
    document.getElementById('t_fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('t_horaInicio').value = new Date().toTimeString().slice(0,5);
    const clientes = await DB.getAll('clientes');
    const selCliente = document.getElementById('t_clienteId');
    selCliente.innerHTML = '<option value="">Seleccionar cliente…</option>' + clientes.map(c=>`<option value="${c.id}">${c.nombre}${c.empresa?` – ${c.empresa}`:''}</option>`).join('');
    if (params.instalacionId) {
      const inst = await DB.getById('instalaciones', params.instalacionId);
      if (inst) { selCliente.value = inst.clienteId; await onClienteChange(inst.clienteId); document.getElementById('t_instalacionId').value = inst.id; }
    }
    if (params.tratamientoId) await cargarTratamiento(params.tratamientoId);
    renderTablaMedias();
    FotosModule.render('fotos_container');
    GPSModule.renderWidget('gps_container');
    setTimeout(() => {
      FirmaModule.crear('firma_tecnico', 'Firma del técnico aplicador');
      FirmaModule.crear('firma_responsable', 'Firma del responsable técnico');
      FirmaModule.crear('firma_cliente', 'Firma del titular/responsable instalación');
    }, 300);
    const tecnico = await DB.getConfig('tecnico_nombre');
    if (tecnico) document.getElementById('t_tecnico').value = tecnico;
  };

  const onClienteChange = async (clienteId) => {
    const sel = document.getElementById('t_instalacionId');
    if (!clienteId) { sel.innerHTML = '<option value="">Primero selecciona cliente</option>'; return; }
    const instalaciones = await DB.getAll('instalaciones','clienteId',parseInt(clienteId));
    sel.innerHTML = '<option value="">Seleccionar instalación…</option>' + instalaciones.map(i=>`<option value="${i.id}">${i.nombre||i.tipo}${i.volumen?` (${i.volumen}L)`:''}</option>`).join('');
  };

  const onProductoChange = () => {
    document.getElementById('t_producto_custom_row').style.display = document.getElementById('t_producto').value === 'custom' ? 'block' : 'none';
  };

  const ahora = (id) => { document.getElementById(id).value = new Date().toTimeString().slice(0,5); };

  const iniciarCronometro = () => {
    if (timerInterval) return;
    const start = Date.now() - _timerSeconds * 1000;
    timerInterval = setInterval(() => {
      _timerSeconds = Math.floor((Date.now()-start)/1000);
      const h=String(Math.floor(_timerSeconds/3600)).padStart(2,'0');
      const m=String(Math.floor((_timerSeconds%3600)/60)).padStart(2,'0');
      const s=String(_timerSeconds%60).padStart(2,'0');
      const el=document.getElementById('cronometro_display');
      if (el) el.textContent=`${h}:${m}:${s}`;
    },1000);
    ahora('t_horaInicio');
  };

  const pararCronometro = () => { clearInterval(timerInterval); timerInterval=null; ahora('t_horaFin'); };
  const resetCronometro = () => { clearInterval(timerInterval); timerInterval=null; _timerSeconds=0; const el=document.getElementById('cronometro_display'); if(el) el.textContent='00:00:00'; };

  const calcularCoste = () => {
    const h=parseFloat(document.getElementById('t_horas').value)||0;
    const ph=parseFloat(document.getElementById('t_precioHora').value)||0;
    const km=parseFloat(document.getElementById('t_km').value)||0;
    const pkm=parseFloat(document.getElementById('t_precioKm').value)||0;
    const mg=parseFloat(document.getElementById('t_margen').value)||0;
    const prod=parseFloat(document.getElementById('t_costeProducto').value)||0;
    const mo=h*ph, desp=km*pkm, sub=mo+desp+prod, margenE=sub*(mg/100), total=sub+margenE;
    const el=document.getElementById('coste_resumen');
    if (el && (h||km||prod)) el.innerHTML=`
      <div class="coste-fila"><span>Mano de obra</span><strong>${mo.toFixed(2)} €</strong></div>
      <div class="coste-fila"><span>Desplazamiento</span><strong>${desp.toFixed(2)} €</strong></div>
      <div class="coste-fila"><span>Producto</span><strong>${prod.toFixed(2)} €</strong></div>
      <div class="coste-fila"><span>Margen (${mg}%)</span><strong>${margenE.toFixed(2)} €</strong></div>
      <div class="coste-fila total"><span>TOTAL</span><strong>${total.toFixed(2)} €</strong></div>`;
  };

  const cargarTratamiento = async (id) => {
    const t = await DB.getById('tratamientos', id);
    if (!t) return;
    currentTratamiento = t;
    const campos = ['fecha','horaInicio','horaFin','temperatura','phInicial','phFinal','cloroLibreInicial','cloroLibreFinal','cloroCombinado','lote','cantidad','costeProducto','horas','km','margen','observaciones','tecnico','tecnicoDni','tecnicoTitulacion','responsable','responsableDni','responsableTitulacion','circuito','tiempoRecirculacion','concentracionChoque','productoRegistro','productoSecundario','partesInstalacion','fechaNotificacion'];
    campos.forEach(f=>{const el=document.getElementById(`t_${f}`);if(el&&t[f]!==undefined&&t[f]!==null)el.value=t[f];});
    ['producto','normativa','motivo','estadoConservacion','notificada','planoHidraulico','paradaInstalacion','vaciado','limpiezaPrevia','limpiezaDepositos'].forEach(f=>{const el=document.getElementById(`t_${f}`);if(el&&t[f])el.value=t[f];});
    if (t.medidas) { medidas = t.medidas; renderTablaMedias(); }
    if (t.fotos) FotosModule.cargarFotos(t.fotos);
  };

  const recogerDatos = () => {
    const pv = document.getElementById('t_producto').value;
    return {
      clienteId: parseInt(document.getElementById('t_clienteId').value)||null,
      instalacionId: parseInt(document.getElementById('t_instalacionId').value)||null,
      fecha: document.getElementById('t_fecha').value,
      horaInicio: document.getElementById('t_horaInicio').value,
      horaFin: document.getElementById('t_horaFin').value,
      duracionSegundos: _timerSeconds,
      tecnico: document.getElementById('t_tecnico').value.trim(),
      tecnicoDni: document.getElementById('t_tecnicoDni').value.trim(),
      tecnicoTitulacion: document.getElementById('t_tecnicoTitulacion').value.trim(),
      responsable: document.getElementById('t_responsable').value.trim(),
      responsableDni: document.getElementById('t_responsableDni').value.trim(),
      responsableTitulacion: document.getElementById('t_responsableTitulacion').value.trim(),
      tipo: document.getElementById('t_motivo').value,
      motivo: document.getElementById('t_motivo').value,
      normativa: document.getElementById('t_normativa').value,
      circuito: document.getElementById('t_circuito').value.trim(),
      tiempoRecirculacion: document.getElementById('t_tiempoRecirculacion').value.trim(),
      concentracionChoque: document.getElementById('t_concentracionChoque').value.trim(),
      estadoConservacion: document.getElementById('t_estadoConservacion').value,
      notificada: document.getElementById('t_notificada').value,
      fechaNotificacion: document.getElementById('t_fechaNotificacion').value,
      planoHidraulico: document.getElementById('t_planoHidraulico').value,
      paradaInstalacion: document.getElementById('t_paradaInstalacion').value,
      vaciado: document.getElementById('t_vaciado').value,
      limpiezaPrevia: document.getElementById('t_limpiezaPrevia').value,
      limpiezaDepositos: document.getElementById('t_limpiezaDepositos').value,
      temperatura: parseFloat(document.getElementById('t_temperatura').value)||null,
      phInicial: parseFloat(document.getElementById('t_phInicial').value)||null,
      phFinal: parseFloat(document.getElementById('t_phFinal').value)||null,
      cloroLibreInicial: parseFloat(document.getElementById('t_cloroLibreInicial').value)||null,
      cloroLibreFinal: parseFloat(document.getElementById('t_cloroLibreFinal').value)||null,
      cloroCombinado: parseFloat(document.getElementById('t_cloroCombinado').value)||null,
      producto: pv==='custom' ? document.getElementById('t_productoCustom').value : pv,
      productoRegistro: document.getElementById('t_productoRegistro').value.trim(),
      productoSecundario: document.getElementById('t_productoSecundario').value.trim(),
      lote: document.getElementById('t_lote').value.trim(),
      caducidad: document.getElementById('t_caducidad').value,
      cantidad: parseFloat(document.getElementById('t_cantidad').value)||null,
      cantidadUnidad: document.getElementById('t_cantidadUnidad').value,
      costeProducto: parseFloat(document.getElementById('t_costeProducto').value)||0,
      horas: parseFloat(document.getElementById('t_horas').value)||0,
      precioHora: parseFloat(document.getElementById('t_precioHora').value)||0,
      km: parseFloat(document.getElementById('t_km').value)||0,
      precioKm: parseFloat(document.getElementById('t_precioKm').value)||0,
      margen: parseFloat(document.getElementById('t_margen').value)||0,
      partesInstalacion: document.getElementById('t_partesInstalacion').value.trim(),
      observaciones: document.getElementById('t_observaciones').value.trim(),
      medidas: [...medidas],
      fotos: FotosModule.obtenerFotos(),
      firmaTecnico: FirmaModule.obtenerImagen('firma_tecnico'),
      firmaResponsable: FirmaModule.obtenerImagen('firma_responsable'),
      firmaCliente: FirmaModule.obtenerImagen('firma_cliente'),
      gps: GPSModule.getLastPosition(),
    };
  };

  const guardar = async (generarCert) => {
    const datos = recogerDatos();
    if (!datos.clienteId||!datos.instalacionId) { App.toast('Selecciona cliente e instalación','error'); return; }
    if (!datos.fecha) { App.toast('Indica la fecha del tratamiento','error'); return; }
    let id;
    if (currentTratamiento) { await DB.update('tratamientos',{...datos,id:currentTratamiento.id}); id=currentTratamiento.id; App.toast('Tratamiento actualizado','success'); }
    else { id = await DB.add('tratamientos',datos); App.toast('Tratamiento guardado','success'); }
    if (generarCert) await PDFModule.generarCertificado(id);
    else App.navigate('historial');
    App.refreshDashboard();
  };

  return { render, load, onClienteChange, onProductoChange, ahora, iniciarCronometro, pararCronometro, resetCronometro, calcularCoste, agregarMedida, actualizarMedida, eliminarMedida, guardar };
})();
window.LegionellaModule = LegionellaModule;
