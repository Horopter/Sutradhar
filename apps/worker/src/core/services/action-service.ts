/**
 * Action Service - Business logic layer for integration actions
 */

import { pluginRegistry } from '../plugin-registry';
import { IActionPlugin, ActionType, BaseActionPayload, ActionResponse } from '../interfaces/action-plugin.interface';
import { IDataPlugin } from '../interfaces/data-plugin.interface';
import { log } from '../../log';

export class ActionService {
  private async getActionPlugin(): Promise<IActionPlugin> {
    return await pluginRegistry.get<IActionPlugin>('action');
  }

  private async getDataPlugin(): Promise<IDataPlugin> {
    return await pluginRegistry.get<IDataPlugin>('data');
  }

  async executeAction<T extends BaseActionPayload>(
    type: ActionType,
    payload: T
  ): Promise<{ ok: boolean; mocked?: boolean; data?: ActionResponse; error?: string }> {
    try {
      const plugin = await this.getActionPlugin();

      // Validate action
      if (!plugin.validateAction(type, payload)) {
        return {
          ok: false,
          error: `Invalid ${type} action payload`,
        };
      }

      // Execute action
      const result = await plugin.executeAction(type, payload);

      // Log to data store if sessionId provided
      if (payload.sessionId && result.ok) {
        try {
          const dataPlugin = await this.getDataPlugin();
          await dataPlugin.logAction({
            sessionId: payload.sessionId,
            type,
            status: result.mocked ? 'mocked' : 'ok',
            payload,
            result: result.data,
          });
        } catch (error) {
          // Non-fatal - log but continue
          log.warn('Failed to log action (non-fatal)', error);
        }
      }

      return {
        ok: result.ok,
        mocked: result.mocked,
        data: result.data,
        error: result.error,
      };
    } catch (error) {
      log.error('Action service error', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getActionsBySession(sessionId: string): Promise<Array<{ type: string; status: string; payload?: any; result?: any; ts?: number }>> {
    try {
      const dataPlugin = await this.getDataPlugin();
      const result = await dataPlugin.getActionsBySession(sessionId);

      if (result.ok && result.data) {
        // Normalize to ensure all fields are present
        return result.data.map(action => ({
          type: action.type,
          status: action.status,
          payload: action.payload || {},
          result: action.result || {},
          ts: action.ts || Date.now(),
        }));
      }

      return [];
    } catch (error) {
      log.error('Get actions failed', error);
      return [];
    }
  }
}

export const actionService = new ActionService();

