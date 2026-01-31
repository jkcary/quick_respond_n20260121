# 语音识别与切分性能优化方案

## 问题概述

当前系统存在三个主要性能瓶颈：
1. **语音识别慢**：Web Speech API 依赖 Google 服务器，延迟 500-2000ms
2. **语音切分慢**：串行执行多次 LLM 调用，延迟 1000-4000ms
3. **提交判断慢**：额外的 LLM 调用，延迟 500-1500ms

**总延迟：2-7秒**

---

## 优化方案总览

| 阶段 | 优化内容 | 预期效果 | 实现难度 |
|------|----------|----------|----------|
| Phase 1 | 合并 LLM 调用（三合一） | 减少 2 次 API 调用 | 低 |
| Phase 2 | 本地 LLM (Ollama) | 延迟降低 80% | 中 |
| Phase 3 | 本地语音识别 (Whisper) | 语音延迟降低 90% | 中 |
| Phase 4 | 流式处理 | 感知延迟降低 50% | 高 |

---

## Phase 1: 合并 LLM 调用（三合一）

### 1.1 新增后端接口

**文件**: `backend/src/llm/llm.service.ts`

```typescript
/**
 * 一次调用完成：纠正转录 + 切分 + 判断
 * 将原来的 3 次 LLM 调用合并为 1 次
 */
async correctSegmentAndJudge(
  provider: LlmProvider,
  transcript: string,
  words: Array<{ index: number; word: string; hints?: string[] }>,
  targetCount: number,
  modelOverride?: string,
  deviceId?: string,
): Promise<CorrectSegmentAndJudgeResult> {
  const wordLines = words
    .map((item) => `#${item.index} ${item.word} | hints: ${(item.hints ?? []).join(', ')}`)
    .join('\n');

  const userMessage = `Transcript (Chinese, may contain homophone errors): ${transcript}

Target segments: ${targetCount}

English words and Chinese hints:
${wordLines}

Tasks:
1. Correct any homophone errors in the transcript
2. Segment into ${targetCount} translation parts
3. Judge if each segment correctly translates the corresponding word

Return JSON only.`;

  const response = await this.sendChat(
    provider,
    CORRECT_SEGMENT_AND_JUDGE_SYSTEM_PROMPT,
    userMessage,
    modelOverride,
    deviceId,
    Math.max(500, targetCount * 100),
  );

  const parsed = safeParseJson<CorrectSegmentAndJudgeResult>(response.content);
  if (
    parsed &&
    typeof parsed.correctedTranscript === 'string' &&
    Array.isArray(parsed.segments) &&
    Array.isArray(parsed.judgments)
  ) {
    return parsed;
  }

  // 回退到分步处理
  return this.fallbackCorrectSegmentAndJudge(provider, transcript, words, targetCount, modelOverride, deviceId);
}
```

### 1.2 新增 System Prompt

**文件**: `backend/src/llm/prompts.ts`

```typescript
export const CORRECT_SEGMENT_AND_JUDGE_SYSTEM_PROMPT = `You are a Chinese speech-to-text correction, segmentation, and translation judgment AI.

Your tasks:
1. CORRECT homophone errors in the Chinese transcript (e.g., "苹过" → "苹果")
2. SEGMENT the corrected text into N translation parts matching the English words
3. JUDGE if each segment correctly translates the corresponding English word

Rules:
- Maintain the original word order
- Each segment should be a complete translation unit
- Judge based on semantic meaning, not exact match
- Synonyms are acceptable (e.g., "高兴" and "快乐" for "happy")

Return ONLY valid JSON in this exact format:
{
  "correctedTranscript": "纠正后的完整中文文本",
  "segments": ["切分1", "切分2", ...],
  "judgments": [
    {"correct": true, "correction": "正确翻译"},
    {"correct": false, "correction": "正确翻译"},
    ...
  ]
}

IMPORTANT:
- segments.length MUST equal the number of target words
- judgments.length MUST equal segments.length
- No explanations, no extra text, ONLY JSON`;
```

### 1.3 新增类型定义

**文件**: `backend/src/llm/llm.types.ts`

```typescript
export interface CorrectSegmentAndJudgeResult {
  correctedTranscript: string;
  segments: string[];
  judgments: JudgmentResult[];
}
```

### 1.4 前端网关更新

**文件**: `src/core/backend/llmGateway.ts`

```typescript
/**
 * 一次调用完成纠正、切分和判断
 */
