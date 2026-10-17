import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const PORT = 5173
const URL = `http://localhost:${PORT}`

function findChromePath() {
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) return p
    }
  } else if (process.platform === 'darwin') {
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if (fs.existsSync(macPath)) return macPath
  } else {
    const linuxCandidates = ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium']
    for (const cmd of linuxCandidates) {
      return cmd
    }
  }
  return null
}

function launchChrome(targetUrl) {
  const chromePath = findChromePath()
  const tempProfileDir = path.join(os.tmpdir(), 'chrome-vite-debug-profile')

  const chromeArgs = [
    `--remote-debugging-port=9222`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--auto-open-devtools-for-tabs',
    targetUrl,
  ]

  console.log(`\n🚀 Launching Google Chrome for debugging...`)
  console.log(`   URL: ${targetUrl}`)
  console.log(`   Remote Debugging Port: 9222`)
  console.log(`   DevTools: Auto-opening`)

  if (chromePath) {
    const chromeProc = spawn(chromePath, chromeArgs, {
      detached: true,
      stdio: 'ignore',
    })
    chromeProc.unref()
  } else {
    console.log(`⚠️ Chrome executable not found directly, falling back to system default launcher...`)
    const command = process.platform === 'win32' ? `start "" "${targetUrl}"` : `open "${targetUrl}"`
    spawn(command, { shell: true, detached: true, stdio: 'ignore' }).unref()
  }
}

console.log('⚡ Starting Vite development server...')
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const viteProc = spawn(npxCmd, ['vite'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
})

let opened = false

function checkOutput(data) {
  const output = data.toString()
  process.stdout.write(output)

  if (!opened && (output.includes('localhost:') || output.includes('Local:'))) {
    opened = true
    // Give Vite server a moment to finish binding
    setTimeout(() => {
      launchChrome(URL)
    }, 600)
  }
}

viteProc.stdout.on('data', checkOutput)
viteProc.stderr.on('data', (data) => {
  process.stderr.write(data.toString())
})

viteProc.on('close', (code) => {
  process.exit(code || 0)
})

process.on('SIGINT', () => {
  viteProc.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  viteProc.kill('SIGTERM')
  process.exit(0)
})

