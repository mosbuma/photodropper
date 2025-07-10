import os from 'os'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // In production (Vercel), use the domain name from the host header
  if (process.env.VERCEL === '1') {
    const host = req.headers.get('host')
    const protocol = req.headers.get('x-forwarded-proto') || 'https'
    
    if (host) {
      const domain = `${protocol}://${host}`
      console.log(`[local-ip] production domain: ${domain}`)
      return NextResponse.json({ localIp: domain })
    }
  }

  // Check for other production indicators
  const isProduction = process.env.NODE_ENV === 'production'
  const host = req.headers.get('host')
  
  if (isProduction && host) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https'
    const domain = `${protocol}://${host}`
    console.log(`[local-ip] production (NODE_ENV) domain: ${domain}`)
    return NextResponse.json({ localIp: domain })
  }

  // In development, use local IP
  const interfaces = os.networkInterfaces()
  let localIp = null
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address
        break
      }
    }
    if (localIp) break
  }

  console.log(`[local-ip] development localIp: ${localIp}`)

  return NextResponse.json({ localIp: localIp || '127.0.0.1' })
} 