# Módulo de Validación CSV

Este módulo permite validar archivos CSV con datos de palmas usando validaciones locales y la API de Gemini.

## Configuración

### 1. Variable de Entorno (OBLIGATORIO)

**IMPORTANTE:** Debes crear un archivo `.env` en la raíz del proyecto `backPH/` con la API key de Gemini:

```env
GEMINI_API_KEY=tu_api_key_de_gemini_aqui
```

Para obtener la API key de Gemini:
1. Visita: https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Genera una nueva API key
4. Cópiala y pégala en el archivo `.env`

**Sin esta clave, Gemini NO funcionará** y solo se harán validaciones locales de coordenadas duplicadas.

### 2. Endpoint

**POST** `/api/v1/csv-validation/validate`

### 3. FormData

- `file` (File): Archivo CSV a validar

### 4. Respuesta

#### Archivo válido:
```json
{
  "isValid": true,
  "message": "El archivo CSV es válido y no contiene errores"
}
```

#### Archivo con errores:
```json
{
  "isValid": false,
  "errors": [
    {
      "type": "Coordenadas duplicadas",
      "description": "Las coordenadas 3.884461687000, -73.642684 aparecen en las filas: 2, 5",
      "rows": [2, 5],
      "count": 2
    },
    {
      "type": "Líneas duplicadas en lote",
      "description": "En el lote \"67-CASA ROJA\", la línea \"1\" aparece en las filas: 2, 3",
      "rows": [2, 3],
      "count": 2
    }
  ],
  "message": "Se encontraron 2 tipo(s) de error(es) en el archivo"
}
```

## Validaciones Implementadas

### Validaciones Locales (Sin Gemini):
1. **Coordenadas duplicadas**: Verifica que no haya latitud/longitud repetidos
2. **Líneas duplicadas en lote**: No debe repetirse la misma línea dentro de un lote
3. **Posiciones de palma duplicadas**: No debe repetirse la misma posición de palma dentro de una línea

### Validaciones con Gemini:
1. **Rangos de coordenadas**: Valida que las coordenadas estén en rangos lógicos
2. **Formato consistente**: Verifica que los lotes tengan un formato consistente
3. **Otras inconsistencias**: Gemini puede detectar errores lógicos adicionales

**Nota**: Si el archivo tiene más de 1000 registros, se dividirá automáticamente en chunks de 1000 y cada chunk se validará por separado, acumulando todos los errores encontrados.

## Formato del CSV

El CSV debe tener las siguientes columnas:
- `Lote`: Identificador del lote
- `Linea`: Número de línea
- `Palma`: Posición de la palma
- `Longitu`: Longitud
- `Latitud`: Latitud

## Uso desde Frontend

Ejemplo con FormData:

```typescript
const formData = new FormData();
formData.append('file', csvFile);

const response = await api.post('/api/v1/csv-validation/validate', formData);
```

## Documentación Swagger

Al iniciar el servidor, la documentación estará disponible en:
`http://localhost:3000/api/docs`

