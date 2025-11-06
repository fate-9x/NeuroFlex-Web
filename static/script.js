// Variables globales
let fechaSeleccionada = null;
let sesionSeleccionada = null;

// Función para cargar las fechas disponibles
async function cargarFechas() {
    const loadingElement = document.getElementById('loading-fechas');
    const fechasContainer = document.getElementById('fechas-container');
    const errorElement = document.getElementById('error-fechas');
    
    // Mostrar loading
    loadingElement.style.display = 'block';
    fechasContainer.style.display = 'none';
    errorElement.style.display = 'none';
    
    try {
        const response = await fetch('/api/fechas');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ocultar loading
        loadingElement.style.display = 'none';
        
        if (data.success && data.fechas && data.fechas.length > 0) {
            mostrarFechas(data.fechas);
            fechasContainer.style.display = 'block';
        } else {
            throw new Error(data.error || 'No se encontraron fechas disponibles');
        }
        
    } catch (error) {
        console.error('Error al cargar fechas:', error);
        
        // Mostrar error
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }
}

// Función para mostrar las fechas en la interfaz
function mostrarFechas(fechas) {
    const fechasContainer = document.getElementById('fechas-container');
    
    fechasContainer.innerHTML = '';
    
    fechas.forEach(fecha => {
        const fechaElement = document.createElement('button');
        fechaElement.className = 'fecha-item fade-in';
        fechaElement.textContent = formatearFecha(fecha);
        fechaElement.onclick = () => seleccionarFecha(fecha);
        
        fechasContainer.appendChild(fechaElement);
    });
}

// Función para seleccionar una fecha
function seleccionarFecha(fecha) {
    // Remover selección anterior
    const fechasAnteriores = document.querySelectorAll('.fecha-item.seleccionada');
    fechasAnteriores.forEach(item => item.classList.remove('seleccionada'));
    
    // Marcar nueva fecha como seleccionada
    const fechaElement = event.target;
    fechaElement.classList.add('seleccionada');
    
    // Guardar fecha seleccionada
    fechaSeleccionada = fecha;
    
    // Mostrar sección de datos
    const datosSection = document.getElementById('datos-section');
    datosSection.style.display = 'block';
    
    // Actualizar fecha mostrada
    document.getElementById('fecha-actual').textContent = formatearFecha(fecha);
    
    // Cargar datos de la fecha
    cargarDatosFecha(fecha);
}

