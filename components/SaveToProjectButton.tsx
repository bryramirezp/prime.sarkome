import React, { useState } from 'react';
import { Project, SavedItem } from '../schemas/projectSchema';

interface SaveToProjectButtonProps {
    itemType: SavedItem['type'];
    itemName: string;
    itemData: any;
    projects: Project[];
    onSaveToProject: (projectId: string, type: SavedItem['type'], name: string, data: any, notes?: string, tags?: string[]) => void;
    onCreateProject: (name: string) => string;
    darkMode?: boolean;
}

/**
 * Button to save an item (entity, hypothesis, message, etc.) to a project.
 * Shows a dropdown menu to select the target project.
 */
const SaveToProjectButton: React.FC<SaveToProjectButtonProps> = ({
    itemType,
    itemName,
    itemData,
    projects,
    onSaveToProject,
    onCreateProject,
    darkMode = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [saved, setSaved] = useState(false);

    const handleSave = (projectId: string) => {
        onSaveToProject(projectId, itemType, itemName, itemData);
        setSaved(true);
        setShowMenu(false);

        // Reset saved state after animation
        setTimeout(() => setSaved(false), 2000);
    };

    const handleCreateAndSave = () => {
        if (!newProjectName.trim()) return;

        const projectId = onCreateProject(newProjectName);
        handleSave(projectId);
        setNewProjectName('');
        setShowCreateInput(false);
    };

    // Temporarily hidden as per user request (Projects -> Working mode transition)
    return null; 
};

export default SaveToProjectButton;
