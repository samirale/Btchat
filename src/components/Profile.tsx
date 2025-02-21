import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Terminal, LogOut, Key, Trash2, AlertCircle, Home } from 'lucide-react';
import { updatePassword, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    status: 'online',
    email: user?.email || ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              displayName: data.displayName || '',
              bio: data.bio || '',
              status: data.status || 'online',
              email: user.email || ''
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          showNotification('error', 'Erreur lors du chargement du profil');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        email: user.email,
        updatedAt: new Date().toISOString(),
      });
      setSuccess('Profil mis à jour avec succès!');
      showNotification('success', 'Profil mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Erreur lors de la sauvegarde du profil.');
      showNotification('error', 'Erreur lors de la sauvegarde du profil');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification('success', 'Vous avez été déconnecté avec succès');
      navigate('/login');
    } catch (error) {
      showNotification('error', 'Erreur lors de la déconnexion');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess('Mot de passe mis à jour avec succès!');
      showNotification('success', 'Mot de passe mis à jour avec succès');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setError('Erreur lors du changement de mot de passe. Vérifiez votre mot de passe actuel.');
      showNotification('error', 'Erreur lors du changement de mot de passe');
    }
  };

  const deleteUserData = async () => {
    if (!user) return;

    const batch = writeBatch(db);

    // Get all conversations where user is a participant
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);

    // Store conversation IDs to delete related messages
    const conversationIds = conversationsSnapshot.docs.map(doc => doc.id);

    // Delete all messages from user's conversations
    for (const conversationId of conversationIds) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // Delete all conversations
    conversationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user profile
    batch.delete(doc(db, 'users', user.uid));

    // Commit all deletions
    await batch.commit();
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Delete all user data (conversations, messages, and profile)
      await deleteUserData();
      
      // Delete Firebase Auth user
      await deleteUser(user);
      
      showNotification('success', 'Votre compte a été supprimé avec succès');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      showNotification('error', 'Erreur lors de la suppression du compte');
      setError('Erreur lors de la suppression du compte. Vérifiez votre mot de passe.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Terminal className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-6">
      <div className="bg-black/80 p-8 rounded-lg border border-green-500/30 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center justify-center flex-1">
            <User className="w-16 h-16 p-3 rounded-full border-2 border-green-500/50" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-matrix p-2"
            title="Retour à l'accueil"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>
        
        <h2 className="text-2xl font-bold mb-6 text-center glow">Configuration du Profil</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-500">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Nom d'affichage</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full p-2 rounded input-matrix"
              placeholder="Votre nom d'affichage"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full p-2 rounded input-matrix h-24 resize-none"
              placeholder="Parlez-nous de vous..."
            />
          </div>
          
          <div>
            <label className="block mb-2">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full p-2 rounded input-matrix bg-black/50"
            >
              <option value="online">En ligne</option>
              <option value="away">Absent</option>
              <option value="busy">Occupé</option>
            </select>
          </div>

          <button type="submit" className="w-full btn-matrix">
            Sauvegarder le profil
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-green-500/30">
          <h3 className="text-xl mb-4 font-semibold">Paramètres du compte</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full btn-matrix flex items-center gap-2 justify-center"
            >
              <Key className="w-5 h-5" />
              Changer le mot de passe
            </button>

            <button
              onClick={handleLogout}
              className="w-full btn-matrix flex items-center gap-2 justify-center"
            >
              <LogOut className="w-5 h-5" />
              Se déconnecter
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500
                       px-4 py-2 rounded transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]
                       flex items-center gap-2 justify-center"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>

      {/* Modal de changement de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-black/90 p-6 rounded-lg border border-green-500/30 w-full max-w-md">
            <h3 className="text-xl mb-4 font-semibold">Changer le mot de passe</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 rounded input-matrix"
                  required
                />
              </div>
              <div>
                <label className="block mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 rounded input-matrix"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-matrix">
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                  }}
                  className="flex-1 btn-matrix"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression de compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-black/90 p-6 rounded-lg border border-green-500/30 w-full max-w-md">
            <h3 className="text-xl mb-4 font-semibold text-red-500">Supprimer le compte</h3>
            <p className="mb-4 text-gray-400">
              Cette action est irréversible. Toutes vos données seront supprimées définitivement, y compris :
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-400 space-y-1">
              <li>Votre profil utilisateur</li>
              <li>Toutes vos conversations</li>
              <li>Tous vos messages</li>
            </ul>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block mb-2">Confirmez votre mot de passe</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 rounded input-matrix"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500
                           px-4 py-2 rounded transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                >
                  Confirmer la suppression
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCurrentPassword('');
                  }}
                  className="flex-1 btn-matrix"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}