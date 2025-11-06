from flask import Flask, render_template, jsonify, request
import requests
import os
import re
from datetime import datetime
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

# Configuración básica
app.config['SECRET_KEY'] = 'secret_key'

# Variables globales para el modelo
modelo_cognitivo = None
modelo_cargado = False

def cargar_modelo():
    """
    Carga el modelo de machine learning desde el archivo local
    Usa el mismo método que el usuario: joblib.load('modelo_cognitivo.pkl')
    """
    global modelo_cognitivo, modelo_cargado
    
    try:
        # Buscar el modelo en diferentes formatos posibles
        rutas_modelo = [
            'models/modelo_cognitivo.pkl',
            'modelo_cognitivo.pkl',  # También buscar en la raíz
            'models/modelo_cognitivo.joblib',
            'models/modelo_cognitivo.h5'
        ]
        
        modelo_encontrado = False
        for ruta in rutas_modelo:
            if os.path.exists(ruta):
                if ruta.endswith('.pkl') or ruta.endswith('.joblib'):
                    # Modelo scikit-learn - usar el mismo método que el usuario
                    try:
                        # Intentar cargar con diferentes métodos para compatibilidad
                        import pickle
                        import warnings
                        
                        # Método 1: Intentar con joblib (método estándar)
                        try:
                            with warnings.catch_warnings():
                                warnings.simplefilter("ignore")
                                modelo_cognitivo = joblib.load(ruta)
                            modelo_encontrado = True
                            print(f"✅ Modelo cargado exitosamente desde: {ruta}")
                            print(f"   Versión de scikit-learn: {__import__('sklearn').__version__}")
                            print(f"   Versión de joblib: {joblib.__version__}")
                            break
                        except Exception as joblib_error:
                            # Método 2: Intentar con pickle directamente
                            try:
                                with open(ruta, 'rb') as f:
                                    with warnings.catch_warnings():
                                        warnings.simplefilter("ignore")
                                        modelo_cognitivo = pickle.load(f)
                                modelo_encontrado = True
                                print(f"✅ Modelo cargado exitosamente desde: {ruta} (usando pickle)")
                                print(f"   Versión de scikit-learn: {__import__('sklearn').__version__}")
                                break
                            except Exception as pickle_error:
                                # Si ambos fallan, mostrar el error más informativo
                                raise joblib_error
                                
                    except Exception as load_error:
                        error_msg = str(load_error)
                        print(f"⚠️ Error al cargar modelo desde {ruta}: {error_msg}")
                        
                        # Si es un error de compatibilidad de sklearn, dar sugerencias específicas
                        if '_RemainderColsList' in error_msg or 'attribute' in error_msg.lower():
                            print(f"\n💡 Solución para error de compatibilidad:")
                            print(f"   1. Verifica la versión de sklearn en Colab:")
                            print(f"      !pip show scikit-learn")
                            print(f"   2. Instala la misma versión localmente:")
                            print(f"      pip install scikit-learn==<VERSION_DE_COLAB>")
                            print(f"   3. O reentrena el modelo en Colab con sklearn 1.7.2")
                            print(f"      !pip install scikit-learn==1.7.2")
                        
                        # Continuar buscando en otras rutas
                        continue
                elif ruta.endswith('.h5'):
                    # Modelo TensorFlow/Keras
                    try:
                        from tensorflow import keras
                        modelo_cognitivo = keras.models.load_model(ruta)
                        modelo_encontrado = True
                        print(f"✅ Modelo Keras cargado exitosamente desde: {ruta}")
                        break
                    except ImportError:
                        print("⚠️ TensorFlow no está instalado. Instala con: pip install tensorflow")
                        break
        
        if not modelo_encontrado:
            print("⚠️ No se encontró ningún modelo en la carpeta models/")
            print("   Coloca tu modelo entrenado como 'modelo_cognitivo.pkl' o 'modelo_cognitivo.joblib'")
            print("\n💡 Si tienes el modelo en otra ubicación, asegúrate de:")
            print("   - Copiarlo a la carpeta 'models/' o a la raíz del proyecto")
            print("   - Verificar que la versión de scikit-learn sea compatible")
            print("   - Si el modelo fue entrenado con sklearn 1.4+, actualiza: pip install --upgrade scikit-learn")
        
        modelo_cargado = modelo_encontrado
        
    except Exception as e:
        print(f"❌ Error al cargar el modelo: {str(e)}")
        print(f"\n💡 Soluciones posibles:")
        print(f"   1. Actualizar scikit-learn: pip install --upgrade scikit-learn")
        print(f"   2. Verificar que la versión de sklearn coincida con la usada para entrenar")
        print(f"   3. Si el modelo fue entrenado con sklearn 1.4+, necesitas sklearn >= 1.4.0")
        modelo_cargado = False

