import { useState, useCallback } from "react"
import { Message, sendMessage, ChatEventChunk } from "../api/message.js"

/**
 * 流式响应状态枚举
 * - idle: 空闲状态，可以接收新的请求
 * - thinking: AI 正在思考阶段（处理 think 块）
 * - generating: AI 正在生成回答（处理 text 块）
 * - completed: 流式响应已完成
 * - error: 发生错误
 */
export type StreamStatus = "idle" | "thinking" | "generating" | "completed" | "error"

/**
 * useStreamResponse Hook 的返回值接口
 * 封装了流式响应所需的所有状态管理逻辑
 */
interface UseStreamResponseReturn {
  // 状态标识
  status: StreamStatus // 当前流式响应的状态
  isThinking: boolean // 是否处于思考阶段（thinking 状态）
  isGenerating: boolean // 是否处于生成阶段（generating 状态）
  isIdle: boolean // 是否空闲

  // 流式内容缓冲区
  streamTextBuffer: string // 累积的流式文本内容（回答）
  streamThinkBuffer: string // 累积的思考过程内容

  // 完整内容（流结束后可用于保存到历史）
  fullTextContent: string // 完整的文本回答内容
  fullThinkContent: string // 完整的思考内容

  // 错误处理
  error: Error | null // 最后一个错误信息

  // 控制方法
  startStream: (message: Message) => Promise<string> // 启动流式请求，返回完整回答
  reset: () => void // 重置所有状态
}

/**
 * 流式响应 Hook
 *
 * 抽象了从发送消息到流式接收响应的完整流程，包括：
 * 1. 状态管理（thinking/generating/idle）
 * 2. 内容缓冲区管理（文本和思考过程分离）
 * 3. 错误处理
 *
 * 使用示例：
 * ```tsx
 * const {
 *   status,
 *   streamTextBuffer,
 *   streamThinkBuffer,
 *   startStream,
 *   reset
 * } = useStreamResponse()
 *
 * const handleSubmit = async (value: string) => {
 *   const userMsg = { id: Date.now().toString(), role: 'user', content: value, timestamp: Date.now() }
 *   await startStream(userMsg)
 * }
 * ```
 */
export const useStreamResponse = (): UseStreamResponseReturn => {
  // === 状态管理 ===

  /**
   * 当前流式响应的状态
   * - idle: 空闲，等待用户输入
   * - thinking: 正在接收思考过程
   * - generating: 正在接收回答文本
   * - completed: 流结束
   * - error: 发生错误
   */
  const [status, setStatus] = useState<StreamStatus>("idle")

  /**
   * 流式文本缓冲区（AI 的回答）
   * 实时累积从流中接收到的文本片段
   */
  const [streamTextBuffer, setStreamTextBuffer] = useState("")

  /**
   * 流式思考缓冲区（AI 的思考过程）
   * 实时累积从流中接收到的 think 块内容
   */
  const [streamThinkBuffer, setStreamThinkBuffer] = useState("")

  /**
   * 错误信息
   * 保存最后一次发生的错误
   */
  const [error, setError] = useState<Error | null>(null)

  // === 计算属性 ===

  /**
   * 是否处于思考阶段
   * 当状态为 thinking 时为 true
   */
  const isThinking = status === "thinking"

  /**
   * 是否处于生成阶段
   * 当状态为 generating 时为 true
   */
  const isGenerating = status === "generating"

  /**
   * 是否空闲
   * 当状态为 idle 时为 true
   */
  const isIdle = status === "idle"

  /**
   * 完整的文本内容
   * 当流结束后，streamTextBuffer 就是完整的回答
   * 可以在 startStream 返回后使用
   */
  const fullTextContent = streamTextBuffer

  /**
   * 完整的思考内容
   * 当流结束后，streamThinkBuffer 就是完整的思考过程
   */
  const fullThinkContent = streamThinkBuffer

  // === 核心方法 ===

  /**
   * 启动流式请求
   *
   * @param message - 用户消息对象
   * @returns Promise<string> - 完整的 AI 回答文本
   *
   * 内部流程：
   * 1. 设置状态为 thinking（开始接收思考过程）
   * 2. 清空两个缓冲区
   * 3. 调用 sendMessage 发送请求
   * 4. 根据 chunk.mask 区分 think 和 text，分别累积到不同缓冲区
   * 5. 根据内容类型切换状态（thinking <-> generating）
   * 6. 流结束后设置状态为 completed
   * 7. 捕获并保存错误
   */
  const startStream = useCallback(async (message: Message): Promise<string> => {
    // 防御性检查：空闲状态才能发起新请求
    if (!isIdle) {
      console.warn("[useStreamResponse] Cannot start stream when not idle")
      return ""
    }

    // 重置错误状态
    setError(null)

    // 清空缓冲区，准备接收新内容
    setStreamTextBuffer("")
    setStreamThinkBuffer("")

    // 初始状态为 thinking（等待接收思考过程）
    setStatus("thinking")

    try {
      // 调用消息发送函数，接收流式数据
      // sendMessage 是一个生成器，通过 onProgress 回调返回每个数据块
      const finalContent = await sendMessage(
        message,
        (chunk: ChatEventChunk) => {
          // 根据掩码类型区分数据内容
          // 如果包含 "think"，说明是思考过程数据
          if (chunk.mask?.includes("think")) {
            // 切换到 thinking 状态（如果还不是）
            if (status !== "thinking") {
              setStatus("thinking")
            }
            // 累积思考内容
            const thinkContent = chunk.block?.think?.content || ""
            setStreamThinkBuffer((prev) => prev + thinkContent)
          }
          // 如果包含 "text"，说明是回答文本数据
          else if (chunk.mask?.includes("text")) {
            // 切换到 generating 状态
            setStatus("generating")
            // 累积回答文本
            const textContent = chunk.block?.text?.content || ""
            setStreamTextBuffer((prev) => prev + textContent)
          }
        }
      )

      // 流结束，设置完成状态
      setStatus("completed")

      // 返回完整的回答内容，供调用方保存到消息历史
      return finalContent
    } catch (err) {
      // 捕获并保存错误
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      setStatus("error")
      console.error("[useStreamResponse] Stream error:", errorObj)
      throw err
    }
  }, [isIdle, status])

  /**
   * 重置所有状态
   *
   * 用于手动重置流式响应状态，
   * 例如用户取消操作或需要重新开始时
   */
  const reset = useCallback(() => {
    setStatus("idle")
    setStreamTextBuffer("")
    setStreamThinkBuffer("")
    setError(null)
  }, [])

  // === 返回值 ===

  return {
    // 状态标识
    status,
    isThinking,
    isGenerating,
    isIdle,

    // 流式内容缓冲区
    streamTextBuffer,
    streamThinkBuffer,

    // 完整内容
    fullTextContent,
    fullThinkContent,

    // 错误处理
    error,

    // 控制方法
    startStream,
    reset,
  }
}
