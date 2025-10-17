import crypto from 'crypto';

export class MockPaymentService {
  // Create a mock payment order
  static async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      console.log('MockPaymentService: Creating mock order for amount:', amount);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const order = {
        id: `order_mock_${Date.now()}`,
        amount: amount * 100, // Convert to paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
      };

      console.log('MockPaymentService: Mock order created:', order);
      
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
      console.error('MockPaymentService: Error creating mock order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify mock payment signature
  static verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      // For mock payments, we'll accept any signature that starts with "mock_"
      const isValid = signature && signature.startsWith('mock_');
      
      console.log('MockPaymentService: Payment verification:', {
        orderId,
        paymentId,
        signature,
        isValid
      });

      return isValid;
    } catch (error) {
      console.error('MockPaymentService: Error verifying payment:', error);
      return false;
    }
  }

  // Get mock payment details
  static async getPaymentDetails(paymentId) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const payment = {
        id: paymentId,
        amount: 999900, // Default amount in paise
        currency: 'INR',
        status: 'captured',
        method: 'card',
        created_at: Math.floor(Date.now() / 1000),
        order_id: `order_mock_${Date.now()}`,
      };

      console.log('MockPaymentService: Mock payment details:', payment);
      
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
      console.error('MockPaymentService: Error fetching payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund mock payment
  static async refundPayment(paymentId, amount = null) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const refund = {
        id: `refund_mock_${Date.now()}`,
        amount: amount ? amount * 100 : 999900, // Amount in paise
        status: 'processed',
        created_at: Math.floor(Date.now() / 1000),
        payment_id: paymentId,
      };

      console.log('MockPaymentService: Mock refund created:', refund);
      
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
      console.error('MockPaymentService: Error creating refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate mock payment signature
  static generateMockSignature(orderId, paymentId) {
    const mockSignature = `mock_${crypto.randomBytes(16).toString('hex')}`;
    console.log('MockPaymentService: Generated mock signature:', mockSignature);
    return mockSignature;
  }
}
