import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const repositoryRoot = process.cwd()
const canonicalRoot = join(repositoryRoot, 'skills')
const adapterRoots = [
  join(repositoryRoot, '.agents', 'skills'),
  join(repositoryRoot, '.claude', 'skills'),
]
const errors = []

function parseFrontmatter(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)

  if (!match) {
    errors.push(`${relative(repositoryRoot, filePath)} has no YAML frontmatter`)
    return { metadata: {}, source }
  }

  const metadata = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) {
      errors.push(
        `${relative(repositoryRoot, filePath)} has unsupported frontmatter: ${line}`
      )
      continue
    }

    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    metadata[key] = value
  }

  return { metadata, source }
}

function validateLinks(filePath, source) {
  const markdownLink = /\[[^\]]*]\(([^)]+)\)/g

  for (const match of source.matchAll(markdownLink)) {
    const target = match[1].split('#')[0]
    if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) {
      continue
    }

    const resolvedTarget = resolve(dirname(filePath), target)
    if (!existsSync(resolvedTarget)) {
      errors.push(
        `${relative(repositoryRoot, filePath)} links to missing ${target}`
      )
    }
  }
}

if (!existsSync(canonicalRoot)) {
  errors.push('skills directory is missing')
}

const packages = existsSync(canonicalRoot)
  ? readdirSync(canonicalRoot)
      .filter((entry) => statSync(join(canonicalRoot, entry)).isDirectory())
      .filter((entry) => existsSync(join(canonicalRoot, entry, 'SKILL.md')))
      .sort()
  : []

for (const packageName of packages) {
  const skillPath = join(canonicalRoot, packageName, 'SKILL.md')
  const { metadata, source } = parseFrontmatter(skillPath)
  const metadataKeys = Object.keys(metadata).sort()

  if (
    packageName.length > 64 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packageName)
  ) {
    errors.push(
      `${relative(repositoryRoot, skillPath)} folder must use a lowercase hyphenated name of at most 64 characters`
    )
  }
  if (metadata.name !== packageName) {
    errors.push(
      `${relative(repositoryRoot, skillPath)} name must equal ${packageName}`
    )
  }
  if (!metadata.description) {
    errors.push(`${relative(repositoryRoot, skillPath)} needs a description`)
  }
  if (
    metadataKeys.length !== 2 ||
    metadataKeys[0] !== 'description' ||
    metadataKeys[1] !== 'name'
  ) {
    errors.push(
      `${relative(repositoryRoot, skillPath)} frontmatter may contain only name and description`
    )
  }
  if (/\b(?:TODO|replace-with|\[TODO)\b/i.test(source)) {
    errors.push(`${relative(repositoryRoot, skillPath)} contains a placeholder`)
  }

  validateLinks(skillPath, source)

  const openaiMetadataPath = join(
    canonicalRoot,
    packageName,
    'agents',
    'openai.yaml'
  )
  if (!existsSync(openaiMetadataPath)) {
    errors.push(
      `${relative(repositoryRoot, openaiMetadataPath)} is required for project skills`
    )
  } else {
    const openaiMetadata = readFileSync(openaiMetadataPath, 'utf8')
    const defaultPrompt = openaiMetadata.match(
      /^\s*default_prompt:\s*["'](.+)["']\s*$/m
    )?.[1]
    const shortDescription = openaiMetadata.match(
      /^\s*short_description:\s*["'](.+)["']\s*$/m
    )?.[1]

    if (!defaultPrompt?.includes(`$${packageName}`)) {
      errors.push(
        `${relative(repositoryRoot, openaiMetadataPath)} default_prompt must mention $${packageName}`
      )
    }
    if (
      !shortDescription ||
      shortDescription.length < 25 ||
      shortDescription.length > 64
    ) {
      errors.push(
        `${relative(repositoryRoot, openaiMetadataPath)} short_description must be 25-64 characters`
      )
    }
  }

  for (const adapterRoot of adapterRoots) {
    const adapterPath = join(adapterRoot, packageName, 'SKILL.md')
    if (!existsSync(adapterPath)) {
      errors.push(`${relative(repositoryRoot, adapterPath)} is missing`)
      continue
    }

    const adapter = parseFrontmatter(adapterPath)
    const adapterMetadataKeys = Object.keys(adapter.metadata).sort()
    if (adapter.metadata.name !== metadata.name) {
      errors.push(
        `${relative(repositoryRoot, adapterPath)} name differs from the canonical skill`
      )
    }
    if (adapter.metadata.description !== metadata.description) {
      errors.push(
        `${relative(repositoryRoot, adapterPath)} description differs from the canonical skill`
      )
    }
    if (
      adapterMetadataKeys.length !== 2 ||
      adapterMetadataKeys[0] !== 'description' ||
      adapterMetadataKeys[1] !== 'name'
    ) {
      errors.push(
        `${relative(repositoryRoot, adapterPath)} frontmatter may contain only name and description`
      )
    }
    if (!adapter.source.includes(`../../../skills/${packageName}/SKILL.md`)) {
      errors.push(
        `${relative(repositoryRoot, adapterPath)} does not point to the canonical skill`
      )
    }

    validateLinks(adapterPath, adapter.source)
  }
}

for (const adapterRoot of adapterRoots) {
  if (!existsSync(adapterRoot)) {
    errors.push(`${relative(repositoryRoot, adapterRoot)} is missing`)
    continue
  }

  const adapters = readdirSync(adapterRoot)
    .filter((entry) => statSync(join(adapterRoot, entry)).isDirectory())
    .filter((entry) => existsSync(join(adapterRoot, entry, 'SKILL.md')))
    .sort()

  for (const adapter of adapters) {
    if (!packages.includes(adapter)) {
      errors.push(
        `${relative(repositoryRoot, join(adapterRoot, adapter))} has no canonical package`
      )
    }
  }
}

// docs/improvement-backlog.md is this repository's real backlog, so unlike the
// sibling repositories it is not a legacy assumption here.
const legacyAssumptions = [
  'parish-family-hub',
  'lib/schedule',
  '.claude/agents/improve-',
]
for (const packageName of ['improve', 'release-notes-on-session-end']) {
  const packageRoot = join(canonicalRoot, packageName)
  if (!existsSync(packageRoot)) {
    continue
  }

  const pending = [packageRoot]
  while (pending.length > 0) {
    const current = pending.pop()
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name)
      if (entry.isDirectory()) {
        pending.push(entryPath)
        continue
      }
      if (!/\.(?:md|ya?ml)$/i.test(entry.name)) {
        continue
      }

      const source = readFileSync(entryPath, 'utf8')
      for (const assumption of legacyAssumptions) {
        if (source.includes(assumption)) {
          errors.push(
            `${relative(repositoryRoot, entryPath)} contains legacy assumption ${assumption}`
          )
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Skill validation failed with ${errors.length} error(s):`)
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log(
    `Validated ${packages.length} canonical skills and ${
      packages.length * adapterRoots.length
    } discovery adapters.`
  )
}
