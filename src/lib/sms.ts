export async function sendOtpSms(mobile: string, otp: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.warn("MSG91 not configured — falling back to console log.");
    console.log(`OTP for ${mobile}: ${otp}`);
    return;
  }

  const response = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: "0",
      recipients: [
        {
          mobiles: `91${mobile}`,
          OTP: otp, // must match the variable name configured in your MSG91 Flow
        },
      ],
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.type === "error") {
    console.error("MSG91 send OTP failed:", data);
    throw new Error("Failed to send OTP SMS");
  }
}