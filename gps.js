/**
 * LegioCert Pro - Módulo GPS
 */
const GPSModule = (() => {
  let lastPosition = null;
  const obtenerPosicion = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocalización no disponible')); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const timestamp = new Date().toISOString();
        let direccion = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        try { direccion = await geocodificarInverso(latitude, longitude); } catch(e) {}
        lastPosition = { latitude, longitude, accuracy, timestamp, direccion };
        resolve(lastPosition);
      },
      (err) => {
        const msgs = { 1: 'Permiso denegado', 2: 'Posición no disponible', 3: 'Tiempo agotado' };
        reject(new Error(msgs[err.code] || 'Error GPS'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
  const geocodificarInverso = async (lat, lon) => {
    const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`, { headers: { 'User-Agent': 'LegioCertPro/2.0' } });
    if (!resp.ok) throw new Error('Sin respuesta');
    const data = await resp.json();
    return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };
  const renderWidget = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="gps-widget">
        <div class="gps-header">
          <span>📍 Ubicación GPS</span>
          <button class="btn btn-sm btn-primary" onclick="GPSModule.capturar('${containerId}')">Obtener ubicación</button>
        </div>
        <div id="${containerId}_result" class="gps-result hidden">
          <div class="gps-coords"></div>
          <div class="gps-address"></div>
          <div class="gps-time"></div>
        </div>
      </div>`;
  };
  const capturar = async (containerId) => {
    const btn = document.querySelector(`#${containerId} button`);
    if (btn) { btn.textContent = '⏳ Obteniendo…'; btn.disabled = true; }
    try {
      const pos = await obtenerPosicion();
      const resultDiv = document.getElementById(`${containerId}_result`);
      if (resultDiv) {
        resultDiv.classList.remove('hidden');
        resultDiv.querySelector('.gps-coords').textContent = `Lat: ${pos.latitude.toFixed(6)} · Lon: ${pos.longitude.toFixed(6)} (±${pos.accuracy.toFixed(0)}m)`;
        resultDiv.querySelector('.gps-address').textContent = pos.direccion;
        resultDiv.querySelector('.gps-time').textContent = `Capturado: ${new Date(pos.timestamp).toLocaleString('es-ES')}`;
      }
      if (btn) { btn.textContent = '✅ Actualizar'; btn.disabled = false; }
      return pos;
    } catch(e) {
      if (btn) { btn.textContent = '❌ Reintentar'; btn.disabled = false; }
      App.toast(e.message, 'error');
      return null;
    }
  };
  const getLastPosition = () => lastPosition;
  return { obtenerPosicion, renderWidget, capturar, getLastPosition };
})();
window.GPSModule = GPSModule;
