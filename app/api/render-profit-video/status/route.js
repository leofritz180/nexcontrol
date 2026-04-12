import { NextResponse } from 'next/server'

/**
 * POST /api/render-profit-video/status
 *
 * Check render status.
 * When Remotion Vercel is configured, this will query the sandbox status.
 *
 * FUTURE:
 * const { getRenderProgress } = await import('@remotion/vercel')
 * const progress = await getRenderProgress({ renderId, sandbox })
 * return NextResponse.json({
 *   status: progress.done ? 'done' : 'rendering',
 *   progress: progress.overallProgress,
 *   url: progress.done ? progress.outputUrl : null,
 * })
 */

export async function POST(req) {
  try {
    const { renderId } = await req.json()

    if (!renderId) {
      return NextResponse.json({ error: 'renderId required' }, { status: 400 })
    }

    // Current: client-side render doesn't need status polling
    return NextResponse.json({
      renderId,
      status: 'client_render',
      message: 'Render is handled client-side. No server status available.',
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
