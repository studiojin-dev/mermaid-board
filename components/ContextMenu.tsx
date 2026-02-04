
import React from 'react';
import { Language } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string | null;
  edgeInfo: { source: string; target: string; label?: string } | null;
  onClose: () => void;
  onAddNode: (targetName: string, transition: string, edgeLabel: string, sourceId?: string) => void;
  onExplain: (id: string, isEdge: boolean) => void;
  language?: Language;
}

const ARROW_TYPES = {
  [Language.KO]: [
    { label: '일반 (-->)', value: '-->' },
    { label: '점선 (-.->)', value: '-.->' },
    { label: '두꺼운 (==>)', value: '==>' },
    { label: '상속 (--|>)', value: '--|>' },
    { label: '연결 (---)', value: '---' }
  ],
  [Language.EN]: [
    { label: 'Normal (-->)', value: '-->' },
    { label: 'Dotted (-.->)', value: '-.->' },
    { label: 'Thick (==>)', value: '==>' },
    { label: 'Inherit (--|>)', value: '--|>' },
    { label: 'Connect (---)', value: '---' }
  ]
};

const UI_TEXT = {
  [Language.KO]: {
    rel: "관계 정보",
    node: "노드 정보",
    bg: "새 관계 추가",
    analyze: "AI 분석",
    connectType: "연결 타입",
    edgeLabel: "관계 설명 (Label)",
    edgeLabelPlaceholder: "예: 승인됨, 클릭함",
    sourceName: "출발 노드 (Source)",
    targetName: "도착 노드 (Target)",
    nodePlaceholder: "이름 입력...",
    cancel: "취소",
    add: "생성하기",
    required: "필수 입력"
  },
  [Language.EN]: {
    rel: "Relationship",
    node: "Node Info",
    bg: "Add Relationship",
    analyze: "Analyze",
    connectType: "Arrow Type",
    edgeLabel: "Edge Label",
    edgeLabelPlaceholder: "e.g., approved",
    sourceName: "Source Node",
    targetName: "Target Node",
    nodePlaceholder: "Enter name...",
    cancel: "Cancel",
    add: "Create",
    required: "Required"
  }
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, y, nodeId, edgeInfo, onClose, onAddNode, onExplain,
  language = Language.KO
}) => {
  const [sourceName, setSourceName] = React.useState(nodeId || '');
  const [targetName, setTargetName] = React.useState('');
  const [edgeLabel, setEdgeLabel] = React.useState('');
  const [selectedArrow, setSelectedArrow] = React.useState('-->');

  const t = UI_TEXT[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetName.trim() && sourceName.trim()) {
      onAddNode(targetName.trim(), selectedArrow, edgeLabel.trim(), sourceName.trim());
      onClose();
    }
  };

  const handleExplain = () => {
    if (edgeInfo) {
      onExplain(`${edgeInfo.source} -> ${edgeInfo.target}`, true);
    } else if (nodeId) {
      onExplain(nodeId, false);
    }
    onClose();
  };

  const isFormValid = targetName.trim() !== '' && sourceName.trim() !== '';

  return (
    <div 
      className="fixed z-[100] bg-white border border-slate-200 shadow-2xl rounded-2xl p-5 w-72 animate-in fade-in zoom-in duration-150"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {edgeInfo ? t.rel : (nodeId ? t.node : t.bg)}
        </h3>
        {(nodeId || edgeInfo) && (
          <button 
            onClick={handleExplain}
            className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>✨</span> {t.analyze}
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Field */}
        <div className="space-y-1.5">
          <label className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
            {t.sourceName}
            {!nodeId && <span className="text-rose-400 text-[8px]">{t.required}</span>}
          </label>
          <input
            type="text"
            value={sourceName}
            disabled={!!nodeId}
            onChange={(e) => setSourceName(e.target.value)}
            className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-all ${
              nodeId ? 'bg-slate-50 border-slate-100 text-slate-400 font-bold' : 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
            placeholder={t.nodePlaceholder}
          />
        </div>

        {/* Arrow & Label Group */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t.connectType}</label>
            <select 
              value={selectedArrow}
              onChange={(e) => setSelectedArrow(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer font-mono"
            >
              {ARROW_TYPES[language].map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t.edgeLabel}</label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder={t.edgeLabelPlaceholder}
            />
          </div>
        </div>
        
        {/* Target Field */}
        <div className="space-y-1.5">
          <label className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
            {t.targetName}
            <span className="text-rose-400 text-[8px]">{t.required}</span>
          </label>
          <input
            autoFocus
            type="text"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder={t.nodePlaceholder}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
          >
            {t.cancel}
          </button>
          <button 
            type="submit"
            disabled={!isFormValid}
            className={`flex-1 px-3 py-2.5 text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 ${
              isFormValid ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {t.add}
          </button>
        </div>
      </form>
    </div>
  );
};
