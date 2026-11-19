const STORAGE_KEY = 'inventario_lab_v1';
let inventarioActual = [];
let appIniciada = false;

// Inicialización del ciclo de vida de Cordova con respaldo para navegador
document.addEventListener('deviceready', () => iniciarAplicacion('En línea'), false);
document.addEventListener('DOMContentLoaded', () => {
    if (!window.cordova) {
        iniciarAplicacion('En línea');
    }
});

async function iniciarAplicacion(textoEstado) {
    if (appIniciada) return;
    appIniciada = true;

    const badge = document.getElementById('estado-dispositivo');
    badge.textContent = textoEstado;
    badge.classList.add('ready');

    configurarNavegacion();
    configurarEventosInventario();
    configurarFormulario();
    configurarEventosAPI();

    await cargarDatosIniciales();
}

function configurarNavegacion() {
    const botonesTab = document.querySelectorAll('.tab-btn');
    const vistas = document.querySelectorAll('.vista');

    botonesTab.forEach(boton => {
        boton.addEventListener('click', () => {
            const idDestino = boton.getAttribute('data-target');

            botonesTab.forEach(b => b.classList.remove('active'));
            vistas.forEach(v => v.classList.remove('active'));

            boton.classList.add('active');
            document.getElementById(idDestino).classList.add('active');
        });
    });
}

async function cargarDatosIniciales() {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
        inventarioActual = JSON.parse(guardado);
        renderizarInventario(inventarioActual);
    } else {
        await restaurarInventarioBase();
    }
}

async function restaurarInventarioBase() {
    try {
        const respuesta = await fetch('data/productos_prueba.json');
        inventarioActual = await respuesta.json();
        guardarEnStorage();
        renderizarInventario(inventarioActual);
        mostrarMensajeLista('Inventario restablecido.', 'info');
    } catch (error) {
        console.error('Error cargando inventario inicial:', error);
        inventarioActual = [];
        renderizarInventario(inventarioActual);
    }
}

function guardarEnStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventarioActual));
}

function renderizarInventario(lista) {
    const contenedor = document.getElementById('lista-inventario');
    const contador = document.getElementById('contador-items');
    contador.textContent = inventarioActual.length;

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                No se encontraron equipos con ese criterio.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = lista.map(item => `
        <article class="item-card">
            <div class="item-info">
                <span class="tag-cat">${escaparHTML(item.categoria)}</span>
                <h3>${escaparHTML(item.nombre)}</h3>
                <div class="item-meta">
                    <span>📍 ${escaparHTML(item.ubicacion)}</span>
                </div>
            </div>
            <div class="item-actions">
                <span class="stock-badge">Cant: ${item.cantidad}</span>
                <button class="btn-delete" data-id="${item.id}">Eliminar</button>
            </div>
        </article>
    `).join('');

    contenedor.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            eliminarProducto(Number(btn.getAttribute('data-id')));
        });
    });
}

function eliminarProducto(id) {
    inventarioActual = inventarioActual.filter(item => item.id !== id);
    guardarEnStorage();
    renderizarInventario(inventarioActual);
    mostrarMensajeLista('Equipo eliminado.', 'info');
}

function configurarEventosInventario() {
    const inputBuscar = document.getElementById('input-buscar');
    inputBuscar.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const filtrados = inventarioActual.filter(item =>
            item.nombre.toLowerCase().includes(termino) ||
            item.categoria.toLowerCase().includes(termino) ||
            item.ubicacion.toLowerCase().includes(termino)
        );
        renderizarInventario(filtrados);
    });

    document.getElementById('btn-recargar-semilla').addEventListener('click', () => {
        inputBuscar.value = '';
        restaurarInventarioBase();
    });
}

