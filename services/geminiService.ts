
import { GoogleGenAI } from "@google/genai";
import { AiConfig, Language } from "../types";

const SERVICE_ERRORS = {
  [Language.KO]: {
    missingGemini: "Gemini API Key가 설정되지 않았습니다. AI 설정 섹션에서 키를 입력해주세요.",
    missingOpenAI: "OpenAI API Key가 설정되지 않았습니다.",
    emptyResponse: "AI로부터 빈 응답을 받았습니다.",
    connectionGemini: "Gemini 연결 성공",
    connectionOpenAI: "OpenAI 호환 엔진 연결 성공",
    noExplanation: "설명을 생성할 수 없습니다."
  },
  [Language.EN]: {
    missingGemini: "Gemini API Key is not configured. Please enter the key in the AI Settings section.",
    missingOpenAI: "OpenAI API Key is not configured.",
    emptyResponse: "Received an empty response from AI.",
    connectionGemini: "Gemini connection successful",
    connectionOpenAI: "OpenAI compatible engine connection successful",
    noExplanation: "Explanation could not be generated."
  }
};

export class GeminiService {
  private getConfig(): AiConfig {
    const saved = localStorage.getItem('mermaid_ai_config');
    if (saved) return JSON.parse(saved);
    return {
      provider: 'GEMINI',
      geminiKey: '',
      openaiKey: '',
      openaiEndpoint: 'https://api.openai.com/v1',
      openaiModel: 'gpt-4o'
    };
  }

  private getGeminiClient(lang: Language) {
    const config = this.getConfig();
    if (!config.geminiKey) {
      throw new Error(SERVICE_ERRORS[lang].missingGemini);
    }
    return new GoogleGenAI({ apiKey: config.geminiKey });
  }

  async testConnection(lang: Language): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const t = SERVICE_ERRORS[lang];
    try {
      if (config.provider === 'GEMINI') {
        const ai = this.getGeminiClient(lang);
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Say 'OK'",
        });
        if (response.text) return { success: true, message: t.connectionGemini };
      } else {
        if (!config.openaiKey) throw new Error(t.missingOpenAI);
        const res = await fetch(`${config.openaiEndpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openaiKey}`
          },
          body: JSON.stringify({
            model: config.openaiModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5
          })
        });
        if (res.ok) return { success: true, message: t.connectionOpenAI };
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Connection failed');
      }
      throw new Error(t.emptyResponse);
    } catch (err: any) {
      return { success: false, message: `Error: ${err.message}` };
    }
  }

  async generateDiagram(prompt: string, lang: Language): Promise<string> {
    const config = this.getConfig();
    const systemPrompt = `Generate a Mermaid.js diagram (v11 compatible) based on this: "${prompt}". 
    Return ONLY the raw mermaid code. No markdown blocks, no explanations.`;

    if (config.provider === 'GEMINI') {
      const ai = this.getGeminiClient(lang);
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: systemPrompt,
        config: { temperature: 0.7 }
      });
      return this.cleanCode(response.text || '');
    } else {
      return this.callOpenAICompatible(systemPrompt, config, lang);
    }
  }

  async fixDiagram(code: string, error: string, lang: Language): Promise<string> {
    const config = this.getConfig();
    const prompt = `Fix this Mermaid.js code error.
    Error: ${error}
    Code:
    ${code}
    Return ONLY the fixed mermaid code.`;

    if (config.provider === 'GEMINI') {
      const ai = this.getGeminiClient(lang);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return this.cleanCode(response.text || code);
    } else {
      return this.callOpenAICompatible(prompt, config, lang);
    }
  }

  async explainElement(code: string, elementId: string, isEdge: boolean, lang: Language): Promise<string> {
    const config = this.getConfig();
    const instruction = lang === Language.KO 
      ? "당신은 시스템 아키텍트입니다. 한국어로 간결하고 전문적인 설명을 제공하세요."
      : "You are a system architect. Provide a concise and professional explanation in English.";
      
    const prompt = isEdge 
      ? `Explain the relationship "${elementId}" in this code:\n${code}`
      : `Explain the role of node "${elementId}" in this code:\n${code}`;

    if (config.provider === 'GEMINI') {
      const ai = this.getGeminiClient(lang);
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction: instruction }
      });
      return response.text || SERVICE_ERRORS[lang].noExplanation;
    } else {
      return this.callOpenAICompatible(`${instruction}\n\n${prompt}`, config, lang);
    }
  }

  private async callOpenAICompatible(prompt: string, config: AiConfig, lang: Language): Promise<string> {
    if (!config.openaiKey) throw new Error(SERVICE_ERRORS[lang].missingOpenAI);
    const res = await fetch(`${config.openaiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiKey}`
      },
      body: JSON.stringify({
        model: config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'AI request failed');
    }
    const data = await res.json();
    return this.cleanCode(data.choices[0].message.content || '');
  }

  private cleanCode(text: string): string {
    return text.replace(/```mermaid/g, '').replace(/```/g, '').trim();
  }
}

export const geminiService = new GeminiService();
