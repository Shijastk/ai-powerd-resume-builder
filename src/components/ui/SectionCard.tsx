import React from 'react';
import { Plus, ChevronUp, ChevronDown, Eye, EyeOff, Edit2 } from 'lucide-react';

export const SectionCard = ({
    title,
    icon: Icon,
    children,
    onAdd,
    id,
    isVisible = true,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onToggleVisibility,
    onTitleChange
}: any) => (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6 transition-all ${!isVisible ? 'opacity-60' : ''}`}>
        <div className="relative px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 flex-1 group/title cursor-text">
                <Icon size={18} className="text-blue-600 shrink-0" />
                <div className="relative flex-1">
                    <input
                        value={title}
                        onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                        className="bg-transparent font-black uppercase tracking-widest text-slate-800 text-xs w-full outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 placeholder:text-slate-400 py-1 transition-colors"
                        placeholder="SECTION TITLE"
                    />
                    <Edit2 size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 group-hover/title:opacity-100 pointer-events-none transition-opacity" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                {onMoveUp && <button disabled={isFirst} onClick={onMoveUp} className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronUp size={16} /></button>}
                {onMoveDown && <button disabled={isLast} onClick={onMoveDown} className="p-1.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronDown size={16} /></button>}

                {onToggleVisibility && (
                    <button onClick={onToggleVisibility} className={`p-1.5 transition-colors ${isVisible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'} rounded-lg`}>
                        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                )}

                {onAdd && isVisible && (
                    <button onClick={onAdd} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={14} /> <span className="text-[10px] font-bold">ADD</span>
                    </button>
                )}
            </div>
        </div>
        {isVisible && (
            <div className="p-6 space-y-4">
                {children}
            </div>
        )}
    </div>
);