async correctSegmentAndJudge(
  transcript: string,
  words: SegmentWordHint[],
  targetCount?: number,
): Promise<CorrectSegmentAndJudgeResult> {
  return backendRequest<CorrectSegmentAndJudgeResult>('/llm/correct-segment-and-judge', {
    method: 'POST',
    body: JSON.stringify({
      provider: this.provider,
      model: this.model,
      transcript,
      words,
      targetCount,
    }),
  });
}
```

### 1.5 前端调用优化

**文件**: `src/components/test/TestPage.tsx`

修改 `segmentAndMatchTranscript` 函数：

```typescript
// 直接使用三合一接口，替代原来的多步调用
if (gateway && autoSubmit) {
  try {
    const result = await withTimeout(
      gateway.correctSegmentAndJudge(trimmedTranscript, hints, batchWords.length),
      TEST_CONFIG.VOICE_SEGMENT_TIMEOUT_MS,
      'Correct, segment and judge timeout',
    );

    if (result?.segments?.length && result?.judgments?.length) {
      // 直接使用结果，不需要再调用 correctTranscript 和 judgeBatch
      applyResultsAndSubmit(result);
      return;
    }
  } catch (error) {
    console.warn('Three-in-one call failed, falling back.', error);
  }
}
```

### 1.6 预期效果

| 操作 | 优化前 | 优化后 |
|------|--------|--------|
| 纠正转录 | 500-1500ms | 0ms (合并) |
| 切分 | 500-1500ms | 0ms (合并) |
| 判断 | 500-1500ms | 0ms (合并) |
| **三合一** | - | 800-2000ms |
| **总延迟** | 1500-4500ms | 800-2000ms |

---

## Phase 2: 本地 LLM (Ollama)

### 2.1 安装 Ollama

```bash
# Windows
winget install Ollama.Ollama

# 或下载安装包
# https://ollama.com/download/windows
```

### 2.2 拉取推荐模型

```bash
# 推荐：Qwen2.5-7B（中文能力强，速度快）
ollama pull qwen2.5:7b

# 备选：Llama3-8B
ollama pull llama3:8b

# 轻量级：Qwen2.5-3B（更快但精度略低）
ollama pull qwen2.5:3b
```

### 2.3 后端配置

**文件**: `backend/.env`

```env
# 启用 Ollama
ALLOW_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# 增加超时时间（本地模型首次加载需要时间）
REQUEST_TIMEOUT_MS=30000
```

### 2.4 前端配置切换

**文件**: `src/config/llm.config.ts`

```typescript
export const DEFAULT_LLM_CONFIGS: Record<LLMProvider, LLMConfig> = {
  // ... 其他配置
  [LLMProvider.Ollama]: {
    provider: LLMProvider.Ollama,
    modelName: 'qwen2.5:7b',
    baseUrl: 'http://localhost:11434',
    maxTokens: 500,
    temperature: 0,
  },
};
```

### 2.5 Ollama 优化配置

创建 Modelfile 优化推理速度：

```dockerfile
# 文件: ollama/Modelfile.qwen-fast
FROM qwen2.5:7b

# 优化参数
PARAMETER temperature 0
PARAMETER top_p 0.9
PARAMETER num_ctx 2048
PARAMETER num_predict 256

# 系统提示词（预加载）
SYSTEM """You are a Chinese translation judgment AI. Return ONLY JSON."""
```

```bash
# 创建优化版本
ollama create qwen-fast -f Modelfile.qwen-fast
```

### 2.6 预期效果

| 模型 | 首次加载 | 后续请求 | 内存占用 |
|------|----------|----------|----------|
| qwen2.5:7b | 2-5s | 100-300ms | ~5GB |
| qwen2.5:3b | 1-3s | 50-150ms | ~2.5GB |
| llama3:8b | 3-6s | 150-400ms | ~6GB |

**总延迟：从 2-7秒 降到 0.2-0.5秒**

---

## Phase 3: 本地语音识别 (Whisper)

### 方案 A: Whisper.cpp + WASM（纯前端）

#### 3A.1 安装依赖

```bash
npm install @nickshanks/whisper.cpp-wasm
# 或
npm install whisper-web
```

#### 3A.2 创建本地识别器

**文件**: `src/core/speech/whisperRecognizer.ts`

```typescript
import { createWhisper } from 'whisper-web';

