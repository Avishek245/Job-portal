import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json((await query('SELECT * FROM companies ORDER BY id DESC')).rows); }
  catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM companies WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('employer'), async (req, res, next) => {
  try {
    const { name, description, location, website } = req.body;
    const result = await query(
      `INSERT INTO companies(name,description,location,website)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [name, description, location, website]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireRole('employer'), async (req, res, next) => {
  try {
    const { name, description, location, website } = req.body;
    const result = await query(
      `UPDATE companies SET name=COALESCE($1,name),description=COALESCE($2,description),
       location=COALESCE($3,location),website=COALESCE($4,website)
       WHERE id=$5 RETURNING *`,
      [name, description, location, website, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('employer'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM companies WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Company not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