def preparar_features(session_data, patient_info):
    """
    Prepara las características (features) para el modelo a partir de los datos de la sesión y paciente
    Retorna un diccionario con el formato exacto requerido por el modelo
    """
    data = session_data.get('data', {})
    
    # Mapeo de mano dominante a string numérico
    mano_mapping = {
        'right': '0',
        'left': '1',
        'ambidextrous': '2'
    }
    
    # Obtener fecha de observación desde el timestamp de la sesión o usar fecha actual
    fecha_observacion = datetime.now().strftime('%Y-%m-%d')
    if 'timestamp' in session_data:
        try:
            # Intentar parsear el timestamp de la sesión
            timestamp = session_data.get('timestamp')
            if isinstance(timestamp, str):
                # Si es string, intentar parsearlo
                fecha_obj = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            else:
                fecha_obj = datetime.fromtimestamp(timestamp)
            fecha_observacion = fecha_obj.strftime('%Y-%m-%d')
        except:
            # Si hay error, usar fecha actual
            fecha_observacion = datetime.now().strftime('%Y-%m-%d')
    
    # Extraer año, mes y día de la fecha de observación
    anno, mes, dia = map(int, fecha_observacion.split('-'))
    
    # Obtener mano predominante
    if patient_info:
        mano_valor = mano_mapping.get(patient_info.get('dominant_hand', 'right'), '0')
        edad_valor = str(patient_info.get('age', 0))
    else:
        mano_valor = '0'  # Derecha por defecto
        edad_valor = '0'
    
    # Obtener TipoEscena como string (puede ser '1', '2', etc. o el nombre de la escena)
    tipo_escena = str(data.get('TipoEscena', '1'))
    # Si es un nombre como 'Scene1', extraer el número
    if 'Scene' in tipo_escena or 'scene' in tipo_escena:
        # Intentar extraer número de Scene1, Scene2, etc.
        match = re.search(r'(\d+)', tipo_escena)
        if match:
            tipo_escena = match.group(1)
    
    # Crear diccionario con el formato exacto requerido
    features_dict = {
        'FechaObservación': fecha_observacion,
        'ManoPredominante': mano_valor,
        'TiempoRespuestaPararse': float(data.get('TiempoRespuestaPararse', 0)),
        'Precision': float(data.get('Precision', 0)) / 100.0 if data.get('Precision', 0) > 1 else float(data.get('Precision', 0)),
        'TiempoActivoTarea': float(data.get('TiempoActivoTarea', 0)),
        'CantAciertasTotales': int(data.get('CantAciertasTotales', 0)),
        'ObjetosInteractuadosCorrectamente': int(data.get('ObjetosInteractuadosCorrectamente', 0)),
        'TiempoRespuestaPregunta1': float(data.get('TiempoRespuestaPregunta1', 0)),
        'TiempoRespuestaPregunta2': float(data.get('TiempoRespuestaPregunta2', 0)),
        'TiempoRespuestaPregunta3': float(data.get('TiempoRespuestaPregunta3', 0)),
        'TiempoCapturarNumero': float(data.get('TiempoCapturarNumero', 0)),
        'TiempoTutorial': float(data.get('TiempoTutorial', 0)),
        'TipoEscena': tipo_escena,
        'Edad': edad_valor,
        'Anno': anno,
        'Mes': mes,
        'Dia': dia
    }
    
    return features_dict

