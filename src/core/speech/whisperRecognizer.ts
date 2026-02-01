/**
 * Whisper Speech-to-Text Recognizer
 * 本地 Whisper 语音识别，通过后端服务实现
 */

export interface WhisperConfig {
  /** Whisper 服务地址 */
  baseUrl?: string;
  /** 语言代码 */
  language?: string;
  /** 请求超时时间 (ms) */
  timeout?: number;
}

export interface WhisperTranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface WhisperHealthStatus {
  status: string;
  provider: string;
  available: boolean;
}

const DEFAULT_CONFIG: Required<WhisperConfig> = {
  baseUrl: 'http://localhost:4000/whisper',
  language: 'zh',
  timeout: 30000,
};

export class WhisperRecognizer {
  private config: Required<WhisperConfig>;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private recordingStartTime = 0;

  constructor(config: WhisperConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检查 Whisper 服务是否可用
   */
  async checkHealth(): Promise<WhisperHealthStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        provider: data.provider,
        available: data.available,
      };
    } catch (error) {
      return {
        status: 'unavailable',
        provider: 'unknown',
        available: false,
      };
    }
  }

  /**
   * 转录音频 Blob
   */
  async transcribe(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('language', this.config.language);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/transcribe`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transcription failed: ${error}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments || [],
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    this.audioChunks = [];
    this.recordingStartTime = Date.now();

    // 获取麦克风权限
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // 选择支持的音频格式
    const mimeType = this.getSupportedMimeType();

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(500); // 每 500ms 收集一次数据
    this.isRecording = true;
  }

  /**
   * 停止录音并转录
   */
  async stopRecording(): Promise<WhisperTranscriptionResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // 合并音频数据
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });

          // 清理资源
          this.cleanup();

          // 如果录音太短，返回空结果
          const recordingDuration = Date.now() - this.recordingStartTime;
          if (recordingDuration < 500 || audioBlob.size < 1000) {
            resolve({
              text: '',
              language: this.config.language,
              duration: recordingDuration / 1000,
              segments: [],
            });
            return;
          }

          // 转录
          const result = await this.transcribe(audioBlob);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * 取消录音
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.isRecording = false;
  }

  /**
   * 获取录音状态
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WhisperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.cancelRecording();
  }

  /**
   * 获取支持的音频 MIME 类型
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }
}

/**
 * 检查 Whisper 服务是否可用
 */
export async function isWhisperAvailable(baseUrl = 'http://localhost:4000/whisper'): Promise<boolean> {
  try {
    const recognizer = new WhisperRecognizer({ baseUrl });
    const health = await recognizer.checkHealth();
    return health.available;
  } catch {
    return false;
  }
}

/**
 * 便捷函数：录音并转录
 */
export async function recordAndTranscribe(
  config: WhisperConfig = {},
): Promise<WhisperTranscriptionResult> {
  const recognizer = new WhisperRecognizer(config);

  try {
    await recognizer.startRecording();

    // 等待用户停止（需要外部控制）
    // 这里只是示例，实际使用时应该在外部调用 stopRecording

    return await recognizer.stopRecording();
  } finally {
    recognizer.destroy();
  }
}
