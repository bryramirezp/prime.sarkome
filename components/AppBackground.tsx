
import React from 'react';

const AppBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-50 pointer-events-none bg-[rgb(var(--color-bg-main))] transition-colors duration-300">
            {/* Subtle radial gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 dark:opacity-20" />
            
            {/* Optional Grain or Pattern could go here if requested, 
                for now keeping it clean and solid as per recent instructions 
                to avoid "transparent" looks in other components 
            */}
        </div>
    );
};

export default AppBackground;
