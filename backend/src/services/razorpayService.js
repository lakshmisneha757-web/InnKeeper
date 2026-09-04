import crypto from 'node:crypto';
import Razorpay from 'razorpay';

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function rupeesToPaise(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Payment amount must be a finite value greater than zero');
  }

  const paise = Math.round(numericAmount * 100);
  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new Error('Payment amount is outside the supported range');
  }

  return paise;
}

export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes }) {
  const paise = rupeesToPaise(amount);
  if (!currency || currency !== 'INR') {
    throw new Error('Razorpay orders must use INR currency');
  }

  return getRazorpayClient().orders.create({
    amount: paise,
    currency,
    receipt,
    notes,
  });
}

export async function fetchRazorpayPayment(paymentId) {
  if (!paymentId) throw new Error('Razorpay payment ID is required');
  return getRazorpayClient().payments.fetch(paymentId);
}

export async function fetchRazorpayOrder(orderId) {
  if (!orderId) throw new Error('Razorpay order ID is required');
  return getRazorpayClient().orders.fetch(orderId);
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay credentials are not configured');

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(String(signature), 'utf8');

  return expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
