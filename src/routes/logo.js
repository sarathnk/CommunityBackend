import { Router } from 'express';
import { LogoGenerator } from '../services/logoGenerator.js';

export const router = Router();

// Generate logo for community
router.post('/generate', async (req, res) => {
  try {
    const { communityName, type, description } = req.body;
    
    if (!communityName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Community name is required' 
      });
    }

    console.log('Generating logo for:', { communityName, type, description });
    
    // Generate custom SVG logo
    const result = await LogoGenerator.generateCustomLogo(
      communityName, 
      type || 'Community', 
      description
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        logoUrl: result.logoUrl,
        method: result.method,
        message: 'Logo generated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate logo'
      });
    }
  } catch (error) {
    console.error('Logo generation endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate simple logo (fallback)
router.post('/generate-simple', async (req, res) => {
  try {
    const { communityName, type } = req.body;
    
    if (!communityName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Community name is required' 
      });
    }

    const result = await LogoGenerator.generateLogo(
      communityName, 
      type || 'Community'
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        logoUrl: result.logoUrl,
        method: result.method,
        message: 'Simple logo generated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate logo'
      });
    }
  } catch (error) {
    console.error('Simple logo generation endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate multiple logo options
router.post('/generate-options', async (req, res) => {
  try {
    const { communityName, type, description } = req.body;
    
    if (!communityName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Community name is required' 
      });
    }

    console.log('Generating multiple logo options for:', { communityName, type, description });
    
    // Generate different logo styles
    const [customResult, advancedResult, simpleResult] = await Promise.all([
      LogoGenerator.generateCustomLogo(communityName, type || 'Community', description),
      LogoGenerator.generateAdvancedLogo(communityName, type || 'Community', description),
      LogoGenerator.generateLogo(communityName, type || 'Community')
    ]);

    const options = [];
    
    if (customResult.success) {
      options.push({
        id: 'custom',
        name: 'Custom Design',
        description: 'Unique SVG logo with icon and gradient',
        logoUrl: customResult.logoUrl,
        method: customResult.method
      });
    }
    
    if (advancedResult.success) {
      options.push({
        id: 'advanced',
        name: 'Professional',
        description: 'Clean and modern design',
        logoUrl: advancedResult.logoUrl,
        method: advancedResult.method
      });
    }
    
    if (simpleResult.success) {
      options.push({
        id: 'simple',
        name: 'Simple',
        description: 'Minimalist text-based logo',
        logoUrl: simpleResult.logoUrl,
        method: simpleResult.method
      });
    }

    return res.status(200).json({
      success: true,
      options: options,
      message: `Generated ${options.length} logo options`
    });
  } catch (error) {
    console.error('Multiple logo generation endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
