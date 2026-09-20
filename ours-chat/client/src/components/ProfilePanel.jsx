import { Edit3, LogOut, UserPlus, X } from 'lucide-react';
import { Avatar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useState } from 'react';

export default function ProfilePanel({ person, conversation, close, own = false, onConversation }) {
  const { user, logout, updateProfile } = useAuth();
  const isGroup = Boolean(conversation?.isGroup);
  const profile = isGroup ? { displayName: conversation.name, profileImage: conversation.groupImage, username: 'group room', bio: 'A shared little corner.', isOnline: true } : person;
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [busy, setBusy] = useState(false);
  async function save(event) { event.preventDefault(); setBusy(true); try { if (isGroup) { const result = await api(`/conversations/${conversation._id}`, { method: 'PATCH', body: JSON.stringify({ name: displayName }) }); onConversation?.(result.conversation); } else await updateProfile({ bio, displayName }); setEditing(false); } finally { setBusy(false); } }
  async function addMember() { const username = window.prompt('Username to add'); if (!username) return; const { users } = await api(`/users/search?q=${encodeURIComponent(username)}`); if (!users[0]) return alert('No one here yet.'); const result = await api(`/conversations/${conversation._id}/members`, { method: 'POST', body: JSON.stringify({ userId: users[0]._id }) }); onConversation?.(result.conversation); }
  async function leaveGroup() { await api(`/conversations/${conversation._id}/members/${user.id}`, { method: 'DELETE' }); close(); }
  async function changeGroupImage(event) { const file = event.target.files?.[0]; if (!file) return; const body = new FormData(); body.append('image', file); const { url } = await api('/upload', { method: 'POST', body }); const result = await api(`/conversations/${conversation._id}`, { method: 'PATCH', body: JSON.stringify({ groupImage: url }) }); onConversation?.(result.conversation); }
  return <aside className="profile-panel"><div className="profile-top"><span className="eyebrow">{isGroup ? 'Group details' : own ? 'Your profile' : 'A friend of ours'}</span><button className="icon-button" onClick={close}><X size={19} /></button></div><div className="profile-main"><Avatar person={profile} large />{isGroup && <label className="profile-image-picker">Change group image<input type="file" accept="image/*" hidden onChange={changeGroupImage} /></label>}<h2>{profile?.displayName}</h2><p className="profile-handle">@{profile?.username}</p><span className={`profile-status ${profile?.isOnline ? 'online' : ''}`}>{profile?.isOnline ? '● Online now' : '● Offline'}</span>{editing ? <form className="profile-edit" onSubmit={save}><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /><textarea value={bio} onChange={(event) => setBio(event.target.value)} /><button className="primary-button" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button></form> : <p className="profile-bio">{profile?.bio || 'Keeping things close to the heart.'}</p>}{isGroup && <div className="group-members">{conversation.members.map((member) => <div className="group-member" key={member._id}><Avatar person={member} /><span>{member.displayName}</span></div>)}</div>}<div className="profile-actions">{isGroup && <button onClick={addMember}><UserPlus size={16} /> Add member</button>}{isGroup && <button onClick={leaveGroup}><LogOut size={16} /> Leave group</button>}{own && <button onClick={() => setEditing(!editing)}><Edit3 size={16} /> {editing ? 'Cancel' : 'Edit profile'}</button>}{own && <button onClick={logout}><LogOut size={16} /> Log out</button>}</div></div></aside>;
}
