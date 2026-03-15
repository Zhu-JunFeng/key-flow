import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Spin, Message } from '@arco-design/web-react';
import { fetchFriends, fetchPendingRequests, addFriend, acceptFriend, removeFriend } from '../lib/api';
import { loadProfile, getDeviceId } from '../lib/device';
import { getAvatar } from '../lib/avatars';
import { socket, connectSocket } from '../lib/socket';
import { t } from '../lib/i18n';
import { useLocale } from '../lib/hooks';

interface FriendInfo {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
  readonly friendsCode: string | null;
  readonly status: string;
  online?: boolean;
}

interface PendingRequest {
  readonly deviceId: string;
  readonly nickname: string;
  readonly avatar: number;
}

export default function Friends() {
  const locale = useLocale();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [pending, setPending] = useState<readonly PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendCode, setFriendCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Private room state
  const [privateRoomId, setPrivateRoomId] = useState<string | null>(null);
  const [joinRoomCode, setJoinRoomCode] = useState('');

  const refreshData = useCallback(async () => {
    const [f, p, profile] = await Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      loadProfile(),
    ]);
    setFriends(f as FriendInfo[]);
    setPending(p);
    setMyCode((profile as { friendsCode?: string }).friendsCode ?? '');
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    connectSocket();

    const deviceId = getDeviceId();
    socket.emit('user:online', { deviceId });

    socket.on('friend:online', (d: { deviceId: string }) => {
      setOnlineUsers(prev => new Set([...prev, d.deviceId]));
    });
    socket.on('friend:offline', (d: { deviceId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(d.deviceId);
        return next;
      });
    });
    socket.on('room:created', (d: { roomId: string }) => {
      setPrivateRoomId(d.roomId);
      Message.success(`${t('friends.roomCode', locale)}: ${d.roomId}`);
    });
    socket.on('room:error', (d: { message: string }) => {
      Message.error(d.message);
    });

    return () => {
      ['friend:online', 'friend:offline', 'room:created', 'room:error'].forEach(e => socket.off(e));
    };
  }, [refreshData, locale]);

  const handleAddFriend = async () => {
    if (!friendCode.trim()) return;
    setAdding(true);
    try {
      const result = await addFriend(friendCode.trim().toUpperCase());
      if (result.success) {
        Message.success(t('friends.requestSent', locale));
        setFriendCode('');
        refreshData();
      }
    } catch (err: unknown) {
      Message.error((err as Error).message || t('common.error', locale));
    }
    setAdding(false);
  };

  const handleAccept = async (deviceId: string) => {
    await acceptFriend(deviceId);
    Message.success(t('friends.accepted', locale));
    refreshData();
  };

  const handleRemove = async (deviceId: string) => {
    await removeFriend(deviceId);
    Message.info(t('friends.removed', locale));
    refreshData();
  };

  const handleCreatePrivateRoom = () => {
    const nickname = localStorage.getItem('nickname') ?? 'Guest';
    const avatar = parseInt(localStorage.getItem('avatar') ?? '0');
    socket.emit('room:create-private', { nickname, avatar });
  };

  const handleJoinPrivateRoom = () => {
    if (!joinRoomCode.trim()) return;
    const nickname = localStorage.getItem('nickname') ?? 'Guest';
    const avatar = parseInt(localStorage.getItem('avatar') ?? '0');
    socket.emit('room:join-private', { roomId: joinRoomCode.trim(), nickname, avatar });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Spin size={32} /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2" style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>{t('friends.title', locale)}</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('friends.subtitle', locale)}</p>
      </div>

      {/* My code */}
      <div className="glass-card p-5 mb-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t('friends.myCode', locale)}</span>
            <div className="text-2xl font-mono font-bold tracking-[0.3em] mt-1" style={{ color: 'var(--primary-color)' }}>{myCode}</div>
          </div>
          <Button size="small" onClick={() => { navigator.clipboard.writeText(myCode); Message.success(t('friends.copied', locale)); }}>{t('friends.copy', locale)}</Button>
        </div>
      </div>

      {/* Add friend */}
      <div className="glass-card p-5 mb-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('friends.addFriend', locale)}</h3>
        <div className="flex gap-2">
          <Input value={friendCode} onChange={v => setFriendCode(v.toUpperCase())} placeholder={t('friends.codePlaceholder', locale)} size="large"
            style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleAddFriend(); }} />
          <Button type="primary" size="large" onClick={handleAddFriend} loading={adding}>{t('practice.add', locale)}</Button>
        </div>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="glass-card p-5 mb-6" style={{ cursor: 'default' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('friends.pending', locale)} ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.deviceId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getAvatar(p.avatar)}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.nickname}</span>
                </div>
                <div className="flex gap-2">
                  <Button type="primary" size="small" onClick={() => handleAccept(p.deviceId)}>{t('friends.accept', locale)}</Button>
                  <Button size="small" onClick={() => handleRemove(p.deviceId)}>{t('friends.reject', locale)}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="glass-card p-5 mb-6" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('friends.list', locale)} ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>{t('friends.empty', locale)}</p>
        ) : (
          <div className="space-y-2">
            {friends.map(f => (
              <div key={f.deviceId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getAvatar(f.avatar)}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{f.nickname}</span>
                  <span className={`w-2 h-2 rounded-full ${onlineUsers.has(f.deviceId) ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <span className="text-xs" style={{ color: onlineUsers.has(f.deviceId) ? '#10b981' : 'var(--text-muted)' }}>
                    {onlineUsers.has(f.deviceId) ? t('friends.online', locale) : t('friends.offline', locale)}
                  </span>
                </div>
                <Button size="small" status="danger" onClick={() => handleRemove(f.deviceId)}>{t('practice.delete', locale)}</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Private room */}
      <div className="glass-card p-5" style={{ cursor: 'default' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{t('friends.privateRoom', locale)}</h3>
        <div className="space-y-3">
          {privateRoomId ? (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('friends.roomCode', locale)}:</span>
              <span className="text-lg font-mono font-bold ml-2" style={{ color: 'var(--primary-color)' }}>{privateRoomId}</span>
              <Button size="small" className="ml-3" onClick={() => { navigator.clipboard.writeText(privateRoomId); Message.success(t('friends.copied', locale)); }}>{t('friends.copy', locale)}</Button>
            </div>
          ) : (
            <Button type="primary" onClick={handleCreatePrivateRoom}>{t('friends.createRoom', locale)}</Button>
          )}
          <div className="flex gap-2">
            <Input value={joinRoomCode} onChange={v => setJoinRoomCode(v)} placeholder={t('friends.joinRoom', locale)} size="large"
              onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleJoinPrivateRoom(); }} />
            <Button size="large" onClick={handleJoinPrivateRoom}>{t('friends.join', locale)}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
