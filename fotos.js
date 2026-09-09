/**
 * LegioCert Pro - Módulo de Fotografías
 */
const FotosModule = (() => {
  const fotos = { antes: [], durante: [], despues: [] };
  const MAX_FOTOS = 5, MAX_SIZE_PX = 1200, JPEG_QUALITY = 0.82;
  const render = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="fotos-widget">
        <h4>📸 Fotografías del Tratamiento</h4>
        ${['antes','durante','despues'].map((tipo, i) => {
          const titulos = ['Antes del tratamiento', 'Durante el tratamiento', 'Después del tratamiento'];
          const emojis = ['🔵','🟡','🟢'];
          return `<div class="fotos-seccion">
            <div class="fotos-seccion-header">
              <span>${emojis[i]} ${titulos[i]}</span>
              <label class="btn btn-sm btn-ghost fotos-upload-btn">📷 Añadir foto
                <input type="file" accept="image/*" capture="environment" multiple onchange="FotosModule.agregarFotos('${tipo}', this.files)" style="display:none">
              </label>
            </div>
            <div id="fotos_${tipo}" class="fotos-grid"></div>
          </div>`;
        }).join('')}
      </div>`;
  };
  const agregarFotos = async (tipo, files) => {
    if (!files || files.length === 0) return;
    if ((fotos[tipo]||[]).length + files.length > MAX_FOTOS) { App.toast(`Máximo ${MAX_FOTOS} fotos`, 'warning'); return; }
    for (const file of Array.from(files)) {
      try { fotos[tipo].push({ base64: await comprimirFoto(file), nombre: file.name, timestamp: Date.now() }); }
      catch(e) { App.toast('Error al procesar foto', 'error'); }
    }
    renderizarSeccion(tipo);
  };
  const comprimirFoto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_SIZE_PX || height > MAX_SIZE_PX) { const r = Math.min(MAX_SIZE_PX/width, MAX_SIZE_PX/height); width = Math.round(width*r); height = Math.round(height*r); }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject; img.src = e.target.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
  const renderizarSeccion = (tipo) => {
    const grid = document.getElementById(`fotos_${tipo}`);
    if (!grid) return;
    if (fotos[tipo].length === 0) { grid.innerHTML = '<p class="fotos-vacio">Sin fotos</p>'; return; }
    grid.innerHTML = fotos[tipo].map((foto, idx) => `
      <div class="foto-thumb" onclick="FotosModule.verFoto('${tipo}', ${idx})">
        <img src="${foto.base64}" alt="Foto" loading="lazy">
        <button class="foto-eliminar" onclick="event.stopPropagation();FotosModule.eliminarFoto('${tipo}',${idx})">✕</button>
      </div>`).join('');
  };
  const eliminarFoto = (tipo, idx) => { fotos[tipo].splice(idx, 1); renderizarSeccion(tipo); };
  const verFoto = (tipo, idx) => {
    const foto = fotos[tipo][idx];
    if (!foto) return;
    const overlay = document.createElement('div');
    overlay.className = 'foto-viewer';
    overlay.innerHTML = `<div class="foto-viewer-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="foto-viewer-content"><img src="${foto.base64}" alt="Foto">
      <button class="foto-viewer-close" onclick="this.closest('.foto-viewer').remove()">✕</button></div>`;
    document.body.appendChild(overlay);
  };
  const cargarFotos = (f) => {
    fotos.antes = f?.antes||[]; fotos.durante = f?.durante||[]; fotos.despues = f?.despues||[];
    ['antes','durante','despues'].forEach(t => renderizarSeccion(t));
  };
  const limpiar = () => { fotos.antes=[]; fotos.durante=[]; fotos.despues=[]; ['antes','durante','despues'].forEach(t => renderizarSeccion(t)); };
  const obtenerFotos = () => ({ ...fotos });
  return { render, agregarFotos, eliminarFoto, verFoto, cargarFotos, limpiar, obtenerFotos };
})();
window.FotosModule = FotosModule;
