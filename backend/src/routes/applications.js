import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, j.title, c.name AS company_name
       FROM applications a
       JOIN jobs j ON j.id=a.job_id
       JOIN companies c ON c.id=j.company_id
       WHERE a.user_id=$1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, j.title, c.name AS company_name
       FROM applications a
       JOIN jobs j ON j.id=a.job_id
       JOIN companies c ON c.id=j.company_id
       WHERE a.id=$1 AND a.user_id=$2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { job_id, resume_url } = req.body;
    const result = await query(
      `INSERT INTO applications(job_id,user_id,resume_url)
       VALUES($1,$2,$3) RETURNING *`,
      [job_id, req.user.id, resume_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Already applied for this job' });
    if (err.code === '23503') return res.status(404).json({ message: 'Job not found' });
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE applications SET status=COALESCE($1,status),resume_url=COALESCE($2,resume_url)
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [req.body.status, req.body.resume_url, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM applications WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Application not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