export class WhisperRecognizer {
  private whisper: Awaited<ReturnType<typeof createWhisper>> | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  async initialize(modelPath = '/models/ggml-small.bin'): Promise<void> {
    if (this.whisper || this.isLoading) {
      return this.loadPromise ?? Promise.resolve();
    }

    this.isLoading = true;
    this.loadPromise = (async () => {
      this.whisper = await createWhisper({
        modelPath,
        language: 'zh',
      });
      this.isLoading = false;
    })();

    return this.loadPromise;
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.whisper) {
      throw new Error('Whisper not initialized');
    }

    const audioBuffer = await audioBlob.arrayBuffer();
    const result = await this.whisper.transcribe(audioBuffer);
    return result.text;
  }

  async transcribeStream(
    stream: MediaStream,
    onResult: (text: string, isFinal: boolean) => void,
  ): Promise<void> {
    // 实现流式识别
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = async (e) => {
      chunks.push(e.data);

      // 每 500ms 处理一次
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const text = await this.transcribe(blob);
        onResult(text, false);
      }
    };

    mediaRecorder.start(500); // 每 500ms 触发一次
  }

  destroy(): void {
    this.whisper = null;
  }
}
```

#### 3A.3 下载模型文件

```bash
# 下载 Whisper small 模型（~500MB，中文识别效果好）
curl -L -o public/models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin

# 或使用 base 模型（~150MB，更快但精度略低）
curl -L -o public/models/ggml-base.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
```

### 方案 B: 后端 Whisper 服务（推荐）

#### 3B.1 安装 faster-whisper

```bash
pip install faster-whisper
```

#### 3B.2 创建 Whisper 服务

**文件**: `backend/whisper-service/main.py`

```python
from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import os

app = FastAPI()

# 加载模型（首次启动时）
model = WhisperModel("small", device="cpu", compute_type="int8")
# GPU 版本: model = WhisperModel("small", device="cuda", compute_type="float16")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    # 保存临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 转录
        segments, info = model.transcribe(tmp_path, language="zh")
        text = "".join([segment.text for segment in segments])

        return {
            "text": text,
            "language": info.language,
            "duration": info.duration,
        }
    finally:
        os.unlink(tmp_path)

@app.get("/health")
def health():
    return {"status": "ok"}
```

#### 3B.3 运行服务

```bash
cd backend/whisper-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

#### 3B.4 前端集成

**文件**: `src/core/speech/backendWhisperRecognizer.ts`

```typescript
export class BackendWhisperRecognizer {
  private baseUrl: string;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(baseUrl = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API failed: ${response.status}`);
    }

    const result = await response.json();
    return result.text;
  }

  startRecording(stream: MediaStream): void {
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start();
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          const text = await this.transcribe(blob);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }
}
```

### 3.5 预期效果

| 方案 | 模型 | 延迟 | 精度 |
|------|------|------|------|
| Web Speech API | Google | 500-2000ms | 高 |
| Whisper WASM (small) | 本地 | 200-500ms | 高 |
| faster-whisper (CPU) | 本地 | 100-300ms | 高 |
| faster-whisper (GPU) | 本地 | 50-150ms | 高 |

---

## Phase 4: 流式处理（高级优化）

### 4.1 架构设计

```
用户说话 ─┬─> 音频采集 ─┬─> 实时转录 ─┬─> 逐词切分 ─┬─> 逐词判断 ─> 实时显示
          │             │             │             │
          ▼             ▼             ▼             ▼
       录音中...    识别中...     切分中...     判断中...
```

### 4.2 实现流式识别

**文件**: `src/core/speech/streamingRecognizer.ts`

```typescript
export class StreamingRecognizer {
  private whisper: BackendWhisperRecognizer;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private buffer: Float32Array[] = [];
  private onResult: ((text: string) => void) | null = null;
  private processInterval: number | null = null;

  constructor(whisperUrl = 'http://localhost:8001') {
    this.whisper = new BackendWhisperRecognizer(whisperUrl);
  }

  async start(onResult: (text: string) => void): Promise<void> {
    this.onResult = onResult;
    this.buffer = [];

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext({ sampleRate: 16000 });

    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      this.buffer.push(new Float32Array(data));
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    // 每 500ms 处理一次
    this.processInterval = window.setInterval(() => {
      this.processBuffer();
    }, 500);
  }

  private async processBuffer(): Promise<void> {
    if (this.buffer.length === 0 || !this.onResult) return;

    // 合并音频数据
    const totalLength = this.buffer.reduce((sum, arr) => sum + arr.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of this.buffer) {
      merged.set(arr, offset);
      offset += arr.length;
    }

    // 转换为 WAV blob
    const wavBlob = this.float32ToWav(merged);

    try {
      const text = await this.whisper.transcribe(wavBlob);
      if (text.trim()) {
        this.onResult(text);
      }
    } catch (error) {
      console.error('Streaming transcription failed:', error);
    }
  }

