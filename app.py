from flask import Flask, render_template, jsonify, request
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Configuración básica
app.config['SECRET_KEY'] = 'tu_clave_secreta_aqui'

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
