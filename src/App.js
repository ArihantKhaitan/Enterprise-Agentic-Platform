import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Send, Loader, User, Bot, XCircle, Sun, Moon, Book, Sparkles, Link as LinkIcon, Cpu, Globe, Code, Zap, Image as ImageIcon, Paperclip, FileSpreadsheet, FileType, CheckCircle, ListOrdered } from 'lucide-react';

// --- MAIN APP COMPONENT ---
export default function App() {
    // --- State Management ---
    const [chatHistory, setChatHistory] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [vectorStore, setVectorStore] = useState([]);
    const [attachedImage, setAttachedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [modelStatus, setModelStatus] = useState({ ready: false, message: 'Initializing client-side AI...' });
    const chatEndRef = useRef(null);
    const pipelineRef = useRef(null);

    // --- API & Model Constants ---
    const GENERATIVE_MODEL_NAME = "gemini-2.5-flash-preview-05-20";
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyCvLhuSYY9_mY91PPiHFDdmlP9-PGYpXnI"; // Provided by Canvas

    // --- Client-Side AI & Library Initialization ---
    useEffect(() => {
        const initialize = async () => {
            try {
                const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
                env.allowLocalModels = false;
                pipelineRef.current = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                    progress_callback: p => setModelStatus({ ready: false, message: `Loading model... ${Math.round(p.progress)}%` })
                });
                setModelStatus({ ready: true, message: 'Client-Side AI Ready' });
            } catch (err) { console.error("Failed to initialize client-side model:", err); setError("Could not load the client-side AI model."); setModelStatus({ ready: false, message: 'Model failed to load' }); }
        };
        initialize();
    }, []);

    // --- Orchestrator, Planner, and Agent Logic ---
    const callPlanner = async (prompt, conversationHistory) => {
        const historyStr = conversationHistory.map(m => `${m.role}: ${m.parts[0].text}`).join('\n');
        const plannerPrompt = `
You are an expert planning agent. Your job is to analyze a user's prompt and the recent conversation history, then create a step-by-step plan to fulfill the request.
You have access to the following agents:
- KnowledgeAgent: Searches through uploaded documents to answer questions.
- WebSearchAgent: Searches the web for real-time information.
- CodeGenerationAgent: Writes code in various programming languages.
- ImageAnalysisAgent: Analyzes an attached image.
- SummarizationAgent: Summarizes a given text or document.

Based on the user's prompt, create a JSON plan. The plan should be an array of steps. Each step must have an "agent" and a "prompt".
The "prompt" for a step can be the original user prompt, or it can be the output of a previous step, which you can represent with the placeholder "{{step_1_output}}", "{{step_2_output}}", etc.

Conversation History:
${historyStr}

User Prompt: "${prompt}"

Generate the JSON plan now.
`;
        const planJsonString = await callGeminiAPI({ prompt: plannerPrompt });
        try {
            // Sanitize the response to extract only the JSON part
            const jsonMatch = planJsonString.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(planJsonString); // Fallback for raw JSON
        } catch (e) {
            console.error("Failed to parse plan:", e);
            // Create a simple fallback plan
            return [{ agent: 'WebSearchAgent', prompt }];
        }
    };

    const executePlan = async (plan) => {
        let stepOutputs = {};
        for (let i = 0; i < plan.length; i++) {
            const step = plan[i];
            let currentPrompt = step.prompt;

            // Substitute outputs from previous steps
            for (const key in stepOutputs) {
                currentPrompt = currentPrompt.replace(`{{${key}}}`, stepOutputs[key]);
            }
            
            setChatHistory(prev => [...prev, { role: 'model', agent: step.agent, thinking: true, step: { current: i + 1, total: plan.length, task: currentPrompt } }]);
            
            const agentResponse = await callAgent(step.agent, currentPrompt);
            stepOutputs[`step_${i + 1}_output`] = agentResponse.parts[0].text;

            // Replace the "thinking" message with the final result of the step
            setChatHistory(prev => [...prev.slice(0, -1), { ...agentResponse, finalStep: i === plan.length - 1 }]);
        }
    };

    const callAgent = async (agent, prompt) => {
        let response;
        switch (agent) {
            case 'KnowledgeAgent': response = await handleKnowledgeQuery(prompt); break;
            case 'WebSearchAgent': response = await handleWebSearchQuery(prompt); break;
            case 'CodeGenerationAgent': response = await handleCodeGenerationQuery(prompt); break;
            case 'SummarizationAgent': response = await handleSummarizationQuery(prompt); break;
            case 'ImageAnalysisAgent': response = await handleImageAnalysisQuery(prompt); break;
            default: response = { role: 'model', agent, parts: [{ text: `Error: Unknown agent "${agent}".` }] };
        }
        return response;
    };

    // --- Agent Logic Handlers ---
    const handleKnowledgeQuery = async (prompt) => {
        const similarChunks = await findSimilarChunks(prompt);
        if (similarChunks.length === 0) return { role: 'model', agent: 'KnowledgeAgent', parts: [{ text: "I couldn't find any relevant information in the uploaded documents to answer that." }]};
        const context = similarChunks.map(c => `Source: ${c.fileName}\nContent:\n${c.chunk}`).join('\n\n---\n\n');
        const augmentedPrompt = `Based *only* on the context below, answer the user's question.\n\n--- CONTEXT ---\n${context}\n--- END CONTEXT ---\n\nUser Question: "${prompt}"`;
        const text = await callGeminiAPI({prompt: augmentedPrompt});
        const sources = similarChunks.map(c => ({ fileName: c.fileName, chunk: c.chunk }));
        return { role: 'model', agent: 'KnowledgeAgent', parts: [{ text }], sources };
    };
    const handleWebSearchQuery = async (prompt) => {
        const searchPrompt = `You are a web search agent. Find relevant information for the query and provide a concise answer with 2-3 simulated markdown links. Query: "${prompt}"`;
        const text = await callGeminiAPI({prompt: searchPrompt});
        return { role: 'model', agent: 'WebSearchAgent', parts: [{ text }] };
    };
    const handleCodeGenerationQuery = async (prompt) => {
        const codePrompt = `You are a code generation agent. Generate a code snippet for the request. Provide only the code in a markdown block. Request: "${prompt}"`;
        const text = await callGeminiAPI({prompt: codePrompt});
        return { role: 'model', agent: 'CodeGenerationAgent', parts: [{ text }] };
    };
    const handleSummarizationQuery = async (prompt) => {
        // This agent can now summarize raw text OR a filename
        const file = uploadedFiles.find(f => f.name === prompt);
        const textToSummarize = file ? file.textContent : prompt;
        if (!textToSummarize) return { role: 'model', agent: 'SummarizationAgent', parts: [{ text: `Error: Could not find document or text to summarize for "${prompt}".` }] };
        const summaryPrompt = `Provide a concise, professional summary of the following text:\n\n--- TEXT ---\n${textToSummarize}\n--- END TEXT ---`;
        const text = await callGeminiAPI({prompt: summaryPrompt});
        return { role: 'model', agent: 'SummarizationAgent', parts: [{ text }] };
    };
    const handleImageAnalysisQuery = async (prompt) => {
        if (!attachedImage) return { role: 'model', agent: 'ImageAnalysisAgent', parts: [{ text: "Error: No image was attached." }] };
        const text = await callGeminiAPI({prompt, image: attachedImage});
        setAttachedImage(null);
        return { role: 'model', agent: 'ImageAnalysisAgent', parts: [{ text }] };
    };

    // --- Main Send Message Handler ---
    const handleSendMessage = async () => {
        if (userInput.trim() === '' || isLoading || isIndexing) return;
        const newUserMessage = { role: 'user', parts: [{ text: userInput }], image: attachedImage };
        setChatHistory(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        setError(null);

        // Get recent history for conversational memory
        const recentHistory = chatHistory.slice(-4);

        const plan = await callPlanner(currentInput, recentHistory);
        if (plan && plan.length > 0) {
            setChatHistory(prev => [...prev, { role: 'model', agent: 'Planner', plan }]);
            await executePlan(plan);
        } else {
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "I'm sorry, I couldn't create a plan for that request." }] }]);
        }
        setIsLoading(false);
    };

    // --- File Parsing and Embedding ---
    const parseFileContent = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            if (file.type === 'application/pdf') {
                const { getDocument } = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.min.mjs');
                const pdfjsWorker = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs');
                const pdf = await getDocument({ data: arrayBuffer, worker: pdfjsWorker }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); text += content.items.map(item => item.str).join(' '); }
                return text;
            }
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { const mammoth = await import('https://cdn.jsdelivr.net/npm/mammoth@1.7.0/mammoth.browser.min.js'); const { value } = await mammoth.extractRawText({ arrayBuffer }); return value; }
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') { const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs'); const workbook = XLSX.read(arrayBuffer, { type: 'array' }); let text = ''; workbook.SheetNames.forEach(sheetName => { text += `Sheet: ${sheetName}\n\n${XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])}\n\n`; }); return text; }
            return new TextDecoder().decode(arrayBuffer);
        } catch (err) { console.error(`Failed to parse ${file.name}:`, err); setError(`Could not parse ${file.name}.`); return null; }
    };
    const processAndEmbedFiles = async (files) => {
        if (!modelStatus.ready) { setError("Document model not ready."); return; }
        setIsIndexing(true);
        let newVectors = [];
        for (const file of files) {
            if (file.type.startsWith('image/')) continue;
            const textContent = await parseFileContent(file.fileObject);
            if (!textContent) continue;
            setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, textContent } : f));
            const chunks = chunkText(textContent);
            const embeddings = await Promise.all(chunks.map(c => getClientSideEmbedding(c)));
            newVectors.push(...chunks.map((chunk, i) => ({ fileName: file.name, chunk, embedding: embeddings[i] })).filter(v => v.embedding));
        }
        setVectorStore(prev => [...prev, ...newVectors]);
        setIsIndexing(false);
    };
    const findSimilarChunks = async (query) => {
        if (vectorStore.length === 0 || !modelStatus.ready) return [];
        const queryEmbedding = await getClientSideEmbedding(query);
        if (!queryEmbedding) return [];
        const similarities = vectorStore.map(v => ({...v, similarity: dotProduct(queryEmbedding, v.embedding)}));
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, 3);
    };
    const callGeminiAPI = async ({ prompt, image = null }) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATIVE_MODEL_NAME}:generateContent?key=${API_KEY}`;
        const parts = [{ text: prompt }];
        if (image) parts.push({ inline_data: { mime_type: image.type, data: image.content } });
        try {
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (err) { setError(`Generation failed: ${err.message}`); setIsLoading(false); return null; }
    };
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setError(null);
        const newFilesToProcess = [];
        files.forEach(file => {
            const fileData = { name: file.name, type: file.type, fileObject: file };
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => { fileData.content = event.target.result.split(',')[1]; setUploadedFiles(prev => [...prev, fileData]); };
                reader.readAsDataURL(file);
            } else { setUploadedFiles(prev => [...prev, fileData]); newFilesToProcess.push(fileData); }
        });
        if (newFilesToProcess.length > 0) processAndEmbedFiles(newFilesToProcess);
    };
    const removeFile = (fileName) => { setUploadedFiles(prev => prev.filter(f => f.name !== fileName)); setVectorStore(prev => prev.filter(v => v.fileName !== fileName)); if (attachedImage?.name === fileName) setAttachedImage(null); };
    useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
    useEffect(() => { setChatHistory([{ role: 'model', parts: [{ text: "Hello! I am a multi-agent AI assistant. I can create and execute plans to answer complex questions. How can I help you?" }] }]); }, []);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isLoading]);
    const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
    const chunkText = (text, chunkSize = 1000, overlap = 200) => { const chunks = []; for (let i = 0; i < text.length; i += chunkSize - overlap) { chunks.push(text.substring(i, i + chunkSize)); } return chunks; };
    const dotProduct = (vecA, vecB) => { let p = 0; for (let i = 0; i < vecA.length; i++) { p += vecA[i] * vecB[i]; } return p; };

    return (
        <div className="font-sans bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col h-screen w-full">
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-10">
                <h1 className="text-xl font-bold">Enterprise Agentic Platform</h1>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"><_ThemeIcon isDarkMode={isDarkMode}/></button>
            </header>
            <div className="flex flex-grow overflow-hidden">
                <_FileUploadArea {...{ uploadedFiles, handleFileChange, removeFile, isIndexing, modelStatus, setAttachedImage, attachedImage }} />
                <main className="w-full flex flex-col h-full bg-white dark:bg-gray-900">
                    <div className="flex-grow p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto">
                            {chatHistory.map((msg, i) => <_ChatMessage key={i} message={msg} />)}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                    <div className="p-6 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
                        {error && <p className="text-red-500 text-sm mb-2 max-w-4xl mx-auto">{error}</p>}
                        {attachedImage && <_AttachedImagePreview image={attachedImage} onRemove={() => setAttachedImage(null)} />}
                        <div className="relative max-w-4xl mx-auto">
                            <textarea className="w-full p-4 pr-24 text-base bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder={!modelStatus.ready ? "Waiting for client-side AI..." : "Ask a multi-step question..."} rows="2" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading || isIndexing || !modelStatus.ready} />
                            <button onClick={handleSendMessage} disabled={isLoading || isIndexing || userInput.trim() === '' || !modelStatus.ready} className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-blue-600 text-white disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-blue-700 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"><Send className="w-5 h-5" /></button>
                        </div>
                    </div>
                </main>
            </div>
            <style>{`@keyframes f{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:f .3s ease-out forwards}::-webkit-scrollbar{width:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background-color:#555;border-radius:4px;border:2px solid transparent;background-clip:content-box}.dark ::-webkit-scrollbar-thumb{background-color:#444}`}</style>
        </div>
    );
}

