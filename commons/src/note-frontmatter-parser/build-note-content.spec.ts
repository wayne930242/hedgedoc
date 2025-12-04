/*
 * SPDX-FileCopyrightText: 2025 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
  parseNoteContent,
  buildNoteContent,
  applyNotePatch,
} from './build-note-content.js'
import { describe, expect, it } from '@jest/globals'

describe('parseNoteContent', () => {
  it('should parse content without frontmatter', () => {
    const content = '# Hello World\n\nThis is content.'
    const result = parseNoteContent(content)

    expect(result.frontmatter).toEqual({})
    expect(result.content).toBe(content)
  })

  it('should parse content with frontmatter', () => {
    const content = `---
title: Test Title
description: Test Description
tags:
  - tag1
  - tag2
---
# Hello World

This is content.`
    const result = parseNoteContent(content)

    expect(result.frontmatter['title']).toBe('Test Title')
    expect(result.frontmatter['description']).toBe('Test Description')
    expect(result.frontmatter['tags']).toEqual(['tag1', 'tag2'])
    expect(result.content).toBe('# Hello World\n\nThis is content.')
  })

  it('should handle empty frontmatter block by treating it as no frontmatter', () => {
    const content = `---
---
# Hello World`
    const result = parseNoteContent(content)

    // When frontmatter block is empty (rawText is ''), we treat the entire content as-is
    // This is because extractFrontmatter returns rawText: '' for empty blocks
    expect(result.frontmatter).toEqual({})
    expect(result.content).toBe(content)
  })
})

describe('buildNoteContent', () => {
  it('should build content without frontmatter if empty', () => {
    const frontmatter = {}
    const content = '# Hello World'

    const result = buildNoteContent(frontmatter, content)

    expect(result).toBe('# Hello World')
  })

  it('should build content with frontmatter', () => {
    const frontmatter = {
      title: 'Test Title',
      description: 'Test Description',
    }
    const content = '# Hello World'

    const result = buildNoteContent(frontmatter, content)

    expect(result).toContain('---')
    expect(result).toContain('title: Test Title')
    expect(result).toContain('description: Test Description')
    expect(result).toContain('# Hello World')
  })

  it('should filter out empty values from frontmatter', () => {
    const frontmatter = {
      title: 'Test Title',
      description: '',
      tags: [],
      opengraph: {},
    }
    const content = '# Hello World'

    const result = buildNoteContent(frontmatter, content)

    expect(result).toContain('title: Test Title')
    expect(result).not.toContain('description')
    expect(result).not.toContain('tags')
    expect(result).not.toContain('opengraph')
  })
})

describe('applyNotePatch', () => {
  const baseContent = `---
title: Original Title
description: Original Description
tags:
  - original-tag
---
# Original Content

This is the original content.`

  it('should update only title', () => {
    const result = applyNotePatch(baseContent, { title: 'New Title' })

    expect(result).toContain('title: New Title')
    expect(result).toContain('description: Original Description')
    expect(result).toContain('# Original Content')
  })

  it('should update only description', () => {
    const result = applyNotePatch(baseContent, {
      description: 'New Description',
    })

    expect(result).toContain('title: Original Title')
    expect(result).toContain('description: New Description')
  })

  it('should update only tags', () => {
    const result = applyNotePatch(baseContent, { tags: ['new-tag1', 'new-tag2'] })

    expect(result).toContain('title: Original Title')
    expect(result).toContain('new-tag1')
    expect(result).toContain('new-tag2')
    expect(result).not.toContain('original-tag')
  })

  it('should update only content', () => {
    const result = applyNotePatch(baseContent, { content: '# New Content\n\nNew body.' })

    expect(result).toContain('title: Original Title')
    expect(result).toContain('# New Content')
    expect(result).toContain('New body.')
    expect(result).not.toContain('Original Content')
  })

  it('should update multiple fields at once', () => {
    const result = applyNotePatch(baseContent, {
      title: 'New Title',
      description: 'New Description',
      content: '# New Content',
    })

    expect(result).toContain('title: New Title')
    expect(result).toContain('description: New Description')
    expect(result).toContain('# New Content')
  })

  it('should handle content without frontmatter', () => {
    const contentWithoutFrontmatter = '# Just Content\n\nNo frontmatter here.'
    const result = applyNotePatch(contentWithoutFrontmatter, {
      title: 'Added Title',
    })

    expect(result).toContain('title: Added Title')
    expect(result).toContain('# Just Content')
  })

  it('should preserve frontmatter when only updating content', () => {
    const result = applyNotePatch(baseContent, {
      content: '# Brand New Content',
    })

    expect(result).toContain('title: Original Title')
    expect(result).toContain('description: Original Description')
    expect(result).toContain('original-tag')
    expect(result).toContain('# Brand New Content')
  })
})
