import { useId, useState, type FormEvent, type ReactNode } from 'react';
import type { Concept } from '../lib/concepts';
import { person } from '../lib/content';
import { ActHead } from './ActHead';

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;

type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

function validate(data: FormData): Errors {
  const e: Errors = {};
  if (!String(data.get('name') ?? '').trim()) e.name = 'Please enter your name.';
  const email = String(data.get('email') ?? '').trim();
  if (!email) e.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address, like name@example.com.';
  if (String(data.get('message') ?? '').trim().length < 10) e.message = 'Please add a short message (at least 10 characters).';
  return e;
}

function ContactForm({ concept }: { concept: Concept }) {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'mailto' | 'error'>('idle');
  const term = concept === 'compile';
  const label = (plain: string, cmd: string) => (term ? `$ ${cmd}` : plain);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`);
      first?.focus();
      return;
    }
    const payload = Object.fromEntries(data.entries()) as Record<string, string>;
    if (ENDPOINT) {
      setStatus('sending');
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
        setStatus('sent');
        form.reset();
      } catch {
        setStatus('error');
      }
      return;
    }
    // No form backend configured: hand off to the visitor's mail client.
    const subject = `${payload.topic || 'Hello'} — from ${payload.name}`;
    const body = `${payload.message}\n\n${payload.name}\n${payload.email}`;
    window.location.href = `mailto:${person.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus('mailto');
  }

  const field = (name: keyof Errors) => ({
    id: `${uid}-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${uid}-${name}-err` : undefined,
  });
  const err = (name: keyof Errors) =>
    errors[name] ? (
      <p className="field__error" id={`${uid}-${name}-err`}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form className="cform panel" noValidate onSubmit={onSubmit} aria-labelledby={`${uid}-title`}>
      <h3 className="cform__title" id={`${uid}-title`}>
        {term ? 'contact.sh' : 'Send a message'}
      </h3>
      <div className="field">
        <label htmlFor={`${uid}-name`}>{label('Name', 'name')}</label>
        <input {...field('name')} type="text" autoComplete="name" required />
        {err('name')}
      </div>
      <div className="field">
        <label htmlFor={`${uid}-email`}>{label('Email', 'email')}</label>
        <input {...field('email')} type="email" autoComplete="email" required />
        {err('email')}
      </div>
      <fieldset className="field field--radios">
        <legend>{label("I'm getting in touch about", 'topic')}</legend>
        {['A remote role', 'A freelance project', 'Something else'].map((t, i) => (
          <label key={t} className="radio">
            <input type="radio" name="topic" value={t} defaultChecked={i === 0} />
            <span>{t}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor={`${uid}-message`}>{label('Message', 'message')}</label>
        <textarea {...field('message')} rows={5} required />
        {err('message')}
      </div>
      <button type="submit" className="btn btn--primary cform__submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : term ? '$ send --now' : 'Send message'}
      </button>
      <p className="cform__status" role="status" aria-live="polite">
        {status === 'sent' && 'Thanks — your message has been sent. I will reply by email.'}
        {status === 'mailto' && `Your email app should have opened with the message filled in. If it didn't, email ${person.email}.`}
        {status === 'error' && `Sorry, that didn't send. Please email ${person.email} directly.`}
      </p>
    </form>
  );
}

const TITLE: Record<Concept, ReactNode> = {
  folio: (
    <>
      Let's work <em>together.</em>
    </>
  ),
  prism: "Let's work together",
  terrain: "Let's work together.",
  compile: (
    <>
      Let's <span className="mono-word">build</span> together.
    </>
  ),
  maquette: "Let's work together.",
};
const KICKER: Record<Concept, ReactNode> = {
  folio: '04 — CONTACT · LAST PAGE',
  prism: '04 / 04 — CONTACT',
  terrain: '04 — Contact',
  compile: '<section> · 04/04 · exit 0',
  maquette: 'ROOF — DUSK',
};

export function Contact({ concept }: { concept: Concept }) {
  return (
    <section id="contact" className="act act--contact" aria-labelledby="contact-title">
      <div className="act__inner">
        <ActHead concept={concept} n={4} id="contact-title" title={TITLE} kicker={KICKER} />
        <div className="contact">
          <div className="contact__info" data-reveal>
            <p className="contact__lede">Open to remote roles and freelance projects. Tell me what you're building.</p>
            <a className="contact__email" href={`mailto:${person.email}`}>
              {person.email}
            </a>
            <span className="contact__beam" aria-hidden="true" />
            <ul className="socials" aria-label="Elsewhere">
              <li>
                <a href={person.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a href={person.github} target="_blank" rel="noreferrer">
                  GitHub <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
          <ContactForm concept={concept} />
        </div>
      </div>
      <footer className="site-foot">
        <span>
          © {new Date().getFullYear()} {person.name}
        </span>
        <span>Built with React, Three.js &amp; GSAP</span>
        <a href="#hero">Back to top ↑</a>
      </footer>
    </section>
  );
}
