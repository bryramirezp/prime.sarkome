import { z } from 'zod';

/**
 * Schema for saved items within a project.
 * Can be entities, paths, hypotheses, or entire chat messages.
 */
export const SavedItemSchema = z.object({
    id: z.string(),
    type: z.enum(['entity', 'path', 'hypothesis', 'message', 'graph']),
    name: z.string(),
    data: z.any(),
    notes: z.string().optional(),
    timestamp: z.union([z.string(), z.date()]).transform((val) =>
        typeof val === 'string' ? new Date(val) : val
    ),
    tags: z.array(z.string()).optional(),
});

/**
 * Schema for a research project/collection.
 */
export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    items: z.array(SavedItemSchema),
    createdAt: z.union([z.string(), z.date()]).transform((val) =>
        typeof val === 'string' ? new Date(val) : val
    ),
    updatedAt: z.union([z.string(), z.date()]).transform((val) =>
        typeof val === 'string' ? new Date(val) : val
    ),
    color: z.string().optional(), // For visual organization
    starred: z.boolean().optional(),
});

export const ProjectsArraySchema = z.array(ProjectSchema);

export type SavedItem = z.infer<typeof SavedItemSchema>;
export type Project = z.infer<typeof ProjectSchema>;
