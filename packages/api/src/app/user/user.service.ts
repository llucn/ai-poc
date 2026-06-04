import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import type { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findAll(page: number = 1, pageSize: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' },
    });

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async exists(name: string): Promise<{ name: boolean }> {
    if (!name.trim()) {
      return { name: false };
    }
    const user = await this.userRepository.findOne({ where: { name: name.trim() } });
    return { name: !!user };
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByName(name: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ where: { name } });
  }

  async create(dto: CreateUserDto, createdBy: string): Promise<UserEntity> {
    // Check for duplicate name
    const existing = await this.userRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`User with name '${dto.name}' already exists`);
    }

    const user = this.userRepository.create({
      ...dto,
      isAvailable: dto.isAvailable ?? 1,
      createdOn: new Date(),
      createdBy,
    });

    return await this.userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto, updatedBy: string): Promise<UserEntity> {
    const user = await this.findOne(id);

    // Check for duplicate name if name is being changed
    if (dto.name && dto.name !== user.name) {
      const existing = await this.userRepository.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException(`User with name '${dto.name}' already exists`);
      }
    }

    Object.assign(user, dto);
    user.updatedOn = new Date();
    user.updatedBy = updatedBy;

    return await this.userRepository.save(user);
  }

  async delete(ids: number[]): Promise<number> {
    const result = await this.userRepository.delete(ids);
    return result.affected ?? 0;
  }
}
