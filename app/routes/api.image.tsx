import type { ActionFunction, LoaderFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { createAppContext } from "../context";
import { handleError } from "../utils/error";
import { withAuth } from "../middleware/auth";
import { withCors } from "../middleware/cors";
import { CONFIG } from "../config";

export const loader: LoaderFunction = () => {
  return json({ error: "此 API 端点仅支持 POST 请求" }, { status: 405 });
};

export const action: ActionFunction = withCors(withAuth(async ({ request, context }) => {
  console.log("API request received");
  console.log("CONFIG:", JSON.stringify(CONFIG, null, 2));
  
  try {
    const appContext = createAppContext(context);
    const { imageGenerationService } = appContext;

    const data = await request.json();
    const { messages, model: requestedModel, stream } = data;
    const userMessage = messages.find((msg: any) => msg.role === "user")?.content;

    if (!userMessage) {
      return json({ error: "未找到用户消息" }, { status: 400 });
    }

    const modelId = requestedModel || Object.keys(CONFIG.CUSTOMER_MODEL_MAP)[0];
    const model = CONFIG.CUSTOMER_MODEL_MAP[modelId];

    if (!model) {
      return json({ error: "无效的模型" }, { status: 400 });
    }

    const result = await imageGenerationService.generateImage(userMessage, model);

    return json(result);
  } catch (error) {
    return handleError(error);
  }
}));