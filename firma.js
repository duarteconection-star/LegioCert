/**
 * LegioCert Pro - Módulo de Firmas v2 (bug fix)
 */
const FirmaModule = (() => {
  const instancias = {};
  const crear = (containerId, label = 'Firma') => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="firma-widget">
        <div class="firma-header">
          <span>✍️ ${label}</span>
          <button class="btn btn-sm btn-ghost" onclick="FirmaModule.limpiar('${containerId}')">Limpiar</button>
        </div>
        <canvas id="${containerId}_canvas" class="firma-canvas"></canvas>
        <p class="firma-hint">Firma con el dedo o el ratón</p>
      </div>`;
    requestAnimationFrame(() => setTimeout(() => inicializarCanvas(containerId), 150));
  };
  const inicializarCanvas = (id) => {
    const canvas = document.getElementById(`${id}_canvas`);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width > 0 ? rect.width : 400;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0A2342';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let drawing = false;
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / r.width, sy = canvas.height / r.height;
      if (e.touches && e.touches[0]) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    };
    canvas.addEventListener('mousedown', (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    canvas.addEventListener('mouseup', () => { drawing = false; });
    canvas.addEventListener('mouseleave', () => { drawing = false; });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); drawing = false; }, { passive: false });
    instancias[id] = { canvas, ctx };
  };
  const limpiar = (id) => {
    const inst = instancias[id];
    if (!inst) { inicializarCanvas(id); return; }
    inst.ctx.fillStyle = '#FFFFFF';
    inst.ctx.fillRect(0, 0, inst.canvas.width, inst.canvas.height);
  };
  const obtenerImagen = (id) => {
    const inst = instancias[id];
    if (!inst) return null;
    return inst.canvas.toDataURL('image/png');
  };
  const tieneFirma = (id) => {
    const inst = instancias[id];
    if (!inst) return false;
    const data = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) return true;
    }
    return false;
  };
  const cargarImagen = (id, base64) => {
    if (!base64) return;
    setTimeout(() => {
      const inst = instancias[id];
      if (!inst) return;
      const img = new Image();
      img.onload = () => inst.ctx.drawImage(img, 0, 0, inst.canvas.width, inst.canvas.height);
      img.src = base64;
    }, 300);
  };
  return { crear, limpiar, obtenerImagen, tieneFirma, cargarImagen };
})();
window.FirmaModule = FirmaModule;
