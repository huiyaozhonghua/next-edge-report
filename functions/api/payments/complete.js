/**
 * Cloudflare Pages Function — POST /api/payments/complete
 *
 * 对应 Pi SDK 的 onReadyForServerCompletion 回调。
 * 服务端用 PI_NETWORK_API_KEY 调 Pi Platform API 的 /payments/:id/approve 与 /complete
 * 完成结算，**确认完成后**才发放权益（支持者徽章），且按 payment id 幂等 —— 同一笔
 * 支付重复提交只会发放一次。
 */
import { handlePost, handleOptions } from "../_paycore.js";

export async function onRequestPost(context) {
  return handlePost(context, "complete");
}

export async function onRequestOptions() {
  return handleOptions();
}
