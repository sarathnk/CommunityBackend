import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

// Get all elections for the organization
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    const where = {
      organizationId: req.user.orgId,
      ...(q ? { 
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ] 
      } : {}),
      ...(status ? { status } : {}),
    };

    const query = {
      where,
      include: {
        candidates: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            votes: true,
            candidates: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    };

    const elections = await prisma.election.findMany(query);
    const hasMore = elections.length > limit;
    const items = elections.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return res.json({ items, nextCursor });
  } catch (e) {
    console.error('Error fetching elections:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific election with candidates and vote counts
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const election = await prisma.election.findFirst({
      where: { 
        id, 
        organizationId: req.user.orgId 
      },
      include: {
        candidates: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    return res.json(election);
  } catch (e) {
    console.error('Error fetching election:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a new election
router.post('/', requireAuth, requirePermission('elections.write'), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      startDate, 
      endDate, 
      allowMultiple, 
      maxVotes, 
      isAnonymous,
      candidates 
    } = req.body;

    if (!title || !description || !type || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const election = await prisma.election.create({
      data: {
        title,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allowMultiple: allowMultiple || false,
        maxVotes: allowMultiple ? maxVotes : null,
        isAnonymous: isAnonymous || false,
        createdById: req.user.sub,
        createdByName: req.user.name || 'Unknown',
        organizationId: req.user.orgId,
        candidates: candidates ? {
          create: candidates.map((candidate, index) => ({
            name: candidate.name,
            description: candidate.description || '',
            photoUrl: candidate.photoUrl || null,
            position: candidate.position || null,
            order: index
          }))
        } : undefined
      },
      include: {
        candidates: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return res.status(201).json(election);
  } catch (e) {
    console.error('Error creating election:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update an election
router.put('/:id', requireAuth, requirePermission('elections.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      type, 
      startDate, 
      endDate, 
      allowMultiple, 
      maxVotes, 
      isAnonymous,
      status 
    } = req.body;

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const updatedElection = await prisma.election.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(allowMultiple !== undefined && { allowMultiple }),
        ...(maxVotes !== undefined && { maxVotes }),
        ...(isAnonymous !== undefined && { isAnonymous }),
        ...(status && { status })
      },
      include: {
        candidates: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return res.json(updatedElection);
  } catch (e) {
    console.error('Error updating election:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete an election
router.delete('/:id', requireAuth, requirePermission('elections.write'), async (req, res) => {
  try {
    const { id } = req.params;

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Delete all votes and candidates first
    await prisma.vote.deleteMany({ where: { electionId: id } });
    await prisma.candidate.deleteMany({ where: { electionId: id } });
    await prisma.election.delete({ where: { id } });

    return res.status(204).send();
  } catch (e) {
    console.error('Error deleting election:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Add candidate to election
router.post('/:id/candidates', requireAuth, requirePermission('elections.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, photoUrl, position } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Candidate name is required' });
    }

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get the next order number
    const lastCandidate = await prisma.candidate.findFirst({
      where: { electionId: id },
      orderBy: { order: 'desc' }
    });

    const candidate = await prisma.candidate.create({
      data: {
        name,
        description: description || '',
        photoUrl: photoUrl || null,
        position: position || null,
        order: (lastCandidate?.order || -1) + 1,
        electionId: id
      }
    });

    return res.status(201).json(candidate);
  } catch (e) {
    console.error('Error adding candidate:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update candidate
router.put('/:id/candidates/:candidateId', requireAuth, requirePermission('elections.write'), async (req, res) => {
  try {
    const { id, candidateId } = req.params;
    const { name, description, photoUrl, position, order } = req.body;

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, electionId: id }
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(position !== undefined && { position }),
        ...(order !== undefined && { order })
      }
    });

    return res.json(updatedCandidate);
  } catch (e) {
    console.error('Error updating candidate:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete candidate
router.delete('/:id/candidates/:candidateId', requireAuth, requirePermission('elections.write'), async (req, res) => {
  try {
    const { id, candidateId } = req.params;

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, electionId: id }
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Delete all votes for this candidate
    await prisma.vote.deleteMany({ where: { candidateId } });
    await prisma.candidate.delete({ where: { id: candidateId } });

    return res.status(204).send();
  } catch (e) {
    console.error('Error deleting candidate:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Cast a vote
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { candidateIds } = req.body; // Array of candidate IDs

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: 'At least one candidate must be selected' });
    }

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: { candidates: true }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    if (election.status !== 'active') {
      return res.status(400).json({ message: 'Election is not active' });
    }

    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return res.status(400).json({ message: 'Election is not currently open for voting' });
    }

    // Check if user has already voted
    const existingVotes = await prisma.vote.findMany({
      where: { voterId: req.user.sub, electionId: id }
    });

    if (existingVotes.length > 0) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Validate candidate IDs
    const validCandidateIds = election.candidates.map(c => c.id);
    const invalidCandidates = candidateIds.filter(id => !validCandidateIds.includes(id));
    
    if (invalidCandidates.length > 0) {
      return res.status(400).json({ message: 'Invalid candidate selection' });
    }

    // Check voting rules
    if (!election.allowMultiple && candidateIds.length > 1) {
      return res.status(400).json({ message: 'This election only allows voting for one candidate' });
    }

    if (election.allowMultiple && election.maxVotes && candidateIds.length > election.maxVotes) {
      return res.status(400).json({ message: `You can vote for at most ${election.maxVotes} candidates` });
    }

    // Create votes
    const votes = await prisma.vote.createMany({
      data: candidateIds.map(candidateId => ({
        voterId: req.user.sub,
        voterName: req.user.name || 'Unknown',
        electionId: id,
        candidateId
      }))
    });

    return res.status(201).json({ message: 'Vote cast successfully', count: votes.count });
  } catch (e) {
    console.error('Error casting vote:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get election results
router.get('/:id/results', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const election = await prisma.election.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: {
        candidates: {
          include: {
            _count: {
              select: { votes: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { votes: true }
        }
      }
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Calculate results
    const totalVotes = election._count.votes;
    const results = election.candidates.map(candidate => ({
      ...candidate,
      voteCount: candidate._count.votes,
      percentage: totalVotes > 0 ? (candidate._count.votes / totalVotes) * 100 : 0
    }));

    // Sort by vote count (descending)
    results.sort((a, b) => b.voteCount - a.voteCount);

    return res.json({
      election: {
        id: election.id,
        title: election.title,
        status: election.status,
        totalVotes,
        totalCandidates: election.candidates.length
      },
      results
    });
  } catch (e) {
    console.error('Error fetching election results:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});
