import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './api.js';

function Layout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('job_portal_user')); } catch { return null; }
  });

  function logout() {
    localStorage.removeItem('job_portal_token');
    localStorage.removeItem('job_portal_user');
    setUser(null);
    navigate('/');
  }

  return (
    <>
      <header>
        <Link className="brand" to="/">JobPortal</Link>
        <nav>
          <Link to="/jobs">Jobs</Link>
          {user ? <Link to="/applications">My Applications</Link> : null}
          {user ? <span className="user">Hi, {user.name}</span> : <Link to="/login">Login</Link>}
          {!user ? <Link className="button small" to="/register">Register</Link> : <button onClick={logout}>Logout</button>}
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}

function Home() {
  return (
    <section className="hero">
      <p className="eyebrow">THREE-TIER JOB PORTAL</p>
      <h1>Find work you’re excited to build.</h1>
      <p>Discover engineering and technology opportunities from growing companies.</p>
      <Link className="button" to="/jobs">Explore Jobs</Link>
    </section>
  );
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (location) params.set('location', location);
      setJobs(await api(`/jobs?${params}`));
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-title"><h2>Open Positions</h2><p>{jobs.length} opportunities</p></div>
      <form className="filters" onSubmit={e => { e.preventDefault(); load(); }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
        <button className="button">Search</button>
      </form>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        {jobs.map(job => (
          <article className="card" key={job.id}>
            <span className="tag">{job.employment_type}</span>
            <h3>{job.title}</h3>
            <p className="muted">{job.company_name} · {job.location}</p>
            <p>{job.description}</p>
            <p className="salary">₹{Number(job.salary_min).toLocaleString()} – ₹{Number(job.salary_max).toLocaleString()}</p>
            <Link to={`/jobs/${job.id}`}>View details →</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function JobDetails() {
  const id = location.pathname.split('/').pop();
  const [job, setJob] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { api(`/jobs/${id}`).then(setJob).catch(e => setMessage(e.message)); }, [id]);

  async function apply() {
    try {
      await api('/applications', { method: 'POST', body: JSON.stringify({ job_id: Number(id) }) });
      setMessage('Application submitted successfully.');
    } catch (e) { setMessage(e.message); }
  }

  if (message && !job) return <div className="error">{message}</div>;
  if (!job) return <p>Loading...</p>;

  return (
    <article className="detail">
      <span className="tag">{job.employment_type}</span>
      <h2>{job.title}</h2>
      <p className="muted">{job.company_name} · {job.location}</p>
      <p>{job.description}</p>
      <p className="salary">₹{Number(job.salary_min).toLocaleString()} – ₹{Number(job.salary_max).toLocaleString()}</p>
      <button className="button" onClick={apply}>Apply now</button>
      {message && <p className="success">{message}</p>}
    </article>
  );
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('job_portal_token', data.token);
      localStorage.setItem('job_portal_user', JSON.stringify(data.user));
      navigate('/jobs');
    } catch (e) { setError(e.message); }
  }

  return <AuthForm title="Welcome back" button="Login" form={form} setForm={setForm} submit={submit} error={error} />;
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'job_seeker' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
      navigate('/login');
    } catch (e) { setError(e.message); }
  }

  return (
    <AuthForm title="Create account" button="Register" form={form} setForm={setForm} submit={submit} error={error} register />
  );
}

function AuthForm({ title, button, form, setForm, submit, error, register }) {
  return (
    <form className="auth card" onSubmit={submit}>
      <h2>{title}</h2>
      {register && <input required placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />}
      <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
      <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
      {register && <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
        <option value="job_seeker">Job seeker</option>
        <option value="employer">Employer</option>
      </select>}
      <button className="button">{button}</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}

function Applications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { api('/applications').then(setItems).catch(e => setError(e.message)); }, []);

  return (
    <section>
      <div className="page-title"><h2>My Applications</h2></div>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        {items.map(item => (
          <article className="card" key={item.id}>
            <h3>{item.title}</h3>
            <p className="muted">{item.company_name}</p>
            <span className="tag">{item.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/applications" element={<Applications />} />
      </Routes>
    </Layout>
  );
}
