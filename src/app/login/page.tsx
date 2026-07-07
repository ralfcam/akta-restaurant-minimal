'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--akta-gold)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'credentials' | 'magic'>('credentials');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (method === 'credentials') {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl,
        });

        if (result?.error) {
          setErrorMsg('Identifiants incorrects');
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        const result = await signIn('resend', {
          redirect: false,
          email,
          callbackUrl,
        });

        if (result?.error) {
          setErrorMsg("Erreur lors de l'envoi du lien magique.");
        } else {
          setSuccessMsg('Lien magique envoyé ! Vérifiez votre boîte mail.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full"
    >
      <LockIcon />
      <h1 className="text-3xl font-light text-[var(--akta-gold-light)] text-center mb-2 tracking-wider">Connexion</h1>
      <p className="text-[11px] text-[var(--akta-beige-dark)] uppercase tracking-[0.2em] text-center mb-6">Äkta Restaurant</p>
      
      {/* Method selector */}
      <div className="flex justify-center gap-6 mb-8 border-b border-[var(--akta-gold)]/10 pb-4">
        <button 
          type="button" 
          onClick={() => { setMethod('credentials'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`text-xs uppercase tracking-[0.1em] pb-1 ${method === 'credentials' ? 'border-b border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'text-[var(--akta-beige-dark)]/50 hover:text-[var(--akta-beige-dark)]'}`}
        >
          Mot de passe
        </button>
        <button 
          type="button" 
          onClick={() => { setMethod('magic'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`text-xs uppercase tracking-[0.1em] pb-1 ${method === 'magic' ? 'border-b border-[var(--akta-gold)] text-[var(--akta-gold)]' : 'text-[var(--akta-beige-dark)]/50 hover:text-[var(--akta-beige-dark)]'}`}
        >
          Lien Magique
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input 
            type="email"
            placeholder="Email de connexion"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-4 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors text-center font-mono placeholder:text-[var(--akta-beige-dark)]/50"
            required
            autoFocus
          />
        </div>

        {method === 'credentials' && (
          <div>
            <input 
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--akta-forest)]/30 border border-[var(--akta-gold)]/20 p-4 text-sm text-[var(--akta-beige)] focus:outline-none focus:border-[var(--akta-gold)] transition-colors text-center font-mono placeholder:text-[var(--akta-beige-dark)]/50"
              required
            />
          </div>
        )}

        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
        {successMsg && <p className="text-green-400 text-xs text-center">{successMsg}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--akta-gold)] hover:bg-[var(--akta-gold-light)] text-[var(--akta-obsidian)] font-bold py-4 text-xs uppercase tracking-[0.2em] transition-all"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--akta-obsidian)] flex items-center justify-center px-6 selection:bg-[var(--akta-gold)] selection:text-[var(--akta-obsidian)]">
      <Suspense fallback={<div className="text-[var(--akta-gold)]">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
