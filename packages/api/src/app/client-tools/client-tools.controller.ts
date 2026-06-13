import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { ClientToolsService } from './client-tools.service';
import { SyncRegistryDto } from './client-tools.dto';

@Controller('client-tools')
export class ClientToolsController {
  constructor(private readonly clientToolsService: ClientToolsService) {}

  /**
   * POST /client-tools/sync
   * Reconcile the frontend's defineClientTool registry into t_tool (source='registry').
   * Called once on app mount; idempotent.
   */
  @Post('sync')
  async sync(
    @Body() dto: SyncRegistryDto,
    @CurrentUser() user: any
  ): Promise<{ message: string }> {
    const createdBy = user?.username || 'system';
    await this.clientToolsService.syncRegistry(dto.tools, createdBy);
    return { message: 'Registry synced successfully' };
  }

  /**
   * GET /client-tools/registry
   * Return the cached mirror of the most recent sync (for debugging / read-only detail).
   */
  @Get('registry')
  getRegistry() {
    return this.clientToolsService.getRegistry();
  }
}