  private float32ToWav(data: Float32Array): Blob {
    // 实现 Float32 到 WAV 的转换
    // ... (省略实现细节)
  }

  stop(): void {
    if (this.processInterval) {
      window.clearInterval(this.processInterval);
    }
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
  }
}
```

### 4.3 流式切分与判断

**文件**: `src/hooks/useStreamingTest.ts`

```typescript
export function useStreamingTest(batchWords: VocabularyItem[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [segments, setSegments] = useState<string[]>([]);
  const [judgments, setJudgments] = useState<JudgmentResult[]>([]);
  const gateway = useGateway();
  const recognizer = useRef<StreamingRecognizer | null>(null);
  const lastTranscript = useRef('');

  const start = useCallback(async () => {
    recognizer.current = new StreamingRecognizer();

    await recognizer.current.start(async (transcript) => {
      // 检测新增的文本
      const newText = transcript.slice(lastTranscript.current.length).trim();
      lastTranscript.current = transcript;

      if (!newText || currentIndex >= batchWords.length) return;

      // 尝试匹配当前单词
      const currentWord = batchWords[currentIndex];
      const hints = [currentWord.zh, ...(currentWord.chinese ?? [])];

      // 简单匹配：检查是否包含提示词
      const matched = hints.some(hint => newText.includes(hint));

      if (matched) {
        // 立即显示
        setSegments(prev => [...prev, newText]);

        // 异步判断（不阻塞UI）
        gateway.judge(currentWord.word, newText).then(result => {
          setJudgments(prev => [...prev, result]);
        });

        setCurrentIndex(prev => prev + 1);
      }
    });
  }, [batchWords, currentIndex, gateway]);

  const stop = useCallback(() => {
    recognizer.current?.stop();
  }, []);

  return { start, stop, segments, judgments, currentIndex };
}
```

---

## 配置文件更新

### app.config.ts

```typescript
export const TEST_CONFIG = {
  WORDS_PER_TEST: 5,

  // 语音识别配置
  VOICE_RECOGNITION_MODE: 'whisper' as 'web-speech' | 'whisper' | 'whisper-wasm',
  WHISPER_API_URL: 'http://localhost:8001',

  // 切分配置
  VOICE_CORRECTION_ENABLED: false, // 使用三合一接口时禁用
  VOICE_SEGMENT_TIMEOUT_MS: 15000,
  VOICE_SPEECH_TIMEOUT_MS: 10000,

  // 本地 LLM 配置
  USE_LOCAL_LLM: true,
  LOCAL_LLM_PROVIDER: 'ollama',
  LOCAL_LLM_MODEL: 'qwen2.5:7b',

  // 流式处理配置
  STREAMING_ENABLED: false, // Phase 4
  STREAMING_INTERVAL_MS: 500,
};
```

---

## 部署检查清单

### Phase 1（合并 LLM 调用）
- [ ] 添加 `CORRECT_SEGMENT_AND_JUDGE_SYSTEM_PROMPT`
- [ ] 实现 `correctSegmentAndJudge` 后端接口
- [ ] 添加 `correctSegmentAndJudge` 前端网关方法
- [ ] 修改 `TestPage.tsx` 使用三合一接口
- [ ] 测试回退逻辑

### Phase 2（本地 LLM）
- [ ] 安装 Ollama
- [ ] 拉取 qwen2.5:7b 模型
- [ ] 配置后端 `.env`
- [ ] 测试连接
- [ ] 优化模型参数

### Phase 3（本地语音识别）
- [ ] 选择方案（WASM 或 后端服务）
- [ ] 安装依赖/部署服务
- [ ] 下载 Whisper 模型
- [ ] 集成前端识别器
- [ ] 测试识别准确率

### Phase 4（流式处理）
- [ ] 实现流式识别器
- [ ] 实现逐词切分
- [ ] 实现异步判断
- [ ] UI 实时更新
- [ ] 错误处理和回退

---

## 预期最终效果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 语音识别延迟 | 500-2000ms | 50-300ms | 80-95% |
| 切分+判断延迟 | 1500-4500ms | 100-500ms | 90-95% |
| 总延迟 | 2-7秒 | 0.2-0.8秒 | **90%** |
| 用户体验 | 等待明显 | 接近实时 | 显著提升 |

---

## 下一步

1. 确认优先实施哪个阶段
2. 根据硬件条件选择本地模型
3. 开始实施并逐步测试
