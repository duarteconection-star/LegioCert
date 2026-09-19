/**
 * LegioCert Pro - Generador de Certificados PDF v4
 * Soporte para múltiples instalaciones en un mismo certificado
 */
const PDFModule = (() => {
  const generarCertificado = async (tratamientoId) => {
    App.toast('Generando certificado…', 'info');
    const trat = await DB.getById('tratamientos', tratamientoId);
    if (!trat) { App.toast('Tratamiento no encontrado', 'error'); return; }
    const cliente = trat.clienteId ? await DB.getById('clientes', trat.clienteId) : null;

    // Cargar todas las instalaciones del tratamiento
    let instalaciones = [];
    if (trat.instalacionIds && Array.isArray(trat.instalacionIds) && trat.instalacionIds.length > 0) {
      for (const instId of trat.instalacionIds) {
        const inst = await DB.getById('instalaciones', instId);
        if (inst) instalaciones.push(inst);
      }
    } else if (trat.instalacionId) {
      const inst = await DB.getById('instalaciones', trat.instalacionId);
      if (inst) instalaciones.push(inst);
    }

    const numeroCert = await DB.nextCertNumber();
    const empresa = {
      nombre: await DB.getConfig('cfg_empresa') || CONFIG.PDF.EMPRESA,
      cif: await DB.getConfig('cfg_cif') || '',
      telefono: await DB.getConfig('cfg_telefono') || '',
      email: await DB.getConfig('cfg_email') || CONFIG.PDF.EMAIL_EMPRESA,
      direccion: await DB.getConfig('cfg_direccion') || '',
      registro: await DB.getConfig('cfg_registro') || '',
    };
    await DB.add('certificados', { tratamientoId, numero: numeroCert, fecha: new Date().toISOString(), clienteId: trat.clienteId });
    const qr = generarQR(`LegioCert:${numeroCert}|${trat.fecha}|${cliente?.nombre||''}`);
    abrirVentanaPDF(buildHTML(numeroCert, trat, cliente, instalaciones, qr, empresa), numeroCert);
    App.toast(`Certificado ${numeroCert} generado`, 'success');
    App.refreshDashboard();
    App.navigate('historial');
  };

  const siNo = (v) => v==='si'?'✅ Sí':v==='no'?'❌ No':v==='parcialmente'?'⚠️ Parcialmente':v||'—';

  const buildHTML = (numero, trat, cliente, instalaciones, qr, empresa) => {
    const fecha = trat.fecha ? new Date(trat.fecha+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'}) : '—';
    const tipoNorm = {RD487:CONFIG.NORMATIVA.RD_487,RD614:CONFIG.NORMATIVA.RD_614,UNE:CONFIG.NORMATIVA.UNE}[trat.normativa]||trat.normativa||CONFIG.NORMATIVA.RD_487;
    const motivoLabel = {mantenimiento:'Mantenimiento programado',aislamiento:'Aislamiento de Legionella',correctora:'Medida correctora',brote:'Brote / Caso',otro:'Otro'}[trat.motivo]||trat.motivo||'—';
    const conservLabel = {correcto:'Correcto',corrosion:'Con corrosión',incrustaciones:'Con incrustaciones / biocapa / algas',deficiente:'Deficiente'}[trat.estadoConservacion]||trat.estadoConservacion||'—';
    const dur = trat.duracionSegundos?(()=>{const h=Math.floor(trat.duracionSegundos/3600),m=Math.floor((trat.duracionSegundos%3600)/60);return h>0?`${h}h ${m}m`:`${m}m`;})():'—';
    const fotosHTML = buildFotos(trat.fotos);
    const firmasHTML = buildFirmas(trat.firmaTecnico, trat.firmaResponsable, trat.firmaCliente, trat.tecnico, trat.responsable);
    const tablaMediasHTML = buildTablaMedias(trat.medidas);
    const instalacionesHTML = buildInstalaciones(instalaciones);
    const gpsHTML = trat.gps?`<tr><td>Latitud/Longitud</td><td>${trat.gps.latitude?.toFixed(6)} / ${trat.gps.longitude?.toFixed(6)}</td></tr><tr><td>Dirección GPS</td><td>${trat.gps.direccion||'—'}</td></tr>`:'';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Certificado ${numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1a1a2e;background:#fff}
.page{max-width:210mm;margin:0 auto;padding:12mm 14mm}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0A2342;padding-bottom:10px;margin-bottom:14px}
.logo{font-size:20pt;font-weight:900;color:#0A2342}.logo span{color:#00BCD4}
.emp-info{font-size:7.5pt;color:#555;margin-top:3px;line-height:1.5}
.cert-num{text-align:right}.num{font-size:13pt;font-weight:700;color:#0A2342}
.tipo-cert{font-size:7.5pt;color:#00BCD4;text-transform:uppercase;letter-spacing:1px}
.fecha-em{font-size:7.5pt;color:#666}
.titulo{background:linear-gradient(135deg,#0A2342,#1565C0);color:white;padding:10px 14px;border-radius:6px;margin-bottom:14px}
.titulo h1{font-size:12pt;font-weight:700}.titulo .norm{font-size:7.5pt;opacity:.85;margin-top:2px}
.section{margin-bottom:14px;page-break-inside:avoid}
.section h2{font-size:8.5pt;font-weight:700;color:#0A2342;border-left:4px solid #00BCD4;padding-left:7px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px}
table{width:100%;border-collapse:collapse}
td{padding:4px 7px;border-bottom:1px solid #eef0f4;font-size:9pt;vertical-align:top}
td:first-child{width:40%;color:#555;font-weight:500}
tr:last-child td{border-bottom:none}
.empresa-box{background:#f0f4f8;border-radius:6px;padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:8.5pt}
.ea-item{display:flex;flex-direction:column}
.ea-label{font-size:6.5pt;color:#666;text-transform:uppercase}
.ea-value{font-weight:600;color:#0A2342}
.ea-full{grid-column:1/-1}
.inst-card{background:#f8fafc;border:1px solid #e0e7ef;border-radius:6px;padding:10px 12px;margin-bottom:8px}
.inst-card h3{font-size:9pt;font-weight:700;color:#0A2342;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.inst-card table td:first-child{width:38%}
.checklist{display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:9pt;margin-top:8px}
.check-item{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #f0f0f0}
.check-label{color:#555;font-weight:500;flex:1}
.params-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.param-box{background:#f0f4f8;border-radius:5px;padding:8px;text-align:center}
.param-ok{border-left:3px solid #26C281}.param-alert{border-left:3px solid #E74C3C}
.param-label{font-size:6.5pt;color:#666;text-transform:uppercase}
.param-value{font-size:14pt;font-weight:800;color:#0A2342;line-height:1.1}
.param-unit{font-size:7pt;color:#00BCD4}
.badge-norm{display:inline-block;background:#E3F2FD;color:#1565C0;padding:2px 7px;border-radius:20px;font-size:7pt;font-weight:600}
.badge-motivo{display:inline-block;padding:2px 8px;border-radius:20px;font-size:7.5pt;font-weight:600;background:#FFF3E0;color:#E65100}
.tabla-medidas{width:100%;border-collapse:collapse;font-size:8.5pt}
.tabla-medidas th{background:#0A2342;color:white;padding:5px 7px;text-align:left;font-size:7.5pt}
.tabla-medidas td{padding:4px 7px;border-bottom:1px solid #eee}
.tabla-medidas tr:nth-child(even) td{background:#f8fafc}
.firmas-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px}
.firma-box{border:1px solid #dde;border-radius:5px;padding:8px;text-align:center;min-height:100px;display:flex;flex-direction:column;justify-content:space-between}
.firma-box img{max-width:100%;max-height:65px;object-fit:contain}
.firma-nombre{font-size:7.5pt;color:#555;margin-top:4px;font-weight:600}
.firma-linea{border-top:1px solid #ccc;margin-top:40px;padding-top:3px;font-size:7pt;color:#aaa}
.fotos-grupo h3{font-size:8.5pt;color:#555;margin:7px 0 5px}
.fotos-grid-pdf{display:flex;flex-wrap:wrap;gap:7px}
.fotos-grid-pdf img{width:85px;height:65px;object-fit:cover;border-radius:3px;border:1px solid #dde}
.texto-legal{font-size:7.5pt;color:#444;line-height:1.6;padding:9px 11px;background:#f0f4f8;border-radius:5px}
.footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #0A2342;margin-top:16px;padding-top:10px}
.footer .legal{font-size:7pt;color:#666;line-height:1.5}
.no-print{margin-top:16px;display:flex;gap:12px;justify-content:center}
.btn-p{padding:10px 24px;background:#0A2342;color:white;border:none;border-radius:8px;font-size:11pt;cursor:pointer}
.btn-c{padding:10px 24px;background:#eee;color:#333;border:none;border-radius:8px;font-size:11pt;cursor:pointer}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:8mm}.no-print{display:none!important}}
</style></head><body><div class="page">

<div class="header">
  <div>
    <div class="logo">Legio<span>Cert</span> Pro</div>
    <div class="emp-info"><strong>${empresa.nombre}</strong>${empresa.cif?` · CIF: ${empresa.cif}`:''}<br>${empresa.email}${empresa.telefono?` · Tel: ${empresa.telefono}`:''}<br>${empresa.registro?`Nº Registro: ${empresa.registro}`:''}</div>
  </div>
  <div class="cert-num">
    <div class="tipo-cert">Certificado de Tratamiento</div>
    <div class="num">${numero}</div>
    <div class="fecha-em">Emitido: ${new Date().toLocaleDateString('es-ES')}</div>
    ${qr?`<img src="${qr}" style="width:50px;height:50px;margin-top:5px">`:''}
  </div>
</div>

<div class="titulo">
  <h1>Certificado de Limpieza y Desinfección Antilegionella</h1>
  <div class="norm">${tipoNorm} · ${CONFIG.NORMATIVA.UNE}</div>
</div>

<div class="section">
  <h2>Datos de la Empresa que Realiza el Tratamiento</h2>
  <div class="empresa-box">
    <div class="ea-item"><span class="ea-label">Razón social</span><span class="ea-value">${empresa.nombre||'—'}</span></div>
    <div class="ea-item"><span class="ea-label">NIF / CIF</span><span class="ea-value">${empresa.cif||'—'}</span></div>
    <div class="ea-item"><span class="ea-label">Teléfono</span><span class="ea-value">${empresa.telefono||'—'}</span></div>
    <div class="ea-item"><span class="ea-label">Email</span><span class="ea-value">${empresa.email||'—'}</span></div>
    ${empresa.registro?`<div class="ea-item ea-full"><span class="ea-label">Número de Registro</span><span class="ea-value">${empresa.registro}</span></div>`:''}
    ${empresa.direccion?`<div class="ea-item ea-full"><span class="ea-label">Domicilio</span><span class="ea-value">${empresa.direccion}</span></div>`:''}
  </div>
</div>

<div class="section">
  <h2>Responsables del Tratamiento</h2>
  <table>
    <tr><td colspan="2" style="background:#f5f5f5;font-weight:700;font-size:8.5pt;color:#0A2342">Aplicador del tratamiento</td></tr>
    <tr><td>Nombre</td><td>${trat.tecnico||'—'}</td></tr>
    <tr><td>DNI</td><td>${trat.tecnicoDni||'—'}</td></tr>
    <tr><td>Titulación / Acreditación</td><td>${trat.tecnicoTitulacion||'—'}</td></tr>
    ${trat.responsable?`
    <tr><td colspan="2" style="background:#f5f5f5;font-weight:700;font-size:8.5pt;color:#0A2342;border-top:2px solid #dde">Responsable técnico</td></tr>
    <tr><td>Nombre</td><td>${trat.responsable||'—'}</td></tr>
    <tr><td>DNI</td><td>${trat.responsableDni||'—'}</td></tr>
    <tr><td>Titulación / Acreditación</td><td>${trat.responsableTitulacion||'—'}</td></tr>`:''}
  </table>
</div>

<div class="section">
  <h2>Datos del Contratante</h2>
  <table>
    <tr><td>Nombre / Razón social</td><td>${cliente?.nombre||'—'}${cliente?.empresa?` · ${cliente.empresa}`:''}</td></tr>
    <tr><td>NIF / CIF</td><td>${cliente?.cif||'—'}</td></tr>
    <tr><td>Domicilio</td><td>${cliente?.direccion||'—'}${cliente?.provincia?` · ${cliente.provincia}`:''}</td></tr>
    <tr><td>Teléfono</td><td>${cliente?.telefono||'—'}</td></tr>
    <tr><td>Email</td><td>${cliente?.email||'—'}</td></tr>
    <tr><td>Persona de contacto</td><td>${cliente?.contacto||'—'}</td></tr>
  </table>
</div>

${instalacionesHTML}

<div class="section">
  <h2>Datos del Tratamiento</h2>
  <table>
    <tr><td>Motivo del tratamiento</td><td><span class="badge-motivo">${motivoLabel}</span></td></tr>
    <tr><td>Fecha de realización</td><td>${fecha}</td></tr>
    <tr><td>Hora inicio / Hora fin</td><td>${trat.horaInicio||'—'} / ${trat.horaFin||'—'}</td></tr>
    <tr><td>Duración del tratamiento</td><td>${dur}</td></tr>
    <tr><td>Tiempo de recirculación del biocida</td><td>${trat.tiempoRecirculacion||'—'}</td></tr>
    <tr><td>Normativa aplicada</td><td><span class="badge-norm">${tipoNorm}</span></td></tr>
    <tr><td>Concentración de choque y tiempo de contacto</td><td>${trat.concentracionChoque||'—'}</td></tr>
    ${trat.circuito?`<tr><td>Nombre del circuito</td><td>${trat.circuito}</td></tr>`:''}
  </table>
  <div class="checklist">
    <div class="check-item"><span class="check-label">Se ha parado la instalación</span><span>${siNo(trat.paradaInstalacion)}</span></div>
    <div class="check-item"><span class="check-label">Se ha vaciado previamente</span><span>${siNo(trat.vaciado)}</span></div>
    <div class="check-item"><span class="check-label">Se ha limpiado antes de añadir el biocida</span><span>${siNo(trat.limpiezaPrevia)}</span></div>
    <div class="check-item"><span class="check-label">Se han limpiado los depósitos acumuladores</span><span>${siNo(trat.limpiezaDepositos)}</span></div>
  </div>
</div>

<div class="section">
  <h2>Productos Utilizados</h2>
  <table>
    <tr><td>Biocida principal</td><td>${trat.producto||'—'}${trat.productoRegistro?` · Nº Registro: ${trat.productoRegistro}`:''}</td></tr>
    ${trat.productoSecundario?`<tr><td>Producto secundario</td><td>${trat.productoSecundario}</td></tr>`:''}
    <tr><td>Nº Lote</td><td>${trat.lote||'—'}</td></tr>
    <tr><td>Fecha caducidad</td><td>${trat.caducidad||'—'}</td></tr>
    <tr><td>Cantidad utilizada</td><td>${trat.cantidad?`${trat.cantidad} ${trat.cantidadUnidad||''}`:'—'}</td></tr>
  </table>
</div>

${trat.partesInstalacion?`<div class="section"><h2>Partes donde se Realiza el Tratamiento</h2><p style="padding:8px 10px;background:#f8fafc;border-radius:5px;font-size:9pt;line-height:1.6">${trat.partesInstalacion}</p></div>`:''}

<div class="section">
  <h2>Parámetros Analíticos</h2>
  <div class="params-grid">
    ${trat.temperatura!=null?`<div class="param-box ${trat.temperatura>=60?'param-ok':'param-alert'}"><div class="param-label">Temperatura</div><div class="param-value">${trat.temperatura}</div><div class="param-unit">°C ${trat.temperatura>=60?'✓':'⚠'}</div></div>`:''}
    ${trat.phInicial!=null?`<div class="param-box"><div class="param-label">pH inicial</div><div class="param-value">${trat.phInicial}</div><div class="param-unit">—</div></div>`:''}
    ${trat.phFinal!=null?`<div class="param-box ${trat.phFinal>=6.5&&trat.phFinal<=8.0?'param-ok':'param-alert'}"><div class="param-label">pH final</div><div class="param-value">${trat.phFinal}</div><div class="param-unit">${trat.phFinal>=6.5&&trat.phFinal<=8.0?'✓ 6.5–8.0':'⚠ Fuera rango'}</div></div>`:''}
    ${trat.cloroLibreInicial!=null?`<div class="param-box"><div class="param-label">Cl libre inicial</div><div class="param-value">${trat.cloroLibreInicial}</div><div class="param-unit">ppm</div></div>`:''}
    ${trat.cloroLibreFinal!=null?`<div class="param-box ${trat.cloroLibreFinal>=0.2?'param-ok':'param-alert'}"><div class="param-label">Cl libre final</div><div class="param-value">${trat.cloroLibreFinal}</div><div class="param-unit">ppm ${trat.cloroLibreFinal>=0.2?'✓':'⚠'}</div></div>`:''}
    ${trat.cloroCombinado!=null?`<div class="param-box ${trat.cloroCombinado<=0.5?'param-ok':'param-alert'}"><div class="param-label">Cl combinado</div><div class="param-value">${trat.cloroCombinado}</div><div class="param-unit">ppm ${trat.cloroCombinado<=0.5?'✓':'⚠'}</div></div>`:''}
  </div>
</div>

${tablaMediasHTML}

${trat.gps?`<div class="section"><h2>Ubicación GPS</h2><table>${gpsHTML}</table></div>`:''}

${trat.observaciones?`<div class="section"><h2>Observaciones</h2><p style="padding:8px 10px;background:#f8fafc;border-radius:5px;font-size:9pt;line-height:1.6">${trat.observaciones}</p></div>`:''}

${fotosHTML}

<div class="section"><h2>Responsables y Firmas</h2>${firmasHTML}</div>

<div class="section">
  <h2>Declaración Legal</h2>
  <div class="texto-legal">${CONFIG.TEXTOS_LEGALES.intro}<br><br>${CONFIG.TEXTOS_LEGALES.metodo}<br><br>${CONFIG.TEXTOS_LEGALES.validez}</div>
</div>

<div class="footer">
  <div class="legal"><strong>${empresa.nombre}</strong> · ${empresa.email}<br>Documento generado por LegioCert Pro v${CONFIG.APP_VERSION}<br>Certificado nº <strong>${numero}</strong> · ${new Date().toLocaleString('es-ES')}</div>
</div>

<div class="no-print">
  <button class="btn-p" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <button class="btn-c" onclick="window.close()">✕ Cerrar</button>
</div>
</div></body></html>`;
  };

  const buildInstalaciones = (instalaciones) => {
    if (!instalaciones || instalaciones.length === 0) return '';
    const iconos = {'ACS':'🚿','AFCH':'💧','Depósito':'🪣','Piscina':'🏊','SPA':'♨️','Torre':'🏗️','Humectador':'💨','Fuente':'⛲'};
    return `
      <div class="section">
        <h2>Instalaciones Tratadas (${instalaciones.length})</h2>
        ${instalaciones.map((inst, idx) => {
          const iconKey = Object.keys(iconos).find(k=>(inst.tipo||'').includes(k));
          const icono = iconKey ? iconos[iconKey] : '🏢';
          return `
          <div class="inst-card">
            <h3>${icono} ${inst.nombre || inst.tipo || 'Instalación'} ${instalaciones.length > 1 ? `<span style="font-size:8pt;color:#888;font-weight:400">(${idx+1} de ${instalaciones.length})</span>` : ''}</h3>
            <table>
              <tr><td>Tipo</td><td>${inst.tipo||'—'}</td></tr>
              <tr><td>Volumen</td><td>${inst.volumen?`${inst.volumen.toLocaleString('es-ES')} litros`:'—'}</td></tr>
              <tr><td>Material</td><td>${inst.material||'—'}</td></tr>
              <tr><td>Año instalación</td><td>${inst.anio||'—'}</td></tr>
              <tr><td>Ubicación</td><td>${inst.ubicacion||'—'}</td></tr>
              ${inst.observaciones?`<tr><td>Observaciones</td><td>${inst.observaciones}</td></tr>`:''}
            </table>
          </div>`;
        }).join('')}
      </div>`;
  };

  const buildTablaMedias = (medidas) => {
    if (!medidas || medidas.length === 0) return '';
    return `
      <div class="section">
        <h2>Anexo I — Medidas de Temperatura y Concentración de Desinfectante</h2>
        <table class="tabla-medidas">
          <thead><tr><th>Nº</th><th>Fecha</th><th>Hora</th><th>Elemento</th><th>Ubicación</th><th>Biocida (ppm)</th><th>Tª (°C)</th><th>pH</th></tr></thead>
          <tbody>${medidas.map((m,i)=>`<tr><td>${i+1}</td><td>${m.fecha||'—'}</td><td>${m.hora||'—'}</td><td>${m.elemento||'—'}</td><td>${m.ubicacion||'—'}</td><td>${m.biocida||'—'}</td><td>${m.temperatura||'—'}</td><td>${m.ph||'—'}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  };

  const buildFotos = (fotos) => {
    if (!fotos||(!fotos.antes?.length&&!fotos.durante?.length&&!fotos.despues?.length)) return '';
    const grupos=[{key:'antes',label:'🔵 Antes'},{key:'durante',label:'🟡 Durante'},{key:'despues',label:'🟢 Después'}];
    const content=grupos.map(g=>{const imgs=fotos[g.key];if(!imgs||imgs.length===0)return '';return `<div class="fotos-grupo"><h3>${g.label}</h3><div class="fotos-grid-pdf">${imgs.map(f=>`<img src="${f.base64}" alt="foto">`).join('')}</div></div>`;}).join('');
    if(!content.trim()) return '';
    return `<div class="section"><h2>Registro Fotográfico</h2>${content}</div>`;
  };

  const buildFirmas = (firmaTecnico, firmaResponsable, firmaCliente, tecnico, responsable) => {
    const esFirmaValida = (f) => f && f.length > 100 && !f.endsWith(',');
    const mkFirma = (firma, nombre, label) => `
      <div class="firma-box">
        ${esFirmaValida(firma)?`<img src="${firma}" alt="firma">`:'<div class="firma-linea">&nbsp;</div>'}
        <div>
          <div class="firma-nombre">${label}</div>
          ${nombre?`<div class="firma-nombre" style="font-weight:400">Fdo. ${nombre}</div>`:''}
        </div>
      </div>`;
    return `<div class="firmas-grid">
      ${mkFirma(firmaTecnico, tecnico, 'Técnico aplicador')}
      ${mkFirma(firmaResponsable, responsable, 'Responsable técnico')}
      ${mkFirma(firmaCliente, '', 'Titular / Responsable instalación')}
    </div>`;
  };

  const generarQR = (texto) => {
    const canvas=document.createElement('canvas'),s=100;canvas.width=s;canvas.height=s;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,s,s);ctx.fillStyle='#000';
    ctx.fillRect(0,0,s,10);ctx.fillRect(0,90,s,10);ctx.fillRect(0,0,10,s);ctx.fillRect(90,0,10,s);
    let hash=0;for(let i=0;i<texto.length;i++){hash=((hash<<5)-hash)+texto.charCodeAt(i);hash|=0;}
    for(let x=2;x<9;x++) for(let y=2;y<9;y++) if((hash+x*7+y*13)%3!==0) ctx.fillRect(x*10,y*10,9,9);
    return canvas.toDataURL('image/png');
  };

  const abrirVentanaPDF = (html, numero) => {
    const win=window.open('',`cert_${numero}`,'width=900,height=700,scrollbars=yes');
    if(win){win.document.write(html);win.document.close();}
    else{const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.target='_blank';a.download=`${numero}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);}
  };

  return { generarCertificado };
})();
window.PDFModule = PDFModule;
