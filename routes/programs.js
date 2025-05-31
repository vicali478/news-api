const express = require('express');
const router = express.Router();
const { Program , User} = require('../models');

// Utility to normalize day format
const normalizeDay = (day) => day.toLowerCase().trim();

// Create a new program
router.post('/', async (req, res) => {
  try {
    const program = await Program.create(req.body);
    res.status(201).json(program);
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(400).json({ error: 'Failed to create program' });
  }
});

// Get all programs or a specific one by ID
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id) {
      const program = await Program.findByPk(req.params.id,{
        
      include: [
        { model: User, as: 'presenter', attributes: ['id', 'username', 'profile_pic'] },
      ]
      });
      if (!program) return res.status(404).json({ error: 'Program not found' });
      return res.json(program);
    }

    const programs = await Program.findAll({
      include: [
        { model: User, as: 'presenter', attributes: ['id', 'username', 'profile_pic'] },
      ]
    });
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get today's programs
router.get('/all/today', async (req, res) => {
  const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  try {
    const programs = await Program.findAll({ where: { day: today },
      include: [
        { model: User, as: 'presenter', attributes: ['id', 'username', 'profile_pic'] },
      ]
     });
    res.json(programs);
  } catch (error) {
    console.error('Error fetching today’s programs:', error);
    res.status(500).json({ error: 'Failed to fetch today’s programs' });
  }
});

// Get programs for a specific day
router.get('/day/:day', async (req, res) => {
  const day = normalizeDay(req.params.day);
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (!validDays.includes(day)) {
    return res.status(400).json({ error: 'Invalid day. Use full lowercase day name (e.g., monday).' });
  }

  try {
    const programs = await Program.findAll({ where: { day },
      include: [
        { model: User, as: 'presenter', attributes: ['id', 'username', 'profile_pic'] },
      ]
     });
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs by day:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Get all programs grouped by day of the week
router.get('/all/grouped-by-day', async (req, res) => {
  try {
    const allPrograms = await Program.findAll({
      include: [
        { model: User, as: 'presenter', attributes: ['id', 'username', 'profile_pic'] },
      ]
    });
    const grouped = {};

    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      grouped[day] = allPrograms.filter(p => p.day === day);
    }

    res.json(grouped);
  } catch (error) {
    console.error('Error grouping programs:', error);
    res.status(500).json({ error: 'Failed to group programs' });
  }
});

// Edit full program (title, time, host, etc.)
router.put('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    await program.update(req.body);
    res.json({ message: 'Program updated', program });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(400).json({ error: 'Failed to update program' });
  }
});

// Update only the status (e.g., postpone, done, cancel)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'done', 'canceled', 'postponed', 'awaiting'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    program.status = status;
    await program.save();

    res.json({ message: 'Status updated', program });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({ error: 'Failed to update status' });
  }
});

// Delete a program
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Program.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Program not found' });

    res.json({ message: 'Program deleted' });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

module.exports = router;
