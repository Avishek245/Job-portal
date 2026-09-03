import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'job_seeker' } = req.body;
    if (!name || !email || !password || !['job_seeker', 'employer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid registration data' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name,email,password_hash,role)
       VALUES ($1,$2,$3,$4)
       RETURNING id,name,email,role,created_at`,
      [name, email.toLowerCase(), passwordHash, role]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email?.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id,name,email,role,created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    next(err);
  }
});

export default router;
