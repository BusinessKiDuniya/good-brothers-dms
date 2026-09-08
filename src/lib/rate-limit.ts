import { RequestLog } from "@/models/RequestLog";

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMinutes: number,
) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  const count = await RequestLog.countDocuments({
    key,
    createdAt: { $gte: windowStart },
  });

  if (count >= maxRequests) return false;

  await RequestLog.create({ key });
  return true;
}
