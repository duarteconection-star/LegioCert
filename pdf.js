// ==============================================================================
// LEGIOCERT PRO - MÓDULO DE GENERACIÓN Y VISUALIZACIÓN DE CERTIFICADOS PDF
// Compatible con WebIntoApp (Android APK), iOS, PWA y Navegadores de Escritorio
// ==============================================================================

const PDFModule = {
  // 1. Genera la estructura HTML del certificado con estilos integrados
  generarHTML: function(datos) {
    const d = datos || {};
    const cliente = d.cliente || {};
    const instalacion = d.instalacion || {};
    const productos = d.productos || [];
    const firma = d.firma || '';
    const numeroCert = d.numero || d.id || 'N/A';
    const fecha = d.fecha ? new Date(d.fecha).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');

    let filasProductos = '';
    if (productos.length > 0) {
      filasProductos = productos.map(p => `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd;">${p.nombre || '-'}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${p.numRegistro || '-'}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${p.dosis || '-'}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${p.materiaActiva || '-'}</td>
        </tr>
      `).join('');
    } else {
      filasProductos = `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #777;">No se registraron productos en este tratamiento.</td></tr>`;
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificado ${numeroCert} - LegioCert</title>
        <style>
          * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
          body { margin: 0; padding: 20px; color: #333; background: #fff; font-size: 13px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0A2342; padding-bottom: 12px; margin-bottom: 15px; }
          .logo { font-size: 22px; font-weight: bold; color: #0A2342; }
          .logo span { color: #00BCD4; }
          .title { font-size: 15px; font-weight: bold; text-align: right; color: #0A2342; text-transform: uppercase; }
          .section { margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #fdfdfd; }
          .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #0A2342; border-bottom: 1px solid #00BCD4; padding-bottom: 4px; margin-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 12px; }
          th { background: #0A2342; color: #fff; padding: 6px; text-align: left; font-size: 11px; text-transform: uppercase; }
          .firma-container { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .firma-box { text-align: center; border-top: 1px solid #ccc; width: 220px; padding-top: 5px; }
          .firma-img { max-width: 180px; max-height: 70px; object-fit: contain; display: block; margin: 0 auto 5px auto; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Legio<span>Cert</span> Pro</div>
          <div class="title">Certificado de Tratamiento<br><small style="font-size: 11px; color: #555;">Nº: ${numeroCert}</small></div>
        </div>

        <div class="section">
          <div class="section-title">1. DATOS DEL CLIENTE Y FECHA</div>
          <div class="grid">
            <div><strong>Cliente:</strong> ${cliente.nombre || 'N/A'}</div>
            <div><strong>CIF/NIF:</strong> ${cliente.cif || 'N/A'}</div>
            <div><strong>Dirección:</strong> ${cliente.direccion || 'N/A'}</div>
            <div><strong>Fecha de Servicio:</strong> ${fecha}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. DATOS DE LA INSTALACIÓN</div>
          <div class="grid">
            <div><strong>Instalación:</strong> ${instalacion.nombre || 'N/A'}</div>
            <div><strong>Tipo:</strong> ${instalacion.tipo || 'N/A'}</div>
            <div><strong>Ubicación:</strong> ${instalacion.ubicacion || 'N/A'}</div>
            <div><strong>Volumen Aprox.:</strong> ${instalacion.volumen ? instalacion.volumen + ' m³' : 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. PRODUCTOS UTILIZADOS</div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Nº Registro</th>
                <th>Dosis / Conc.</th>
                <th>Materia Activa</th>
              </tr>
            </thead>
            <tbody>
              ${filasProductos}
            </tbody>
          </table>
        </div>

        <div class="firma-container">
          <div>
            <p style="font-size: 10px; color: #666; max-width: 280px;">
              Certificado expedido en conformidad con la normativa vigente de prevención y control de la Legionelosis (RD 486/1997 y anexos sanitarios aplicables).
            </p>
          </div>
          <div class="firma-box">
            ${firma ? `<img class="firma-img" src="${firma}" alt="Firma Digital">` : '<div style="height: 50px;"></div>'}
            <strong>Firma del Técnico / Cliente</strong>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

// 2. Función principal que reemplaza a la antigua 'descargarHTML'
// Muestra el certificado en un visor iframe dentro de un modal
const descargarHTML = (html, numero) => {
  try {
    // Si la función recibe un objeto con los datos en lugar de texto HTML directamente:
    let contenidoHTML = html;
    if (typeof html === 'object') {
      contenidoHTML = PDFModule.generarHTML(html);
      numero = html.numero || html.id || numero;
    }

    // Limpiar modales previos si existieran
    let modalExistente = document.getElementById('legiocert-preview-modal');
    if (modalExistente) modalExistente.remove();

    // Crear el contenedor modal
    const modal = document.createElement('div');
    modal.id = 'legiocert-preview-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0, 0, 0, 0.85); display: flex;
      flex-direction: column; justify-content: center; align-items: center;
      padding: 10px; box-sizing: border-box;
    `;

    // Estructura interna del modal con barra superior interactiva
    modal.innerHTML = `
      <div style="width: 100%; height: 100%; max-width: 900px; display: flex; flex-direction: column; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="padding: 10px 16px; background: #0A2342; color: #fff; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif;">
          <span style="font-weight: bold; font-size: 14px;">Vista Previa - ${numero ? 'Cert. ' + numero : 'Certificado'}</span>
          <div style="display: flex; gap: 8px;">
            <button id="btn-imprimir-cert" style="background: #00BCD4; color: white; border: none; padding: 7px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">🖨️ Imprimir / PDF</button>
            <button id="btn-cerrar-cert" style="background: #E74C3C; color: white; border: none; padding: 7px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">✕ Cerrar</button>
          </div>
        </div>
        <iframe id="iframe-certificado" style="width: 100%; height: 100%; border: none; background: #fff;"></iframe>
      </div>
    `;

    document.body.appendChild(modal);

    // Inyectar el HTML dentro del iframe
    const iframe = document.getElementById('iframe-certificado');
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(contenidoHTML);
    doc.close();

    // Asignar los eventos a los botones
    document.getElementById('btn-cerrar-cert').onclick = () => modal.remove();
    document.getElementById('btn-imprimir-cert').onclick = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Usa la opción de guardar pantalla o impresión de tu teléfono', 'warning');
        }
      }
    };

    if (typeof App !== 'undefined' && App.toast) {
      App.toast('Certificado listo para visualizar e imprimir', 'success', 3000);
    }
  } catch (e) {
    console.error('Error al generar la vista previa del certificado:', e);
    if (typeof App !== 'undefined' && App.toast) {
      App.toast('Error al abrir la vista previa', 'error');
    }
  }
};

// 3. Exposición global para mantener compatibilidad con app.js
window.descargarHTML = descargarHTML;
window.abrirVentanaPDF = descargarHTML;
window.PDFModule = PDFModule;
