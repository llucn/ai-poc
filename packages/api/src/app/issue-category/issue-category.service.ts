import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import {
  CreateIssueCategoryDto,
  ExistsResponseDto,
  UpdateIssueCategoryDto,
} from './issue-category.dto';
import { IssueCategoryEntity } from './issue-category.entity';

type ConflictField = 'name' | 'displayName';

type DuplicateError = {
  field: ConflictField;
  value: string;
};

const MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';
const UK_NAME = 'uk_t_issue_category_name';
const UK_DISPLAY_NAME = 'uk_t_issue_category_display_name';

@Injectable()
export class IssueCategoryService {
  constructor(
    @InjectRepository(IssueCategoryEntity)
    private readonly repo: Repository<IssueCategoryEntity>,
  ) {}

  findAll(): Promise<IssueCategoryEntity[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<IssueCategoryEntity> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Category ${id} not found`,
      });
    }
    return row;
  }

  async existsByField(field: ConflictField, value: string): Promise<boolean> {
    const column = field === 'name' ? 'name' : 'displayName';
    const count = await this.repo.count({ where: { [column]: value } });
    return count > 0;
  }

  async checkExists(
    name: string | undefined,
    displayName: string | undefined,
  ): Promise<ExistsResponseDto> {
    const [nameTaken, displayNameTaken] = await Promise.all([
      name ? this.existsByField('name', name) : Promise.resolve(false),
      displayName
        ? this.existsByField('displayName', displayName)
        : Promise.resolve(false),
    ]);
    return { name: nameTaken, displayName: displayNameTaken };
  }

  async create(dto: CreateIssueCategoryDto): Promise<IssueCategoryEntity> {
    if (await this.existsByField('name', dto.name)) {
      throw this.duplicateConflict('name', dto.name);
    }
    if (await this.existsByField('displayName', dto.displayName)) {
      throw this.duplicateConflict('displayName', dto.displayName);
    }

    try {
      const created = this.repo.create({
        name: dto.name,
        displayName: dto.displayName,
      });
      return await this.repo.save(created);
    } catch (err) {
      const dup = this.parseDuplicate(err, dto);
      if (dup) throw this.duplicateConflict(dup.field, dup.value);
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateIssueCategoryDto,
  ): Promise<IssueCategoryEntity> {
    const row = await this.findById(id);
    if (dto.displayName === row.displayName) {
      return row;
    }
    if (await this.existsByField('displayName', dto.displayName)) {
      throw this.duplicateConflict('displayName', dto.displayName);
    }
    row.displayName = dto.displayName;
    try {
      return await this.repo.save(row);
    } catch (err) {
      if (this.isDisplayNameDuplicate(err)) {
        throw this.duplicateConflict('displayName', dto.displayName);
      }
      throw err;
    }
  }

  async removeMany(ids: number[]): Promise<number> {
    const result = await this.repo.delete({ id: In(ids) });
    return result.affected ?? 0;
  }

  private duplicateConflict(field: ConflictField, value: string) {
    return new ConflictException({
      statusCode: 409,
      message: `${field} already exists`,
      field,
      value,
    });
  }

  private parseDuplicate(
    err: unknown,
    dto: CreateIssueCategoryDto,
  ): DuplicateError | null {
    if (!(err instanceof QueryFailedError)) return null;
    const driverErr = (err as QueryFailedError & {
      driverError?: { code?: string; sqlMessage?: string };
    }).driverError;
    if (driverErr?.code !== MYSQL_DUP_ENTRY) return null;
    const message = driverErr.sqlMessage ?? '';
    if (message.includes(UK_NAME)) {
      return { field: 'name', value: dto.name };
    }
    if (message.includes(UK_DISPLAY_NAME)) {
      return { field: 'displayName', value: dto.displayName };
    }
    return null;
  }

  private isDisplayNameDuplicate(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const driverErr = (err as QueryFailedError & {
      driverError?: { code?: string; sqlMessage?: string };
    }).driverError;
    if (driverErr?.code !== MYSQL_DUP_ENTRY) return false;
    return (driverErr.sqlMessage ?? '').includes(UK_DISPLAY_NAME);
  }
}
