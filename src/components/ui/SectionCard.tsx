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
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors hover:border-slate-300 ${!isVisible ? 'opacity-60' : ''}`}>
        <div className="relative pl-4 pr-3 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5 flex-1 group/title cursor-text min-w-0">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Icon size={15} />
                </span>
                <div className="relative flex-1 min-w-0">
                    <input
                        value={title}
                        onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                        className="bg-transparent font-semibold uppercase tracking-[0.13em] text-slate-700 text-[11px] w-full outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 placeholder:text-slate-300 py-0.5 transition-colors"
                        placeholder="SECTION TITLE"
                    />
                    <Edit2 size={11} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover/title:opacity-100 pointer-events-none transition-opacity" />
                </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
                {onMoveUp && <button disabled={isFirst} onClick={onMoveUp} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors"><ChevronUp size={15} /></button>}
                {onMoveDown && <button disabled={isLast} onClick={onMoveDown} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors"><ChevronDown size={15} /></button>}

                {onToggleVisibility && (
                    <button onClick={onToggleVisibility} className={`p-1.5 rounded-lg transition-colors ${isVisible ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                        {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                )}

                {onAdd && isVisible && (
                    <button onClick={onAdd} className="ml-1.5 bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Plus size={13} /> <span className="text-[10px] font-semibold tracking-wide uppercase">Add</span>
                    </button>
                )}
            </div>
        </div>
        {isVisible && (
            <div className="p-5 space-y-4">
                {children}
            </div>
        )}
    </div>
);
