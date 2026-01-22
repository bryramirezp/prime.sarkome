import { useState, useEffect, useCallback } from 'react';
import { Project, SavedItem, ProjectsArraySchema } from '../schemas/projectSchema';

const STORAGE_KEY = 'primekg_projects';

/**
 * Hook for managing research projects/collections.
 * Stores projects in localStorage with automatic persistence.
 */
export const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // Load projects from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const validated = ProjectsArraySchema.parse(parsed);
                setProjects(validated);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            setProjects([]);
        }
    }, []);

    // Save projects to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
            console.error('Failed to save projects:', error);
        }
    }, [projects]);

    /**
     * Create a new project
     */
    const createProject = useCallback((name: string, description?: string, color?: string) => {
        const newProject: Project = {
            id: `project_${Date.now()}`,
            name,
            description,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            color: color || '#6366f1', // Default indigo
            starred: false,
        };

        setProjects(prev => [...prev, newProject]);
        setCurrentProjectId(newProject.id);
        return newProject.id;
    }, []);

    /**
     * Delete a project
     */
    const deleteProject = useCallback((projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (currentProjectId === projectId) {
            setCurrentProjectId(null);
        }
    }, [currentProjectId]);

    /**
     * Rename a project
     */
    const renameProject = useCallback((projectId: string, newName: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? { ...p, name: newName, updatedAt: new Date() }
                : p
        ));
    }, []);

    /**
     * Update project description
     */
    const updateProjectDescription = useCallback((projectId: string, description: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? { ...p, description, updatedAt: new Date() }
                : p
        ));
    }, []);

    /**
     * Toggle project starred status
     */
    const toggleProjectStar = useCallback((projectId: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? { ...p, starred: !p.starred, updatedAt: new Date() }
                : p
        ));
    }, []);

    /**
     * Add an item to a project
     */
    const addItemToProject = useCallback((
        projectId: string,
        type: SavedItem['type'],
        name: string,
        data: any,
        notes?: string,
        tags?: string[]
    ) => {
        const newItem: SavedItem = {
            id: `item_${Date.now()}`,
            type,
            name,
            data,
            notes,
            timestamp: new Date(),
            tags,
        };

        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? {
                    ...p,
                    items: [...p.items, newItem],
                    updatedAt: new Date()
                }
                : p
        ));

        return newItem.id;
    }, []);

    /**
     * Remove an item from a project
     */
    const removeItemFromProject = useCallback((projectId: string, itemId: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? {
                    ...p,
                    items: p.items.filter(i => i.id !== itemId),
                    updatedAt: new Date()
                }
                : p
        ));
    }, []);

    /**
     * Update item notes
     */
    const updateItemNotes = useCallback((projectId: string, itemId: string, notes: string) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? {
                    ...p,
                    items: p.items.map(i =>
                        i.id === itemId ? { ...i, notes } : i
                    ),
                    updatedAt: new Date()
                }
                : p
        ));
    }, []);

    /**
     * Update item tags
     */
    const updateItemTags = useCallback((projectId: string, itemId: string, tags: string[]) => {
        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? {
                    ...p,
                    items: p.items.map(i =>
                        i.id === itemId ? { ...i, tags } : i
                    ),
                    updatedAt: new Date()
                }
                : p
        ));
    }, []);

    /**
     * Get current project
     */
    const currentProject = currentProjectId
        ? projects.find(p => p.id === currentProjectId) || null
        : null;

    /**
     * Export project as JSON
     */
    const exportProject = useCallback((projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return null;

        const exportData = {
            ...project,
            exportedAt: new Date().toISOString(),
            version: '1.0',
        };

        return JSON.stringify(exportData, null, 2);
    }, [projects]);

    /**
     * Import project from JSON
     */
    const importProject = useCallback((jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            const validated = ProjectsArraySchema.parse([data]);
            const imported = validated[0];

            // Generate new ID to avoid conflicts
            const newProject: Project = {
                ...imported,
                id: `project_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            setProjects(prev => [...prev, newProject]);
            return newProject.id;
        } catch (error) {
            console.error('Failed to import project:', error);
            return null;
        }
    }, []);

    return {
        projects,
        currentProject,
        currentProjectId,
        setCurrentProjectId,
        createProject,
        deleteProject,
        renameProject,
        updateProjectDescription,
        toggleProjectStar,
        addItemToProject,
        removeItemFromProject,
        updateItemNotes,
        updateItemTags,
        exportProject,
        importProject,
    };
};
