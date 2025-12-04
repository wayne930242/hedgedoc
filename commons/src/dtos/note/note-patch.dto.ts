/*
 * SPDX-FileCopyrightText: 2025 The HedgeDoc developers (see AUTHORS file)
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { z } from 'zod'

/**
 * Schema for partial note updates via PATCH endpoint.
 * All fields are optional - only provided fields will be updated.
 * Uses merge strategy: existing values are preserved for unspecified fields.
 */
export const NotePatchSchema = z
  .object({
    /**
     * Update the note title in frontmatter.
     * If provided, replaces the title field in the YAML frontmatter.
     */
    title: z
      .string()
      .optional()
      .describe('The new title for the note frontmatter'),

    /**
     * Update the note description in frontmatter.
     */
    description: z
      .string()
      .optional()
      .describe('The new description for the note frontmatter'),

    /**
     * Update the tags in frontmatter.
     * Replaces the entire tags array.
     */
    tags: z
      .array(z.string())
      .optional()
      .describe('The new tags array for the note frontmatter'),

    /**
     * Update the main content of the note (everything after frontmatter).
     * The frontmatter section will be preserved/merged.
     */
    content: z
      .string()
      .optional()
      .describe('The new markdown content (excluding frontmatter)'),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.tags !== undefined ||
      data.content !== undefined,
    {
      message: 'At least one field must be provided for update',
    },
  )
  .describe('DTO for partial note updates via PATCH')

export type NotePatchInterface = z.infer<typeof NotePatchSchema>
