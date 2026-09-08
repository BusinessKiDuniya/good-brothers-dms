export function formatSubscription(sub: any) {
  return {
    amount: sub.amount,
    status: sub.status as "CREATED" | "ACTIVE" | "PAUSED" | "CANCELLED" | "HALTED",
    startedAt: sub.startedAt
      ? new Date(sub.startedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null,
    nextPaymentDate: sub.nextPaymentDate
      ? new Date(sub.nextPaymentDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null,
    razorpaySubscriptionId: sub.razorpaySubscriptionId ?? null,
  };
}