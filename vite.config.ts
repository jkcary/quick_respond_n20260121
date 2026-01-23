import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const mockVoiceSegmentPlugin = (): Plugin => ({
  name: 'mock-voice-segment',
  configureServer(server) {
    server.middlewares.use('/api/voice/segment-match', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const payload = body ? JSON.parse(body) : {}
          const transcript = typeof payload.transcript === 'string' ? payload.transcript.trim() : ''
          const wordCount = Array.isArray(payload.words) ? payload.words.length : 10

          if (!transcript) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'transcript is required' }))
            return
          }

          const expectedWords = Array.isArray(payload.words) ? payload.words : []
          const fallbackDictionary = [
            '\u6bcd\u4eb2',
            '\u4f60\u7684',
            '\u86cb\u7cd5',
            '\u5b66\u6821',
            '\u6709\u8da3\u7684',
            '\u6709\u8da3',
            '\u9762\u5305',
            '\u767d\u8272',
            '\u5144\u5f1f',
            '\u5c3a\u5b50',
            '\u5927\u5934',
            '\u624b',
            '\u9000',
            '\u817f',
          ].sort((a, b) => b.length - a.length)
          let remaining = transcript
          const segments: string[] = []

          const takeLeadingDigits = () => {
            const match = remaining.match(/^\d+/)
            if (!match) return null
            const digits = match[0]
            remaining = remaining.slice(digits.length)
            return digits.split('').join('/')
          }

          const getCandidates = (word: any) => {
            const candidates: string[] = []
            if (word?.zh) candidates.push(String(word.zh))
            if (Array.isArray(word?.chinese)) {
              candidates.push(...word.chinese.map((item: string) => String(item)))
            }
            return candidates.map((item) => item.trim()).filter(Boolean)
          }

          for (let i = 0; i < wordCount; i += 1) {
            if (i === 0) {
              const digits = takeLeadingDigits()
              if (digits) {
                segments.push(digits)
                continue
              }
            }

            if (remaining.startsWith('\u4eb2\u7684') && i + 1 < wordCount) {
              segments.push('\u6bcd\u4eb2')
              segments.push('\u4f60\u7684')
              remaining = remaining.slice(2)
              i += 1
              continue
            }

            const candidates = getCandidates(expectedWords[i])
            const matched = candidates.find((candidate) => remaining.startsWith(candidate))
            if (matched) {
              segments.push(matched)
              remaining = remaining.slice(matched.length)
              continue
            }

            const fallbackMatch = fallbackDictionary.find((candidate) =>
              remaining.startsWith(candidate),
            )
            if (fallbackMatch) {
              segments.push(fallbackMatch)
              remaining = remaining.slice(fallbackMatch.length)
              continue
            }

            if (remaining.length > 0) {
              segments.push(remaining.slice(0, 1))
              remaining = remaining.slice(1)
            } else {
              segments.push('')
            }
          }

          let normalized = segments
          if (normalized.length > wordCount) {
            const overflow = normalized.slice(wordCount - 1).join(' ')
            normalized = [...normalized.slice(0, wordCount - 1), overflow]
          }

          if (normalized.length < wordCount) {
            normalized = [...normalized, ...Array(wordCount - normalized.length).fill('')]
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ segments: normalized }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
        }
      })
    })

    server.middlewares.use('/api/ai-log', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          const payload = body ? JSON.parse(body) : {}
          const logsDir = path.resolve(__dirname, 'logs')
          const logFile = path.join(logsDir, 'ai-usage.log')
          fs.mkdirSync(logsDir, { recursive: true })
          const line = `${JSON.stringify({
            ...payload,
            timestamp: payload.timestamp ?? new Date().toISOString(),
          })}\n`
          fs.appendFileSync(logFile, line, 'utf-8')
          res.statusCode = 204
          res.end()
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
          )
        }
      })
    })
  },
})

export default defineConfig({
  plugins: [react(), mockVoiceSegmentPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
