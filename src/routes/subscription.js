import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { PaymentService } from '../services/paymentService.js';
import { MockPaymentService } from '../services/mockPaymentService.js';

const router = express.Router();

// Get user's subscription
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Subscription API: GET /api/subscription - User ID:', userId);
    
    // For now, we'll create a trial subscription for new users
    // In a real app, you'd query the database
    const subscription = {
      id: `sub_${Date.now()}`,
      userId: userId,
      plan: 'trial',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      isActive: true,
      isTrial: true,
      amount: 0,
      currency: 'INR',
      status: 'active'
    };

    console.log('Subscription API: Returning subscription:', subscription);
    res.json(subscription);
  } catch (error) {
    console.error('Subscription API: Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create payment order for subscription
router.post('/create-payment-order', async (req, res) => {
  try {
    // For mock payments, use a test user ID
    const userId = 'test-user-123';
    const { plan, amount, currency = 'INR' } = req.body;
    
    console.log('Subscription API: POST /api/subscription/create-payment-order - User ID:', userId);
    console.log('Subscription API: Request body:', { plan, amount, currency });

    if (plan !== 'yearly' || amount !== 9999 || currency !== 'INR') {
      console.log('Subscription API: Invalid subscription details');
      return res.status(400).json({ error: 'Invalid subscription details' });
    }

    // Create payment order (using mock service for testing)
    const receipt = `sub_${plan}_${userId}_${Date.now()}`;
    const paymentResult = await MockPaymentService.createOrder(amount, currency, receipt);

    if (paymentResult.success) {
      res.json({
        success: true,
        order: paymentResult.order,
        message: 'Mock payment order created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: paymentResult.error
      });
    }
  } catch (error) {
    console.error('Subscription API: Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Complete subscription purchase after payment verification
router.post('/complete-purchase', async (req, res) => {
  try {
    // For mock payments, use a test user ID
    const userId = 'test-user-123';
    const { orderId, paymentId, signature, plan, amount, currency } = req.body;
    
    console.log('Subscription API: POST /api/subscription/complete-purchase - User ID:', userId);
    console.log('Subscription API: Request body:', { orderId, paymentId, signature, plan, amount, currency });

    // Verify payment (using mock service for testing)
    const isValid = MockPaymentService.verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      console.log('Subscription API: Invalid payment signature');
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Create subscription after successful payment
    const subscription = {
      id: `sub_${Date.now()}`,
      userId: userId,
      plan: plan || 'yearly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      isActive: true,
      isTrial: false,
      amount: amount || 9999,
      currency: currency || 'INR',
      status: 'active',
      paymentId: paymentId,
      orderId: orderId
    };

    // In a real app, you'd save this to the database
    console.log('Subscription API: Subscription purchased:', subscription);

    res.json(subscription);
  } catch (error) {
    console.error('Subscription API: Error completing purchase:', error);
    res.status(500).json({ error: 'Failed to complete subscription purchase' });
  }
});

// Purchase yearly subscription (legacy - for testing without payment)
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, amount, currency } = req.body;
    
    console.log('Subscription API: POST /api/subscription/purchase - User ID:', userId);
    console.log('Subscription API: Request body:', { plan, amount, currency });

    if (plan !== 'yearly' || amount !== 9999 || currency !== 'INR') {
      console.log('Subscription API: Invalid subscription details');
      return res.status(400).json({ error: 'Invalid subscription details' });
    }

    // Simulate a successful purchase (for testing)
    const subscription = {
      id: `sub_${Date.now()}`,
      userId: userId,
      plan: 'yearly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      isActive: true,
      isTrial: false,
      amount: 9999,
      currency: 'INR',
      status: 'active'
    };

    console.log('Subscription API: Subscription purchased (test mode):', subscription);

    res.json(subscription);
  } catch (error) {
    console.error('Subscription API: Error purchasing subscription:', error);
    res.status(500).json({ error: 'Failed to purchase subscription' });
  }
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // In a real app, you'd update the subscription status in the database
    const subscription = {
      id: `sub_${Date.now()}`,
      userId: userId,
      plan: 'yearly',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(), // Set to current time to mark as cancelled
      isActive: false,
      isTrial: false,
      amount: 9999,
      currency: 'INR',
      status: 'cancelled'
    };

    console.log('Subscription cancelled:', subscription);

    res.json({ message: 'Subscription cancelled successfully', subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get subscription plans
router.get('/plans', (req, res) => {
  try {
    const plans = {
      trial: {
        name: 'Free Trial',
        price: 0,
        duration: 365, // 1 year
        description: 'First year completely free',
        features: [
          'Unlimited community members',
          'Unlimited events and announcements',
          'Basic analytics',
          'Email support'
        ]
      },
      yearly: {
        name: 'Yearly Plan',
        price: 9999,
        duration: 365,
        description: 'Full access for one year',
        features: [
          'Unlimited community members',
          'Unlimited events and announcements',
          'Advanced analytics and reporting',
          'Priority customer support',
          'Custom branding options',
          'API access for integrations'
        ]
      }
    };

    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

export { router };
