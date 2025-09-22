import React from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
    if (!content) {
        return <>{children}</>;
    }
    return (
        <div className={`tooltip-container ${className || ''}`}>
            {children}
            <div className="tooltip-text">
                {content}
            </div>
        </div>
    );
};

export default Tooltip;