// Función para cargar datos de una fecha específica
async function cargarDatosFecha(fecha) {
    const loadingElement = document.getElementById('loading-datos');
    const datosContainer = document.getElementById('datos-container');
    const errorElement = document.getElementById('error-datos');
    
    // Mostrar loading
    loadingElement.style.display = 'block';
    datosContainer.style.display = 'none';
    errorElement.style.display = 'none';
    
    try {
        const response = await fetch(`/api/datos/${fecha}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ocultar loading
        loadingElement.style.display = 'none';
        
        if (data.success && data.sessions && data.sessions.length > 0) {
            mostrarSesiones(data.sessions, data.total_sessions);
            datosContainer.style.display = 'block';
        } else {
            throw new Error(data.error || 'No se encontraron sesiones para esta fecha');
        }
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        
        // Mostrar error
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }
}

// Función para mostrar las sesiones en la interfaz
function mostrarSesiones(sessions, totalSessions) {
    const datosContainer = document.getElementById('datos-container');
    
    // Limpiar contenido previo para evitar acumulación entre selecciones de fecha
    datosContainer.innerHTML = '';
    
    // Agregar información del total de sesiones
    const totalInfo = document.createElement('div');
    totalInfo.className = 'total-sessions-info';
    totalInfo.innerHTML = `<h3>Total de Sesiones: ${totalSessions}</h3>`;
    datosContainer.appendChild(totalInfo);
    
    sessions.forEach((session, index) => {
        const sessionElement = document.createElement('div');
        sessionElement.className = 'session-item fade-in';
        sessionElement.style.animationDelay = `${index * 0.1}s`;
        
        // Formatear timestamp
        const timestamp = new Date(session.timestamp);
        const formattedTime = timestamp.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Extraer datos de la sesión
        const data = session.data;
        
        // Verificar si tiene datos del paciente
        const hasPatientData = session.patient_info;
        const patientStatus = hasPatientData ? 
            `<span style="color: #48bb78; font-weight: bold;">Con datos del paciente</span>` : 
            `<span style="color: #e53e3e; font-weight: bold;">Sin datos del paciente</span>`;
        
        sessionElement.innerHTML = `
            <div class="session-header">
                <span class="session-id">Sesión: ${session.session_id.substring(0, 8)}...</span>
                <span class="session-timestamp">${formattedTime}</span>
            </div>
            <div class="session-data">
                <div class="data-grid">
                    <div class="data-item">
                        <span class="data-label">Precisión:</span>
                        <span class="data-value precision">${data.Precision}%</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Tiempo Activo:</span>
                        <span class="data-value">${formatearTiempo(data.TiempoActivoTarea)}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Aciertos Totales:</span>
                        <span class="data-value">${data.CantAciertasTotales}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Objetos Correctos:</span>
                        <span class="data-value">${data.ObjetosInteractuadosCorrectamente}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Tiempo Tutorial:</span>
                        <span class="data-value">${formatearTiempo(data.TiempoTutorial)}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Tipo Escena:</span>
                        <span class="data-value">${data.TipoEscena}</span>
                    </div>
                </div>
                <div class="response-times">
                    <h4>Tiempos de Respuesta</h4>
                    <div class="response-grid">
                        <div class="response-item">
                            <span>Pararse:</span>
                            <span>${formatearTiempo(data.TiempoRespuestaPararse)}</span>
                        </div>
                        <div class="response-item">
                            <span>Pregunta 1:</span>
                            <span>${formatearTiempo(data.TiempoRespuestaPregunta1)}</span>
                        </div>
                        <div class="response-item">
                            <span>Pregunta 2:</span>
                            <span>${formatearTiempo(data.TiempoRespuestaPregunta2)}</span>
                        </div>
                        <div class="response-item">
                            <span>Pregunta 3:</span>
                            <span>${formatearTiempo(data.TiempoRespuestaPregunta3)}</span>
                        </div>
                        <div class="response-item">
                            <span>Capturar Número:</span>
                            <span>${formatearTiempo(data.TiempoCapturarNumero)}</span>
                        </div>
                    </div>
                </div>
                ${hasPatientData ? `
                <div class="cognitive-status" id="cognitive-status-${session.session_id}">
                    <h4>Estado Cognitivo</h4>
                    <div class="cognitive-loading" style="color: #718096; font-style: italic;">
                        Calculando predicción...
                    </div>
                </div>
                ` : ''}
                <div class="session-actions">
                    <div class="patient-status">${patientStatus}</div>
                    <button class="btn-primary" onclick="seleccionarSesion('${session.session_id}')" data-session-id="${session.session_id}">
                        ${hasPatientData ? 'Ver/Editar Paciente' : 'Agregar Datos del Paciente'}
                    </button>
                </div>
            </div>
        `;
        
        datosContainer.appendChild(sessionElement);
        
        // Si tiene datos del paciente, obtener predicción del estado cognitivo
        if (hasPatientData) {
            obtenerPrediccionEstadoCognitivo(session);
        }
    });
}

// Función para obtener predicción del estado cognitivo
async function obtenerPrediccionEstadoCognitivo(session) {
    try {
        const response = await fetch('/api/predecir-estado-cognitivo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_data: session,
                patient_info: session.patient_info
            })
        });
        
        const data = await response.json();
        
        const cognitiveStatusElement = document.getElementById(`cognitive-status-${session.session_id}`);
        if (!cognitiveStatusElement) return;
        
        if (data.success && data.prediccion) {
            const prediccion = data.prediccion;
            let estadoHTML = '';
            
            // Si el modelo devuelve 'resultado' (Alto/Bajo), usar ese formato
            if (prediccion.resultado !== undefined) {
                // Modelo binario: 'Alto' o 'Bajo'
                const resultado = prediccion.resultado;
                const esAlto = resultado === 'Alto' || prediccion.valor === 1;
                const color = esAlto ? '#48bb78' : '#e53e3e'; // Verde para 'Alto', Rojo para 'Bajo'
                
                estadoHTML = `
                    <div class="cognitive-result">
                        <div class="cognitive-class" style="font-size: 1.3em; font-weight: bold; color: ${color};">
                            ${resultado}
                        </div>
                        ${prediccion.probabilidades ? `
                        <div class="cognitive-confidence" style="font-size: 0.9em; color: #718096; margin-top: 5px;">
                            Probabilidad: ${(prediccion.probabilidades[prediccion.valor] * 100).toFixed(1)}%
                        </div>
                        ` : ''}
                    </div>
                `;
            } else if (prediccion.clase !== undefined) {
                // Modelo con clases (clasificación)
                const clases = ['Normal', 'Leve', 'Moderado', 'Severo'];
                const claseTexto = clases[prediccion.clase] || `Clase ${prediccion.clase}`;
                const confianza = prediccion.probabilidades ? 
                    (Math.max(...prediccion.probabilidades) * 100).toFixed(1) : 'N/A';
                
                estadoHTML = `
                    <div class="cognitive-result">
                        <div class="cognitive-class" style="font-size: 1.2em; font-weight: bold; color: #3182ce;">
                            ${claseTexto}
                        </div>
                        ${prediccion.probabilidades ? `
                        <div class="cognitive-confidence" style="font-size: 0.9em; color: #718096; margin-top: 5px;">
                            Confianza: ${confianza}%
                        </div>
                        ` : ''}
                    </div>
                `;
            } else if (prediccion.valor !== undefined && prediccion.valor !== null) {
                // Modelo con valor numérico (0 o 1 para binario)
                const valor = parseInt(prediccion.valor);
                
                // Si es 0 o 1, tratar como binario
                if (valor === 0 || valor === 1) {
                    const resultado = valor === 1 ? 'Alto' : 'Bajo';
                    const color = valor === 1 ? '#48bb78' : '#e53e3e'; // Verde para 'Alto', Rojo para 'Bajo'
                    
                    estadoHTML = `
                        <div class="cognitive-result">
                            <div class="cognitive-class" style="font-size: 1.3em; font-weight: bold; color: ${color};">
                                ${resultado}
                            </div>
                            ${prediccion.probabilidades ? `
                            <div class="cognitive-confidence" style="font-size: 0.9em; color: #718096; margin-top: 5px;">
                                Probabilidad: ${(prediccion.probabilidades[valor] * 100).toFixed(1)}%
                            </div>
                            ` : ''}
                        </div>
                    `;
                } else {
                    // Valor numérico continuo (regresión o score)
                    let color = '#48bb78';
                    let estado = 'Normal';
                    
                    if (valor < 0.3) {
                        color = '#48bb78';
                        estado = 'Normal';
                    } else if (valor < 0.6) {
                        color = '#ed8936';
                        estado = 'Leve';
                    } else if (valor < 0.8) {
                        color = '#e53e3e';
                        estado = 'Moderado';
                    } else {
                        color = '#c53030';
                        estado = 'Severo';
                    }
                    
                    estadoHTML = `
                        <div class="cognitive-result">
                            <div class="cognitive-class" style="font-size: 1.2em; font-weight: bold; color: ${color};">
                                ${estado}
                            </div>
                            <div class="cognitive-value" style="font-size: 0.9em; color: #718096; margin-top: 5px;">
                                Score: ${valor.toFixed(3)}
                            </div>
                        </div>
                    `;
                }
            } else {
                estadoHTML = `
                    <div class="cognitive-result" style="color: #e53e3e;">
                        Error: Formato de predicción no reconocido
                    </div>
                `;
            }
            
            cognitiveStatusElement.innerHTML = `
                <h4>Estado Cognitivo</h4>
                ${estadoHTML}
            `;
        } else {
            cognitiveStatusElement.innerHTML = `
                <h4>Estado Cognitivo</h4>
                <div class="cognitive-error" style="color: #e53e3e; font-style: italic;">
                    ${data.error || 'Error al obtener predicción'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al obtener predicción del estado cognitivo:', error);
        const cognitiveStatusElement = document.getElementById(`cognitive-status-${session.session_id}`);
        if (cognitiveStatusElement) {
            cognitiveStatusElement.innerHTML = `
                <h4>Estado Cognitivo</h4>
                <div class="cognitive-error" style="color: #e53e3e; font-style: italic;">
                    Error al calcular predicción
                </div>
            `;
        }
    }
}

// Función para formatear fechas de manera más legible
function formatearFecha(fecha) {
    // Evitar desfase de un día por interpretación UTC de 'YYYY-MM-DD'
    // Si viene en formato fecha-only (YYYY-MM-DD), construir Date en zona local
    let fechaObj;
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [y, m, d] = fecha.split('-').map(Number);
        fechaObj = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
        fechaObj = new Date(fecha);
    }
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    
    return fechaObj.toLocaleDateString('es-ES', opciones);
}

// Función para formatear tiempo en segundos a minutos, segundos y milisegundos
function formatearTiempo(segundos) {
    if (typeof segundos !== 'number' || isNaN(segundos)) {
        return '0s';
    }
    
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);
    const milisegundos = Math.round((segundos % 1) * 1000);
    
    if (minutos > 0) {
        if (milisegundos > 0) {
            return `${minutos} min ${segundosRestantes}s ${milisegundos}ms`;
        } else {
            return `${minutos} min ${segundosRestantes}s`;
        }
    } else if (segundosRestantes > 0) {
        if (milisegundos > 0) {
            return `${segundosRestantes}s ${milisegundos}ms`;
        } else {
            return `${segundosRestantes}s`;
        }
    } else {
        return `${milisegundos}ms`;
    }
}

