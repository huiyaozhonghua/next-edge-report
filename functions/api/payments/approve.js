/**
 * Cloudflare Pages Function — POST /api/payments/approve
 *
 * 对应 Pi SDK 的 onReadyForServerApproval 回调。
 * 服务端读取并校验这笔支付（金额必须命中服务端档位、方向必须是 user_to_app、
 * 付款人必须是当前已认证用户），然后登记一条幂等记录。
 *
 * ⚠️ 路由按文件路径匹配 —— 这个文件必须独立存在，不能只靠 api/payments.js。
 */
import { handlePost, handleOptions } from "../_paycore.js";

export async function onRequestPost(context) {
  return handlePost(context, "approve");
}

export async function onRequestOptions() {
  return handleOptions();
}
