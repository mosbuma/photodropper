import os from 'os'
import { NextResponse } from 'next/server'

export async function GET() {
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

  console.log(`[local-ip] localIp: ${localIp}`)

  return NextResponse.json({ localIp: localIp || '127.0.0.1' })
} 