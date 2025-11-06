# Modelos de Machine Learning

Esta carpeta contiene los modelos entrenados para predecir el estado cognitivo.

## Instrucciones

1. Coloca tu modelo entrenado en esta carpeta con el nombre `modelo_cognitivo.pkl` (o el formato que uses: `.joblib`, `.h5`, etc.)

2. El modelo debe estar entrenado para recibir las siguientes características:
   - **Datos de la sesión:**
     - Precision (float)
     - TiempoActivoTarea (float, en segundos)
     - CantAciertasTotales (int)
     - ObjetosInteractuadosCorrectamente (int)
     - TiempoTutorial (float, en segundos)
     - TipoEscena (string, codificado)
     - TiempoRespuestaPararse (float, en segundos)
     - TiempoRespuestaPregunta1 (float, en segundos)
     - TiempoRespuestaPregunta2 (float, en segundos)
     - TiempoRespuestaPregunta3 (float, en segundos)
     - TiempoCapturarNumero (float, en segundos)
   
   - **Datos del paciente:**
     - age (int)
     - dominant_hand (string, codificado: 'right'=0, 'left'=1, 'ambidextrous'=2)

3. El modelo debe tener un método `predict()` que devuelva el estado cognitivo.

4. Si usas scikit-learn, guarda el modelo con:
   ```python
   import joblib
   joblib.dump(modelo, 'models/modelo_cognitivo.pkl')
   ```

5. Si usas TensorFlow/Keras, guarda el modelo con:
   ```python
   modelo.save('models/modelo_cognitivo.h5')
   ```

## Formato de predicción esperado

El modelo debe devolver un valor que indique el estado cognitivo. Puede ser:
- Un número (0-1, 0-100, etc.)
- Una clase categórica ('normal', 'leve', 'moderado', 'severo')
- Etc.

Ajusta el código en `app.py` según el formato de salida de tu modelo.

