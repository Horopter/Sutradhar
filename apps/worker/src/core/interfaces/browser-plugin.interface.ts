/**
 * Browser Automation Plugin Interface
 */

import { IPlugin, PluginResult } from '../types';

export interface BrowserActionPayload {
  url?: string;
  text: string;
  username?: string;
  password?: string;
  sessionId?: string;
  [key: string]: any;
}

export interface BrowserActionResponse {
  ok: boolean;
  screenshot?: string;
  url?: string;
  data?: any;
}

export interface IBrowserPlugin extends IPlugin {
  executeAction(
    action: string,
    payload: BrowserActionPayload
  ): Promise<PluginResult<BrowserActionResponse>>;
  
  listSupportedActions(): string[];
}

