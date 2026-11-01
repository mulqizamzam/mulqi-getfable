/**
 * Host bundle entry for mulqi-getfable.
 *
 * `src/policy-service.ts` is the policy service; this thin entry re-exports it
 * as the default export so the host's cordis loader mounts it, and wires the
 * two host RPC channels onto the web-only `connection` service.
 */
import type { Context } from '@deepseek-ai/cordis'
import { GfPolicy, PLUGIN_VERSION } from '../policy-service.ts'
import {
  GF_READ_CHANNEL,
  GF_WRITE_CHANNEL,
  type GfResult,
  type GfRouteRequest,
} from '../core/wire.ts'

export { GfPolicy, PLUGIN_VERSION }
export default GfPolicy

/** Mount the two host RPC channels (web-only; no-op on a headless profile). */
export function wireGfRpc(ctx: Context): void {
  ctx.inject(['connection'], (injected) => {
    const connection = (injected as { connection?: unknown }).connection
    if (connection === undefined || connection === null) return
    const rpc = (connection as { rpc?: { handle?: (c: string, h: unknown) => (() => void) | undefined } }).rpc
    if (rpc === undefined || typeof rpc.handle !== 'function') return
    const policy = ctx.gf
    const read = (endpoint: string): Promise<GfResult<unknown>> =>
      new Promise<GfResult<unknown>>((resolve) => {
        void endpoint
        resolve({ ok: true, value: undefined })
      })
    void read
    // Endpoints are handled inside the service via its own endpoint dispatch;
    // the handle() registration receives a dispatcher built by the service.
    const readDispatcher = policy.endpointDispatcher?.('read')
    const writeDispatcher = policy.endpointDispatcher?.('write')
    if (typeof readDispatcher === 'function') {
      rpc.handle(GF_READ_CHANNEL, readDispatcher)
    }
    if (typeof writeDispatcher === 'function') {
      rpc.handle(GF_WRITE_CHANNEL, writeDispatcher)
    }
  })
}

/** Call-site convenience: the service's dispatcher for a channel kind. */
export type GfEndpointDispatcher = (channel: string, endpoint: string, payload: unknown) => Promise<GfResult<unknown>>

export { GfRouteRequest }