// Validación de campos y registro en el almacenamiento local
function configurarFormulario() {
    const formulario = document.getElementById('form-producto');

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        limpiarErroresFormulario();

        const nombre = document.getElementById('nombre').value.trim();
        const categoria = document.getElementById('categoria').value.trim();
        const cantidadStr = document.getElementById('cantidad').value.trim();
        const ubicacion = document.getElementById('ubicacion').value.trim();

        let esValido = true;

        if (nombre.length < 3) {
            marcarErrorCampo('nombre', 'Ingresa un nombre válido (mínimo 3 letras).');
            esValido = false;
        }

        if (!categoria) {
            marcarErrorCampo('categoria', 'Selecciona una categoría.');
            esValido = false;
        }

        const cantidad = Number(cantidadStr);
        if (!cantidadStr || isNaN(cantidad) || cantidad < 1 || !Number.isInteger(cantidad)) {
            marcarErrorCampo('cantidad', 'Ingresa un número entero mayor a 0.');
            esValido = false;
        }

        if (ubicacion.length < 3) {
            marcarErrorCampo('ubicacion', 'Indica la ubicación física (mínimo 3 letras).');
            esValido = false;
        }

        if (!esValido) {
            mostrarAlertaFormulario('Revisa los campos marcados en rojo.', 'error');
            return;
        }

        inventarioActual.unshift({
            id: Date.now(),
            nombre,
            categoria,
            cantidad,
            ubicacion
        });

        guardarEnStorage();
        renderizarInventario(inventarioActual);

        formulario.reset();
        mostrarAlertaFormulario(`"${nombre}" se guardó correctamente.`, 'success');
    });

    document.getElementById('btn-limpiar').addEventListener('click', limpiarErroresFormulario);
}

function marcarErrorCampo(idCampo, mensaje) {
    const input = document.getElementById(idCampo);
    const smallError = document.getElementById(`error-${idCampo}`);
    if (input) input.classList.add('input-error');
    if (smallError) smallError.textContent = mensaje;
}

function limpiarErroresFormulario() {
    document.querySelectorAll('.input-control').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.getElementById('alerta-formulario').className = 'alert hidden';
}

function mostrarAlertaFormulario(texto, tipo) {
    const alerta = document.getElementById('alerta-formulario');
    alerta.textContent = texto;
    alerta.className = `alert ${tipo}`;
}

function mostrarMensajeLista(texto, tipo) {
    const alerta = document.getElementById('mensaje-lista');
    alerta.textContent = texto;
    alerta.className = `alert ${tipo}`;
    setTimeout(() => {
        alerta.className = 'alert hidden';
    }, 3000);
}

function configurarEventosAPI() {
    document.getElementById('btn-cargar-api').addEventListener('click', consultarProveedores);
}

// Consumo del servicio REST para cargar el directorio de proveedores
async function consultarProveedores() {
    const urlInput = document.getElementById('url-endpoint').value.trim();
    const estadoApi = document.getElementById('estado-api');
    const contenedorApi = document.getElementById('lista-api');

    if (!urlInput) {
        estadoApi.textContent = 'Ingresa una dirección de servidor válida.';
        estadoApi.className = 'alert error';
        return;
    }

    estadoApi.textContent = 'Cargando proveedores...';
    estadoApi.className = 'alert info';
    contenedorApi.innerHTML = '';

    try {
        const respuesta = await fetch(urlInput);
        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        const listaElementos = Array.isArray(datos) ? datos : (datos.results || [datos]);

        estadoApi.textContent = `Se cargaron ${listaElementos.length} proveedores.`;
        estadoApi.className = 'alert success';

        contenedorApi.innerHTML = listaElementos.slice(0, 8).map(item => {
            const titulo = item.nombre || item.name || item.title || `Proveedor #${item.id || ''}`;
            const sub1 = item.categoria || item.email || item.username || 'Sin contacto';
            const sub2 = item.ubicacion || (item.company ? item.company.name : '') || item.phone || '';

            return `
                <article class="item-card">
                    <div class="item-info">
                        <span class="tag-cat">Proveedor</span>
                        <h3>${escaparHTML(String(titulo))}</h3>
                        <div class="item-meta">
                            <span>📧 ${escaparHTML(String(sub1))}</span>
                            ${sub2 ? `<span>🏢 ${escaparHTML(String(sub2))}</span>` : ''}
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    } catch (error) {
        estadoApi.textContent = `No se pudo conectar con el servidor: ${error.message}`;
        estadoApi.className = 'alert error';
    }
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}
