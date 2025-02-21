import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Check, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    special: false,
    number: false
  });

  const validatePassword = (value: string) => {
    setPasswordValidation({
      length: value.length >= 10,
      uppercase: /[A-Z]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      number: /[0-9]/.test(value)
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(Boolean);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        if (!acceptTerms) {
          setError('Vous devez accepter les conditions générales d\'utilisation pour créer un compte.');
          return;
        }

        if (!isPasswordValid()) {
          setError('Le mot de passe ne respecte pas les critères de sécurité requis.');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email.toLowerCase(),
          createdAt: new Date(),
          status: 'online'
        });
        showNotification('success', 'Votre compte a été créé avec succès !');
        navigate('/profile');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showNotification('success', 'Connexion réussie !');
        navigate('/');
      }
    } catch (error: any) {
      setError(error.message);
      showNotification('error', 'Erreur lors de la connexion');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Un email de réinitialisation a été envoyé à votre adresse.');
      setShowResetPassword(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6">
      <div className="bg-black/80 p-8 rounded-lg border border-green-500/30 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center glow">
          {showResetPassword 
            ? 'Réinitialiser le mot de passe'
            : isSignUp 
              ? 'Créer un compte' 
              : 'Accès Terminal'}
        </h2>
        
        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded input-matrix"
                placeholder="votre@email.com"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-500 p-3 rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            <button type="submit" className="w-full btn-matrix">
              Envoyer le lien de réinitialisation
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="text-green-500 hover:text-green-400 underline"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded input-matrix"
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full p-2 rounded input-matrix"
                placeholder="••••••••"
                required
              />
              {isSignUp && (
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {passwordValidation.length ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span>Au moins 10 caractères</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.uppercase ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span>Au moins une majuscule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.special ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span>Au moins un caractère spécial (!@#$%^&*)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.number ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                    <span>Au moins un chiffre</span>
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm">
                  J'accepte les{' '}
                  <Link 
                    to="/terms" 
                    className="text-green-500 hover:text-green-400 underline"
                  >
                    conditions générales d'utilisation
                  </Link>
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className={`w-full btn-matrix ${
                isSignUp && (!isPasswordValid() || !acceptTerms) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isSignUp && (!isPasswordValid() || !acceptTerms)}
            >
              {isSignUp ? 'Créer un compte' : 'Se connecter'}
            </button>

            <div className="text-center mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setPasswordValidation({
                    length: false,
                    uppercase: false,
                    special: false,
                    number: false
                  });
                }}
                className="text-green-500 hover:text-green-400 underline block w-full"
              >
                {isSignUp ? 'Déjà un compte ? Se connecter' : 'Créer un compte'}
              </button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-green-500 hover:text-green-400 underline block w-full"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}