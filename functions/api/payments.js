/**
 * Cloudflare Pages Function — GET /api/payments
 *
 * 返回服务端权威的打赏档位、是否已配置支付、以及当前用户自己的支持者标记。
 * 浏览器只能拿到 key 与展示文案，拿不到任何服务端秘密。
 */
import { handleGet, handleOptions } from "./_paycore.js";

export async function onRequestGet(context) {
  return handleGet(context);
}

export async function onRequestOptions() {
  return handleOptions();
}
