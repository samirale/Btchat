import React, { useState, useEffect } from 'react';
import { Send, Menu, Search, User, Terminal, PlusCircle, X, Trash2, MoreHorizontal, Shield, Camera, AlertTriangle, Ban, Unlock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy, onSnapshot, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { MessageEncryption } from '../utils/encryption';

interface UserProfile {
  uid: string;
  displayName: string;
  bio: string;
  status: string;
  email: string;
}

interface Message {
  id: string;
  senderId: string;
  encryptedText: string;
  timestamp: any;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  otherUser: UserProfile;
  encryptionKey: string;
  isConfirmed?: boolean;
  pendingConfirmation?: boolean;
  initiator?: string;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [message, setMessage] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const [showScreenshotAlert, setShowScreenshotAlert] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    return new Date(timestamp.toDate()).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          uid: user.uid,
          displayName: data.displayName || 'Anonymous',
          bio: data.bio || '',
          status: data.status || 'online',
          email: user.email || ''
        });

        setBlockedUsers(data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showNotification('error', 'Error fetching user profile');
    }
  };

  const fetchConversations = () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );

      return onSnapshot(q, async (snapshot) => {
        const conversationsData: Conversation[] = [];

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          const otherUserId = data.participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            const otherUserDocRef = doc(db, 'users', otherUserId);
            const otherUserDocSnap = await getDoc(otherUserDocRef);
            const otherUserData = otherUserDocSnap.data();

            if (otherUserData) {
              conversationsData.push({
                id: docSnapshot.id,
                ...data,
                otherUser: {
                  uid: otherUserId,
                  displayName: otherUserData.displayName || 'Anonymous',
                  bio: otherUserData.bio || '',
                  status: otherUserData.status || 'offline',
                  email: otherUserData.email || ''
                }
              });
            }
          }
        }

        setConversations(conversationsData);
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showNotification('error', 'Error fetching conversations');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentConversation || !user) return;

    try {
      const otherUserDoc = await getDoc(doc(db, 'users', currentConversation.otherUser.uid));
      const otherUserData = otherUserDoc.data();
      const isBlockedByOther = otherUserData?.blockedUsers?.includes(user.uid);

      if (isBlockedByOther) {
        showNotification('error', 'Vous ne pouvez pas envoyer de messages car cet utilisateur vous a bloqué');
        return;
      }

      const encryptedMessage = await MessageEncryption.encryptMessage(
        message,
        currentConversation.encryptionKey
      );

      await addDoc(collection(db, 'messages'), {
        conversationId: currentConversation.id,
        senderId: user.uid,
        encryptedText: encryptedMessage,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', currentConversation.id), {
        lastMessage: message,
        lastMessageTime: serverTimestamp()
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('error', 'Error sending message');
    }
  };

  const fetchMessages = () => {
    if (!currentConversation || !user) return;

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', currentConversation.id),
      orderBy('timestamp', 'asc')
    );

    try {
      return onSnapshot(q, async (snapshot) => {
        const messagesData: Message[] = [];
        const newDecryptedMessages = new Map(decryptedMessages);

        const otherUserDoc = await getDoc(doc(db, 'users', currentConversation.otherUser.uid));
        const otherUserData = otherUserDoc.data();
        const isBlockedByOther = otherUserData?.blockedUsers?.includes(user.uid);

        for (const doc of snapshot.docs) {
          const messageData = { id: doc.id, ...doc.data() } as Message;
          messagesData.push(messageData);

          if (!decryptedMessages.has(messageData.id)) {
            try {
              const decryptedText = await MessageEncryption.decryptMessage(
                messageData.encryptedText,
                currentConversation.encryptionKey
              );
              newDecryptedMessages.set(messageData.id, decryptedText);
            } catch (error) {
              console.error('Error decrypting message:', error);
              newDecryptedMessages.set(messageData.id, '[Erreur de déchiffrement]');
            }
          }
        }

        setMessages(messagesData);
        setDecryptedMessages(newDecryptedMessages);

        if (isBlockedByOther) {
          showNotification('error', 'Vous avez été bloqué par cet utilisateur');
        }
      });
    } catch (error) {
      console.error('Error setting up messages listener:', error);
      showNotification('error', 'Error setting up messages listener');
      return () => {};
    }
  };

  const toggleBlockUser = async () => {
    if (!user || !currentConversation) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const currentBlockedUsers = userData?.blockedUsers || [];
      const otherUserId = currentConversation.otherUser.uid;

      let newBlockedUsers;
      if (currentBlockedUsers.includes(otherUserId)) {
        newBlockedUsers = currentBlockedUsers.filter((id: string) => id !== otherUserId);
        showNotification('success', 'Utilisateur débloqué');
      } else {
        newBlockedUsers = [...currentBlockedUsers, otherUserId];
        showNotification('success', 'Utilisateur bloqué');
      }

      await updateDoc(userRef, {
        blockedUsers: newBlockedUsers
      });

      setBlockedUsers(newBlockedUsers);
    } catch (error) {
      console.error('Error toggling block user:', error);
      showNotification('error', 'Erreur lors du blocage/déblocage');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentConversation || !user) return;

    try {
      await deleteDoc(doc(db, 'messages', messageId));
      setShowMessageMenu(null);
      showNotification('success', 'Message supprimé');
    } catch (error) {
      console.error('Error deleting message:', error);
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const searchUsers = async (email: string) => {
    if (!email || !user) return;

    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      const results: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          const data = doc.data();
          results.push({
            uid: doc.id,
            displayName: data.displayName || 'Anonymous',
            bio: data.bio || '',
            status: data.status || 'offline',
            email: data.email
          });
        }
      });

      if (results.length === 0) {
        setError('No user found with this email');
      } else {
        setError('');
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Error searching users');
    }
  };

  const startConversation = async (otherUser: UserProfile) => {
    if (!user) return;

    try {
      const existingConvQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      const existingConvSnapshot = await getDocs(existingConvQuery);
      
      const existingConv = existingConvSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(otherUser.uid);
      });

      if (existingConv) {
        setCurrentConversation({
          id: existingConv.id,
          ...existingConv.data(),
          otherUser
        } as Conversation);
        setShowNewChat(false);
        return;
      }

      const encryptionKey = await MessageEncryption.generateConversationKey();

      const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, otherUser.uid],
        createdAt: serverTimestamp(),
        encryptionKey,
        isConfirmed: false,
        initiator: user.uid
      });

      setCurrentConversation({
        id: conversationRef.id,
        participants: [user.uid, otherUser.uid],
        otherUser,
        encryptionKey,
        isConfirmed: false,
        initiator: user.uid
      });

      setShowNewChat(false);
      showNotification('success', 'Conversation started');
    } catch (error) {
      console.error('Error starting conversation:', error);
      showNotification('error', 'Error starting conversation');
    }
  };

  const handleConfirmation = async (accept: boolean) => {
    if (!currentConversation || !user) return;

    try {
      const conversationRef = doc(db, 'conversations', currentConversation.id);
      
      if (accept) {
        await updateDoc(conversationRef, {
          isConfirmed: true,
          pendingConfirmation: false,
          confirmedAt: serverTimestamp()
        });
        showNotification('success', 'Conversation accepted');
      } else {
        await deleteConversation();
        showNotification('success', 'Conversation declined');
      }
      
      setShowConfirmationModal(false);
    } catch (error) {
      console.error('Error during confirmation:', error);
      showNotification('error', 'Error during confirmation');
    }
  };

  const deleteConversation = async () => {
    if (!currentConversation || !user) return;

    try {
      const batch = writeBatch(db);

      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', currentConversation.id)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      batch.delete(doc(db, 'conversations', currentConversation.id));

      await batch.commit();

      setCurrentConversation(null);
      setShowDeleteConversationModal(false);
      showNotification('success', 'Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showNotification('error', 'Error deleting conversation');
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (user) {
      fetchUserProfile();
      unsubscribe = fetchConversations();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (currentConversation) {
      unsubscribe = fetchMessages();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentConversation]);

  useEffect(() => {
    if (currentConversation) {
      const unsubscribe = onSnapshot(doc(db, 'conversations', currentConversation.id), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (!data.isConfirmed && !data.pendingConfirmation && data.initiator !== user?.uid) {
            setShowConfirmationModal(true);
            updateDoc(doc.ref, { pendingConfirmation: true });
          }
        }
      });

      return () => unsubscribe();
    }
  }, [currentConversation, user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setShowScreenshotAlert(true);
        setTimeout(() => setShowScreenshotAlert(false), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="h-[calc(100vh-80px)] flex chat-container">
      {/* Sidebar */}
      <div className={`w-96 border-r border-green-500/30 bg-black/90 flex flex-col chat-sidebar ${showSidebar ? 'visible' : 'hidden'} md:relative md:translate-x-0`}>
        <div className="p-4 flex items-center justify-between border-b border-green-500/30">
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80">
            <div className="w-10 h-10 rounded-full border-2 border-green-500/50 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold">{userProfile?.displayName || 'User'}</div>
              <div className="text-sm text-green-500/70">{userProfile?.status}</div>
            </div>
          </Link>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowNewChat(true)} 
              className="hover:text-green-400"
              title="New conversation"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button 
              className="hover:text-green-400 md:hidden"
              onClick={() => setShowSidebar(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showNewChat ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New conversation</h3>
              <button 
                onClick={() => {
                  setShowNewChat(false);
                  setSearchEmail('');
                  setSearchResults([]);
                  setError('');
                }}
                className="hover:text-green-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers(searchEmail)}
                  placeholder="Search by email"
                  className="w-full p-2 pl-10 rounded input-matrix text-sm"
                />
                <Search 
                  className="w-5 h-5 absolute left-3 top-2.5 text-green-500/50 cursor-pointer"
                  onClick={() => searchUsers(searchEmail)}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              {searchResults.map((result) => (
                <div
                  key={result.email}
                  onClick={() => startConversation(result)}
                  className="p-3 border border-green-500/30 rounded-lg hover:bg-green-500/10 cursor-pointer"
                >
                  <div className="font-semibold">{result.displayName}</div>
                  <div className="text-sm text-green-500/70">{result.email}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-green-500/30">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations"
                  className="w-full p-2 pl-10 rounded input-matrix text-sm"
                />
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-green-500/50" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setCurrentConversation(conversation)}
                  className={`p-4 border-b border-green-500/20 hover:bg-green-500/10 cursor-pointer
                    ${currentConversation?.id === conversation.id ? 'bg-green-500/10' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold">{conversation.otherUser.displayName}</div>
                    {conversation.lastMessageTime && (
                      <div className="text-xs text-green-500/50">
                        {formatMessageTime(conversation.lastMessageTime)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-green-500/70 line-clamp-1">
                    {!conversation.isConfirmed 
                      ? 'Waiting for confirmation...'
                      : conversation.lastMessage || 'New conversation'
                    }
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black/95 chat-main">
        {currentConversation ? (
          <>
            <div className="p-4 border-b border-green-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden hover:text-green-400 mr-2"
                  onClick={() => setShowSidebar(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full border-2 border-green-500/50 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">{currentConversation.otherUser.displayName}</div>
                  <div className="text-sm text-green-500/70">
                    {!currentConversation.isConfirmed 
                      ? 'Waiting for confirmation...'
                      : currentConversation.otherUser.status
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleBlockUser}
                  className="hover:text-green-400"
                  title={blockedUsers.includes(currentConversation.otherUser.uid) ? "Débloquer" : "Bloquer"}
                >
                  {blockedUsers.includes(currentConversation.otherUser.uid) ? (
                    <Unlock className="w-5 h-5" />
                  ) : (
                    <Ban className="w-5 h-5" />
                  )}
                </button>
                <button 
                  onClick={() => setShowDeleteConversationModal(true)}
                  className="hover:text-green-400"
                  title="Delete conversation"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 matrix-bg"
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {!currentConversation.isConfirmed && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500">
                    Waiting for conversation confirmation...
                  </span>
                </div>
              )}

              {blockedUsers.includes(currentConversation.otherUser.uid) && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">
                    Vous avez bloqué cet utilisateur. Il ne peut pas vous envoyer de messages.
                  </span>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`relative group ${
                    msg.senderId === user?.uid
                      ? 'ml-auto bg-green-500/10'
                      : 'mr-auto bg-black/50'
                  } p-3 rounded-lg max-w-[80%] mb-4 border border-green-500/30`}
                >
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-green-500/50" title="Encrypted message" />
                    <div>{decryptedMessages.get(msg.id) || '[Decrypting...]'}</div>
                  </div>
                  <div className="text-right text-xs text-green-500/50 mt-1">
                    {formatMessageTime(msg.timestamp)}
                  </div>
                  {msg.senderId === user?.uid && (
                    <button
                      onClick={() => setShowMessageMenu(msg.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:text-green-400 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                  {showMessageMenu === msg.id && (
                    <div className="absolute top-8 right-0 bg-black border border-green-500/30 rounded-lg shadow-lg p-2">
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="flex items-center gap-2 hover:bg-green-500/10 p-2 rounded w-full"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-green-500/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 p-2 rounded input-matrix"
                  placeholder={
                    blockedUsers.includes(currentConversation.otherUser.uid)
                      ? "Vous avez bloqué cet utilisateur"
                      : currentConversation.isConfirmed 
                        ? "Type your message..." 
                        : "Waiting for confirmation..."
                  }
                  disabled={!currentConversation.isConfirmed || blockedUsers.includes(currentConversation.otherUser.uid)}
                />
                <button 
                  type="submit" 
                  className="btn-matrix px-6"
                  disabled={!currentConversation.isConfirmed || blockedUsers.includes(currentConversation.otherUser.uid)}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-green-500/70">
            <div className="text-center">
              <Terminal className="w-16 h-16 mx-auto mb-4" />
              <p className="px-4">Select a conversation or start a new one</p>
              <button 
                className="md:hidden mt-4 btn-matrix"
                onClick={() => setShowSidebar(true)}
              >
                View conversations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Conversation Confirmation</h3>
            <p className="text-green-500/70 mb-6">
              {currentConversation?.otherUser.displayName} wants to start a conversation with you. Do you accept?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => handleConfirmation(false)}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded hover:bg-red-500/30"
              >
                Decline
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded hover:bg-green-500/30"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Modal */}
      {showDeleteConversationModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Delete Conversation</h3>
            <p className="text-green-500/70 mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConversationModal(false)}
                className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded hover:bg-green-500/30"
              >
                Cancel
              </button>
              <button
                onClick={deleteConversation}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Alert */}
      {showScreenshotAlert && (
        <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <span>Screenshot detected! Messages are confidential.</span>
        </div>
      )}
    </div>
  );
};

export default Chat;