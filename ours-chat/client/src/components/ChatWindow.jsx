import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, ImagePlus, MoreHorizontal, Reply, Send, Smile, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './Sidebar';
import { api } from '../services/api';

const reactions = ['❤️', '😂', '😭', '😮', '👍'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export default function ChatWindow({ conversation, user, socket, onBack, onProfile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState(null);
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightbox, setLightbox] = useState('');
  const bottom = useRef(null);
  const typingTimer = useRef(null);
  const typingActive = useRef(false);
  const messageRefs = useRef(new Map());
  const other = conversation.members.find((member) => String(member._id) !== String(user.id)) || conversation.members[0];
  const person = conversation.isGroup ? { displayName: conversation.name, profileImage: conversation.groupImage } : other;

  useEffect(() => {
    let active = true;
    setMessages([]);
    api(`/conversations/${conversation._id}/messages`).then(({ messages: next }) => {
      if (active) {
        setMessages(next);
        socket.emit('message-read', { conversationId: conversation._id });
      }
    }).catch(() => setError('Unable to load messages right now.'));
    socket.emit('join-conversation', conversation._id);
    const receive = (message) => {
      if (String(message.conversationId) !== String(conversation._id)) return;
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      if (String(message.senderId?._id || message.senderId) !== String(user.id)) socket.emit('message-read', { conversationId: conversation._id });
    };
    const reaction = (message) => setMessages((current) => current.map((item) => item._id === message._id ? message : item));
    const deleted = ({ messageId }) => setMessages((current) => current.map((item) => item._id === messageId ? { ...item, isDeleted: true, text: '', imageUrl: '', reactions: [] } : item));
    const read = ({ conversationId, userId }) => {
      if (String(conversationId) !== String(conversation._id) || String(userId) === String(user.id)) return;
      setMessages((current) => current.map((item) => item.readBy?.includes(userId) ? item : { ...item, readBy: [...(item.readBy || []), userId] }));
    };
    const onTyping = ({ conversationId, userId }) => { if (String(conversationId) === String(conversation._id) && String(userId) !== String(user.id)) setTyping(true); };
    const onStop = ({ conversationId }) => { if (String(conversationId) === String(conversation._id)) setTyping(false); };
    socket.on('receive-message', receive); socket.on('message-reaction', reaction); socket.on('message-deleted', deleted); socket.on('message-read', read); socket.on('typing', onTyping); socket.on('stop-typing', onStop);
    return () => {
      active = false;
      socket.off('receive-message', receive); socket.off('message-reaction', reaction); socket.off('message-deleted', deleted); socket.off('message-read', read); socket.off('typing', onTyping); socket.off('stop-typing', onStop);
      clearTimeout(typingTimer.current);
    };
  }, [conversation._id, socket, user.id]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  function changeText(event) {
    setText(event.target.value);
    if (!typingActive.current) { typingActive.current = true; socket.emit('typing', { conversationId: conversation._id }); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { typingActive.current = false; socket.emit('stop-typing', { conversationId: conversation._id }); }, 850);
  }
  function handleKeyDown(event) { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(event); } }
  function chooseFile(event) {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith('image/')) return setError('Please choose an image file.');
    if (picked.size > MAX_IMAGE_SIZE) return setError('Images must be smaller than 8 MB.');
    setError(''); setFile(picked); setPreview(URL.createObjectURL(picked));
  }
  async function send(event) {
    event?.preventDefault();
    if ((!text.trim() && !file) || sending) return;
    setSending(true); setError('');
    try {
      let imageUrl = '';
      if (file) { const body = new FormData(); body.append('image', file); imageUrl = (await api('/upload', { method: 'POST', body })).url; }
      await new Promise((resolve, reject) => socket.emit('send-message', { conversationId: conversation._id, text, imageUrl, replyTo: reply?._id }, (result) => result?.error ? reject(new Error(result.error)) : resolve(result)));
      setText(''); setFile(null); setPreview(''); setReply(null); setShowEmoji(false); typingActive.current = false; socket.emit('stop-typing', { conversationId: conversation._id });
    } catch (sendError) { setError(sendError.message || 'Something went wrong. Try again.'); }
    finally { setSending(false); }
  }
  function react(messageId, emoji) { socket.emit('message-reaction', { messageId, emoji, conversationId: conversation._id }); }
  function deleteMessage(messageId) { socket.emit('message-deleted', { messageId, conversationId: conversation._id }); }
  function jumpTo(messageId) { messageRefs.current.get(messageId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  function renderMessage(message) {
    const mine = String(message.senderId?._id || message.senderId) === String(user.id);
    const counts = reactions.map((emoji) => ({ emoji, count: message.reactions?.filter((item) => item.emoji === emoji).length || 0 })).filter((item) => item.count);
    return <motion.div ref={(node) => { if (node) messageRefs.current.set(message._id, node); }} key={message._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`message-row ${mine ? 'mine' : ''}`}>
      <div className="message-avatar">{!mine && <Avatar person={message.senderId} />}</div>
      <div className="message-content">
        {message.replyTo && !message.isDeleted && <button className="reply-preview" onClick={() => jumpTo(message.replyTo._id)}><Reply size={13} /> {message.replyTo.text || 'Image'}</button>}
        {message.isDeleted ? <div className="bubble deleted-message">This message was deleted</div> : <>{message.imageUrl && <button className="image-message-button" onClick={() => setLightbox(message.imageUrl)}><img className="message-image" src={message.imageUrl} alt="Shared" /></button>}{message.text && <div className="bubble">{message.text}</div>}</>}
        {!message.isDeleted && <div className="message-actions">{reactions.map((emoji) => <button key={emoji} onClick={() => react(message._id, emoji)}>{emoji}</button>)}{mine && <button onClick={() => deleteMessage(message._id)}><Trash2 size={12} /></button>}<button onClick={() => setReply(message)}><Reply size={13} /></button></div>}
        {counts.length > 0 && <div className="reaction-counts">{counts.map((item) => <button key={item.emoji} onClick={() => react(message._id, item.emoji)}>{item.emoji} {item.count}</button>)}</div>}
        <div className="message-meta"><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>{mine && (message.readBy?.length > 1 ? <CheckCheck size={14} className="seen" /> : <Check size={14} />)}</div>
      </div>
    </motion.div>;
  }

  return <section className="chat-window">
    <header className="chat-header"><button className="icon-button mobile-only" onClick={onBack}><ArrowLeft size={19} /></button><div className="chat-person"><Avatar person={person} /><div><strong>{conversation.isGroup ? conversation.name : other.displayName}</strong><span className={other?.isOnline ? 'status-online' : ''}>{conversation.isGroup ? `${conversation.members.length} friends` : other.isOnline ? '● Online' : 'Last seen recently'}</span></div></div><button className="icon-button" onClick={onProfile}><MoreHorizontal size={20} /></button></header>
    <div className="messages"><div className="chat-intro"><Avatar person={person} large /><p className="eyebrow">{conversation.isGroup ? 'A little gathering' : `You and ${other.displayName}`}</p><h2>{conversation.isGroup ? conversation.name : other.displayName}</h2><span>{conversation.isGroup ? 'A shared little corner.' : other.bio}</span></div>{messages.length === 0 && <div className="empty-chat">Start something worth remembering. <span>❤️</span></div>}<AnimatePresence initial={false}>{messages.map(renderMessage)}</AnimatePresence>{typing && <div className="typing-indicator"><span /><span /><span /> {conversation.isGroup ? 'Someone' : other.displayName} is typing...</div>}<div ref={bottom} /></div>
    <div className="composer-wrap">{error && <div className="composer-error">{error}</div>}{reply && <div className="reply-bar"><Reply size={14} /><span>Replying to <b>{reply.senderId?.displayName}</b>: {reply.text || 'Image'}</span><button onClick={() => setReply(null)}><X size={15} /></button></div>}{preview && <div className="upload-preview"><img src={preview} alt="Preview" /><button onClick={() => { setFile(null); setPreview(''); }}><X size={14} /></button></div>}{showEmoji && <div className="emoji-picker">{reactions.map((emoji) => <button key={emoji} onClick={() => setText((value) => value + emoji)}>{emoji}</button>)}</div>}<form className="composer" onSubmit={send}><label className="icon-button" title="Attach image"><ImagePlus size={20} /><input type="file" accept="image/*" hidden onChange={chooseFile} /></label><textarea value={text} onChange={changeText} onKeyDown={handleKeyDown} placeholder="Write something..." rows="1" /><button type="button" className="icon-button" onClick={() => setShowEmoji((value) => !value)}><Smile size={20} /></button><button className="send-button" disabled={sending || (!text.trim() && !file)} aria-label="Send">{sending ? '...' : <Send size={18} />}</button></form></div>
    {lightbox && <button className="lightbox" onClick={() => setLightbox('')}><img src={lightbox} alt="Shared full size" /></button>}
  </section>;
}
