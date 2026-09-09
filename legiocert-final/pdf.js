/**
 * LegioCert Pro - Generador de Certificados PDF v2
 */
const PDFModule = (() => {
  const generarCertificado = async (tratamientoId) => {
    App.toast('Generando certificado…', 'info');
    const trat = await DB.getById('tratamientos', tratamientoId);
    if (!trat) { App.toast('Tratamiento no encontrado', 'error'); return; }
    const cliente = trat.clienteId ? await DB.getById('clientes', trat.clienteId) : null;
    const instalacion = trat.instalacionId ? await DB.getById('instalaciones', trat.instalacionId) : null;
    const numeroCert = await DB.nextCertNumber();
    const empresa = {
      nombre: await DB.getConfig('cfg_empresa') || CONFIG.PDF.EMPRESA,
      cif: await DB.getConfig('cfg_cif') || '',
      telefono: await DB.getConfig('cfg_telefono') || '',
      email: await DB.getConfig('cfg_email') || CONFIG.PDF.EMAIL_EMPRESA,
      direccion: await DB.getConfig('cfg_direccion') || '',
      registro: await DB.getConfig('cfg_registro') || '',
    };
    await DB.add('certificados', { tratamientoId, numero: numeroCert, fecha: new Date().toISOString(), clienteId: trat.clienteId, instalacionId: trat.instalacionId });
    const qr = generarQR(`LegioCert:${numeroCert}|${trat.fecha}|${cliente?.nombre||''}`);
    abrirVentanaPDF(buildHTML(numeroCert, trat, cliente, instalacion, qr, empresa), numeroCert);
    App.toast(`Certificado ${numeroCert} generado`, 'success');
    App.refreshDashboard();
    App.navigate('historial');
  };

  const buildHTML = (numero, trat, cliente, instalacion, qr, empresa) => {
    const fecha = trat.fecha ? new Date(trat.fecha+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'}) : '—';
    const tipoNorm = {RD487:CONFIG.NORMATIVA.RD_487,RD614:CONFIG.NORMATIVA.RD_614,UNE:CONFIG.NORMATIVA.UNE}[trat.normativa] || trat.normativa || CONFIG.NORMATIVA.RD_487;
    const tipoLabel = {mantenimiento:'Mantenimiento preventivo',desinfeccion:'Desinfección',choque:'Choque por positivo Legionella',revision:'Revisión periódica',muestreo:'Toma de muestras'}[trat.tipo] || trat.tipo || '—';
    const dur = trat.duracionSegundos ? (()=>{const h=Math.floor(trat.duracionSegundos/3600),m=Math.floor((trat.duracionSegundos%3600)/60);return h>0?`${h}h ${m}m`:`${m}m`;})() : '—';
    const fotosHTML = buildFotos(trat.fotos);
    const firmasHTML = buildFirmas(trat.firmaTecnico, trat.firmaCliente, trat.tecnico);
    const gpsHTML = trat.gps ? `<tr><td>Latitud/Longitud</td><td>${trat.gps.latitude?.toFixed(6)} / ${trat.gps.longitude?.toFixed(6)}</td></tr><tr><td>Dirección GPS</td><td>${trat.gps.direccion||'—'}</td></tr>` : '';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificado ${numero}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10.5pt;color:#1a1a2e;background:#fff}
.page{max-width:210mm;margin:0 auto;padding:14mm 16mm}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0A2342;padding-bottom:12px;margin-bottom:16px}
.logo{font-size:22pt;font-weight:900;color:#0A2342}.logo span{color:#00BCD4}
.emp-info{font-size:8pt;color:#666;margin-top:4px;line-height:1.5}
.cert-num{text-align:right}.num{font-size:14pt;font-weight:700;color:#0A2342}
.tipo-cert{font-size:8pt;color:#00BCD4;text-transform:uppercase;letter-spacing:1px}
.fecha-em{font-size:8pt;color:#666}
.titulo{background:linear-gradient(135deg,#0A2342 0%,#1565C0 100%);color:white;padding:12px 16px;border-radius:6px;margin-bottom:16px}
.titulo h1{font-size:13pt;font-weight:700}.titulo .norm{font-size:8pt;opacity:.85;margin-top:3px}
.section{margin-bottom:16px}
.section h2{font-size:9pt;font-weight:700;color:#0A2342;border-left:4px solid #00BCD4;padding-left:8px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
table{width:100%;border-collapse:collapse}
td{padding:5px 8px;border-bottom:1px solid #eef0f4;font-size:9.5pt;vertical-align:top}
td:first-child{width:40%;color:#555;font-weight:500}
tr:last-child td{border-bottom:none}
.empresa-box{background:#f0f4f8;border-radius:6px;padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:9pt}
.ea-item{display:flex;flex-direction:column}.ea-label{font-size:7pt;color:#666;text-transform:uppercase}.ea-value{font-weight:600;color:#0A2342}
.ea-full{grid-column:1/-1}
.params-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.param-box{background:#f0f4f8;border-radius:6px;padding:10px;text-align:center}
.param-ok{border-left:3px solid #26C281}.param-alert{border-left:3px solid #E74C3C}
.param-label{font-size:7pt;color:#666;text-transform:uppercase}
.param-value{font-size:16pt;font-weight:800;color:#0A2342;line-height:1.1}
.param-unit{font-size:7.5pt;color:#00BCD4}
.badge-norm{display:inline-block;background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:20px;font-size:7.5pt;font-weight:600}
.firmas-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:8px}
.firma-box{border:1px solid #dde;border-radius:6px;padding:10px;text-align:center;min-height:120px;display:flex;flex-direction:column;justify-content:space-between}
.firma-box img{max-width:100%;max-height:80px;object-fit:contain}
.firma-nombre{font-size:8pt;color:#555;margin-top:6px;font-weight:600}
.firma-linea{border-top:1px solid #ccc;margin-top:50px;padding-top:4px;font-size:7.5pt;color:#aaa}
.fotos-grupo h3{font-size:9pt;color:#555;margin:8px 0 6px}
.fotos-grid-pdf{display:flex;flex-wrap:wrap;gap:8px}
.fotos-grid-pdf img{width:90px;height:70px;object-fit:cover;border-radius:4px;border:1px solid #dde}
.texto-legal{font-size:8pt;color:#444;line-height:1.6;padding:10px 12px;background:#f0f4f8;border-radius:6px}
.footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #0A2342;margin-top:20px;padding-top:12px}
.footer .legal{font-size:7.5pt;color:#666;line-height:1.5}
.no-print{margin-top:20px;display:flex;gap:12px;justify-content:center}
.btn-p{padding:10px 24px;background:#0A2342;color:white;border:none;border-radius:8px;font-size:11pt;cursor:pointer}
.btn-c{padding:10px 24px;background:#eee;color:#333;border:none;border-radius:8px;font-size:11pt;cursor:pointer}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:10mm}.no-print{display:none!important}}
</style></head><body><div class="page">

<div class="header">
  <div>
    <div class="logo">Legio<span>Cert</span> Pro</div>
    <div class="emp-info"><strong>${empresa.nombre}</strong><br>${empresa.cif?`CIF: ${empresa.cif} · `:''}${empresa.email}<br>${empresa.telefono?`Tel: ${empresa.telefono}`:''}${empresa.registro?` · Reg: ${empresa.registro}`:''}</div>
  </div>
  <div class="cert-num">
    <div class="tipo-cert">Certificado de Tratamiento</div>
    <div class="num">${numero}</div>
    <div class="fecha-em">Emitido: ${new Date().toLocaleDateString('es-ES')}</div>
    ${qr?`<img src="${qr}" style="width:55px;height:55px;margin-top:6px">`: ''}
  </div>
</div>

<div class="titulo">
  <h1>Certificado de Desinfección y Tratamiento Antilegionella</h1>
  <div class="norm">${tipoNorm} · ${CONFIG.NORMATIVA.UNE}</div>
</div>

<div class="section">
  <h2>Empresa Aplicadora</h2>
  <div class="empresa-box">
    <div class="ea-item"><span class="ea-label">Razón social</span><span class="ea-value">${empresa.nombre||'—'}</span></div>
    <div class="ea-item"><span class="ea-label">CIF</span><span class="ea-value">${empresa.cif||'—'}</span></div>
    <div class="ea-item"><span class="ea-label">Teléfono</span><span class="ea-value">${empresa.telefono||'—'}</span></div>
    <div class="ea-item"><span class="ea-label">Email</span><span class="ea-value">${empresa.email||'—'}</span></div>
    ${empresa.registro?`<div class="ea-item ea-full"><span class="ea-label">Nº Registro Sanitario</span><span class="ea-value">${empresa.registro}</span></div>`:''}
    ${empresa.direccion?`<div class="ea-item ea-full"><span class="ea-label">Dirección</span><span class="ea-value">${empresa.direccion}</span></div>`:''}
    <div class="ea-item"><span class="ea-label">Técnico responsable</span><span class="ea-value">${trat.tecnico||'—'}</span></div>
  </div>
</div>

<div class="section">
  <h2>Datos del Cliente</h2>
  <table>
    <tr><td>Nombre / Razón social</td><td>${cliente?.nombre||'—'}${cliente?.empresa?` · ${cliente.empresa}`:''}</td></tr>
    <tr><td>CIF / NIF</td><td>${cliente?.cif||'—'}</td></tr>
    <tr><td>Dirección</td><td>${cliente?.direccion||'—'}${cliente?.provincia?` · ${cliente.provincia}`:''}</td></tr>
    <tr><td>Teléfono</td><td>${cliente?.telefono||'—'}</td></tr>
    <tr><td>Email</td><td>${cliente?.email||'—'}</td></tr>
    <tr><td>Persona de contacto</td><td>${cliente?.contacto||'—'}</td></tr>
  </table>
</div>

<div class="section">
  <h2>Datos de la Instalación</h2>
  <table>
    <tr><td>Descripción</td><td>${instalacion?.nombre||'—'}</td></tr>
    <tr><td>Tipo</td><td>${instalacion?.tipo||'—'}</td></tr>
    <tr><td>Volumen</td><td>${instalacion?.volumen?`${instalacion.volumen.toLocaleString('es-ES')} litros`:'—'}</td></tr>
    <tr><td>Material</td><td>${instalacion?.material||'—'}</td></tr>
    <tr><td>Año instalación</td><td>${instalacion?.anio||'—'}</td></tr>
    <tr><td>Ubicación</td><td>${instalacion?.ubicacion||'—'}</td></tr>
  </table>
</div>

<div class="section">
  <h2>Datos del Tratamiento</h2>
  <table>
    <tr><td>Fecha</td><td>${fecha}</td></tr>
    <tr><td>Hora inicio</td><td>${trat.horaInicio||'—'}</td></tr>
    <tr><td>Hora fin</td><td>${trat.horaFin||'—'}</td></tr>
    <tr><td>Duración</td><td>${dur}</td></tr>
    <tr><td>Tipo de actuación</td><td>${tipoLabel}</td></tr>
    <tr><td>Normativa aplicada</td><td><span class="badge-norm">${tipoNorm}</span></td></tr>
    <tr><td>Producto utilizado</td><td>${trat.producto||'—'}</td></tr>
    <tr><td>Nº Lote</td><td>${trat.lote||'—'}</td></tr>
    <tr><td>Fecha caducidad</td><td>${trat.caducidad||'—'}</td></tr>
    <tr><td>Cantidad utilizada</td><td>${trat.cantidad?`${trat.cantidad} ${trat.cantidadUnidad||''}`:'—'}</td></tr>
  </table>
</div>

<div class="section">
  <h2>Parámetros Analíticos</h2>
  <div class="params-grid">
    ${trat.temperatura!=null?`<div class="param-box ${trat.temperatura>=60?'param-ok':'param-alert'}"><div class="param-label">Temperatura</div><div class="param-value">${trat.temperatura}</div><div class="param-unit">°C ${trat.temperatura>=60?'✓':'⚠ <60°C'}</div></div>`:''}
    ${trat.phInicial!=null?`<div class="param-box"><div class="param-label">pH inicial</div><div class="param-value">${trat.phInicial}</div><div class="param-unit">—</div></div>`:''}
    ${trat.phFinal!=null?`<div class="param-box ${trat.phFinal>=6.5&&trat.phFinal<=8.0?'param-ok':'param-alert'}"><div class="param-label">pH final</div><div class="param-value">${trat.phFinal}</div><div class="param-unit">${trat.phFinal>=6.5&&trat.phFinal<=8.0?'✓ 6.5–8.0':'⚠ Fuera rango'}</div></div>`:''}
    ${trat.cloroLibreInicial!=null?`<div class="param-box"><div class="param-label">Cl libre inicial</div><div class="param-value">${trat.cloroLibreInicial}</div><div class="param-unit">ppm</div></div>`:''}
    ${trat.cloroLibreFinal!=null?`<div class="param-box ${trat.cloroLibreFinal>=0.2?'param-ok':'param-alert'}"><div class="param-label">Cl libre final</div><div class="param-value">${trat.cloroLibreFinal}</div><div class="param-unit">ppm ${trat.cloroLibreFinal>=0.2?'✓':'⚠ <0.2'}</div></div>`:''}
    ${trat.cloroCombinado!=null?`<div class="param-box ${trat.cloroCombinado<=0.5?'param-ok':'param-alert'}"><div class="param-label">Cl combinado</div><div class="param-value">${trat.cloroCombinado}</div><div class="param-unit">ppm ${trat.cloroCombinado<=0.5?'✓':'⚠ >0.5'}</div></div>`:''}
  </div>
</div>

${trat.gps?`<div class="section"><h2>Ubicación GPS</h2><table>${gpsHTML}</table></div>`:''}

${trat.observaciones?`<div class="section"><h2>Observaciones</h2><p style="padding:8px 12px;background:#f8fafc;border-radius:6px;font-size:9.5pt;line-height:1.6">${trat.observaciones}</p></div>`:''}

${fotosHTML}

<div class="section"><h2>Firmas</h2>${firmasHTML}</div>

<div class="section">
  <h2>Declaración Legal</h2>
  <div class="texto-legal">${CONFIG.TEXTOS_LEGALES.intro}<br><br>${CONFIG.TEXTOS_LEGALES.metodo}<br><br>${CONFIG.TEXTOS_LEGALES.validez}</div>
</div>

<div class="footer">
  <div class="legal"><strong>${empresa.nombre}</strong> · ${empresa.email}<br>Documento generado electrónicamente por LegioCert Pro v${CONFIG.APP_VERSION}<br>Certificado nº <strong>${numero}</strong> · ${new Date().toLocaleString('es-ES')}</div>
</div>

<div class="no-print">
  <button class="btn-p" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  <button class="btn-c" onclick="window.close()">✕ Cerrar</button>
</div>
</div></body></html>`;
  };

  const buildFotos = (fotos) => {
    if (!fotos||(!fotos.antes?.length&&!fotos.durante?.length&&!fotos.despues?.length)) return '';
    const grupos=[{key:'antes',label:'🔵 Antes'},{key:'durante',label:'🟡 Durante'},{key:'despues',label:'🟢 Después'}];
    const content=grupos.map(g=>{const imgs=fotos[g.key];if(!imgs||imgs.length===0)return '';return `<div class="fotos-grupo"><h3>${g.label}</h3><div class="fotos-grid-pdf">${imgs.map(f=>`<img src="${f.base64}" alt="foto">`).join('')}</div></div>`;}).join('');
    if(!content.trim()) return '';
    return `<div class="section"><h2>Registro Fotográfico</h2>${content}</div>`;
  };

  const buildFirmas = (firmaTecnico, firmaCliente, tecnico) => {
    const esFirmaValida = (f) => f && f.length > 100 && !f.endsWith(',');
    const fT=esFirmaValida(firmaTecnico)?`<img src="${firmaTecnico}" alt="Firma técnico">`:'<div class="firma-linea">Sin firma</div>';
    const fC=esFirmaValida(firmaCliente)?`<img src="${firmaCliente}" alt="Firma cliente">`:'<div class="firma-linea">Sin firma del cliente</div>';
    return `<div class="firmas-grid"><div class="firma-box">${fT}<div class="firma-nombre">Técnico responsable${tecnico?`<br>${tecnico}`:''}</div></div><div class="firma-box">${fC}<div class="firma-nombre">Representante del cliente</div></div></div>`;
  };

  const generarQR = (texto) => {
    const canvas=document.createElement('canvas'), s=100;
    canvas.width=s; canvas.height=s;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,s,s);
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,s,10); ctx.fillRect(0,90,s,10); ctx.fillRect(0,0,10,s); ctx.fillRect(90,0,10,s);
    let hash=0;
    for(let i=0;i<texto.length;i++){hash=((hash<<5)-hash)+texto.charCodeAt(i);hash|=0;}
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