// --- Helper UI Components ---
const _ThemeIcon = ({ isDarkMode }) => isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-700" />;
const _FileUploadArea = ({ uploadedFiles, handleFileChange, removeFile, isIndexing, modelStatus, setAttachedImage, attachedImage }) => (
    <div className="w-full lg:w-1/3 xl:w-1/4 bg-gray-100 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 flex items-center"><Book className="mr-3 text-blue-500"/>Knowledge Base</h2>
        <div className={`flex items-center text-sm mb-4 p-2 rounded-lg ${modelStatus.ready ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'}`}>
            {modelStatus.ready ? <Cpu className="w-5 h-5 mr-2"/> : <Loader className="animate-spin w-5 h-5 mr-2"/>} <span className="truncate">{modelStatus.message}</span>
        </div>
        <label htmlFor="file-upload" className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${modelStatus.ready ? 'cursor-pointer border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-200 dark:hover:bg-gray-800' : 'cursor-not-allowed bg-gray-200/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700'}`}>
            <Upload className="w-10 h-10 text-gray-400 dark:text-gray-600 mb-3" />
            <span className="text-center font-semibold text-gray-600 dark:text-gray-400"><span className="text-blue-500">Click to upload</span> files</span>
            <span className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX, TXT, PNG, JPG</span>
        </label>
        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept=".txt,.png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx" disabled={!modelStatus.ready} />
        {isIndexing && <div className="flex items-center justify-center mt-4 text-sm text-gray-500"><Loader className="animate-spin w-4 h-4 mr-2"/><span>Processing documents...</span></div>}
        <div className="mt-8 flex-grow overflow-y-auto pr-2 -mr-2">
            <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
            {uploadedFiles.length > 0 ? <ul className="space-y-3">{uploadedFiles.map(f => <_FileItem key={f.name} {...{ file: f, removeFile, setAttachedImage, attachedImage }} />)}</ul> : <div className="text-center py-10"><FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">Files appear here.</p></div>}
        </div>
    </div>
);
const _FileItem = ({ file, removeFile, setAttachedImage, attachedImage }) => {
    const isImage = file.type.startsWith('image/');
    const isAttached = attachedImage?.name === file.name;
    const getIcon = () => {
        if (isImage) return <ImageIcon className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />;
        if (file.type.includes('pdf')) return <FileType className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />;
        if (file.type.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />;
        if (file.type.includes('word')) return <FileType className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />;
        return <FileText className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />;
    };
    return (
        <li className={`flex items-center justify-between bg-white dark:bg-gray-800/50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all ${isAttached ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-center truncate">{getIcon()}<span className="text-sm truncate">{file.name}</span></div>
            <div className="flex items-center flex-shrink-0">
                {isImage && <button onClick={() => setAttachedImage(file)} className={`p-1 transition-colors ${isAttached ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}><Paperclip className="w-5 h-5" /></button>}
                <button onClick={() => removeFile(file.name)} className="text-gray-400 hover:text-red-500 p-1 transition-colors"><XCircle className="w-5 h-5" /></button>
            </div>
        </li>
    );
};
const _ChatMessage = ({ message }) => {
    if (message.plan) return <_PlanMessage plan={message.plan} />;
    if (message.thinking) return <_ThinkingMessage agent={message.agent} step={message.step} />;
    const isUser = message.role === 'user';
    const agentConfig = { 'KnowledgeAgent': { icon: Book, color: 'from-blue-500 to-sky-600' }, 'WebSearchAgent': { icon: Globe, color: 'from-green-500 to-emerald-600' }, 'CodeGenerationAgent': { icon: Code, color: 'from-orange-500 to-amber-600' }, 'SummarizationAgent': { icon: Sparkles, color: 'from-amber-500 to-yellow-600' }, 'ImageAnalysisAgent': { icon: ImageIcon, color: 'from-purple-500 to-pink-600' }, 'Default': { icon: Bot, color: 'from-gray-500 to-gray-600' } };
    const config = agentConfig[message.agent] || agentConfig.Default;
    return (
        <div className="flex items-start gap-4 my-6 animate-fade-in">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : `bg-gradient-to-tr ${config.color}`}`}>
                {isUser ? <User className="w-6 h-6 text-white" /> : <config.icon className="w-6 h-6 text-white" />}
            </div>
            <div className="flex flex-col gap-2 w-full">
                <div className={`p-4 rounded-xl max-w-3xl shadow-md ${isUser ? 'bg-blue-600 text-white rounded-bl-none' : 'bg-white dark:bg-gray-800 rounded-bl-none'}`}>
                    {message.image && <img src={`data:${message.image.type};base64,${message.image.content}`} alt="User upload" className="rounded-lg mb-2 max-w-xs" />}
                    <_MessageContent text={message.parts[0].text} agent={message.agent} />
                </div>
                {message.sources && <_SourceList sources={message.sources} />}
            </div>
        </div>
    );
};
const _PlanMessage = ({ plan }) => (
    <div className="flex items-start gap-4 my-6 animate-fade-in">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-600"><ListOrdered className="w-6 h-6 text-white" /></div>
        <div className="p-4 rounded-xl max-w-3xl shadow-md bg-white dark:bg-gray-800">
            <h3 className="font-bold mb-2">Execution Plan:</h3>
            <ol className="list-decimal list-inside space-y-2">{plan.map((step, i) => <li key={i} className="text-sm"><span className="font-semibold">{step.agent}:</span> {step.prompt.length > 70 ? step.prompt.substring(0, 70) + '...' : step.prompt}</li>)}</ol>
        </div>
    </div>
);
const _ThinkingMessage = ({ agent, step }) => {
    const agentConfig = { 'KnowledgeAgent': { icon: Book, text: 'Searching knowledge base...' }, 'WebSearchAgent': { icon: Globe, text: 'Searching the web...' }, 'CodeGenerationAgent': { icon: Code, text: 'Generating code...' }, 'SummarizationAgent': { icon: Sparkles, text: 'Summarizing...' }, 'ImageAnalysisAgent': { icon: ImageIcon, text: 'Analyzing image...' }, 'Default': { icon: Zap, text: 'Orchestrator is thinking...' } };
    const config = agentConfig[agent] || agentConfig.Default;
    return (
        <div className="flex items-center gap-4 my-6 animate-fade-in pl-14">
            <div className="p-4 rounded-xl max-w-xl shadow-md bg-white dark:bg-gray-800 flex items-center">
                <Loader className="animate-spin w-5 h-5 text-gray-500" />
                <div className="ml-3"><p className="text-gray-700 dark:text-gray-300">{config.text}</p><p className="text-xs text-gray-400">Step {step.current} of {step.total}</p></div>
            </div>
        </div>
    );
};
const _SourceList = ({ sources }) => ( <div className="mt-2"><h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center"><LinkIcon className="w-3 h-3 mr-1.5"/>Sources:</h4><div className="flex flex-wrap gap-2">{sources.map((s, i) => <div key={i} className="bg-gray-100 dark:bg-gray-800/50 text-xs px-2 py-1 rounded-md" title={s.chunk}>{s.fileName}</div>)}</div></div>);
const _MessageContent = ({ text, agent }) => {
    if (!text) return null;
    if (agent === 'CodeGenerationAgent' && text.includes('```')) {
        const lang = text.match(/```(\w+)/)?.[1] || '';
        const code = text.replace(/```\w*\n?/, '').replace(/```$/, '');
        return <_CodeBlock language={lang} code={code} />;
    }
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkRegex);
    return <p className="whitespace-pre-wrap text-base">{parts.map((part, i) => i % 3 === 1 ? <a key={i} href={parts[i+1]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{part}</a> : (i % 3 === 0 ? part : null))}</p>;
};
const _CodeBlock = ({ language, code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) { console.error('Failed to copy text: ', err); }
        document.body.removeChild(textArea);
    };
    return (
        <div className="bg-gray-900 dark:bg-black/50 rounded-lg my-2"><div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 dark:bg-white/10 rounded-t-lg"><span className="text-xs text-gray-300 font-mono">{language}</span><button onClick={handleCopy} className="text-xs text-gray-300 hover:text-white flex items-center transition-colors">{copied ? 'Copied!' : 'Copy'}</button></div><pre className="p-4 overflow-x-auto text-sm text-white"><code className={`language-${language}`}>{code}</code></pre></div>
    );
};
const _AttachedImagePreview = ({ image, onRemove }) => (
    <div className="max-w-4xl mx-auto mb-2 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex items-center justify-between animate-fade-in">
        <div className="flex items-center"><img src={`data:${image.type};base64,${image.content}`} alt="Attached" className="w-12 h-12 rounded-md object-cover"/><div className="ml-3"><p className="text-sm font-medium">{image.name}</p><p className="text-xs text-gray-500">Image attached to next prompt</p></div></div>
        <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><XCircle className="w-5 h-5"/></button>
    </div>
);
