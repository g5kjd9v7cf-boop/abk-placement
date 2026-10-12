/**
 * Private CV retention. Objects never receive a public URL.
 * The bucket binding stays commented until Ahmed approves storage.
 * Until then putPrivateCv stores nothing and the application is only mailed.
 */

export const CV_RETENTION_DAYS = 180;

export function retentionDays(env) {
  const raw = Number(env && env.CV_RETENTION_DAYS);
  if (!Number.isFinite(raw)) return CV_RETENTION_DAYS;
  return Math.min(730, Math.max(30, Math.floor(raw)));
}

export function privateCvPlan(now = new Date(), days = CV_RETENTION_DAYS) {
  const deleteAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const id = crypto.randomUUID();
  return {
    key: `private/${deleteAt.toISOString().slice(0, 10)}/${id}`,
    deleteAt: deleteAt.toISOString(),
    publicUrl: null,
  };
}

export async function putPrivateCv(bucket, bytes, contentType, plan) {
  if (!bucket || typeof bucket.put !== 'function') {
    return { stored: false, publicUrl: null, deleteAt: plan.deleteAt };
  }
  await bucket.put(plan.key, bytes, {
    httpMetadata: { contentType },
    customMetadata: { delete_at: plan.deleteAt },
  });
  return { stored: true, publicUrl: null, deleteAt: plan.deleteAt };
}

export async function deleteExpired(bucket, now = new Date()) {
  if (!bucket || typeof bucket.list !== 'function') return { deleted: 0 };
  const listed = await bucket.list({ prefix: 'private/' });
  let deleted = 0;
  for (const obj of listed.objects || []) {
    let meta = obj.customMetadata || null;
    if (!meta && typeof bucket.head === 'function') {
      const head = await bucket.head(obj.key);
      meta = (head && head.customMetadata) || {};
    }
    const when = Date.parse((meta && meta.delete_at) || '');
    if (Number.isFinite(when) && when <= now.getTime()) {
      await bucket.delete(obj.key);
      deleted += 1;
    }
  }
  return { deleted };
}
