/**
 * LegioCert Pro - Calculadora Profesional
 */
const CalculadoraModule = (() => {
  const render = () => `
    <div class="module-header"><h2><i class="icon">🧮</i> Calculadora Profesional</h2></div>
    <div class="calc-tabs">
      <button class="calc-tab active" onclick="CalculadoraModule.switchTab('cloro',this)">Cloro</button>
      <button class="calc-tab" onclick="CalculadoraModule.switchTab('dioxido',this)">Dióxido Cl.</button>
      <button class="calc-tab" onclick="CalculadoraModule.switchTab('conversion',this)">Conversiones</button>
      <button class="calc-tab" onclick="CalculadoraModule.switchTab('ppm',this)">ppm/mg·L</button>
    </div>
    <div id="tab-cloro" class="calc-panel active">
      <div class="calc-section">
        <h3>Parámetros del Sistema</h3>
        <div class="form-grid">
          <div class="form-group"><label>Volumen del sistema</label>
            <div class="input-with-unit">
              <input type="number" id="calc_volumen" placeholder="0" min="0" oninput="CalculadoraModule.calcularCloro()">
              <select id="calc_vol_unidad" onchange="CalculadoraModule.calcularCloro()">
                <option value="L">Litros</option><option value="m3">m³</option><option value="gal">Galones</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Concentración objetivo (ppm)</label><input type="number" id="calc_ppm_objetivo" placeholder="20" min="0" oninput="CalculadoraModule.calcularCloro()"></div>
          <div class="form-group"><label>Cloro residual actual (ppm)</label><input type="number" id="calc_cloro_actual" placeholder="0" min="0" value="0" oninput="CalculadoraModule.calcularCloro()"></div>
          <div class="form-group"><label>Producto</label>
            <select id="calc_producto" onchange="CalculadoraModule.calcularCloro()">
              <option value="CLORO_GRANULADO">Cloro granulado (65%)</option>
              <option value="HIPOCLORITO_SODICO">Hipoclorito sódico (12%)</option>
              <option value="HIPOCLORITO_20">Hipoclorito sódico (20%)</option>
              <option value="CUSTOM">Personalizado</option>
            </select>
          </div>
          <div class="form-group" id="calc_custom_conc_row" style="display:none"><label>Concentración (%)</label><input type="number" id="calc_custom_conc" placeholder="0" min="0" max="100" oninput="CalculadoraModule.calcularCloro()"></div>
        </div>
        <div class="protocol-buttons">
          <p>Protocolos rápidos:</p>
          <button class="btn btn-protocol" onclick="CalculadoraModule.setProtocol(20)">🟡 20 ppm<br><small>Mantenimiento</small></button>
          <button class="btn btn-protocol" onclick="CalculadoraModule.setProtocol(50)">🟠 50 ppm<br><small>Preventivo</small></button>
          <button class="btn btn-protocol" onclick="CalculadoraModule.setProtocol(150)">🔴 150 ppm<br><small>Choque</small></button>
        </div>
      </div>
      <div class="calc-results" id="calc_resultado_cloro"><div class="result-placeholder">Introduce los datos para calcular</div></div>
    </div>
    <div id="tab-dioxido" class="calc-panel hidden">
      <div class="calc-section">
        <h3>Dióxido de Cloro</h3>
        <div class="form-grid">
          <div class="form-group"><label>Volumen (L)</label><input type="number" id="dio_volumen" placeholder="0" oninput="CalculadoraModule.calcularDioxido()"></div>
          <div class="form-group"><label>Concentración objetivo (ppm)</label><input type="number" id="dio_ppm" placeholder="0.5" step="0.1" oninput="CalculadoraModule.calcularDioxido()"></div>
          <div class="form-group"><label>Concentración producto (%)</label><input type="number" id="dio_conc" placeholder="0.3" value="0.3" step="0.01" oninput="CalculadoraModule.calcularDioxido()"></div>
        </div>
      </div>
      <div class="calc-results" id="calc_resultado_dioxido"><div class="result-placeholder">Introduce los datos para calcular</div></div>
    </div>
    <div id="tab-conversion" class="calc-panel hidden">
      <div class="calc-section">
        <h3>Conversión de Volumen</h3>
        <div class="form-group"><label>Valor</label><input type="number" id="conv_valor" placeholder="0" oninput="CalculadoraModule.convertir()"></div>
        <div class="form-group"><label>Unidad origen</label>
          <select id="conv_desde" onchange="CalculadoraModule.convertir()">
            <option value="L">Litros (L)</option><option value="m3">Metros cúbicos (m³)</option><option value="gal">Galones (gal)</option>
          </select>
        </div>
        <div id="conv_resultado" class="conv-result-grid"></div>
      </div>
      <div class="calc-section">
        <h3>Cloro Libre / Combinado</h3>
        <div class="form-grid">
          <div class="form-group"><label>Cloro libre (ppm)</label><input type="number" id="clib" placeholder="0" step="0.01" oninput="CalculadoraModule.calcularCloroTotal()"></div>
          <div class="form-group"><label>Cloro combinado (ppm)</label><input type="number" id="ccomb" placeholder="0" step="0.01" oninput="CalculadoraModule.calcularCloroTotal()"></div>
        </div>
        <div id="cloro_total_result" class="result-box"></div>
      </div>
    </div>
    <div id="tab-ppm" class="calc-panel hidden">
      <div class="calc-section">
        <h3>Conversión ppm ↔ mg/L</h3>
        <div class="info-box">Para soluciones acuosas diluidas: <strong>1 ppm = 1 mg/L</strong></div>
        <div class="form-grid">
          <div class="form-group"><label>Valor en ppm</label><input type="number" id="ppm_valor" placeholder="0" step="0.01" oninput="CalculadoraModule.convertirPPM('ppm')"></div>
          <div class="form-group"><label>Valor en mg/L</label><input type="number" id="mgl_valor" placeholder="0" step="0.01" oninput="CalculadoraModule.convertirPPM('mgl')"></div>
        </div>
        <div id="ppm_result" class="result-box"></div>
      </div>
    </div>`;
  const load = () => {};
  const switchTab = (tab, btn) => {
    document.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.calc-panel').forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });
    btn.classList.add('active');
    const panel = document.getElementById(`tab-${tab}`);
    if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
  };
  const setProtocol = (ppm) => { document.getElementById('calc_ppm_objetivo').value = ppm; calcularCloro(); App.toast(`Protocolo ${ppm} ppm seleccionado`, 'info'); };
  const calcularCloro = () => {
    const volRaw = parseFloat(document.getElementById('calc_volumen').value)||0;
    const unidad = document.getElementById('calc_vol_unidad').value;
    const ppmObj = parseFloat(document.getElementById('calc_ppm_objetivo').value)||0;
    const ppmActual = parseFloat(document.getElementById('calc_cloro_actual').value)||0;
    const producto = document.getElementById('calc_producto').value;
    document.getElementById('calc_custom_conc_row').style.display = producto==='CUSTOM'?'block':'none';
    const resultDiv = document.getElementById('calc_resultado_cloro');
    if (!volRaw||!ppmObj) { resultDiv.innerHTML='<div class="result-placeholder">Introduce volumen y concentración objetivo</div>'; return; }
    let volLitros = volRaw;
    if (unidad==='m3') volLitros=volRaw*1000;
    if (unidad==='gal') volLitros=volRaw*CONFIG.CONVERSIONES.GAL_A_L;
    const grCl = (Math.max(0,ppmObj-ppmActual)*volLitros)/1000;
    let cant, nombre, unidadP;
    switch(producto) {
      case 'CLORO_GRANULADO': cant=grCl/0.65; nombre='Cloro granulado (65%)'; unidadP='g'; break;
      case 'HIPOCLORITO_SODICO': cant=grCl/(0.12*1.21); nombre='Hipoclorito sódico (12%)'; unidadP='mL'; break;
      case 'HIPOCLORITO_20': cant=grCl/(0.20*1.25); nombre='Hipoclorito sódico (20%)'; unidadP='mL'; break;
      case 'CUSTOM': const cc=(parseFloat(document.getElementById('calc_custom_conc').value)||0)/100; if(!cc){resultDiv.innerHTML='<div class="result-placeholder">Introduce la concentración</div>';return;} cant=grCl/cc; nombre=`Producto (${(cc*100).toFixed(1)}%)`; unidadP='g'; break;
      default: return;
    }
    const t = ppmObj>=150?{h:12,p:'Choque intensivo'}:ppmObj>=50?{h:6,p:'Preventivo'}:{h:2,p:'Mantenimiento'};
    resultDiv.innerHTML = `
      <div class="result-card primary"><div class="result-label">Cantidad de ${nombre}</div><div class="result-value">${cant.toFixed(2)} ${unidadP}</div></div>
      <div class="result-grid">
        <div class="result-card"><div class="result-label">Volumen</div><div class="result-value">${volLitros.toLocaleString('es-ES',{maximumFractionDigits:1})} L</div></div>
        <div class="result-card"><div class="result-label">Cl₂ necesario</div><div class="result-value">${grCl.toFixed(2)} g</div></div>
        <div class="result-card"><div class="result-label">Tiempo contacto</div><div class="result-value">${t.h} h</div></div>
        <div class="result-card ${ppmObj>=150?'danger':ppmObj>=50?'warning':'success'}"><div class="result-label">Protocolo</div><div class="result-value">${ppmObj} ppm</div><div class="result-sub">${t.p}</div></div>
      </div>
      <div class="calc-nota">⚠️ Verificar pH entre 6.5 y 8.0 para máxima eficacia del cloro.</div>`;
  };
  const calcularDioxido = () => {
    const vol=parseFloat(document.getElementById('dio_volumen').value)||0;
    const ppm=parseFloat(document.getElementById('dio_ppm').value)||0;
    const conc=(parseFloat(document.getElementById('dio_conc').value)||0.3)/100;
    const r=document.getElementById('calc_resultado_dioxido');
    if(!vol||!ppm){r.innerHTML='<div class="result-placeholder">Introduce los datos</div>';return;}
    r.innerHTML=`<div class="result-card primary"><div class="result-label">Dióxido de Cloro necesario</div><div class="result-value">${(ppm*vol/(conc*1000)).toFixed(2)} mL</div></div>`;
  };
  const convertir = () => {
    const v=parseFloat(document.getElementById('conv_valor').value)||0;
    const d=document.getElementById('conv_desde').value;
    let L=v; if(d==='m3') L=v*1000; else if(d==='gal') L=v*CONFIG.CONVERSIONES.GAL_A_L;
    document.getElementById('conv_resultado').innerHTML=`
      <div class="conv-row"><span>Litros:</span><strong>${L.toLocaleString('es-ES',{maximumFractionDigits:4})} L</strong></div>
      <div class="conv-row"><span>Metros cúbicos:</span><strong>${(L/1000).toFixed(6)} m³</strong></div>
      <div class="conv-row"><span>Galones (US):</span><strong>${(L*CONFIG.CONVERSIONES.L_A_GAL).toFixed(4)} gal</strong></div>`;
  };
  const calcularCloroTotal = () => {
    const l=parseFloat(document.getElementById('clib').value)||0, c=parseFloat(document.getElementById('ccomb').value)||0;
    document.getElementById('cloro_total_result').innerHTML=`
      <div class="conv-row"><span>Cloro total:</span><strong>${(l+c).toFixed(2)} ppm</strong></div>
      <div class="conv-row"><span>Cloraminas:</span>${c>0.5?'<span class="badge badge-red">⚠️ Elevado</span>':'<span class="badge badge-teal">✅ Correcto</span>'}</div>`;
  };
  const convertirPPM = (d) => {
    if(d==='ppm'){const v=parseFloat(document.getElementById('ppm_valor').value)||0;document.getElementById('mgl_valor').value=v;document.getElementById('ppm_result').innerHTML=`<div class="conv-row"><span>${v} ppm =</span><strong>${v} mg/L</strong></div>`;}
    else{const v=parseFloat(document.getElementById('mgl_valor').value)||0;document.getElementById('ppm_valor').value=v;document.getElementById('ppm_result').innerHTML=`<div class="conv-row"><span>${v} mg/L =</span><strong>${v} ppm</strong></div>`;}
  };
  return { render, load, switchTab, setProtocol, calcularCloro, calcularDioxido, convertir, calcularCloroTotal, convertirPPM };
})();
window.CalculadoraModule = CalculadoraModule;
