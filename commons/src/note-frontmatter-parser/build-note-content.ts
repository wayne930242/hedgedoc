/*
 * SPDX-FileCopyrightText: 2025 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { dump } from 'js-yaml'
import { extractFrontmatter } from '../frontmatter-extractor/index.js'
import { NoteFrontmatter } from '../note-frontmatter/index.js'
import { DeepPartial } from '../utils/index.js'
import { parseRawFrontmatterFromYaml } from './parse-raw-frontmatter-from-yaml.js'

/**
 * Data structure for patching a note.
 * It allows partial updates to frontmatter fields (via DeepPartial<NoteFrontmatter>)
 * and the note content.
 */
export interface NotePatchData extends DeepPartial<NoteFrontmatter> {
  /**
   * The new markdown content (excluding frontmatter).
   * If undefined, the existing content will be preserved.
   */
  content?: string
}

export interface ParsedNoteContent {
  frontmatter: Record<string, unknown>
  content: string
}

/**
 * Parses note content into frontmatter object and content body
 *
 * @param noteContent The full note content including frontmatter
 * @returns The parsed frontmatter and content body
 */
export function parseNoteContent(noteContent: string): ParsedNoteContent {
  const lines = noteContent.split('\n')
  const extractionResult = extractFrontmatter(lines)

  if (!extractionResult || !extractionResult.rawText) {
    return {
      frontmatter: {},
      content: noteContent,
    }
  }

  const parsedResult = parseRawFrontmatterFromYaml(extractionResult.rawText)
  const frontmatter =
    parsedResult.error === undefined
      ? (parsedResult.value as unknown as Record<string, unknown>)
      : {}

  // Get content after frontmatter
  const contentLines = lines.slice(extractionResult.lineOffset)
  const content = contentLines.join('\n')

  return {
    frontmatter,
    content,
  }
}

/**
 * Builds note content by combining frontmatter and content body
 *
 * @param frontmatter The frontmatter object to serialize
 * @param content The content body
 * @returns The combined note content with YAML frontmatter
 */
export function buildNoteContent(
  frontmatter: Record<string, unknown>,
  content: string,
): string {
  // Filter out empty or default values from frontmatter
  const cleanedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0)
        return false
      return true
    }),
  )

  // If no frontmatter, return content as-is
  if (Object.keys(cleanedFrontmatter).length === 0) {
    return content
  }

  // Serialize frontmatter to YAML
  const yamlContent = dump(cleanedFrontmatter, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    quotingType: '"',
    forceQuotes: false,
  }).trim()

  return `---\n${yamlContent}\n---\n${content}`
}

/**
 * Applies partial updates to note content using merge strategy.
 * Only specified fields are updated, others are preserved.
 *
 * @param currentContent The current full note content
 * @param patchData The partial update data
 * @returns The updated note content
 */
export function applyNotePatch(
  currentContent: string,
  patchData: NotePatchData,
): string {
  const parsed = parseNoteContent(currentContent)
  const { content, ...frontmatterPatch } = patchData

  // Merge frontmatter updates
  // We use spread to overwrite existing keys with new values
  const updatedFrontmatter = { ...parsed.frontmatter, ...frontmatterPatch }

  // Use new content if provided, otherwise keep existing
  const updatedContent = content !== undefined ? content : parsed.content

  return buildNoteContent(updatedFrontmatter, updatedContent)
}
