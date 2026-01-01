// import * as dotenv from "dotenv"; // 必须在第一行就加载
// import path from "path";

// // 根据 NODE_ENV 加载不同的 .env 文件
// const envFile =
// 	process.env.NODE_ENV === "production" ? ".env.production" : ".env";

// dotenv.config({
// 	path: path.resolve(process.cwd(), envFile),
// });
import { sendBufferMessage } from "./message.js"

// test sendMsg
async function test() {
	console.log("正在发起请求...")
	try {
		const iterator = sendBufferMessage([
			{ content: "请问现在的北京时间是多少？" },
		])

		for await (const text of iterator) {
			console.log("收到片段:", text)
		}
		console.log("迭代结束")
	} catch (e) {
		console.error("捕获到错误:", e)
	}
}

test()

// 正在发起请求...
// JSON Content: {
//   "heartbeat": {}
// }
// JSON Content: {
//   "op": "set",
//   "eventOffset": 1,
//   "chat": {
//     "id": "19b79776-8e42-8075-8000-091037ea12d9",
//     "name": "未命名会话",
//     "createTime": "2026-01-01T12:10:27.469993881Z"
//   }
// }
// JSON Content: {
//   "op": "set",
//   "mask": "chat.lastRequest",
//   "eventOffset": 2,
//   "chat": {
//     "id": "19b79776-8e42-8075-8000-091037ea12d9",
//     "lastRequest": {
//       "options": {
//         "thinking": true
//       },
//       "scenario": "SCENARIO_K2"
//     }
//   }
// }
// JSON Content: {
//   "op": "set",
//   "eventOffset": 3,
//   "message": {
//     "id": "19b79776-8e42-8075-8000-091037ea12d9",
//     "role": "system",
//     "status": "MESSAGE_STATUS_COMPLETED",
//     "scenario": "SCENARIO_K2",
//     "createTime": "2026-01-01T12:10:27.568790818Z"
//   }
// }
// JSON Content: {
//   "op": "set",
//   "mask": "message",
//   "eventOffset": 4,
//   "message": {
//     "id": "19b79776-9262-8db7-8000-0a101182304b",
//     "parentId": "19b79776-8e42-8075-8000-091037ea12d9",
//     "role": "user",
//     "status": "MESSAGE_STATUS_COMPLETED",
//     "blocks": [
//       {
//         "text": {
//           "content": "请问现在的北京时间是多少？"
//         }
//       }
//     ],
//     "scenario": "SCENARIO_K2",
//     "createTime": "2026-01-01T12:10:27.494572Z"
//   }
// }
// 收到片段: 请问现在的北京时间是多少？
// JSON Content: {
//   "op": "set",
//   "mask": "message",
//   "eventOffset": 5,
//   "message": {
//     "id": "19b79776-9262-8db7-8000-0a1082ef3e40",
//     "parentId": "19b79776-9262-8db7-8000-0a101182304b",
//     "role": "assistant",
//     "status": "MESSAGE_STATUS_GENERATING",
//     "scenario": "SCENARIO_K2",
//     "createTime": "2026-01-01T12:10:27.494574Z"
//   }
// }
// ...

// 提问的结构：json.message.blocks[0].text.content
// 回答的结构：json.block.text.content，一个个json对象蹦出来
// 根据 json.op来判断是新的内容、阶段还是添加内容
// 思考和回答内容使用json.mask
// # think：
// - JSON.op = "set" & JSON.mask = 'block.think'，思考开始
// - json.op = 'append' & json.mask = 'block.think.content'，添加思考考内容
// - json.op 'set' & json[json.mask].stages[0].status === "STAGE_STATUS_END"
// # answer:
// - json.op = 'set' & json.mask = 'block.text'，回答开始
// - json.op = 'append' & json.mask = 'block.text.content'，添加回答内容

// 结束：
// JSON Content: {
//   "op": "set",
//   "mask": "message.status",
//   "eventOffset": 246,
//   "message": {
//     "id": "19b79776-9262-8db7-8000-0a1082ef3e40",
//     "status": "MESSAGE_STATUS_COMPLETED"
//   }
// }

// 算力不足 + 搜索工具（回答今日要闻）

