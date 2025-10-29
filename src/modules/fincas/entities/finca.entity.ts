import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('fincas')
export class Finca {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'key' })
  key: string;

  @Column({ type: 'varchar', length: 255, name: 'grupo' })
  grupo: string;

  @Column({ type: 'varchar', length: 50, name: 'sigla' })
  sigla: string;

  @Column({ type: 'varchar', length: 10, name: 'moneda' })
  moneda: string;

  @Column({ type: 'varchar', length: 255, name: 'nombre' })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'pago_dia' })
  pagoDia: number;

  @Column({ type: 'int', name: 'key_value' })
  keyValue: number;

  @Column({ type: 'int', name: 'tipo_sujeto_id' })
  tipoSujetoId: number;

  @Column({ type: 'int', name: 'tipo_cultivo_id' })
  tipoCultivoId: number;
}
