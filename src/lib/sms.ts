export async function sendOtpSms(
  mobile: string,
  otp: string,
) {
  console.log(`OTP for ${mobile}: ${otp}`);

  // Later connect your SMS provider here.
}
