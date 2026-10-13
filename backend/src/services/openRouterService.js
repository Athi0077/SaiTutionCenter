const https = require('https');
const fetch = globalThis.fetch;

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || "google/gemma-7b-it:free";
    this.baseUrl = "openrouter.ai";
    this.basePath = "/api/v1";
  }

  _makeRequest(path, payload, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) return reject(new Error("Missing OpenRouter API key"));

      const dataString = JSON.stringify(payload);
      
      const options = {
        hostname: this.baseUrl,
        path: this.basePath + path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'StudyMate',
          'User-Agent': 'StudyMate/1.0',
          'Content-Length': Buffer.byteLength(dataString)
        },
        timeout: timeoutMs
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(responseBody));
            } catch (e) {
              reject(new Error("Invalid JSON response from AI provider"));
            }
          } else {
            if (res.statusCode === 429) reject(new Error("OpenRouter rate limit exceeded"));
            else if (res.statusCode === 401) reject(new Error("Invalid OpenRouter API key"));
            else reject(new Error(`OpenRouter API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error("OpenRouter API request timed out"));
      });

      req.write(dataString);
      req.end();
    });
  }

  async analyzeStudent(studentData) {
    if (!this.apiKey) throw new Error("Missing OpenRouter API key");

    try {
      const fetch = globalThis.fetch;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000", 
          "X-Title": "StudyMate",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are StudyMate's academic analysis assistant. Analyze only the supplied student records. Do not invent facts, diagnose disabilities, infer personal circumstances, or make disciplinary decisions. Provide evidence-based academic observations and practical learning recommendations. Clearly identify missing data and uncertainty. Do not assign permanent student labels such as 'weak student', 'failure', or 'poor student'. Do not predict a student's future academic outcome as a certainty. Return the response in a structured markdown format."
            },
            {
              role: "user",
              content: `Analyze the supplied academic performance, attendance, and homework summary: \n${JSON.stringify(studentData, null, 2)}`
            }
          ],
          temperature: 0.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorText = "";
        try { errorText = await response.text(); } catch(e) {}
        if (response.status === 429) throw new Error("OpenRouter rate limit exceeded");
        if (response.status === 401) throw new Error("Invalid OpenRouter API key");
        if (response.status === 402) throw new Error("OpenRouter credits exhausted (402)");
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText.substring(0, 50)}`);
      }

      const data = await response.json();
      if (!data?.choices?.[0]?.message) throw new Error("Invalid or empty AI response");
      return data.choices[0].message.content;

    } catch (error) {
      if (error.name === 'AbortError') throw new Error("OpenRouter API request timed out");
      // Add fetch error prefix so it doesn't get lost
      if (error.message.includes("fetch failed")) throw new Error("Network: fetch failed (Check OpenRouter status or DNS)");
      throw error;
    }
  }

  async analyzeClass(classData) {
    const payload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are StudyMate's academic analysis assistant. Analyze only the supplied class records. Do not invent facts or generate school-wide claims from a single class's data. Provide evidence-based academic observations and practical school-appropriate recommendations. Clearly identify missing data and distinguish recorded facts from AI-generated recommendations. Return the response in a structured markdown format."
        },
        {
          role: "user",
          content: `Analyze the supplied class performance, attendance, and homework summary: \n${JSON.stringify(classData, null, 2)}`
        }
      ],
      temperature: 0.2
    };

    const data = await this._makeRequest('/chat/completions', payload);
    if (!data?.choices?.[0]?.message) throw new Error("Invalid or empty AI response");
    return data.choices[0].message.content;
  }

  async extractIntent(query) {
    if (!this.apiKey) return { intent: "UNKNOWN" };
    try {
      const payload = {
        model: this.model,
        messages: [{
          role: "system",
          content: `You are an intent extractor. Return ONLY a structured JSON object. Extract the user's intent. Valid intents: SCHOOL_ENROLLMENT_SUMMARY, CLASS_PERFORMANCE_SUMMARY, SUBJECT_PERFORMANCE, CLASS_COMPARISON, STUDENT_LOOKUP, STUDENT_PERFORMANCE, ATTENDANCE_SUMMARY, LOW_ATTENDANCE_STUDENTS, HOMEWORK_SUMMARY, PENDING_HOMEWORK_STUDENTS, ACADEMIC_TREND, EARLY_WARNING_SUMMARY, UNKNOWN. 
Format: {"intent": "INTENT", "parameters": {"standard": "10th", "section": "A"}}`
        }, {
          role: "user",
          content: query
        }],
        response_format: { type: "json_object" },
        temperature: 0
      };
      const data = await this._makeRequest('/chat/completions', payload);
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      return { intent: "UNKNOWN" };
    }
  }

  async generateChatAnswer(query, dbData, history) {
    const formattedHistory = history.map(h => ({ role: h.role, content: h.content })).slice(-6);
    const payload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are the StudyMate Principal AI Assistant. Answer the user's question using ONLY the provided database query results. Do not invent facts, names, or numbers. Clearly distinguish between verified database facts and your own inferences. Use concise markdown."
        },
        ...formattedHistory,
        {
          role: "user",
          content: `Question: ${query}\n\nDatabase Results:\n${JSON.stringify(dbData, null, 2)}`
        }
      ],
      temperature: 0.2
    };

    const data = await this._makeRequest('/chat/completions', payload);
    if (!data?.choices?.[0]?.message) throw new Error("Invalid or empty AI response");
    return data.choices[0].message.content;
  }
}

module.exports = new OpenRouterService();
