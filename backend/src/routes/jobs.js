import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const selectJobs = `
SELECT j.*, c.name AS company_name
FROM jobs j
JOIN companies c ON c.id = j.company_id
`;

router.get('/', async (req, res, next) => {
  try {
    const { search, location, employment_type } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`);
    }
    if (location) {
      params.push(`%${location}%`);
      conditions.push(`j.location ILIKE $${params.length}`);
    }
    if (employment_type) {
      params.push(employment_type);
      conditions.push(`j.employment_type = $${params.length}`);
    }

    const sql = `${selectJobs} ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
                 ORDER BY j.created_at DESC`;
    res.json((await query(sql, params)).rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(`${selectJobs} WHERE j.id=$1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('employer'), async (req, res, next) => {
  try {
    const { company_id, title, description, location, employment_type, salary_min, salary_max } = req.body;
    const result = await query(
      `INSERT INTO jobs(company_id,title,description,location,employment_type,salary_min,salary_max)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [company_id, title, description, location, employment_type, salary_min, salary_max]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireRole('employer'), async (req, res, next) => {
  try {
    const { title, description, location, employment_type, salary_min, salary_max } = req.body;
    const result = await query(
      `UPDATE jobs SET title=COALESCE($1,title),description=COALESCE($2,description),
       location=COALESCE($3,location),employment_type=COALESCE($4,employment_type),
       salary_min=COALESCE($5,salary_min),salary_max=COALESCE($6,salary_max)
       WHERE id=$7 RETURNING *`,
      [title, description, location, employment_type, salary_min, salary_max, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('employer'), async (req, res, next) => {
  try {
    const result = await query('DELETE FROM jobs WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Job not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
