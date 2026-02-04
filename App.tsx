
import React, { useState, useCallback, useRef, useEffect } from 'react';
import MermaidRenderer from './components/MermaidRenderer';
import { geminiService } from './services/geminiService';
import { TEMPLATES, DEFAULT_MERMAID_CODE } from './constants';
import { TabType, Language, TestStatus, SavedDiagram, AiConfig, AiProvider } from './types';

const MERMAID_KEYWORDS = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt', 'mindmap', 'pie', 'gitGraph', 'quadrantChart', 'c4Context', 'timeline', 'zenuml', 'architecture'];

const TRANSLATIONS = {
  [Language.KO]: {
    appTitle: "Mermaid Board",
    version: "Mermaid v11.12 호환",
    gridLayout: "그리드 레이아웃",
    autoAlign: "열 자동 정렬",
    fitView: "한눈에 보기 리셋",
    editor: "에디터",
    aiGen: "AI 생성",
    files: "내 파일",
    templates: "템플릿",
    settings: "설정",
    codeEditor: "코드 에디터",
    clearAll: "전체 삭제",
    saveToMd: "MD 블록으로 저장",
    copied: "클립보드에 복사됨!",
    placeholder: "Mermaid 문법을 입력하세요...",
    errorTitle: "문법 오류 발생",
    aiFix: "AI로 즉시 수정",
    aiGenTitle: "AI 다이어그램 생성기",
    aiPromptPlaceholder: "예: '로그인에서 결제까지의 시퀀스 다이어그램을 그려줘'",
    generate: "생성하기",
    generating: "AI 분석 중...",
    aiModelSettings: "일반 설정",
    languageSelect: "언어 설정 (Language)",
    testConnection: "AI 엔진 상태 확인",
    testing: "확인 중...",
    aiProcessing: "AI가 다이어그램을 설계하고 있습니다",
    aiInsight: "AI 인사이트",
    analysis: "분석 결과",
    close: "닫기",
    undo: "뒤로 가기",
    redo: "앞으로 가기",
    storageTitle: "데이터 관리 (Storage)",
    storageWarning: "⚠️ 경고: 데이터는 브라우저 로컬 저장소에 저장됩니다. 브라우저 데이터를 초기화하면 작성한 코드가 모두 삭제됩니다.",
    autoSaved: "임시 저장됨",
    resetToDefault: "기본 템플릿으로 초기화",
    loadLastSaved: "마지막 저장 데이터 불러오기",
    saveFile: "현재 다이어그램 저장",
    newFile: "새 다이어그램",
    fileName: "파일 이름",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    unsavedWarning: "저장되지 않은 변경사항이 있습니다. 저장하시겠습니까?",
    confirmDelete: "정말로 이 파일을 삭제하시겠습니까?",
    noFiles: "저장된 파일이 없습니다.",
    lastUpdated: "최근 수정",
    savedSuccessfully: "성공적으로 저장되었습니다.",
    aiApiSettings: "AI 엔진 설정",
    provider: "AI 프로바이더",
    geminiKeyLabel: "Gemini API Key (필수)",
    geminiKeyHint: "Google AI Studio에서 발급받은 API 키를 입력하세요.",
    geminiGetKey: "Gemini API Key 발급받기",
    openaiEndpointLabel: "OpenAI 호환 Endpoint",
    openaiKeyLabel: "OpenAI 호환 API Key (필수)",
    openaiModelLabel: "모델 이름 (Model Name)",
    needApiKey: "API 키 설정이 필요합니다",
    saveSettings: "설정 저장"
  },
  [Language.EN]: {
    appTitle: "Mermaid Board",
    version: "Mermaid v11.12 Compatible",
    gridLayout: "Grid Layout",
    autoAlign: "Cols Auto Align",
    fitView: "Reset Fit-to-View",
    editor: "Editor",
    aiGen: "AI Generate",
    files: "My Files",
    templates: "Templates",
    settings: "Settings",
    codeEditor: "Code Editor",
    clearAll: "Clear All",
    saveToMd: "Save to MD block",
    copied: "Copied to Clipboard!",
    placeholder: "Enter Mermaid syntax...",
    errorTitle: "Syntax Error",
    aiFix: "AI Quick Fix",
    aiGenTitle: "AI Diagram Generator",
    aiPromptPlaceholder: "e.g., 'Draw a sequence diagram for login to payment flow'",
    generate: "Generate",
    generating: "AI Analyzing...",
    aiModelSettings: "General Settings",
    languageSelect: "Language Preference",
    testConnection: "Check AI Engine",
    testing: "Checking...",
    aiProcessing: "AI is designing your diagram",
    aiInsight: "AI Insight",
    analysis: "Analysis Result",
    close: "Close",
    undo: "Undo",
    redo: "Redo",
    storageTitle: "Storage Management",
    storageWarning: "⚠️ Warning: Data is stored in browser local storage. Clearing browser data will delete your codes permanently.",
    autoSaved: "Temp saved",
    resetToDefault: "Reset to Default",
    loadLastSaved: "Load last saved data",
    saveFile: "Save Diagram",
    newFile: "New Diagram",
    fileName: "File Name",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    unsavedWarning: "You have unsaved changes. Would you like to save them first?",
    confirmDelete: "Are you sure you want to delete this file?",
    noFiles: "No saved files yet.",
    lastUpdated: "Last updated",
    savedSuccessfully: "Saved successfully.",
    aiApiSettings: "AI Engine Configuration",
    provider: "AI Provider",
    geminiKeyLabel: "Gemini API Key (Required)",
    geminiKeyHint: "Enter the API key issued from Google AI Studio.",
    geminiGetKey: "Get Gemini API Key",
    openaiEndpointLabel: "OpenAI Compatible Endpoint",
    openaiKeyLabel: "OpenAI Compatible API Key (Required)",
    openaiModelLabel: "Model Name",
    needApiKey: "API Key required",
    saveSettings: "Save Settings"
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('mermaid_language');
    return (saved as Language) || Language.KO;
  });
  
  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem('mermaid_current_workspace');
    return savedCode || DEFAULT_MERMAID_CODE;
  });

  const [savedFiles, setSavedFiles] = useState<SavedDiagram[]>(() => {
    const saved = localStorage.getItem('mermaid_saved_files');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentFileId, setCurrentFileId] = useState<string | null>(() => {
    return localStorage.getItem('mermaid_current_file_id');
  });

  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    const saved = localStorage.getItem('mermaid_ai_config');
    return saved ? JSON.parse(saved) : {
      provider: 'GEMINI',
      geminiKey: '',
      openaiKey: '',
      openaiEndpoint: 'https://api.openai.com/v1',
      openaiModel: 'gpt-4o'
    };
  });

  const [lastSavedCode, setLastSavedCode] = useState<string>(() => {
    const currentId = localStorage.getItem('mermaid_current_file_id');
    if (currentId) {
      const files = JSON.parse(localStorage.getItem('mermaid_saved_files') || '[]');
      const file = files.find((f: SavedDiagram) => f.id === currentId);
      return file ? file.code : code;
    }
    return code;
  });

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(TabType.EDITOR);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [insight, setInsight] = useState<{ title: string; content: string; loading: boolean } | null>(null);
  const [itemsPerRow, setItemsPerRow] = useState(3);
  const [alignSignal, setAlignSignal] = useState(0);
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const t = TRANSLATIONS[language];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([code]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const isDirty = code !== lastSavedCode;
  const isAiConfigured = aiConfig.provider === 'GEMINI' ? !!aiConfig.geminiKey.trim() : !!aiConfig.openaiKey.trim();

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('mermaid_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('mermaid_saved_files', JSON.stringify(savedFiles));
  }, [savedFiles]);

  useEffect(() => {
    localStorage.setItem('mermaid_current_workspace', code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem('mermaid_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    if (currentFileId) localStorage.setItem('mermaid_current_file_id', currentFileId);
    else localStorage.removeItem('mermaid_current_file_id');
  }, [currentFileId]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = t.unsavedWarning;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, t.unsavedWarning]);

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newCode]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateCode(e.target.value);
  };

  const handleSaveFile = () => {
    if (currentFileId) {
      setSavedFiles(prev => prev.map(f => f.id === currentFileId ? { ...f, code, updatedAt: Date.now() } : f));
      setLastSavedCode(code);
      alert(t.savedSuccessfully);
    } else {
      setNewFileName('');
      setIsSaveModalOpen(true);
    }
  };

  const confirmSaveNewFile = () => {
    if (!newFileName.trim()) return;
    const newId = 'file_' + Math.random().toString(36).substring(2, 9);
    const newFile: SavedDiagram = {
      id: newId,
      name: newFileName.trim(),
      code: code,
      updatedAt: Date.now()
    };
    setSavedFiles(prev => [newFile, ...prev]);
    setCurrentFileId(newId);
    setLastSavedCode(code);
    setIsSaveModalOpen(false);
  };

  const handleNewDiagram = () => {
    if (isDirty && !confirm(t.unsavedWarning)) return;
    updateCode(DEFAULT_MERMAID_CODE);
    setCurrentFileId(null);
    setLastSavedCode(DEFAULT_MERMAID_CODE);
    setActiveTab(TabType.EDITOR);
  };

  const handleLoadFile = (file: SavedDiagram) => {
    if (isDirty && !confirm(t.unsavedWarning)) return;
    updateCode(file.code);
    setCurrentFileId(file.id);
    setLastSavedCode(file.code);
    setActiveTab(TabType.EDITOR);
  };

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t.confirmDelete)) {
      setSavedFiles(prev => prev.filter(f => f.id !== id));
      if (currentFileId === id) {
        setCurrentFileId(null);
        setLastSavedCode(""); 
      }
    }
  };

  const handleSaveToMarkdown = useCallback(() => {
    if (!code.trim()) return;
    const regex = new RegExp(`(?=\\b(?:${MERMAID_KEYWORDS.join('|')})\\b)`, 'i');
    const blocks = code.split(regex).map(b => b.trim()).filter(b => b.length > 0);
    const markdown = blocks.map(block => `\`\`\`mermaid\n${block}\n\`\`\``).join('\n\n');
    navigator.clipboard.writeText(markdown).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [code]);

  const handleAddFromPreview = (diagramIndex: number, clickedNodeId: string | null, newNodeName: string, transition: string, edgeLabel: string, customSourceId?: string) => {
    const getSafeNodeData = (name: string) => {
      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(name);
      if (isAlphanumeric) return { id: name, definition: name };
      const randomId = 'node_' + Math.random().toString(36).substring(2, 7);
      return { id: randomId, definition: `${randomId}["${name}"]` };
    };

    const getSafeTargetRef = (id: string) => {
      const needsQuotes = /[^a-zA-Z0-9]/.test(id);
      return needsQuotes ? `"${id}"` : id;
    };

    const regex = new RegExp(`(?=\\b(?:${MERMAID_KEYWORDS.join('|')})\\b)`, 'i');
    const parts = code.split(regex);
    const finalSourceRaw = clickedNodeId || customSourceId;
    if (!finalSourceRaw) return;

    let blockCounter = -1;
    const updatedParts = parts.map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return part;
      const isDiagram = MERMAID_KEYWORDS.some(k => trimmed.toLowerCase().startsWith(k.toLowerCase()));
      if (isDiagram) {
        blockCounter++;
        if (blockCounter === diagramIndex) {
          const sourceNode = getSafeNodeData(finalSourceRaw);
          const targetNode = getSafeNodeData(newNodeName);
          let newLine = '';
          const safeSource = getSafeTargetRef(sourceNode.id);
          const labelPart = edgeLabel ? `|${edgeLabel}| ` : '';
          const sourceExists = part.includes(sourceNode.id);
          if (!sourceExists && !clickedNodeId) {
             newLine = `\n    ${sourceNode.definition}\n    ${safeSource} ${transition}${labelPart}${targetNode.definition}`;
          } else {
             newLine = `\n    ${safeSource} ${transition}${labelPart}${targetNode.definition}`;
          }
          return part.trimEnd() + newLine + '\n';
        }
      }
      return part;
    });
    updateCode(updatedParts.join(''));
  };

  const handleUpdateEdgeLabel = (sourceId: string, targetId: string, currentLabel: string) => {
    const promptMsg = language === Language.KO ? `라벨 수정 (${sourceId} -> ${targetId}):` : `Update Label (${sourceId} -> ${targetId}):`;
    const newLabel = prompt(promptMsg, currentLabel);
    if (newLabel === null) return;
    const lines = code.split('\n');
    const updatedLines = lines.map(line => {
      const edgeRegex = new RegExp(`(${sourceId})\\s+([\\-\\=\\.]+>|<[\\-\\趁\\.]+|[\\-\\=\\.]+)\\s*(\\|.*?\\|)?\\s*(${targetId})`, 'i');
      if (edgeRegex.test(line)) {
        return line.replace(edgeRegex, (match, s, arrow, oldLabel, t) => `${s} ${arrow}|${newLabel}| ${t}`);
      }
      return line;
    });
    updateCode(updatedLines.join('\n'));
  };

  const handleExplain = async (id: string, isEdge: boolean) => {
    setInsight({ title: id, content: '', loading: true });
    try {
      const explanation = await geminiService.explainElement(code, id, isEdge, language);
      setInsight({ title: id, content: explanation, loading: false });
    } catch (err: any) {
      setInsight({ title: id, content: `Error: ${err.message}`, loading: false });
    }
  };

  const runTest = async () => {
    setTestStatus({ success: false, message: "", loading: true });
    const result = await geminiService.testConnection(language);
    setTestStatus({ ...result, loading: false });
  };

  const triggerResetView = () => setAlignSignal(prev => prev + 1);
  const undo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setCode(history[historyIndex - 1]); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setCode(history[historyIndex + 1]); } };

  const currentFileName = savedFiles.find(f => f.id === currentFileId)?.name || (language === Language.KO ? "새 문서" : "New Document");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 text-white shrink-0">
        <div className="text-2xl font-bold bg-indigo-600 w-12 h-12 flex items-center justify-center rounded-xl shadow-lg mb-4 cursor-pointer hover:rotate-12 transition-transform">M</div>
        <button onClick={() => setActiveTab(TabType.EDITOR)} title={t.editor} className={`p-3 rounded-lg transition-colors ${activeTab === TabType.EDITOR ? 'bg-indigo-600 shadow-indigo-500/50 shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>📝</button>
        <button onClick={() => setActiveTab(TabType.FILES)} title={t.files} className={`p-3 rounded-lg transition-colors ${activeTab === TabType.FILES ? 'bg-indigo-600 shadow-indigo-500/50 shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>📁</button>
        <button onClick={() => setActiveTab(TabType.AI)} title={t.aiGen} className={`p-3 rounded-lg transition-colors ${activeTab === TabType.AI ? 'bg-indigo-600 shadow-indigo-500/50 shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>✨</button>
        <button onClick={() => setActiveTab(TabType.TEMPLATES)} title={t.templates} className={`p-3 rounded-lg transition-colors ${activeTab === TabType.TEMPLATES ? 'bg-indigo-600 shadow-indigo-500/50 shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>📚</button>
        <button onClick={() => setActiveTab(TabType.SETTINGS)} title={t.settings} className={`p-3 rounded-lg transition-colors ${activeTab === TabType.SETTINGS ? 'bg-indigo-600 shadow-indigo-500/50 shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>⚙️</button>
        <div className="mt-auto flex flex-col gap-4 pb-4">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-400 disabled:opacity-20 hover:text-white transition-opacity" title={t.undo}>↩️</button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-400 disabled:opacity-20 hover:text-white transition-opacity" title={t.redo}>↪️</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{t.appTitle}</h1>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.version}</span>
              <span className="text-xs font-black text-indigo-600 truncate max-w-[150px]">{currentFileName}{isDirty ? '*' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.gridLayout}</span>
                <select value={itemsPerRow} onChange={(e) => setItemsPerRow(parseInt(e.target.value))} className="text-[11px] font-bold bg-white border border-slate-300 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500">
                  {[1,2,3,4,5,6,7,8].map(v => <option key={v} value={v}>{v}{language === Language.KO ? '열 ' : ' '}{t.autoAlign}</option>)}
                </select>
                <div className="w-[1px] h-4 bg-slate-200"></div>
                <button onClick={triggerResetView} className="text-[11px] bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2">
                   <span>🔄</span> {t.fitView}
                </button>
             </div>
             <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button onClick={() => setLanguage(Language.KO)} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${language === Language.KO ? 'bg-white shadow-sm text-indigo-600 scale-105' : 'text-slate-500 hover:text-slate-800'}`}>KO</button>
                <button onClick={() => setLanguage(Language.EN)} className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${language === Language.EN ? 'bg-white shadow-sm text-indigo-600 scale-105' : 'text-slate-500 hover:text-slate-800'}`}>EN</button>
             </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[450px] border-r border-slate-200 bg-white flex flex-col shrink-0 relative shadow-lg">
            {activeTab === TabType.EDITOR && (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <div className="flex gap-2">
                     <button onClick={handleSaveFile} className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-md font-bold uppercase hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm">
                       <span>💾</span> {t.save}
                     </button>
                     <button onClick={handleNewDiagram} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-md font-bold uppercase hover:bg-slate-50 transition-colors">
                       {t.newFile}
                     </button>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={handleSaveToMarkdown} className={`text-[10px] px-3 py-1 rounded-md font-bold uppercase transition-all flex items-center gap-1.5 ${isCopied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>{isCopied ? `✅ ${t.copied}` : `💾 ${t.saveToMd}`}</button>
                     <button onClick={() => updateCode('')} className="text-[10px] bg-red-50 text-red-500 px-3 py-1 rounded-md font-bold uppercase hover:bg-red-100 transition-colors">{t.clearAll}</button>
                   </div>
                </div>
                <div className="flex-1 relative">
                  <textarea ref={textareaRef} value={code} onChange={handleTextareaChange} className="w-full h-full p-8 font-mono text-sm resize-none focus:outline-none bg-white text-slate-800 leading-relaxed scrollbar-thin" placeholder={t.placeholder} spellCheck={false} />
                </div>
                {error && (
                  <div className="p-5 bg-rose-50 border-t border-rose-100">
                    <p className="text-[11px] font-bold text-rose-500 uppercase mb-2 flex items-center gap-2"><span>⚠️</span> {t.errorTitle}</p>
                    <div className="max-h-24 overflow-y-auto mb-4">
                      <p className="text-xs text-rose-700 leading-relaxed font-mono bg-white/50 p-2 rounded border border-rose-100">{error}</p>
                    </div>
                    <button onClick={async () => { setIsGenerating(true); try { const fixed = await geminiService.fixDiagram(code, error, language); updateCode(fixed); } catch(e:any){ alert(e.message); } finally { setIsGenerating(false); } }} disabled={!isAiConfigured} className={`w-full text-xs py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isAiConfigured ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                      {isAiConfigured ? `✨ ${t.aiFix}` : `🔒 ${t.needApiKey}`}
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === TabType.FILES && (
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                <div className="p-6 bg-white border-b border-slate-200">
                  <h2 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><span>📁</span> {t.files}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">{t.storageWarning}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  <button onClick={handleNewDiagram} className="w-full p-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 mb-4"><span>➕</span> {t.newFile}</button>
                  {savedFiles.length === 0 ? (<div className="text-center py-10"><p className="text-slate-300 font-bold text-sm">{t.noFiles}</p></div>) : (
                    savedFiles.map(file => (
                      <div key={file.id} onClick={() => handleLoadFile(file)} className={`p-4 bg-white border-2 rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 group flex justify-between items-center ${currentFileId === file.id ? 'border-indigo-500 shadow-md' : 'border-slate-100'}`}>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-800 group-hover:text-indigo-600 truncate">{file.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{t.lastUpdated}: {new Date(file.updatedAt).toLocaleDateString()} {new Date(file.updatedAt).toLocaleTimeString()}</p>
                        </div>
                        <button onClick={(e) => handleDeleteFile(e, file.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === TabType.AI && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                <div className="flex-1 p-8 overflow-y-auto scrollbar-thin">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">✨</div>
                    <h2 className="text-2xl font-black text-slate-800">{t.aiGenTitle}</h2>
                  </div>
                  
                  <textarea 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)} 
                    className="w-full h-40 p-6 bg-white border border-slate-200 rounded-2xl mb-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" 
                    placeholder={t.aiPromptPlaceholder} 
                  />
                  
                  <button 
                    onClick={async () => { 
                      setIsGenerating(true); 
                      try { 
                        const gen = await geminiService.generateDiagram(aiPrompt, language); 
                        updateCode(gen); 
                        setActiveTab(TabType.EDITOR); 
                        setAiPrompt(''); 
                      } catch(e:any) { 
                        alert(e.message); 
                      } finally { 
                        setIsGenerating(false); 
                      } 
                    }} 
                    disabled={isGenerating || !aiPrompt.trim() || !isAiConfigured} 
                    className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all transform active:scale-[0.98] ${
                      isAiConfigured 
                        ? 'bg-slate-900 hover:bg-indigo-600' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {!isAiConfigured ? `🔒 ${t.needApiKey}` : (isGenerating ? t.generating : t.generate)}
                  </button>

                  <div className="mt-10 pt-8 border-t border-slate-200 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-lg">⚙️</span>
                       <h3 className="text-lg font-black text-slate-800">{t.aiApiSettings}</h3>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.provider}</label>
                      <div className="flex gap-2">
                        {(['GEMINI', 'OPENAI_COMPATIBLE'] as AiProvider[]).map(p => (
                          <button key={p} onClick={() => setAiConfig(prev => ({ ...prev, provider: p }))} className={`flex-1 py-3 px-2 rounded-xl border-2 font-bold text-[10px] transition-all ${aiConfig.provider === p ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}>
                            {p === 'GEMINI' ? 'Google Gemini' : 'OpenAI Compatible'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {aiConfig.provider === 'GEMINI' ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.geminiKeyLabel}</label>
                          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline">
                             {t.geminiGetKey} ↗
                          </a>
                        </div>
                        <input type="password" value={aiConfig.geminiKey} onChange={(e) => setAiConfig(prev => ({ ...prev, geminiKey: e.target.value }))} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="AI Studio API Key" />
                        <p className="text-[10px] text-slate-400 font-medium italic">{t.geminiKeyHint}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.openaiEndpointLabel}</label>
                          <input type="text" value={aiConfig.openaiEndpoint} onChange={(e) => setAiConfig(prev => ({ ...prev, openaiEndpoint: e.target.value }))} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.openaiKeyLabel}</label>
                          <input type="password" value={aiConfig.openaiKey} onChange={(e) => setAiConfig(prev => ({ ...prev, openaiKey: e.target.value }))} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="sk-..." />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.openaiModelLabel}</label>
                          <input type="text" value={aiConfig.openaiModel} onChange={(e) => setAiConfig(prev => ({ ...prev, openaiModel: e.target.value }))} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="gpt-4o / claude-3" />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button onClick={runTest} disabled={testStatus?.loading} className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-xs">
                         <span>⚡</span> {testStatus?.loading ? t.testing : t.testConnection}
                      </button>
                      {testStatus && (<div className={`mt-3 p-3 rounded-xl text-[10px] font-bold flex items-center gap-3 ${testStatus.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}><div className={`w-1.5 h-1.5 rounded-full ${testStatus.success ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>{testStatus.message}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === TabType.TEMPLATES && (
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
                {TEMPLATES.map(item => (
                  <button key={item.id} onClick={() => { if (isDirty && !confirm(t.unsavedWarning)) return; updateCode(item.code); setCurrentFileId(null); setLastSavedCode(item.code); setActiveTab(TabType.EDITOR); }} className="w-full p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl text-left flex items-center gap-5 group transition-all duration-300 transform hover:-translate-y-1"><span className="text-3xl bg-slate-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">{item.icon}</span><div className="flex flex-col"><span className="font-black text-slate-800 group-hover:text-indigo-600">{item.name}</span><span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Preset Design</span></div></button>
                ))}
              </div>
            )}

            {activeTab === TabType.SETTINGS && (
              <div className="flex-1 p-10 overflow-y-auto bg-slate-50 scrollbar-thin">
                <h2 className="text-2xl font-black mb-8 text-slate-800">{t.aiModelSettings}</h2>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.languageSelect}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setLanguage(Language.KO)} className={`py-4 rounded-2xl border-2 font-black text-sm transition-all ${language === Language.KO ? 'border-indigo-600 bg-white text-indigo-600 shadow-lg' : 'border-slate-200 bg-white text-slate-400'}`}>한국어</button>
                      <button onClick={() => setLanguage(Language.EN)} className={`py-4 rounded-2xl border-2 font-black text-sm transition-all ${language === Language.EN ? 'border-indigo-600 bg-white text-indigo-600 shadow-lg' : 'border-slate-200 bg-white text-slate-400'}`}>English</button>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-black mb-4 text-slate-800">{t.storageTitle}</h3>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4"><p className="text-xs text-amber-700 leading-relaxed font-semibold">{t.storageWarning}</p></div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { if (confirm(t.resetToDefault)) { updateCode(DEFAULT_MERMAID_CODE); setCurrentFileId(null); setLastSavedCode(DEFAULT_MERMAID_CODE); } }} className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm">{t.resetToDefault}</button>
                      <button onClick={() => { if (confirm(t.confirmDelete)) { localStorage.removeItem('mermaid_saved_files'); localStorage.removeItem('mermaid_current_workspace'); localStorage.removeItem('mermaid_current_file_id'); localStorage.removeItem('mermaid_ai_config'); window.location.reload(); } }} className="w-full py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-100 transition-all text-sm">{t.clearAll}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 bg-slate-100 relative shadow-inner overflow-hidden">
            <MermaidRenderer code={code} onError={setError} onAddFromPreview={handleAddFromPreview} onExplain={handleExplain} onUpdateEdgeLabel={handleUpdateEdgeLabel} itemsPerRow={itemsPerRow} alignSignal={alignSignal} language={language} />
            {insight && (
              <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-8 z-40 animate-in slide-in-from-bottom-8 fade-in duration-500">
                <div className="flex justify-between items-start mb-6"><div><span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest block mb-1">{t.aiInsight}</span><h3 className="text-lg font-black text-slate-900">{t.analysis}: {insight.title}</h3></div><button onClick={() => setInsight(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">✕</button></div>
                {insight.loading ? (<div className="flex items-center gap-4 py-6"><div className="w-6 h-6 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" /><span className="text-sm text-slate-500 font-bold animate-pulse">{t.generating}</span></div>) : (<div className="text-sm text-slate-600 leading-relaxed max-h-48 overflow-y-auto pr-4 font-medium scrollbar-thin">{insight.content}</div>)}
              </div>
            )}
          </div>
        </div>
      </main>
      {isGenerating && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center animate-in fade-in duration-300"><div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm text-center transform scale-110"><div className="relative w-20 h-20 mb-6"><div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div><div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div></div><h3 className="text-xl font-black text-slate-900 mb-2">{t.aiProcessing}</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Designing multi-layer diagrams</p></div></div>)}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[210] flex items-center justify-center animate-in fade-in zoom-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200"><h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>💾</span> {t.saveFile}</h3><div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.fileName}</label><input type="text" autoFocus value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmSaveNewFile()} className="w-full text-sm p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" placeholder={language === Language.KO ? "프로젝트 이름..." : "Project Name..."} /></div><div className="flex gap-3 pt-4"><button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">{t.cancel}</button><button onClick={confirmSaveNewFile} disabled={!newFileName.trim()} className="flex-1 py-3 text-sm font-black bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:shadow-none">{t.save}</button></div></div></div>
        </div>
      )}
    </div>
  );
};

export default App;
