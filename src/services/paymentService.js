import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Replace with your actual key
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_key', // Replace with your actual secret
});

export class PaymentService {
  // Create a payment order
  static async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1, // Auto capture payment
      };

      console.log('PaymentService: Creating order with options:', options);
      const order = await razorpay.orders.create(options);
      console.log('PaymentService: Order created:', order);
      
      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        }
      };
    } catch (error) {
      console.error('PaymentService: Error creating order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  static verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_secret_key')
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === signature;
      console.log('PaymentService: Payment verification:', {
        orderId,
        paymentId,
        expectedSignature,
        receivedSignature: signature,
        isValid
      });

      return isValid;
    } catch (error) {
      console.error('PaymentService: Error verifying payment:', error);
      return false;
    }
  }

  // Get payment details
  static async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      console.log('PaymentService: Payment details:', payment);
      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: payment.created_at,
        }
      };
    } catch (error) {
      console.error('PaymentService: Error fetching payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment
  static async refundPayment(paymentId, amount = null) {
    try {
      const refundOptions = {
        payment_id: paymentId,
        amount: amount ? amount * 100 : undefined, // Amount in paise, if not provided, full refund
      };

      console.log('PaymentService: Creating refund with options:', refundOptions);
      const refund = await razorpay.payments.refund(paymentId, refundOptions);
      console.log('PaymentService: Refund created:', refund);
      
      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          created_at: refund.created_at,
        }
      };
    } catch (error) {
      console.error('PaymentService: Error creating refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
