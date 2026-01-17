import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500',
            textColor: 'text-green-800',
            iconColor: 'text-green-500'
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-500',
            textColor: 'text-red-800',
            iconColor: 'text-red-500'
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-500',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-500'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-500',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-500'
        }
    };

    const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

    return (
        <div className={`fixed top-24 right-8 z-[200] animate-in slide-in-from-top-4 fade-in duration-300 max-w-md`}>
            <div className={`${bgColor} ${textColor} border-l-4 ${borderColor} rounded-2xl shadow-2xl p-4 pr-12 backdrop-blur-sm`}>
                <div className="flex items-start gap-3">
                    <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} />
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 ${textColor} hover:opacity-70 transition-opacity`}
                    aria-label="Close notification"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
