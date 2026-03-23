import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const packageJsonPath = path.join(repoRoot, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredFiles = [
  'assets/icon.png',
  'assets/tray-icon.png',
  'assets/darkreader.js',
  'src/main/index.ts',
  'src/preload/index.ts',
  'src/renderer/main.tsx'
]

const failures = []

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`)
  }
}

if (packageJson.main !== 'dist/main/main/index.js') {
  failures.push(`Unexpected package.json main entry: ${packageJson.main}`)
}

const buildConfig = packageJson.build ?? {}
const outputDir = buildConfig.directories?.output
if (outputDir !== 'release') {
  failures.push(`Expected build.directories.output to be "release", received "${outputDir ?? 'undefined'}"`)
}

const filePatterns = buildConfig.files ?? []
for (const expectedPattern of ['dist/**/*', 'package.json']) {
  if (!filePatterns.includes(expectedPattern)) {
    failures.push(`Missing electron-builder files entry: ${expectedPattern}`)
  }
}

const extraResources = buildConfig.extraResources ?? []
for (const requiredResource of ['assets/icon.png', 'assets/tray-icon.png', 'assets/darkreader.js']) {
  if (!extraResources.some((entry) => entry.from === requiredResource)) {
    failures.push(`Missing extraResources entry for ${requiredResource}`)
  }
}

if (failures.length > 0) {
  console.error('Release check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Release check passed for WebWrangler ${packageJson.version}.`)
