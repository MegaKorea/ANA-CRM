/**
 * Giới hạn tần suất đơn giản, lưu trong bộ nhớ tiến trình.
 *
 * Đủ để chặn spam gọi API từ một tài khoản (quét liên tục, script thử mã). Lưu ý
 * giới hạn của cách làm này: bộ đếm nằm trong RAM nên khi chạy nhiều instance
 * (serverless, autoscale) mỗi instance đếm riêng. Muốn chặt chẽ hơn thì phải
 * chuyển sang Redis hoặc bảng đếm trong Postgres.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Dọn định kỳ để Map không phình theo số key đã hết hạn. */
function sweep(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Số giây phải chờ trước khi thử lại, chỉ có nghĩa khi allowed = false. */
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
