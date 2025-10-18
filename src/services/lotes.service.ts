import { LoteModel, Lote, CreateLoteDto, UpdateLoteDto, Coordenada } from '../models/lote.model'

// ============================================================================
// UTILIDADES GEOGRÁFICAS
// ============================================================================

/**
 * Calcular área de un polígono en hectáreas usando coordenadas geográficas
 * Usa la fórmula de área geodésica
 */
function calcularAreaHectareas(coordenadas: Coordenada[]): number {
  if (coordenadas.length < 3) return 0

  const RADIO_TIERRA = 6371000 // metros
  
  // Convertir a radianes
  const toRad = (deg: number) => (deg * Math.PI) / 180

  let area = 0
  const n = coordenadas.length

  for (let i = 0; i < n; i++) {
    const p1 = coordenadas[i]
    const p2 = coordenadas[(i + 1) % n]
    
    const lat1 = toRad(p1.lat)
    const lat2 = toRad(p2.lat)
    const lng1 = toRad(p1.lng)
    const lng2 = toRad(p2.lng)
    
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  area = Math.abs(area * RADIO_TIERRA * RADIO_TIERRA / 2)
  
  // Convertir de m² a hectáreas (1 hectárea = 10,000 m²)
  return area / 10000
}

/**
 * Calcular perímetro en metros usando la fórmula de Haversine
 */
function calcularPerimetroMetros(coordenadas: Coordenada[]): number {
  if (coordenadas.length < 2) return 0

  const RADIO_TIERRA = 6371000 // metros
  const toRad = (deg: number) => (deg * Math.PI) / 180

  let perimetro = 0
  const n = coordenadas.length

  for (let i = 0; i < n; i++) {
    const p1 = coordenadas[i]
    const p2 = coordenadas[(i + 1) % n]
    
    const lat1 = toRad(p1.lat)
    const lat2 = toRad(p2.lat)
    const lng1 = toRad(p1.lng)
    const lng2 = toRad(p2.lng)
    
    const dlat = lat2 - lat1
    const dlng = lng2 - lng1
    
    const a = Math.sin(dlat / 2) ** 2 + 
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    perimetro += RADIO_TIERRA * c
  }

  return perimetro
}

// ============================================================================
// SERVICIO DE LOTES
// ============================================================================

export class LotesService {
  /**
   * Obtener todos los lotes
   */
  async getAllLotes(): Promise<Lote[]> {
    return await LoteModel.findAll()
  }

  /**
   * Obtener un lote por ID
   */
  async getLoteById(id: number): Promise<Lote> {
    const lote = await LoteModel.findById(id)
    
    if (!lote) {
      throw new Error('Lote no encontrado')
    }
    
    return lote
  }

  /**
   * Crear un nuevo lote
   */
  async createLote(data: CreateLoteDto): Promise<Lote> {
    // Validaciones
    if (!data.codigo || data.codigo.trim().length === 0) {
      throw new Error('El código del lote es requerido')
    }

    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('El nombre del lote es requerido')
    }

    if (!data.coordenadas || data.coordenadas.length < 3) {
      throw new Error('Se requieren al menos 3 coordenadas para definir el lote')
    }

    // Calcular automáticamente área y perímetro si no se proporcionan
    if (!data.area_hectareas || data.area_hectareas === 0) {
      data.area_hectareas = calcularAreaHectareas(data.coordenadas)
    }

    if (!data.perimetro_metros || data.perimetro_metros === 0) {
      data.perimetro_metros = calcularPerimetroMetros(data.coordenadas)
    }

    // Validar que el área calculada sea válida
    if (data.area_hectareas <= 0) {
      throw new Error('No se pudo calcular un área válida. Verifica las coordenadas.')
    }

    // Verificar que el código no exista
    const codigoExists = await LoteModel.codigoExists(data.codigo)
    if (codigoExists) {
      throw new Error('Ya existe un lote con ese código')
    }

    // Crear lote
    const id = await LoteModel.create(data)
    
    // Obtener el lote creado
    const lote = await LoteModel.findById(id)
    
    if (!lote) {
      throw new Error('Error al crear el lote')
    }
    
    return lote
  }

  /**
   * Actualizar un lote
   */
  async updateLote(id: number, data: UpdateLoteDto): Promise<Lote> {
    // Verificar que el lote existe
    const exists = await LoteModel.exists(id)
    if (!exists) {
      throw new Error('Lote no encontrado')
    }

    // Validaciones
    if (data.codigo !== undefined) {
      if (data.codigo.trim().length === 0) {
        throw new Error('El código del lote no puede estar vacío')
      }
      
      // Verificar que el código no exista (excepto el actual)
      const codigoExists = await LoteModel.codigoExists(data.codigo, id)
      if (codigoExists) {
        throw new Error('Ya existe un lote con ese código')
      }
    }

    if (data.nombre !== undefined && data.nombre.trim().length === 0) {
      throw new Error('El nombre del lote no puede estar vacío')
    }

    if (data.coordenadas !== undefined && data.coordenadas.length < 3) {
      throw new Error('Se requieren al menos 3 coordenadas para definir el lote')
    }

    // Si se actualizan las coordenadas, recalcular área y perímetro
    if (data.coordenadas && data.coordenadas.length >= 3) {
      data.area_hectareas = calcularAreaHectareas(data.coordenadas)
      data.perimetro_metros = calcularPerimetroMetros(data.coordenadas)

      if (data.area_hectareas <= 0) {
        throw new Error('No se pudo calcular un área válida. Verifica las coordenadas.')
      }
    } else if (data.area_hectareas !== undefined && data.area_hectareas <= 0) {
      throw new Error('El área debe ser mayor a 0')
    }

    // Actualizar
    const updated = await LoteModel.update(id, data)
    
    if (!updated) {
      throw new Error('No se pudo actualizar el lote')
    }

    // Obtener el lote actualizado
    const lote = await LoteModel.findById(id)
    
    if (!lote) {
      throw new Error('Error al obtener el lote actualizado')
    }
    
    return lote
  }

  /**
   * Eliminar un lote
   */
  async deleteLote(id: number): Promise<void> {
    // Verificar que el lote existe
    const exists = await LoteModel.exists(id)
    if (!exists) {
      throw new Error('Lote no encontrado')
    }

    // Eliminar (también elimina coordenadas por CASCADE)
    await LoteModel.delete(id)
  }

  /**
   * Obtener estadísticas de lotes
   */
  async getEstadisticas(): Promise<any> {
    return await LoteModel.getEstadisticas()
  }
}

export const lotesService = new LotesService()

