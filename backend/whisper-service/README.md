# Whisper 语音识别服务

本地部署的语音识别服务，使用 faster-whisper 实现低延迟中文语音转文字。

## 快速开始

### 1. 安装依赖

```bash
cd backend/whisper-service
pip install -r requirements.txt
```

### 2. 启动服务

```bash
# 默认配置（CPU，small 模型）
python main.py

# 或使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 3. 测试服务

```bash
# 健康检查
curl http://localhost:8001/health

# 转录音频
curl -X POST http://localhost:8001/transcribe \
  -F "audio=@test.webm" \
  -F "language=zh"
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WHISPER_MODEL` | `small` | 模型大小: tiny, base, small, medium, large-v3 |
| `WHISPER_DEVICE` | `cpu` | 设备: cpu, cuda |
| `WHISPER_COMPUTE_TYPE` | `int8` | 计算类型: int8, float16, float32 |
| `WHISPER_PORT` | `8001` | 服务端口 |
| `WHISPER_HOST` | `0.0.0.0` | 监听地址 |

## 模型选择

| 模型 | 大小 | 内存占用 | 速度 | 精度 |
|------|------|----------|------|------|
| tiny | 75MB | ~1GB | 最快 | 低 |
| base | 150MB | ~1.5GB | 快 | 中 |
| **small** | 500MB | ~2.5GB | 中 | **高（推荐）** |
| medium | 1.5GB | ~5GB | 慢 | 更高 |
| large-v3 | 3GB | ~10GB | 最慢 | 最高 |

**推荐**：使用 `small` 模型，在速度和精度之间取得平衡。

## GPU 加速

如果有 NVIDIA GPU，可以启用 CUDA 加速：

```bash
# 安装 CUDA 版本的 ctranslate2
pip install ctranslate2

# 设置环境变量
export WHISPER_DEVICE=cuda
export WHISPER_COMPUTE_TYPE=float16

python main.py
```

## API 文档

启动服务后访问：http://localhost:8001/docs

### POST /transcribe

转录音频文件。

**请求**：
- `audio`: 音频文件 (multipart/form-data)
- `language`: 语言代码，默认 `zh`

**响应**：
```json
{
  "text": "识别出的文本",
  "language": "zh",
  "duration": 3.5,
  "segments": [
    {"start": 0.0, "end": 1.5, "text": "你好"},
    {"start": 1.5, "end": 3.5, "text": "世界"}
  ]
}
```

## 性能对比

| 方案 | 延迟 (3秒音频) | 网络依赖 |
|------|----------------|----------|
| Web Speech API | 500-2000ms | 需要 Google 服务器 |
| Whisper (CPU) | 100-300ms | 无 |
| Whisper (GPU) | 50-150ms | 无 |

## 故障排除

### 模型下载慢

首次启动会从 Hugging Face 下载模型，可能需要几分钟。

可以手动下载并设置缓存目录：
```bash
export HF_HOME=/path/to/cache
```

### 内存不足

如果遇到内存不足，尝试使用更小的模型：
```bash
export WHISPER_MODEL=base
```

### CUDA 错误

确保安装了正确版本的 CUDA 和 cuDNN，并安装 CUDA 版本的 ctranslate2：
```bash
pip install ctranslate2
```