// Función para manejar errores de red
function manejarErrorRed(error) {
    console.error('Error de red:', error);
    
    // Mostrar mensaje de error genérico
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.innerHTML = `
        <p>Error de conexión. Verifica tu conexión a internet e intenta nuevamente.</p>
        <button onclick="location.reload()">Recargar página</button>
    `;
    
    document.body.appendChild(errorElement);
}

// Función para seleccionar una sesión y mostrar datos del paciente
function seleccionarSesion(sessionId) {
    // Buscar los datos de la sesión desde la interfaz
    const sessionElements = document.querySelectorAll('.session-item');
    let sessionData = null;
    let hasPatientData = false;
    
    sessionElements.forEach(element => {
        const button = element.querySelector(`button[data-session-id="${sessionId}"]`);
        if (button) {
            // Extraer los datos de la sesión desde el HTML
            const sessionContainer = element;
            const sessionIdElement = sessionContainer.querySelector('.session-id');
            const timestampElement = sessionContainer.querySelector('.session-timestamp');
            
            // Verificar si ya tiene datos del paciente
            const patientStatus = sessionContainer.querySelector('.patient-status');
            hasPatientData = patientStatus && patientStatus.textContent.includes('Con datos del paciente');
            
            // Reconstruir los datos básicos de la sesión
            sessionData = {
                session_id: sessionId,
                timestamp: timestampElement ? timestampElement.textContent : '',
                patient_info: null // Se determinará si existe o no
            };
        }
    });
    
    if (sessionData) {
        sesionSeleccionada = sessionData;
        
        // Mostrar sección del paciente
        const pacienteSection = document.getElementById('paciente-section');
        pacienteSection.style.display = 'block';
        
        if (hasPatientData) {
            // Si ya tiene datos, obtenerlos del servidor primero
            obtenerDatosSesionCompleta(sessionId);
        } else {
            // Si no tiene datos, mostrar formulario directamente
            mostrarDatosPaciente(null);
        }
        
        // Scroll a la sección del paciente
        pacienteSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Función para obtener los datos completos de una sesión
async function obtenerDatosSesionCompleta(sessionId) {
    // Mostrar indicador de carga
    mostrarIndicadorCarga();
    
    try {
        const response = await fetch(`/api/datos/${fechaSeleccionada}`);
        const data = await response.json();
        
        if (data.success) {
            const session = data.sessions.find(s => s.session_id === sessionId);
            if (session) {
                sesionSeleccionada = session;
                
                // Ocultar indicador de carga
                ocultarIndicadorCarga();
                
                // Mostrar datos del paciente
                mostrarDatosPaciente(session.patient_info);
            }
        } else {
            ocultarIndicadorCarga();
            mostrarMensaje('Error al cargar los datos de la sesión', 'error');
        }
    } catch (error) {
        console.error('Error al obtener datos de la sesión:', error);
        ocultarIndicadorCarga();
        mostrarMensaje('Error al cargar los datos de la sesión', 'error');
    }
}

// Función para mostrar indicador de carga
function mostrarIndicadorCarga() {
    const pacienteInfo = document.getElementById('paciente-info');
    const pacienteForm = document.getElementById('paciente-form');
    const pacienteActions = document.getElementById('paciente-actions');
    
    // Ocultar todo
    pacienteInfo.style.display = 'none';
    pacienteForm.style.display = 'none';
    pacienteActions.style.display = 'none';
    
    // Mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'paciente-loading';
    loadingIndicator.className = 'loading';
    loadingIndicator.innerHTML = '<p>Cargando datos del paciente...</p>';
    
    const pacienteSection = document.getElementById('paciente-section');
    pacienteSection.appendChild(loadingIndicator);
}

// Función para ocultar indicador de carga
function ocultarIndicadorCarga() {
    const loadingIndicator = document.getElementById('paciente-loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Función para mostrar los datos del paciente
function mostrarDatosPaciente(patientInfo) {
    // Ocultar indicador de carga si está presente
    ocultarIndicadorCarga();
    
    const pacienteInfo = document.getElementById('paciente-info');
    const pacienteForm = document.getElementById('paciente-form');
    const pacienteActions = document.getElementById('paciente-actions');
    
    if (patientInfo) {
        // Mostrar datos existentes
        pacienteInfo.innerHTML = `
            <h3>Información del Paciente</h3>
            <div class="paciente-details">
                <div class="paciente-detail">
                    <div class="paciente-detail-label">Nombre:</div>
                    <div class="paciente-detail-value">${patientInfo.name}</div>
                </div>
                <div class="paciente-detail">
                    <div class="paciente-detail-label">Edad:</div>
                    <div class="paciente-detail-value">${patientInfo.age} años</div>
                </div>
                <div class="paciente-detail">
                    <div class="paciente-detail-label">RUT:</div>
                    <div class="paciente-detail-value rut">${patientInfo.rut}</div>
                </div>
                <div class="paciente-detail">
                    <div class="paciente-detail-label">Mano Predominante:</div>
                    <div class="paciente-detail-value mano">${patientInfo.dominant_hand}</div>
                </div>
                <div class="paciente-detail">
                    <div class="paciente-detail-label">Última Actualización:</div>
                    <div class="paciente-detail-value updated">${formatearFechaActualizacion(patientInfo.updated_at)}</div>
                </div>
            </div>
        `;
        
        pacienteInfo.style.display = 'block';
        pacienteForm.style.display = 'none';
        pacienteActions.style.display = 'block';
    } else {
        // No hay datos del paciente, mostrar formulario
        mostrarFormularioPaciente();
    }
}

// Función para mostrar el formulario del paciente
function mostrarFormularioPaciente() {
    // Ocultar indicador de carga si está presente
    ocultarIndicadorCarga();
    
    const pacienteInfo = document.getElementById('paciente-info');
    const pacienteForm = document.getElementById('paciente-form');
    const pacienteActions = document.getElementById('paciente-actions');
    
    pacienteInfo.style.display = 'none';
    pacienteForm.style.display = 'block';
    pacienteActions.style.display = 'none';
    
    // Limpiar formulario
    document.getElementById('form-paciente').reset();
}

// Función para editar datos del paciente
function editarPaciente() {
    const patientInfo = sesionSeleccionada.patient_info;
    
    // Llenar formulario con datos existentes
    document.getElementById('nombre').value = patientInfo.name;
    document.getElementById('edad').value = patientInfo.age;
    document.getElementById('rut').value = patientInfo.rut;
    document.getElementById('mano').value = patientInfo.dominant_hand;
    
    // Mostrar formulario
    mostrarFormularioPaciente();
}

// Función para cancelar edición
function cancelarEdicion() {
    if (sesionSeleccionada && sesionSeleccionada.patient_info) {
        mostrarDatosPaciente(sesionSeleccionada.patient_info);
    } else {
        document.getElementById('paciente-section').style.display = 'none';
    }
}

// Función para formatear fecha de actualización
function formatearFechaActualizacion(fecha) {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para guardar datos del paciente
async function guardarDatosPaciente(patientData) {
    try {
        const response = await fetch('/api/actualizar-sesion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: fechaSeleccionada,
                session_id: sesionSeleccionada.session_id,
                patient_data: patientData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Actualizar datos de la sesión seleccionada
            sesionSeleccionada.patient_info = result.patient_info;
            
            // Mostrar datos actualizados
            mostrarDatosPaciente(result.patient_info);
            
            // Mostrar mensaje de éxito
            mostrarMensaje('Datos del paciente guardados exitosamente', 'success');
            
            // Recargar datos de la fecha para obtener la sesión actualizada
            await cargarDatosFecha(fechaSeleccionada);
            
        } else {
            throw new Error(result.error || 'Error al guardar los datos');
        }
        
    } catch (error) {
        console.error('Error al guardar datos del paciente:', error);
        mostrarMensaje('Error al guardar los datos: ' + error.message, 'error');
    }
}

// Función para actualizar solo una sesión específica en la interfaz
function actualizarSesionEnInterfaz(sessionData) {
    // Buscar el elemento de la sesión por session_id
    const sessionElements = document.querySelectorAll('.session-item');
    
    sessionElements.forEach(element => {
        // Buscar el botón que contiene el session_id
        const button = element.querySelector(`button[data-session-id="${sessionData.session_id}"]`);
        if (button) {
            // Encontrar el contenedor padre de la sesión
            const sessionContainer = element;
            
            // Actualizar el estado del paciente en la interfaz
            const patientStatus = sessionContainer.querySelector('.patient-status');
            if (patientStatus) {
                patientStatus.innerHTML = '<span style="color: #48bb78; font-weight: bold;">Con datos del paciente</span>';
            }
            
            // Actualizar el texto del botón
            button.textContent = 'Ver/Editar Paciente';
            
            // Agregar efecto visual de actualización
            sessionContainer.style.animation = 'none';
            setTimeout(() => {
                sessionContainer.style.animation = 'fadeIn 0.5s ease-out';
            }, 10);
        }
    });
}

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo) {
    // Crear elemento de mensaje
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje ${tipo}`;
    mensajeElement.textContent = mensaje;
    
    // Agregar estilos
    mensajeElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        ${tipo === 'success' ? 'background: #48bb78;' : 'background: #e53e3e;'}
    `;
    
    document.body.appendChild(mensajeElement);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        mensajeElement.remove();
    }, 3000);
}

// Función para formatear RUT automáticamente
function formatearRUT(input) {
    let value = input.value.replace(/\D/g, ''); // Solo números
    
    // Limitar a 9 dígitos máximo
    if (value.length > 9) {
        value = value.substring(0, 9);
    }
    
    if (value.length <= 1) {
        input.value = value;
    } else if (value.length <= 4) {
        // XX.X   (ej: 1234 → 123.4)
        input.value = value.slice(0, -1) + '-' + value.slice(-1);
    } else if (value.length <= 7) {
        // XX.XXX-X   (ej: 123456 → 12.345-6)
        input.value = value.slice(0, -4) + '.' + value.slice(-4, -1) + '-' + value.slice(-1);
    } else {
        // XX.XXX.XXX-X   (ej: 12345678 → 12.345.678-9)
        input.value = value.slice(0, -7) + '.' + value.slice(-7, -4) + '.' + value.slice(-4, -1) + '-' + value.slice(-1);
    }
}


// Función para validar RUT chileno
function validarRUT(rut) {
    // Remover puntos y guión
    const rutLimpio = rut.replace(/[.-]/g, '');
    
    // Verificar formato básico
    if (!/^\d{7,8}[0-9kK]$/.test(rutLimpio)) {
        return false;
    }
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    // Recorrer el cuerpo del RUT de derecha a izquierda
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculadoNum = 11 - resto;
    
    let dvCalculado;
    if (dvCalculadoNum === 11) {
        dvCalculado = '0';
    } else if (dvCalculadoNum === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvCalculadoNum.toString();
    }
    
    return dv === dvCalculado;
}


// Función para mostrar error de RUT
function mostrarErrorRUT(input, mensaje) {
    // Remover error anterior
    const errorAnterior = input.parentNode.querySelector('.error-rut');
    if (errorAnterior) {
        errorAnterior.remove();
    }
    
    // Agregar nuevo error
    const errorElement = document.createElement('div');
    errorElement.className = 'error-rut';
    errorElement.style.cssText = `
        color: #e53e3e;
        font-size: 0.8rem;
        margin-top: 5px;
        font-weight: 500;
    `;
    errorElement.textContent = mensaje;
    
    input.parentNode.appendChild(errorElement);
    input.style.borderColor = '#e53e3e';
}

// Función para limpiar error de RUT
function limpiarErrorRUT(input) {
    const errorElement = input.parentNode.querySelector('.error-rut');
    if (errorElement) {
        errorElement.remove();
    }
    input.style.borderColor = '#e2e8f0';
}

// Configurar formulario del paciente
document.addEventListener('DOMContentLoaded', function() {
    const formPaciente = document.getElementById('form-paciente');
    const rutInput = document.getElementById('rut');
    
    if (formPaciente) {
        // Configurar formateo automático del RUT
        if (rutInput) {
            rutInput.addEventListener('input', function(e) {
                formatearRUT(e.target);
            });
            
            rutInput.addEventListener('blur', function(e) {
                const rut = e.target.value.trim();
                if (rut && !validarRUT(rut)) {
                    mostrarErrorRUT(e.target, 'RUT inválido. Verifique el formato y dígito verificador.');
                } else {
                    limpiarErrorRUT(e.target);
                }
            });
            
            rutInput.addEventListener('focus', function(e) {
                limpiarErrorRUT(e.target);
            });
        }
        
        formPaciente.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar RUT antes de enviar
            const rut = rutInput.value.trim();
            if (rut && !validarRUT(rut)) {
                mostrarErrorRUT(rutInput, 'RUT inválido. Verifique el formato y dígito verificador.');
                rutInput.focus();
                return;
            }
            
            const formData = new FormData(formPaciente);
            const patientData = {
                name: formData.get('name'),
                age: parseInt(formData.get('age')),
                rut: formData.get('rut'),
                dominant_hand: formData.get('dominant_hand')
            };
            
            guardarDatosPaciente(patientData);
        });
    }
});

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('NeuroFlex - Aplicación iniciada');
    
    // Cargar fechas al inicio
    cargarFechas();
    
    // Configurar manejo de errores globales
    window.addEventListener('error', function(event) {
        console.error('Error global:', event.error);
    });
    
    // Configurar manejo de promesas rechazadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promesa rechazada:', event.reason);
        event.preventDefault();
    });
});
