const { useState, useEffect } = React;

const API_URL = 'http://localhost:3000';

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [view, setView] = useState('login');
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setLoading(false);
        }
        
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        checkNotificationPermission();
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const checkNotificationPermission = async () => {
        if ('Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    };

    const toggleNotifications = async () => {
        if (!('Notification' in window)) {
            alert('Notifications not supported');
            return;
        }

        if (Notification.permission === 'granted') {
            setNotificationsEnabled(false);
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotificationsEnabled(true);
                await registerPushNotifications();
            }
        }
    };

    const registerPushNotifications = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
            });

            await fetch(`${API_URL}/api/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subscription })
            });
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    };

    const validateToken = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.user);
                setView('dashboard');
            } else {
                localStorage.removeItem('token');
                setToken(null);
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
            setToken(null);
        }
        setLoading(false);
    };

    const handleLogin = (user, newToken) => {
        setCurrentUser(user);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        setView('dashboard');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('token');
        setView('login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-800 flex items-center justify-center">
                <div className="text-2xl text-indigo-600 dark:text-indigo-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-800">
            {!currentUser ? (
                view === 'login' ? (
                    <LoginForm onLogin={handleLogin} onSwitchToSignup={() => setView('signup')} darkMode={darkMode} />
                ) : (
                    <SignupForm onSignup={handleLogin} onSwitchToLogin={() => setView('login')} darkMode={darkMode} />
                )
            ) : (
                <MainApp 
                    user={currentUser} 
                    token={token} 
                    onLogout={handleLogout} 
                    view={view} 
                    setView={setView}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    notificationsEnabled={notificationsEnabled}
                    toggleNotifications={toggleNotifications}
                />
            )}
        </div>
    );
}

function MainApp({ user, token, onLogout, view, setView, darkMode, setDarkMode, notificationsEnabled, toggleNotifications }) {
    return (
        <>
            <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-6">
                            <h1 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">RemindMe</h1>
                            <nav className="flex gap-1 md:gap-4">
                                <button
                                    onClick={() => setView('dashboard')}
                                    className={`px-2 md:px-4 py-2 rounded-lg transition text-sm md:text-base ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setView('analytics')}
                                    className={`px-2 md:px-4 py-2 rounded-lg transition text-sm md:text-base ${view === 'analytics' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    Analytics
                                </button>
                            </nav>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <span className="hidden md:inline text-gray-600 dark:text-gray-300">Welcome, {user.name}</span>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Toggle dark mode"
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>
                            <button
                                onClick={toggleNotifications}
                                className={`p-2 rounded-lg transition ${notificationsEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'} hover:opacity-80`}
                                title="Toggle notifications"
                            >
                                {notificationsEnabled ? '🔔' : '🔕'}
                            </button>
                            <button
                                onClick={onLogout}
                                className="px-3 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm md:text-base"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            {view === 'dashboard' && <Dashboard user={user} token={token} darkMode={darkMode} />}
            {view === 'analytics' && <Analytics user={user} token={token} darkMode={darkMode} />}
        </>
    );
}

