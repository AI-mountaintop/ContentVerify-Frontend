import React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

interface DataStatusIndicatorProps {
    hasData: boolean;
    needsRevision?: boolean;
    label: string;
}

const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({ hasData, needsRevision = false, label }) => {
    if (needsRevision) {
        return (
            <span className="inline-flex items-center gap-1 text-orange-600">
                <RotateCcw size={14} />
                <span className="text-sm">{label}</span>
            </span>
        );
    }

    if (hasData) {
        return (
            <span className="inline-flex items-center gap-1 text-green-600">
                <Check size={14} />
                <span className="text-sm">{label}</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-gray-400">
            <X size={14} />
            <span className="text-sm">{label}</span>
        </span>
    );
};

export default DataStatusIndicator;
