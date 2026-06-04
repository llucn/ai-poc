import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, QueryFailedError, Repository } from 'typeorm';
import { CreateFieldDto, UpdateFieldDto } from './field.dto';
import { FieldEntity } from './field.entity';
import type { FieldType } from './field-type';
import { validateProperties } from './validate-properties';

const MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';

@Injectable()
export class FieldService {
  constructor(
    @InjectRepository(FieldEntity)
    private readonly repo: Repository<FieldEntity>,
  ) {}

  findAll(): Promise<FieldEntity[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<FieldEntity> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Field ${id} not found`);
    }
    return row;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.repo.count({ where: { name } });
    return count > 0;
  }

  async create(dto: CreateFieldDto, userName: string): Promise<FieldEntity> {
    if (await this.existsByName(dto.name)) {
      throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
    }

    const type = dto.type as FieldType;
    const parsedProps = dto.properties ?? null;
    const propsError = validateProperties(type, parsedProps);
    if (propsError) {
      throw new BadRequestException(propsError);
    }

    try {
      const entity = this.repo.create({
        name: dto.name,
        title: dto.title,
        description: dto.description ?? null,
        required: dto.required ? 1 : 0,
        defaultValue: dto.defaultValue ?? null,
        type: dto.type,
        properties: parsedProps ? JSON.stringify(parsedProps) : null,
        createdBy: userName,
      });
      return await this.repo.save(entity);
    } catch (err) {
      if (this.isDupName(err)) {
        throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateFieldDto, userName: string): Promise<FieldEntity> {
    const row = await this.findById(id);

    if (dto.name !== row.name) {
      const dup = await this.repo.count({ where: { name: dto.name, id: Not(id) } });
      if (dup > 0) {
        throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
      }
    }

    const type = dto.type as FieldType;
    const parsedProps = dto.properties ?? null;
    const propsError = validateProperties(type, parsedProps);
    if (propsError) {
      throw new BadRequestException(propsError);
    }

    row.name = dto.name;
    row.title = dto.title;
    row.description = dto.description ?? null;
    row.required = dto.required ? 1 : 0;
    row.defaultValue = dto.defaultValue ?? null;
    row.type = dto.type;
    row.properties = parsedProps ? JSON.stringify(parsedProps) : null;
    row.updatedBy = userName;

    try {
      return await this.repo.save(row);
    } catch (err) {
      if (this.isDupName(err)) {
        throw new ConflictException({ statusCode: 409, message: 'name already exists', field: 'name', value: dto.name });
      }
      throw err;
    }
  }

  async removeMany(ids: number[]): Promise<number> {
    const result = await this.repo.delete({ id: In(ids) });
    return result.affected ?? 0;
  }

  async removeOne(id: number): Promise<void> {
    const row = await this.findById(id);
    await this.repo.remove(row);
  }

  private isDupName(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const driverErr = (err as QueryFailedError & {
      driverError?: { code?: string; sqlMessage?: string };
    }).driverError;
    return driverErr?.code === MYSQL_DUP_ENTRY;
  }
}
