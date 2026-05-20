import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import JavascriptObfuscator from 'javascript-obfuscator'

function obfuscatorPlugin(): Plugin {
  return {
    name: 'javascript-obfuscator',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && !chunk.fileName.includes('vendor')) {
          chunk.code = JavascriptObfuscator.obfuscate(chunk.code, {
            compact: true,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 1,
            rotateStringArray: true,
            shuffleStringArray: true,
            splitStrings: true,
            splitStringsChunkLength: 8,
            identifierNamesGenerator: 'hexadecimal',
            controlFlowFlattening: false,
            deadCodeInjection: false,
          }).getObfuscatedCode()
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), obfuscatorPlugin()],
  base: '/aurora-corp/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
