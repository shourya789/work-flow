import { GoogleGenAI, Type } from "@google/genai";

export const parseRawTimeData = async (text: string) => {
  // Use import.meta.env for Vite projects
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Gemini API Key is missing. Ensure VITE_GEMINI_API_KEY is set in Vercel/Env.");
    throw new Error("AI Configuration Error: API Key not found.");
  }

  const ai = new GoogleGenAI(apiKey);
  
  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash', // Standard stable model name
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pause: { type: Type.STRING },
            dispo: { type: Type.STRING },
            dead: { type: Type.STRING },
            currentLogin: { type: Type.STRING },
            loginTimestamp: { type: Type.STRING },
            logoutTimestamp: { type: Type.STRING },
            wait: { type: Type.STRING },
            talk: { type: Type.STRING },
            hold: { type: Type.STRING },
            customerTalk: { type: Type.STRING },
            inbound: { type: Type.INTEGER },
            outbound: { type: Type.INTEGER },
          },
          required: ["pause", "dispo", "dead", "currentLogin", "loginTimestamp", "logoutTimestamp", "wait", "talk", "hold", "customerTalk", "inbound", "outbound"]
        }
      }
    });

    const prompt = `You are a specialized data extractor for dialer performance reports. 
      Look at the provided text and extract these 12 specific values. 
      Note that labels and values might be squashed together.
      
      RULES:
      - If a time value is missing, return "00:00:00".
      - If a call count is missing, return 0.
      - Clean up any squashed text (e.g., "Time3:22:08" -> "03:22:08").
      
      TEXT TO PARSE:
      """
      ${text}
      """`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    if (!responseText) {
      console.warn("AI returned empty response text");
      return null;
    }
    
    const rawResult = JSON.parse(responseText.trim());
    
    const sanitize = (val: string) => {
      if (typeof val !== 'string') return '00:00:00';
      const parts = val.split(':');
      if (parts.length >= 2) {
        return parts.map(p => p.padStart(2, '0')).join(':').substring(0, 8);
      }
      return '00:00:00';
    };

    return {
      ...rawResult,
      pause: sanitize(rawResult.pause),
      dispo: sanitize(rawResult.dispo),
      dead: sanitize(rawResult.dead),
      currentLogin: sanitize(rawResult.currentLogin),
      loginTimestamp: sanitize(rawResult.loginTimestamp),
      logoutTimestamp: sanitize(rawResult.logoutTimestamp),
      wait: sanitize(rawResult.wait),
      talk: sanitize(rawResult.talk),
      hold: sanitize(rawResult.hold),
      customerTalk: sanitize(rawResult.customerTalk),
    };
  } catch (e) {
    console.error("Gemini API Request Failed:", e);
    throw e;
  }
};
