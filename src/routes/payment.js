import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { PaymentService } from '../services/paymentService.js';

const router = express.Router();

// Create payment order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { amount, currency = 'INR', plan } = req.body;
    const userId = req.user.id;

    console.log('Payment API: Creating order for user:', userId, 'Amount:', amount, 'Plan:', plan);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const receipt = `sub_${plan}_${userId}_${Date.now()}`;
    const result = await PaymentService.createOrder(amount, currency, receipt);

    if (result.success) {
      res.json({
        success: true,
        order: result.order,
        message: 'Order created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Payment API: Error creating order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const userId = req.user.id;

    console.log('Payment API: Verifying payment for user:', userId, 'Order:', orderId, 'Payment:', paymentId);

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    const isValid = PaymentService.verifyPaymentSignature(orderId, paymentId, signature);

    if (isValid) {
      // Get payment details
      const paymentDetails = await PaymentService.getPaymentDetails(paymentId);
      
      if (paymentDetails.success) {
        res.json({
          success: true,
          verified: true,
          payment: paymentDetails.payment,
          message: 'Payment verified successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch payment details'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('Payment API: Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get payment details
router.get('/:paymentId', requireAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    console.log('Payment API: Getting payment details for user:', userId, 'Payment:', paymentId);

    const result = await PaymentService.getPaymentDetails(paymentId);

    if (result.success) {
      res.json({
        success: true,
        payment: result.payment
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Payment API: Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Refund payment
router.post('/refund', requireAuth, async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    const userId = req.user.id;

    console.log('Payment API: Creating refund for user:', userId, 'Payment:', paymentId, 'Amount:', amount);

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const result = await PaymentService.refundPayment(paymentId, amount);

    if (result.success) {
      res.json({
        success: true,
        refund: result.refund,
        message: 'Refund processed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Payment API: Error creating refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

export { router };
