/**
 * LegioCert Pro - Dashboard
 */
const DashboardModule = (() => {
  const render = () => `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>Panel de Control</h2>
        <span id="dashboard_fecha" class="dashboard-date"></span>
      </div>
      <div id="dashboard_stats" class="stats-grid"></div>
      <div class="charts-row">
        <div class="chart-card"><h3>Tratamientos por tipo</h3><canvas id="chart_tipos" height="180"></canvas></div>
        <div class="chart-card"><h3>Actividad mensual</h3><canvas id="chart_mensual" height="180"></canvas></div>
      </div>
      <div id="dashboard_proximas" class="proximas-section"></div>
      <div id="dashboard_recientes" class="recientes-section"></div>
    </div>`;

  const load = async () => {
    const el = document.getElementById('dashboard_fecha');
    if (el) el.textContent = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    const [clientes,instalaciones,tratamientos,certificados,productos] = await Promise.all([
      DB.getAll('clientes'),DB.getAll('instalaciones'),DB.getAll('tratamientos'),DB.getAll('certificados'),DB.getAll('productos'),
    ]);
    const agenda = await DB.getAll('agenda');
    const hoy = new Date().toISOString().split('T')[0];
    const proximas = agenda.filter(a=>a.fecha>=hoy).slice(0,5);
    let facturacion=0, costes=0;
    tratamientos.forEach(t=>{const sub=(t.horas||0)*(t.precioHora||0)+(t.km||0)*(t.precioKm||0)+(t.costeProducto||0);costes+=sub;facturacion+=sub*(1+(t.margen||0)/100);});
    const stats = document.getElementById('dashboard_stats');
    if (stats) stats.innerHTML = `
      <div class="stat-card blue" onclick="App.navigate('clientes')"><div class="stat-icon">👥</div><div class="stat-value">${clientes.length}</div><div class="stat-label">Clientes</div></div>
      <div class="stat-card teal" onclick="App.navigate('instalaciones')"><div class="stat-icon">🏢</div><div class="stat-value">${instalaciones.length}</div><div class="stat-label">Instalaciones</div></div>
      <div class="stat-card green" onclick="App.navigate('historial')"><div class="stat-icon">🧪</div><div class="stat-value">${tratamientos.length}</div><div class="stat-label">Tratamientos</div></div>
      <div class="stat-card orange" onclick="App.navigate('historial')"><div class="stat-icon">📄</div><div class="stat-value">${certificados.length}</div><div class="stat-label">Certificados</div></div>
      <div class="stat-card purple" onclick="App.navigate('agenda')"><div class="stat-icon">📅</div><div class="stat-value">${proximas.length}</div><div class="stat-label">Próx. revisiones</div></div>
      <div class="stat-card emerald"><div class="stat-icon">💶</div><div class="stat-value">${facturacion.toFixed(0)}€</div><div class="stat-label">Facturación est.</div></div>
      <div class="stat-card red"><div class="stat-icon">💸</div><div class="stat-value">${costes.toFixed(0)}€</div><div class="stat-label">Costes</div></div>
      <div class="stat-card gray" onclick="App.navigate('productos')"><div class="stat-icon">🧴</div><div class="stat-value">${productos.length}</div><div class="stat-label">Productos</div></div>`;
    setTimeout(() => { renderChartTipos(tratamientos); renderChartMensual(tratamientos); }, 150);
    renderProximas(proximas, clientes);
    renderRecientes(tratamientos.slice(-5).reverse(), clientes);
  };

  const renderChartTipos = (tratamientos) => {
    const canvas = document.getElementById('chart_tipos');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const tipos={};
    tratamientos.forEach(t=>{tipos[t.tipo||'otro']=(tipos[t.tipo||'otro']||0)+1;});
    const labels=Object.keys(tipos), values=Object.values(tipos);
    const colores=['#1565C0','#00BCD4','#26C281','#F39C12','#E74C3C','#9B59B6'];
    canvas.width = canvas.offsetWidth||300;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (labels.length===0){ctx.fillStyle='#8A9BBB';ctx.font='12px Arial';ctx.textAlign='center';ctx.fillText('Sin datos',canvas.width/2,canvas.height/2);return;}
    const pad=30,cW=canvas.width-pad*2,cH=canvas.height-pad*2,bW=Math.floor(cW/labels.length)-6,maxV=Math.max(...values);
    labels.forEach((label,i)=>{
      const bH=maxV>0?(values[i]/maxV)*cH:0,x=pad+i*(bW+6),y=pad+cH-bH;
      ctx.fillStyle=colores[i%colores.length];
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,bW,bH,[4,4,0,0]);else ctx.rect(x,y,bW,bH);ctx.fill();
      ctx.fillStyle='#E8EDF4';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText(values[i],x+bW/2,y-4);
      ctx.fillStyle='#8A9BBB';ctx.font='9px Arial';ctx.fillText(label.slice(0,8),x+bW/2,canvas.height-6);
    });
  };

  const renderChartMensual = (tratamientos) => {
    const canvas = document.getElementById('chart_mensual');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const now=new Date(), meses=[], counts=[];
    for (let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;meses.push(d.toLocaleDateString('es-ES',{month:'short'}));counts.push(tratamientos.filter(t=>t.fecha&&t.fecha.startsWith(key)).length);}
    canvas.width=canvas.offsetWidth||300;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pad=30,cW=canvas.width-pad*2,cH=canvas.height-pad*2,maxV=Math.max(...counts,1),step=cW/(meses.length-1);
    const pts=meses.map((_,i)=>({x:pad+i*step,y:pad+cH-(counts[i]/maxV)*cH}));
    ctx.beginPath();ctx.strokeStyle='#1565C0';ctx.lineWidth=2.5;ctx.lineJoin='round';
    pts.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}); ctx.stroke();
    ctx.beginPath();ctx.moveTo(pts[0].x,pad+cH);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,pad+cH);ctx.closePath();ctx.fillStyle='rgba(21,101,192,0.12)';ctx.fill();
    pts.forEach((p,i)=>{ctx.fillStyle='#1565C0';ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();if(counts[i]>0){ctx.fillStyle='#E8EDF4';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(counts[i],p.x,p.y-8);}ctx.fillStyle='#8A9BBB';ctx.font='9px Arial';ctx.fillText(meses[i],p.x,canvas.height-4);});
  };

  const renderProximas = (proximas, clientes) => {
    const el=document.getElementById('dashboard_proximas');
    if (!el) return;
    const cm={};clientes.forEach(c=>{cm[c.id]=c;});
    el.innerHTML=`<h3 class="section-subtitle">📅 Próximas revisiones</h3>
      ${proximas.length===0?'<p class="text-muted">No hay revisiones programadas</p>':proximas.map(a=>`<div class="proxima-item"><span class="proxima-fecha">${a.fecha}</span><span class="proxima-desc">${a.descripcion||'Revisión'}</span><span class="proxima-cliente">${cm[a.clienteId]?.nombre||'—'}</span></div>`).join('')}
      <button class="btn btn-sm btn-ghost" onclick="App.navigate('agenda')" style="margin-top:8px">Ver agenda →</button>`;
  };

  const renderRecientes = (tratamientos, clientes) => {
    const el=document.getElementById('dashboard_recientes');
    if (!el) return;
    const cm={};clientes.forEach(c=>{cm[c.id]=c;});
    el.innerHTML=`<h3 class="section-subtitle">🕐 Tratamientos recientes</h3>
      ${tratamientos.length===0?'<p class="text-muted">Sin actividad reciente</p>':tratamientos.map(t=>`<div class="reciente-item" onclick="App.navigate('historial')"><span class="reciente-fecha">${t.fecha||'—'}</span><span class="reciente-cliente">${cm[t.clienteId]?.nombre||'—'}</span><span class="badge badge-${t.tipo==='choque'?'red':t.tipo==='desinfeccion'?'orange':'blue'}">${t.tipo||'—'}</span></div>`).join('')}
      <button class="btn btn-sm btn-ghost" onclick="App.navigate('historial')" style="margin-top:8px">Ver historial →</button>`;
  };

  return { render, load };
})();
window.DashboardModule = DashboardModule;
