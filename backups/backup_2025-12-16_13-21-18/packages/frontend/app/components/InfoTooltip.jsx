'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

export default function InfoTooltip({ content, position = 'top' }) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
                <Info className="h-3 w-3" />
            </button>

            {isVisible && (
                <div
                    className={`absolute ${positionClasses[position]} z-50 w-64 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-700`}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="relative">
                        {content}
                        {/* Arrow */}
                        <div
                            className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 border-gray-700 transform rotate-45 ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b' :
                                    position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t' :
                                        position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' :
                                            'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
                                }`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
