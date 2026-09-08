export function addOneMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function formatSubscription(sub: any) {
  return {
    amount: sub.amount,
    status: sub.status as "ACTIVE" | "PAUSED" | "CANCELLED",
    startedAt: new Date(sub.startedAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
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