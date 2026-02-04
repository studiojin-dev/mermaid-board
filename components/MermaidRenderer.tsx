
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs';
import { ContextMenu } from './ContextMenu';
import { Language } from '../types';

interface MermaidRendererProps {
  code: string;
  onError: (error: string) => void;
  onAddFromPreview: (diagramIndex: number, clickedNodeId: string | null, newNodeName: string, transition: string, edgeLabel: string, customSourceId?: string) => void;
  onExplain: (id: string, isEdge: boolean) => void;
  onUpdateEdgeLabel: (sourceId: string, targetId: string, currentLabel: string) => void;
  itemsPerRow: number;
  alignSignal: number;
  language?: Language;
}

interface BlockPosition {
  x: number;
  y: number;
}

interface DiagramSize {
  width: number;
  height: number;
}

const CARD_PADDING = 32; 
const MERMAID_KEYWORDS = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt', 'mindmap', 'pie', 'gitGraph', 'quadrantChart', 'c4Context', 'timeline', 'zenuml', 'architecture'];

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ 
  code, 
  onError, 
  onAddFromPreview, 
  onExplain, 
  onUpdateEdgeLabel,
  itemsPerRow,
  alignSignal,
  language = Language.KO
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [svgs, setSvgs] = useState<string[]>([]);
  const [blockPositions, setBlockPositions] = useState<BlockPosition[]>([]);
  const [scale, setScale] = useState(1);
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  const [menuPos, setMenuPos] = useState<{ 
    x: number; 
    y: number; 
    diagramIndex: number;
    nodeId: string | null;
    edgeInfo: { source: string; target: string; label?: string } | null;
  } | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      flowchart: { 
        useMaxWidth: false, 
        htmlLabels: true, 
        padding: 5
      }
    });
    const handleClickOutside = () => setMenuPos(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const getSvgSize = (svgStr: string): DiagramSize => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return { width: 300, height: 200 };

    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(parseFloat);
      return { 
        width: (parts[2] || 300) + CARD_PADDING, 
        height: (parts[3] || 200) + CARD_PADDING 
      };
    }
    
    return {
      width: (parseFloat(svgEl.getAttribute('width') || '300')) + CARD_PADDING,
      height: (parseFloat(svgEl.getAttribute('height') || '200')) + CARD_PADDING
    };
  };

  const getBlocks = () => {
    if (!code.trim()) return [];
    const regex = new RegExp(`(?=\\b(?:${MERMAID_KEYWORDS.join('|')})\\b)`, 'i');
    return code.split(regex).filter(block => {
      const trimmed = block.trim();
      return trimmed.length > 0 && MERMAID_KEYWORDS.some(k => trimmed.toLowerCase().startsWith(k.toLowerCase()));
    });
  };

  useEffect(() => {
    const renderDiagrams = async () => {
      const blocks = getBlocks();
      if (blocks.length === 0) { setSvgs([]); setBlockPositions([]); return; }

      try {
        const renderedSvgs: string[] = [];
        for (let i = 0; i < blocks.length; i++) {
          const id = `mermaid-svg-${i}-${Math.random().toString(36).substr(2, 5)}`;
          const { svg } = await mermaid.render(id, blocks[i].trim());
          renderedSvgs.push(svg);
        }
        setSvgs(renderedSvgs);
        onError('');
      } catch (err: any) { onError(err.message || 'Syntax Error'); }
    };
    const timeoutId = setTimeout(renderDiagrams, 300);
    return () => clearTimeout(timeoutId);
  }, [code, onError]);

  const performAutoAlign = (isReset: boolean = false) => {
    if (svgs.length === 0) return;
    
    const sizes = svgs.map(getSvgSize);
    const numItems = svgs.length;
    const cols = Math.min(itemsPerRow, numItems);
    const rows = Math.ceil(numItems / cols);
    
    const rowHeights: number[] = Array(rows).fill(0);
    const colWidths: number[] = Array(cols).fill(0);

    sizes.forEach((size, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      rowHeights[r] = Math.max(rowHeights[r], size.height);
      colWidths[c] = Math.max(colWidths[c], size.width);
    });

    const newPositions = svgs.map((_, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = colWidths.slice(0, c).reduce((sum, w) => sum + w, 0);
      const y = rowHeights.slice(0, r).reduce((sum, h) => sum + h, 0);
      return { x, y };
    });
    setBlockPositions(newPositions);

    if (isReset && wrapperRef.current) {
      const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
      const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
      
      const margin = 80;
      const availableW = wrapperRef.current.clientWidth - margin;
      const availableH = wrapperRef.current.clientHeight - margin;
      
      const fitScale = Math.min(availableW / totalWidth, availableH / totalHeight, 1.0);
      const finalScaledWidth = totalWidth * fitScale;
      const finalScaledHeight = totalHeight * fitScale;

      setScale(fitScale);
      setViewportOffset({ 
        x: (wrapperRef.current.clientWidth - finalScaledWidth) / 2, 
        y: (wrapperRef.current.clientHeight - finalScaledHeight) / 2 
      });
    }
  };

  useEffect(() => { 
    performAutoAlign(false);
  }, [svgs, itemsPerRow]);

  useEffect(() => {
    if (alignSignal > 0) performAutoAlign(true);
  }, [alignSignal]);

  const handleMouseDown = (e: React.MouseEvent, blockIndex: number | null = null) => {
    if (e.button !== 0) return;
    setLastMousePos({ x: e.clientX, y: e.clientY });
    if (blockIndex !== null) { setActiveBlockIndex(blockIndex); e.stopPropagation(); } 
    else { setIsDraggingViewport(true); }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = (e.clientX - lastMousePos.x) / scale;
    const dy = (e.clientY - lastMousePos.y) / scale;
    if (activeBlockIndex !== null) {
      setBlockPositions(prev => {
        const next = [...prev];
        if (next[activeBlockIndex]) {
          next[activeBlockIndex] = { x: next[activeBlockIndex].x + dx, y: next[activeBlockIndex].y + dy };
        }
        return next;
      });
    } else if (isDraggingViewport) {
      setViewportOffset(prev => ({ x: prev.x + (e.clientX - lastMousePos.x), y: prev.y + (e.clientY - lastMousePos.y) }));
    }
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => { setIsDraggingViewport(false); setActiveBlockIndex(null); };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale(s => Math.max(0.05, Math.min(5, s + delta)));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    let target = e.target as HTMLElement;
    let nodeId: string | null = null;
    let edgeInfo: { source: string; target: string; label?: string } | null = null;
    
    const blockContainer = target.closest('[data-block-index]');
    if (!blockContainer) return;

    const diagramIndex = parseInt(blockContainer.getAttribute('data-block-index') || '0');
    
    // 블록 타입 확인 (graph 또는 flowchart만 지원)
    const blocks = getBlocks();
    const targetBlock = blocks[diagramIndex]?.trim().toLowerCase() || '';
    const isGraphType = targetBlock.startsWith('graph') || targetBlock.startsWith('flowchart');
    
    if (!isGraphType) return; // graph가 아니면 메뉴 표시 안함

    while (target && target !== containerRef.current) {
      if (target.classList.contains('node') || target.classList.contains('task')) {
        const match = (target.id || '').match(/flowchart-(.+)-\d+/);
        nodeId = match ? match[1] : (target.querySelector('.nodeLabel')?.textContent?.trim() || 'Node');
        break;
      }
      if (target.classList.contains('edgePath') || target.classList.contains('edgeLabel')) {
        const labelText = target.querySelector('.edgeLabel')?.textContent || target.textContent || "";
        const parentGroup = target.closest('g[id*="L-"]');
        let s = "Source", t = "Target";
        if (parentGroup) { const parts = parentGroup.id.split('-'); if (parts.length >= 3) { s = parts[1]; t = parts[2]; } }
        edgeInfo = { source: s, target: t, label: labelText.trim() };
        break;
      }
      target = target.parentElement as HTMLElement;
    }
    setMenuPos({ x: e.clientX, y: e.clientY, diagramIndex, nodeId, edgeInfo });
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col bg-slate-50 overflow-hidden select-none"
      ref={wrapperRef}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: (isDraggingViewport || activeBlockIndex !== null) ? 'grabbing' : 'grab' }}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-2 bg-white/90 border border-slate-200 rounded-lg shadow hover:bg-white transition-colors">➕</button>
        <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 bg-white/90 border border-slate-200 rounded-lg shadow hover:bg-white transition-colors">➖</button>
        <button onClick={() => performAutoAlign(true)} className="p-2 bg-white/90 border border-indigo-200 text-indigo-600 rounded-lg shadow hover:bg-indigo-600 hover:text-white transition-all hover:scale-105">🔄</button>
      </div>

      <div 
        ref={containerRef}
        className="transition-transform duration-500 ease-in-out" 
        style={{ transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        <div className="relative">
          {svgs.map((svg, idx) => {
            const pos = blockPositions[idx] || { x: 0, y: idx * 300 };
            return (
              <div 
                key={idx} 
                data-block-index={idx}
                className="absolute bg-white p-4 rounded-xl shadow-sm border border-slate-100 max-w-none overflow-visible pointer-events-auto group"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  zIndex: activeBlockIndex === idx ? 100 : 10,
                  transition: activeBlockIndex === idx ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div onMouseDown={(e) => handleMouseDown(e, idx)} className="absolute top-1 left-1 p-1 text-slate-200 hover:text-indigo-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <div className="mermaid-svg-container" dangerouslySetInnerHTML={{ __html: svg }} />
              </div>
            );
          })}
        </div>
      </div>
      {menuPos && (
        <ContextMenu
          x={menuPos.x} y={menuPos.y} nodeId={menuPos.nodeId} edgeInfo={menuPos.edgeInfo} onClose={() => setMenuPos(null)}
          onAddNode={(name, trans, label, src) => onAddFromPreview(menuPos.diagramIndex, menuPos.nodeId, name, trans, label, src)} onExplain={onExplain}
          language={language}
        />
      )}
    </div>
  );
};

export default MermaidRenderer;
