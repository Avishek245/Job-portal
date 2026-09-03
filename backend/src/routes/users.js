import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id,name,email,role,created_at FROM users WHERE id=$1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    if (Number(req.params.id) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const { name } = req.body;
    const result = await query(
      'UPDATE users SET name=COALESCE($1,name) WHERE id=$2 RETURNING id,name,email,role',
      [name, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
