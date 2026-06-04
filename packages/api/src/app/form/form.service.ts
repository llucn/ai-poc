import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, QueryFailedError, Repository } from 'typeorm';
import { FieldEntity } from '../field/field.entity';
import { CreateFormDto, PutFormFieldsDto, UpdateFormDto } from './form.dto';
import { FormFieldEntity } from './form-field.entity';
import { FormEntity } from './form.entity';

const MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';

@Injectable()
export class FormService {
  constructor(
    @InjectRepository(FormEntity)
    private readonly formRepo: Repository<FormEntity>,
    @InjectRepository(FormFieldEntity)
    private readonly formFieldRepo: Repository<FormFieldEntity>,
    @InjectRepository(FieldEntity)
    private readonly fieldRepo: Repository<FieldEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<FormEntity[]> {
    return this.formRepo.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<FormEntity> {
    const row = await this.formRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Form ${id} not found`);
    return row;
  }

  async existsByName(name: string): Promise<boolean> {
    return (await this.formRepo.count({ where: { name } })) > 0;
  }

  async create(dto: CreateFormDto, userName: string): Promise<FormEntity> {
    if (await this.existsByName(dto.name)) {
      throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
    }
    try {
      const entity = this.formRepo.create({
        name: dto.name,
        description: dto.description ?? null,
        createdBy: userName,
      });
      return await this.formRepo.save(entity);
    } catch (err) {
      if (this.isDupName(err)) {
        throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateFormDto, userName: string): Promise<FormEntity> {
    const row = await this.findById(id);
    if (dto.name !== row.name) {
      const dup = await this.formRepo.count({ where: { name: dto.name, id: Not(id) } });
      if (dup > 0) {
        throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
      }
    }
    row.name = dto.name;
    row.description = dto.description ?? null;
    row.updatedBy = userName;
    try {
      return await this.formRepo.save(row);
    } catch (err) {
      if (this.isDupName(err)) {
        throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
      }
      throw err;
    }
  }

  async removeMany(ids: number[]): Promise<number> {
    const result = await this.formRepo.delete({ id: In(ids) });
    return result.affected ?? 0;
  }

  async removeOne(id: number): Promise<void> {
    const row = await this.findById(id);
    await this.formRepo.remove(row);
  }

  async getFields(formId: number): Promise<FormFieldEntity[]> {
    await this.findById(formId);
    return this.formFieldRepo.find({
      where: { formId },
      order: { position: 'ASC' },
      relations: ['field'],
    });
  }

  async putFields(formId: number, dto: PutFormFieldsDto, userName: string): Promise<FormFieldEntity[]> {
    await this.findById(formId);

    const fieldIds = dto.fields.map((f) => f.fieldId);
    if (fieldIds.length > 0) {
      const existingCount = await this.fieldRepo.count({ where: { id: In(fieldIds) } });
      if (existingCount !== new Set(fieldIds).size) {
        throw new BadRequestException('One or more fieldIds do not exist');
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(FormFieldEntity, { formId });
      if (dto.fields.length > 0) {
        const rows = dto.fields.map((f) => {
          const entity = new FormFieldEntity();
          entity.formId = formId;
          entity.fieldId = f.fieldId;
          entity.position = f.position;
          entity.createdBy = userName;
          return entity;
        });
        await manager.save(FormFieldEntity, rows);
      }
    });

    return this.getFields(formId);
  }

  private isDupName(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const driverErr = (err as QueryFailedError & {
      driverError?: { code?: string };
    }).driverError;
    return driverErr?.code === MYSQL_DUP_ENTRY;
  }
}
