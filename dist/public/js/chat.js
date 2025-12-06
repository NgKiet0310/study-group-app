/// <reference lib="dom" />
const socket = io();
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const onlineUsersList = document.getElementById('online-users-list');
const onlineCount = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');
const typingUser = document.getElementById('typing-user');
const sendBtn = document.getElementById('send-btn');
if (!chatMessages) {
    console.error('❌ LỖI: Element #chat-messages không tồn tại!');
}
const roomId = window.roomId;
const currentUserId = window.currentUserId;
const currentUsername = window.currentUsername;
console.log('🔍 Debug Info:');
console.log('  roomId:', roomId);
console.log('  currentUserId:', currentUserId);
console.log('  currentUsername:', currentUsername);
let typingTimeout;
let isTyping = false;
socket.emit('joinRoom', roomId);
socket.on('connect', () => {
    console.log('✅ Connected to server');
    sendBtn.disabled = false;
});
socket.on('disconnect', () => {
    console.log('🔌 Disconnected from server');
    sendBtn.disabled = true;
    showNotification('Mất kết nối với server', 'warning');
});
socket.on('onlineUsers', (users) => {
    console.log('👥 Online users:', users);
    updateOnlineUsers(users);
});
socket.on('loadMessages', (messages) => {
    console.log('📨 Load messages:', messages.length, 'messages');
    chatMessages.innerHTML = '';
    if (messages.length === 0) {
        chatMessages.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="fas fa-comments fa-3x mb-3"></i>
        <p>Chưa có tin nhắn nào, hãy bắt đầu cuộc trò chuyện</p>
      </div>
    `;
    }
    else {
        // Render tất cả messages
        messages.forEach((msg) => {
            addMessageToDOM(msg);
        });
        // Force scroll xuống bottom sau khi load xong
        setTimeout(() => {
            forceScrollToBottom();
            console.log('✅ Đã scroll xuống bottom sau khi load messages');
        }, 100);
    }
});
socket.on('chatMessage', (msg) => {
    console.log('💬 New message:', msg.user, '-', msg.content.substring(0, 30));
    const wasAtBottom = isAtBottom();
    addMessageToDOM(msg);
    // Auto scroll nếu đang ở bottom hoặc là tin nhắn của mình
    if (wasAtBottom || msg.userId === currentUserId) {
        setTimeout(() => {
            forceScrollToBottom();
        }, 50);
    }
    if (msg.userId !== currentUserId) {
        playNotificationSound();
    }
});
socket.on('userTyping', (username) => {
    console.log('✍️ User typing:', username);
    typingUser.textContent = username;
    typingIndicator.style.display = 'block';
});
socket.on('userStoppedTyping', () => {
    typingIndicator.style.display = 'none';
});
chatInput.addEventListener('keyup', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', { roomId, username: currentUsername });
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('stopTyping', { roomId });
    }, 1000);
});
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});
function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) {
        console.warn('⚠️ Message trống');
        return;
    }
    if (msg.length > 1000) {
        showNotification('Message quá dài (tối đa 1000 ký tự)', 'error');
        return;
    }
    console.log('📤 Sending message:', msg.substring(0, 50));
    sendBtn.disabled = true;
    socket.emit('chatMessage', { roomId, msg }, () => {
        sendBtn.disabled = false;
    });
    chatInput.value = '';
    isTyping = false;
    socket.emit('stopTyping', { roomId });
    setTimeout(() => {
        sendBtn.disabled = false;
    }, 500);
}
function addMessageToDOM(msg) {
    if (!chatMessages) {
        console.error('❌ chatMessages element không tồn tại!');
        return;
    }
    const isOwn = msg.userId === currentUserId;
    const avatarBg = isOwn ? 'bg-primary' : getAvatarColor(msg.userId);
    const avatarLetter = msg.user?.charAt(0).toUpperCase() || '?';
    const time = formatTime(msg.createdAt);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own' : ''}`;
    messageDiv.innerHTML = `
    <div class="user-avatar ${avatarBg}">${avatarLetter}</div>
    <div class="message-bubble">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong style="font-size: 0.9rem;">${isOwn ? 'Bạn' : msg.user}</strong>
        <small class="text-muted" style="font-size: 0.75rem;">${time}</small>
      </div>
      <div style="word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(msg.content)}</div>
    </div>
  `;
    chatMessages.appendChild(messageDiv);
}
function isAtBottom() {
    if (!chatMessages)
        return true;
    const threshold = 100;
    const position = chatMessages.scrollTop + chatMessages.clientHeight;
    const height = chatMessages.scrollHeight;
    return position >= height - threshold;
}
function forceScrollToBottom() {
    if (!chatMessages)
        return;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log('📊 Scroll executed:');
    console.log('  scrollHeight:', chatMessages.scrollHeight);
    console.log('  scrollTop:', chatMessages.scrollTop);
    console.log('  clientHeight:', chatMessages.clientHeight);
}
function updateOnlineUsers(users) {
    onlineCount.textContent = users.length;
    if (users.length === 0) {
        onlineUsersList.innerHTML = '<span class="text-muted">Không có ai online</span>';
        return;
    }
    onlineUsersList.innerHTML = users
        .map(user => {
        const isMe = user.id === currentUserId;
        return `
        <div class="online-user-badge ${isMe ? 'me' : ''}">
          <span class="online-indicator"></span>
          ${isMe ? 'Bạn' : user.username}
        </div>
      `;
    })
        .join('');
}
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 1)
        return 'Vừa xong';
    if (diffInMinutes < 60)
        return `${diffInMinutes} phút trước`;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return `${hours}:${minutes}`;
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
}
function getAvatarColor(userId) {
    const colors = [
        'bg-primary', 'bg-success', 'bg-info', 'bg-warning',
        'bg-danger', 'bg-secondary', 'bg-dark'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    catch (e) {
        console.log('Audio context không khả dụng');
    }
}
chatInput.focus();
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        chatInput.focus();
    }
});
console.log('💬 Chat initialized for room:', roomId);
export {};
//# sourceMappingURL=chat.js.map