def predecir_estado_cognitivo(session_data, patient_info):
    """
    Realiza la predicción del estado cognitivo usando el modelo cargado
    """
    global modelo_cognitivo, modelo_cargado
    
    if not modelo_cargado:
        return None, "Modelo no cargado"
    
    try:
        # Preparar features como diccionario
        features_dict = preparar_features(session_data, patient_info)
        
        # Debug: imprimir el diccionario de features (comentar en producción)
        if app.config.get('DEBUG', False):
            print("📊 Features preparadas para el modelo:")
            print(features_dict)
        
        # Convertir diccionario a array numpy en el orden correcto
        # El modelo espera 16 características (sin FechaObservación, ya que tiene Anno, Mes, Dia)
        # Orden según el formato requerido (SIN FechaObservación):
        order = [
            'ManoPredominante', 'TiempoRespuestaPararse', 'Precision',
            'TiempoActivoTarea', 'CantAciertasTotales', 'ObjetosInteractuadosCorrectamente',
            'TiempoRespuestaPregunta1', 'TiempoRespuestaPregunta2', 'TiempoRespuestaPregunta3',
            'TiempoCapturarNumero', 'TiempoTutorial', 'TipoEscena', 'Edad',
            'Anno', 'Mes', 'Dia'
        ]
        
        # Convertir valores a números (excluyendo FechaObservación que es solo para referencia)
        features_array = []
        for key in order:
            value = features_dict.get(key)
            if key in ['ManoPredominante', 'TipoEscena', 'Edad']:
                # Convertir strings numéricos a float
                features_array.append(float(value) if value else 0.0)
            else:
                # Ya son números
                features_array.append(float(value) if value else 0.0)
        
        # Convertir a DataFrame de pandas (el modelo espera un DataFrame con nombres de columnas)
        features_df = pd.DataFrame([features_array], columns=order)
        
        # Usar el DataFrame para la predicción
        features = features_df
        
        # Realizar predicción usando el mismo método que el usuario
        # pred = modelo_cargado.predict(nuevos_datos)
        # resultado = 'Sí' if pred[0] == 1 else 'No'
        try:
            pred = modelo_cognitivo.predict(features)
            
            # Convertir predicción a formato adecuado
            if isinstance(pred, np.ndarray):
                pred_valor = pred[0] if len(pred) > 0 else pred.item() if pred.size == 1 else pred.tolist()[0]
            else:
                pred_valor = pred[0] if isinstance(pred, (list, tuple)) else pred
            
            # Convertir a entero (0 o 1)
            pred_int = int(pred_valor) if isinstance(pred_valor, (int, float, np.integer, np.floating)) else pred_valor
            
            # Formatear resultado como 'Alto' o 'Bajo'
            resultado = 'Alto' if pred_int == 1 else 'Bajo'
            
            # También intentar obtener probabilidades si están disponibles
            probabilidades = None
            if hasattr(modelo_cognitivo, 'predict_proba'):
                try:
                    proba = modelo_cognitivo.predict_proba(features)[0]
                    if isinstance(proba, np.ndarray):
                        probabilidades = proba.tolist()
                    else:
                        probabilidades = list(proba) if isinstance(proba, (list, tuple)) else [proba]
                except:
                    pass  # Si no se pueden obtener probabilidades, no pasa nada
            
            return {
                'valor': pred_int,
                'resultado': resultado,
                'probabilidades': probabilidades
            }, None
            
        except Exception as pred_error:
            return None, f"Error en predicción: {str(pred_error)}"
        
    except Exception as e:
        return None, str(e)

# Cargar el modelo al iniciar la aplicación
print("🔄 Cargando modelo de machine learning...")
cargar_modelo()


@app.route('/')
def index():
    """Página principal de la aplicación"""
    return render_template('index.html')

