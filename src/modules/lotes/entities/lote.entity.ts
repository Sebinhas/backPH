import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lotesSioma')
export class Lote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'key' })
  key: string;

  @Column({ type: 'varchar', length: 255, name: 'grupo' })
  grupo: string;

  @Column({ type: 'varchar', length: 50, name: 'sigla' })
  sigla: string;

  @Column({ type: 'varchar', length: 255, name: 'nombre' })
  nombre: string;

  @Column({ type: 'int', name: 'finca_id' })
  fincaId: number;

  @Column({ type: 'int', name: 'key_value' })
  keyValue: number;

  @Column({ type: 'int', name: 'tipo_sujeto_id' })
  tipoSujetoId: number;

  @Column({ type: 'int', name: 'tipo_cultivo_id' })
  tipoCultivoId: number;
}
