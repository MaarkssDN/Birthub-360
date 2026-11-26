/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Vendor prefix do Safari/iOS para a Web Audio API — não faz parte da lib "DOM" padrão. */
  webkitAudioContext?: typeof AudioContext;
}

declare module 'd3' {
  const d3: any;
  export = d3;
}

declare module 'twilio' {
  const twilio: any;
  export = twilio;
}

declare module 'openid-client' {
  export interface Configuration {
    [key: string]: any;
  }
  export function discovery(...args: any[]): Promise<Configuration | undefined>;
}

declare module '@temporalio/client' {
  export const Connection: any;
  export const Client: any;
  export type ClientOptions = any;
}

declare module '@temporalio/activity' {
  export interface Context {
    [key: string]: any;
  }
}

declare module '@temporalio/worker' {
  export const Worker: any;
  export const NativeConnection: any;
  export type WorkerOptions = any;
  export type ActivityExecuteInput = any;
  export type ActivityInboundCallsInterceptor = any;
  export type Next<T = any, R = any> = any;
}

declare module '@temporalio/workflow' {
  export function proxyActivities<T = any>(options?: any): T;
  export const defineSignal: any;
  export const defineQuery: any;
  export const setHandler: any;
}

declare module 'crawlee' {
  export const PlaywrightCrawler: any;
  export const Configuration: any;
  export type PlaywrightCrawlingContext = any;
}
