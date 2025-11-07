import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Spinner: React.FC = () => {
    const { theme } = useTheme();
    return (
        <div className="flex items-center justify-center h-full">
            <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-${theme.colors.accent}-500`}></div>
        </div>
    );
}

export default Spinner;
