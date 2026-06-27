import { Message } from '../types';
import { SONYA_SYSTEM_PROMPT } from './sonyaPrompt';

export async function streamChatCompletion(
  apiKey: string,
  provider: string,
  model: string,
  history: Message[],
  signal: AbortSignal,
  onChunk: (accumulatedText: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: Error) => void
) {
  try {
    if (!apiKey) {
      throw new Error('OpenRouter API Key is missing. Please add it to Settings.');
    }

    const isGroq = provider === 'groq';
    const endpoint = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    if (!isGroq) {
      headers['HTTP-Referer'] = 'https://sonya.app';
      headers['X-Title'] = 'Sonya Companion';
    }

    // Prepare full list of messages with system prompt first
    const messages = [
      { role: 'system', content: SONYA_SYSTEM_PROMPT },
      ...history.map((msg) => ({
        role: msg.role,
        content: Array.isArray(msg.content) ? msg.content : msg.content,
      })),
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model: model || (isGroq ? 'llama-3.3-70b-versatile' : 'cognitivecomputations/dolphin3.0-mistral-24b'),
        messages,
        stream: true,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      let errorDesc = '';
      try {
        const errorJson = await response.json();
        errorDesc = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch (e) {
        try {
          errorDesc = await response.text();
        } catch (t) {
          errorDesc = response.statusText;
        }
      }
      throw new Error(errorDesc || `HTTP Error ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is unavailable for streaming.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedContent = '';
    let isThinking = false;
    let hasStartedOutput = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep the last partial line in buffer

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine.startsWith('data:')) {
          const dataStr = cleanLine.substring(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              const errMsg = parsed.error.message || JSON.stringify(parsed.error);
              throw new Error(`OpenRouter Error: ${errMsg}`);
            }
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              accumulatedContent += content;

              if (!isThinking) {
                const thinkStart = accumulatedContent.indexOf('<think>');
                if (thinkStart !== -1) {
                  isThinking = true;
                }
              }

              if (isThinking) {
                const thinkEnd = accumulatedContent.indexOf('</think>');
                if (thinkEnd !== -1) {
                  // Strip everything up to and including </think>
                  const stripped = accumulatedContent.substring(thinkEnd + '</think>'.length).replace(/^[\s\n\r]+/, '');
                  isThinking = false;
                  hasStartedOutput = false;
                  accumulatedContent = stripped;
                  if (stripped) {
                    onChunk(stripped);
                  }
                }
                // else: still thinking, no output
              } else {
                if (!hasStartedOutput) {
                  const trimmed = accumulatedContent.replace(/^[\s\n\r]+/, '');
                  accumulatedContent = trimmed;
                  onChunk(trimmed);
                  hasStartedOutput = true;
                } else {
                  onChunk(accumulatedContent);
                }
              }
            }
          } catch (e: any) {
            if (e.message && e.message.includes('OpenRouter Error:')) {
              throw e;
            }
            // Partial JSON chunk, allow next iterations to process it
          }
        }
      }
    }

    // Deal with any trailing buffer
    if (buffer && buffer.startsWith('data:')) {
      const dataStr = buffer.substring(5).trim();
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            const errMsg = parsed.error.message || JSON.stringify(parsed.error);
            throw new Error(`OpenRouter Error: ${errMsg}`);
          }
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            accumulatedContent += content;

            if (!isThinking) {
              const thinkStart = accumulatedContent.indexOf('<think>');
              if (thinkStart !== -1) {
                isThinking = true;
              }
            }

            if (isThinking) {
              const thinkEnd = accumulatedContent.indexOf('</think>');
              if (thinkEnd !== -1) {
                const stripped = accumulatedContent.substring(thinkEnd + '</think>'.length).replace(/^[\s\n\r]+/, '');
                isThinking = false;
                hasStartedOutput = false;
                accumulatedContent = stripped;
                if (stripped) {
                  onChunk(stripped);
                }
              }
            } else {
              if (!hasStartedOutput) {
                const trimmed = accumulatedContent.replace(/^[\s\n\r]+/, '');
                accumulatedContent = trimmed;
                onChunk(trimmed);
                hasStartedOutput = true;
              } else {
                onChunk(accumulatedContent);
              }
            }
          }
        } catch (e: any) {
          if (e.message && e.message.includes('OpenRouter Error:')) {
            throw e;
          }
        }
      }
    }

    onDone(accumulatedContent);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      onError(error || new Error('Unknown connection error'));
    }
}