import { NextResponse } from 'next/server'

/**
 * POST /api/render-profit-video
 *
 * Starts a Remotion video render using @remotion/vercel.
 *
 * SETUP REQUIRED:
 * 1. npm install @remotion/vercel @vercel/blob
 * 2. Set env vars:
 *    - REMOTION_VERCEL_FUNCTION_NAME (your deployed Remotion function)
 *    - VERCEL_BLOB_READ_WRITE_TOKEN (for blob storage)
 * 3. Deploy Remotion bundle to Vercel (npx remotion deploy --vercel)
 *
 * When @remotion/vercel sandbox is fully available:
 * - Replace the placeholder below with actual createSandbox() flow
 * - The composition and props are already structured correctly
 */

export async function POST(req) {
  try {
    const props = await req.json()

    // Validate required props
    if (typeof props.amount !== 'number') {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 })
    }

    const renderProps = {
      amount: props.amount,
      isPositive: props.amount >= 0,
      mode: props.mode || 'total',
      completedGoals: props.completedGoals || 0,
      operationName: props.operationName || 'Resultado da operacao',
      dateLabel: props.dateLabel || new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }),
      brandName: 'NexControl',
      goalPct: props.goalPct || 0,
    }

    // ══════════════════════════════════════════════════════════
    // REMOTION VERCEL SANDBOX RENDER
    // ══════════════════════════════════════════════════════════
    //
    // When @remotion/vercel sandbox API is configured:
    //
    // const { createSandbox, addBundleToSandbox, renderMediaOnVercel } = await import('@remotion/vercel')
    // const { put } = await import('@vercel/blob')
    //
    // Step 1: Create sandbox
    // const sandbox = await createSandbox()
    //
    // Step 2: Add Remotion bundle
    // await addBundleToSandbox({
    //   sandbox,
    //   bundlePath: './remotion-bundle', // pre-built with: npx remotion bundle ./remotion/Root.jsx
    // })
    //
    // Step 3: Render
    // const result = await renderMediaOnVercel({
    //   sandbox,
    //   composition: 'ProfitResultVideo',
    //   inputProps: renderProps,
    //   codec: 'h264',
    //   outputFormat: 'mp4',
    // })
    //
    // Step 4: Upload to Vercel Blob
    // const blob = await put(`videos/nexcontrol-${Date.now()}.mp4`, result.buffer, {
    //   access: 'public',
    //   token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    // })
    //
    // return NextResponse.json({
    //   status: 'done',
    //   url: blob.url,
    //   renderId: sandbox.id,
    // })
    //
    // ══════════════════════════════════════════════════════════

    // CURRENT: Return props for client-side Canvas fallback render
    // This will be replaced by the Remotion Vercel pipeline above
    // once sandbox credentials are configured
    const renderId = `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    return NextResponse.json({
      status: 'use_client_render',
      renderId,
      props: renderProps,
      message: 'Remotion Vercel sandbox not configured. Using client-side render.',
      setup_instructions: {
        step1: 'npx remotion bundle ./remotion/Root.jsx --out-dir=remotion-bundle',
        step2: 'Configure REMOTION_VERCEL_FUNCTION_NAME env var',
        step3: 'Configure VERCEL_BLOB_READ_WRITE_TOKEN env var',
        step4: 'Uncomment the Remotion Vercel section in this file',
      },
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