function LoginForm({ onLogin, onSwitchToSignup, darkMode }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.user, data.token);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">RemindMe</h1>
                    <p className="text-gray-600 dark:text-gray-300">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToSignup}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function SignupForm({ onSignup, onSwitchToLogin, darkMode }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password, timezone })
            });

            const data = await response.json();

            if (response.ok) {
                onSignup(data.user, data.token);
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">RemindMe</h1>
                    <p className="text-gray-600 dark:text-gray-300">Create your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Timezone
                        </label>
                        <input
                            type="text"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function Dashboard({ user, token }) {
    const [reminders, setReminders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingCompletions, setPendingCompletions] = useState([]);
    const [streaks, setStreaks] = useState([]);

    useEffect(() => {
        fetchReminders();
        fetchPendingCompletions();
        fetchStreaks();
    }, []);

    const fetchReminders = async () => {
        try {
            const response = await fetch(`${API_URL}/api/reminders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setReminders(data);
            }
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this reminder?')) return;

        try {
            const response = await fetch(`${API_URL}/api/reminders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                fetchReminders();
            }
        } catch (error) {
            console.error('Failed to delete reminder:', error);
        }
    };

    const handleToggleActive = async (id, isActive) => {
        try {
            const response = await fetch(`${API_URL}/api/reminders/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: !isActive })
            });
            if (response.ok) {
                fetchReminders();
            }
        } catch (error) {
            console.error('Failed to toggle reminder:', error);
        }
    };

    const handleEdit = (reminder) => {
        setEditingReminder(reminder);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingReminder(null);
        fetchReminders();
        fetchPendingCompletions();
        fetchStreaks();
    };

    const fetchPendingCompletions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/completions/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPendingCompletions(data);
            }
        } catch (error) {
            console.error('Failed to fetch pending completions:', error);
        }
    };

    const fetchStreaks = async () => {
        try {
            const response = await fetch(`${API_URL}/api/completions/streaks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStreaks(data);
            }
        } catch (error) {
            console.error('Failed to fetch streaks:', error);
        }
    };

    const handleComplete = async (logId) => {
        try {
            const response = await fetch(`${API_URL}/api/completions/${logId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                fetchPendingCompletions();
                fetchStreaks();
            }
        } catch (error) {
            console.error('Failed to complete reminder:', error);
        }
    };

    const getNextReminder = () => {
        const active = reminders.filter(r => r.is_active);
        if (active.length === 0) return null;
        
        const now = new Date();
        const today = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        let nextReminder = null;
        let minDiff = Infinity;

        active.forEach(reminder => {
            const [hours, minutes] = reminder.reminder_time.split(':').map(Number);
            const reminderMinutes = hours * 60 + minutes;

            if (reminder.recurrence_type === 'daily') {
                let diff = reminderMinutes - currentTime;
                if (diff < 0) diff += 1440; // Add 24 hours
                if (diff < minDiff) {
                    minDiff = diff;
                    nextReminder = reminder;
                }
            } else if (reminder.recurrence_type === 'weekly') {
                const days = JSON.parse(reminder.weekly_days || '[]');
                days.forEach(day => {
                    let dayDiff = day - today;
                    if (dayDiff < 0) dayDiff += 7;
                    if (dayDiff === 0 && reminderMinutes < currentTime) dayDiff = 7;
                    
                    const totalMinutes = dayDiff * 1440 + reminderMinutes - currentTime;
                    if (totalMinutes < minDiff) {
                        minDiff = totalMinutes;
                        nextReminder = reminder;
                    }
                });
            }
        });

        return nextReminder;
    };

    const nextReminder = getNextReminder();
    const totalStreak = streaks.reduce((sum, s) => sum + (s.current_streak || 0), 0);

    return (
        <div className="min-h-screen p-3 md:p-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Active</div>
                        <div className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{reminders.filter(r => r.is_active).length}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Reminders</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Streak</div>
                        <div className="text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-500">{totalStreak}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Days</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</div>
                        <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{pendingCompletions.length}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">To Complete</div>
                    </div>
                </div>

                {nextReminder && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 text-white">
                        <h2 className="text-lg md:text-xl font-bold mb-2">Next Upcoming Reminder</h2>
                        <p className="text-xl md:text-2xl font-semibold">{nextReminder.title}</p>
                        <p className="opacity-90 text-sm md:text-base">{nextReminder.reminder_time} - {nextReminder.recurrence_type}</p>
                    </div>
                )}

                {pendingCompletions.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Pending Completions</h2>
                        <div className="space-y-2">
                            {pendingCompletions.slice(0, 5).map(pending => (
                                <div key={pending.id} className="flex flex-col md:flex-row justify-between md:items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{pending.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(pending.triggered_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleComplete(pending.id)}
                                        className="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition text-sm md:text-base whitespace-nowrap"
                                    >
                                        Mark Complete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">My Reminders</h2>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 md:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm md:text-base"
                        >
                            + New Reminder
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading reminders...</p>
                    ) : reminders.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reminders yet. Create your first one!</p>
                    ) : (
                        <div className="space-y-3">
                            {reminders.map(reminder => {
                                const streak = streaks.find(s => s.reminder_id === reminder.id);
                                return (
                                    <ReminderCard
                                        key={reminder.id}
                                        reminder={reminder}
                                        streak={streak}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggle={handleToggleActive}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <ReminderForm
                    token={token}
                    reminder={editingReminder}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}

function ReminderCard({ reminder, streak, onEdit, onDelete, onToggle }) {
    const getDaysString = () => {
        if (reminder.recurrence_type !== 'weekly') return null;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = JSON.parse(reminder.weekly_days || '[]');
        return selectedDays.map(d => days[d]).join(', ');
    };

    return (
        <div className={`border rounded-lg p-4 ${reminder.is_active ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-800">{reminder.title}</h3>
                        {streak && streak.current_streak > 0 && (
                            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold">
                                {streak.current_streak} day streak
                            </span>
                        )}
                    </div>
                    {reminder.description && (
                        <p className="text-gray-600 text-sm mt-1">{reminder.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">{reminder.reminder_time}</span>
                        <span className="capitalize">{reminder.recurrence_type}</span>
                        {getDaysString() && <span>{getDaysString()}</span>}
                        {streak && streak.longest_streak > 0 && (
                            <span className="text-amber-600">Best: {streak.longest_streak}</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => onToggle(reminder.id, reminder.is_active)}
                        className={`px-3 py-1 rounded ${reminder.is_active ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                    >
                        {reminder.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                        onClick={() => onEdit(reminder)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(reminder.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReminderForm({ token, reminder, onClose }) {
    const [title, setTitle] = useState(reminder?.title || '');
    const [description, setDescription] = useState(reminder?.description || '');
    const [time, setTime] = useState(reminder?.reminder_time || '09:00');
    const [recurrenceType, setRecurrenceType] = useState(reminder?.recurrence_type || 'daily');
    const [weeklyDays, setWeeklyDays] = useState(
        reminder?.weekly_days ? JSON.parse(reminder.weekly_days) : []
    );
    const [isActive, setIsActive] = useState(reminder?.is_active ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const handleDayToggle = (dayIndex) => {
        if (weeklyDays.includes(dayIndex)) {
            setWeeklyDays(weeklyDays.filter(d => d !== dayIndex));
        } else {
            setWeeklyDays([...weeklyDays, dayIndex].sort());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (recurrenceType === 'weekly' && weeklyDays.length === 0) {
            setError('Please select at least one day for weekly reminders');
            setLoading(false);
            return;
        }

        const data = {
            title,
            description,
            reminder_time: time,
            recurrence_type: recurrenceType,
            weekly_days: recurrenceType === 'weekly' ? JSON.stringify(weeklyDays) : null,
            is_active: isActive
        };

        try {
            const url = reminder 
                ? `${API_URL}/api/reminders/${reminder.id}`
                : `${API_URL}/api/reminders`;
            
            const response = await fetch(url, {
                method: reminder ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                onClose();
            } else {
                const result = await response.json();
                setError(result.error || 'Failed to save reminder');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {reminder ? 'Edit Reminder' : 'New Reminder'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time *
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recurrence Type *
                        </label>
                        <select
                            value={recurrenceType}
                            onChange={(e) => setRecurrenceType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    {recurrenceType === 'weekly' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Days *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {dayNames.map((day, index) => (
                                    <label key={index} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={weeklyDays.includes(index)}
                                            onChange={() => handleDayToggle(index)}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <span className="text-sm">{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Analytics({ user, token }) {
    const [overview, setOverview] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [overviewRes, weeklyRes] = await Promise.all([
                fetch(`${API_URL}/api/analytics/overview`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/analytics/weekly`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (overviewRes.ok) {
                const data = await overviewRes.json();
                setOverview(data);
            }

            if (weeklyRes.ok) {
                const data = await weeklyRes.json();
                setWeeklyData(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center">
                <div className="text-2xl text-indigo-600">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h2>
                    <p className="text-gray-600">Track your progress and performance</p>
                </div>

                {overview && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="text-sm text-gray-600 mb-1">Active Reminders</div>
                                <div className="text-3xl font-bold text-indigo-600">{overview.totalActiveReminders}</div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="text-sm text-gray-600 mb-1">Completed</div>
                                <div className="text-3xl font-bold text-green-600">{overview.totalCompletions}</div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="text-sm text-gray-600 mb-1">Missed</div>
                                <div className="text-3xl font-bold text-red-600">{overview.totalMissed}</div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                                <div className="text-3xl font-bold text-purple-600">{overview.completionRate}%</div>
                            </div>
                        </div>

                        {overview.topStreak && (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
                                <h3 className="text-xl font-bold mb-2">Top Streak</h3>
                                <p className="text-2xl font-semibold">{overview.topStreak.title}</p>
                                <p className="text-4xl font-bold mt-2">{overview.topStreak.current_streak} days</p>
                            </div>
                        )}
                    </>
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Weekly Performance</h3>
                    {weeklyData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No data yet. Start completing reminders!</p>
                    ) : (
                        <div className="space-y-4">
                            {weeklyData.map((day, index) => (
                                <div key={index} className="border-b pb-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-700">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {day.completed}/{day.total} completed
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                                            style={{ width: `${day.completionRate}%` }}
                                        >
                                            <span className="text-xs text-white font-bold px-2 leading-4">
                                                {day.completionRate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-1 text-xs">
                                        <span className="text-green-600">{day.completed} completed</span>
                                        <span className="text-red-600">{day.missed} missed</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Chart</h3>
                    {weeklyData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No chart data available</p>
                    ) : (
                        <div className="flex items-end justify-around h-64 gap-2">
                            {weeklyData.map((day, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div className="flex-1 w-full flex items-end justify-center">
                                        <div
                                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all hover:opacity-80"
                                            style={{ height: `${Math.max(day.completionRate, 5)}%` }}
                                            title={`${day.completionRate}% completion`}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-2 text-center">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="text-xs font-bold text-indigo-600">
                                        {day.completionRate}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));