@app.route('/api/fechas')
def obtener_fechas():
    """
    Endpoint para obtener las fechas disponibles desde la API externa
    """
    try:
        # URL del endpoint para obtener fechas
        url = "https://f13h4cz6id.execute-api.sa-east-1.amazonaws.com/data/dates"
        
        # Realizar la petición GET
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Lanza excepción si hay error HTTP
        
        # Obtener los datos JSON
        data = response.json()
        
        # Verificar que la respuesta sea exitosa
        if data.get('success', False):
            return jsonify({
                'fechas': data.get('dates', []),
                'total': data.get('total_dates', 0),
                'success': True
            })
        else:
            return jsonify({
                'error': 'La API externa no retornó datos exitosamente',
                'success': False
            }), 500
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': f'Error al conectar con la API externa: {str(e)}',
            'success': False
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Error inesperado: {str(e)}',
            'success': False
        }), 500

@app.route('/api/datos/<fecha>')
def obtener_datos_fecha(fecha):
    """
    Endpoint para obtener los datos de una fecha específica desde la API externa
    """
    try:
        # URL del endpoint para obtener datos de una fecha específica
        url = f"https://f13h4cz6id.execute-api.sa-east-1.amazonaws.com/data/{fecha}"
        
        # Realizar la petición GET
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Lanza excepción si hay error HTTP
        
        # Obtener los datos JSON
        data = response.json()
        
        # Verificar que la respuesta sea exitosa
        if data.get('success', False):
            return jsonify({
                'fecha': data.get('date', fecha),
                'sessions': data.get('sessions', []),
                'total_sessions': data.get('total_sessions', 0),
                'success': True
            })
        else:
            return jsonify({
                'error': 'La API externa no retornó datos exitosamente',
                'success': False
            }), 500
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': f'Error al conectar con la API externa: {str(e)}',
            'success': False
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Error inesperado: {str(e)}',
            'success': False
        }), 500

@app.route('/api/actualizar-sesion', methods=['POST'])
def actualizar_sesion():
    """
    Endpoint para actualizar una sesión con datos del paciente
    """
    try:
        # Obtener datos del request
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['date', 'session_id', 'patient_data']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': f'Faltan campos requeridos: {", ".join(missing_fields)}',
                'success': False
            }), 400
        
        # Validar datos del paciente
        patient_data = data.get('patient_data', {})
        required_patient_fields = ['name', 'age', 'rut', 'dominant_hand']
        missing_patient_fields = [field for field in required_patient_fields if not patient_data.get(field)]
        
        if missing_patient_fields:
            return jsonify({
                'error': f'Faltan campos del paciente: {", ".join(missing_patient_fields)}',
                'success': False
            }), 400
        
        # URL del endpoint para actualizar sesión
        url = "https://f13h4cz6id.execute-api.sa-east-1.amazonaws.com/update-session"
        
        # Realizar la petición POST
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        
        # Obtener la respuesta
        result = response.json()
        
        return jsonify(result)
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': f'Error al conectar con la API externa: {str(e)}',
            'success': False
        }), 500
    except Exception as e:
        return jsonify({
            'error': f'Error inesperado: {str(e)}',
            'success': False
        }), 500

@app.route('/api/predecir-estado-cognitivo', methods=['POST'])
def predecir_estado_cognitivo_endpoint():
    """
    Endpoint para predecir el estado cognitivo de una sesión
    """
    try:
        global modelo_cargado
        
        if not modelo_cargado:
            return jsonify({
                'error': 'Modelo no cargado. Asegúrate de tener un modelo en la carpeta models/',
                'success': False
            }), 503
        
        # Obtener datos del request
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['session_data', 'patient_info']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': f'Faltan campos requeridos: {", ".join(missing_fields)}',
                'success': False
            }), 400
        
        session_data = data.get('session_data', {})
        patient_info = data.get('patient_info')
        
        # Realizar predicción
        resultado, error = predecir_estado_cognitivo(session_data, patient_info)
        
        if error:
            return jsonify({
                'error': error,
                'success': False
            }), 500
        
        return jsonify({
            'prediccion': resultado,
            'success': True
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Error inesperado: {str(e)}',
            'success': False
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
