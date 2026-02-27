import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Users, 
  CreditCard, 
  Activity, 
  Star, 
  LogOut, 
  LayoutDashboard,
  FileText,
  Bell,
  Home,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  DollarSign,
  BarChart3,
  Sun,
  Moon,
  Download,
  CheckCircle,
  XCircle,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  TrendingUp,
  CheckSquare,
  XSquare,
  RefreshCw,
  CalendarDays,
  Coins,
  Award,
  Hash
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';
import { 
  getAllUsers, 
  getAllPlans, 
  createPlan, 
  updatePlan, 
  deletePlan,
  getAllSubscriptions,
  getAllPayments,
  getAllReviews,
  getAdminStats,
  logActivity,
  getActivityLogs,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  updateUserRole,
  addUserByAdmin,
  deleteUser,
  updateReviewApproval,
  deleteReview
} from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function Admin() {
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPayments: 0,
    activePlans: 0,
    activeSubscriptions: 0,
    totalReviews: 0,
    totalVisits: 0,
    uniqueVisitors: 0,
    avgVisitDuration: '0m 0s',
    conversionRate: 0,
    visitIncrease: 0,
    uniqueIncrease: 0,
    durationIncrease: 0,
    conversionIncrease: 0,
    topCountries: [],
    devices: {},
    osStats: {},
    pageViews: []
  });
  
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  
  // Form states
  const [planForm, setPlanForm] = useState({
    name_en: '',
    name_ar: '',
    price: '',
    billing_cycle: 'monthly',
    credits: '',
    tokens_per_question: '500',
    features_en: '',
    features_ar: '',
    is_active: true,
    order: '0'
  });

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    gender: '',
    role: 'user',
    business_name: '',
    country: '',
    city: ''
  });

  useEffect(() => {
    checkAuth();
    loadData();
    loadNotifications();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(() => {
      if (activeTab === 'dashboard') {
        refreshAnalytics();
      }
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  const checkAuth = () => {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) {
      navigate(createPageUrl('SignIn'));
      return;
    }
    
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      navigate(createPageUrl('Home'));
      return;
    }
    
    setCurrentUser(user);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        statsData,
        usersData,
        plansData,
        subsData,
        paymentsData,
        reviewsData,
        logsData
      ] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllPlans(),
        getAllSubscriptions(),
        getAllPayments(),
        getAllReviews(),
        getActivityLogs(50)
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setPlans(plansData);
      setSubscriptions(subsData);
      setPayments(paymentsData);
      setReviews(reviewsData);
      setActivityLogs(logsData);
      
      // Log this activity
      if (currentUser?.email) {
        await logActivity({
          action: 'admin_view_dashboard',
          user_email: currentUser.email,
          details: 'Admin viewed dashboard'
        });
      }
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    try {
      const statsData = await getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      if (currentUser?.email) {
        const notifs = await getUserNotifications(currentUser.email);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification(notificationId);
    loadNotifications();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    navigate(createPageUrl('Home'));
  };

  // ==================== User Management ====================

  const handleUpdateUserRole = async (userId, newRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      loadData();
      loadNotifications();
    }
  };

  const handleAddUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.full_name) {
      alert(language === 'ar' ? 'البريد الإلكتروني وكلمة المرور والاسم مطلوبون' : 'Email, password and name are required');
      return;
    }

    const result = await addUserByAdmin(userForm);
    if (result.success) {
      setShowUserModal(false);
      setUserForm({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        gender: '',
        role: 'user',
        business_name: '',
        country: '',
        city: ''
      });
      loadData();
      loadNotifications();
    } else {
      alert(result.error || 'Error creating user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedItem) return;
    await deleteUser(selectedItem.id);
    setShowDeleteDialog(false);
    setSelectedItem(null);
    loadData();
    loadNotifications();
  };

  // ==================== Plan Management ====================

  const handleCreatePlan = async () => {
    if (!planForm.name_en || !planForm.price || !planForm.credits) {
      alert(language === 'ar' ? 'جميع الحقول المطلوبة يجب ملؤها' : 'All required fields must be filled');
      return;
    }
    
    try {
      await createPlan(planForm);
      setShowPlanModal(false);
      setPlanForm({
        name_en: '',
        name_ar: '',
        price: '',
        billing_cycle: 'monthly',
        credits: '',
        tokens_per_question: '500',
        features_en: '',
        features_ar: '',
        is_active: true,
        order: '0'
      });
      loadData();
      loadNotifications();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedItem) return;
    
    try {
      await updatePlan(selectedItem.id, planForm);
      setShowPlanModal(false);
      setSelectedItem(null);
      setPlanForm({
        name_en: '',
        name_ar: '',
        price: '',
        billing_cycle: 'monthly',
        credits: '',
        tokens_per_question: '500',
        features_en: '',
        features_ar: '',
        is_active: true,
        order: '0'
      });
      loadData();
      loadNotifications();
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedItem) return;
    
    try {
      await deletePlan(selectedItem.id);
      setShowDeleteDialog(false);
      setSelectedItem(null);
      loadData();
      loadNotifications();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setSelectedItem(plan);
      setPlanForm({
        name_en: plan.name_en || '',
        name_ar: plan.name_ar || '',
        price: plan.price?.toString() || '',
        billing_cycle: plan.billing_cycle || 'monthly',
        credits: plan.credits?.toString() || '',
        tokens_per_question: plan.tokens_per_question?.toString() || '500',
        features_en: Array.isArray(plan.features_en) ? plan.features_en.join(', ') : plan.features_en || '',
        features_ar: Array.isArray(plan.features_ar) ? plan.features_ar.join(', ') : plan.features_ar || '',
        is_active: plan.is_active !== false,
        order: plan.order?.toString() || '0'
      });
    } else {
      setSelectedItem(null);
      setPlanForm({
        name_en: '',
        name_ar: '',
        price: '',
        billing_cycle: 'monthly',
        credits: '',
        tokens_per_question: '500',
        features_en: '',
        features_ar: '',
        is_active: true,
        order: '0'
      });
    }
    setShowPlanModal(true);
  };

  // ==================== Review Management ====================

  const handleUpdateReviewApproval = async (reviewId, isApproved) => {
    await updateReviewApproval(reviewId, isApproved);
    loadData();
    loadNotifications();
  };

  const handleDeleteReview = async (reviewId) => {
    setSelectedItem({ id: reviewId });
    setDeleteType('review');
    setShowDeleteDialog(true);
  };

  const confirmDeleteReview = async () => {
    if (!selectedItem) return;
    await deleteReview(selectedItem.id);
    setShowDeleteDialog(false);
    setSelectedItem(null);
    loadData();
    loadNotifications();
  };

  // ==================== Utility Functions ====================

  const confirmDelete = (item, type) => {
    setSelectedItem(item);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(
      language === 'ar' ? 'ar-EG' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDeviceIcon = (device) => {
    switch(device?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getOsIcon = (os) => {
    switch(os?.toLowerCase()) {
      case 'android': return '📱';
      case 'ios': return '🍎';
      case 'windows': return '💻';
      case 'macos': return '💻';
      case 'linux': return '🐧';
      default: return '💻';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">{language === 'ar' ? 'نشط' : 'Active'}</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">{language === 'ar' ? 'منتهي' : 'Expired'}</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800">{language === 'ar' ? 'ملغي' : 'Cancelled'}</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1995AD] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Sidebar */}
      <div className={`fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          {sidebarOpen ? (
            <span className="text-xl font-bold bg-gradient-to-r from-[#1995AD] to-[#A1D6E2] bg-clip-text text-transparent">
              Admin
            </span>
          ) : (
            <span className="text-xl font-bold text-[#1995AD]">A</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'users' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'plans' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'الخطط' : 'Plans'}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'subscriptions' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'payments' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'المدفوعات' : 'Payments'}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'reviews' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Star className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'التقييمات' : 'Reviews'}</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              activeTab === 'logs' 
                ? 'bg-[#1995AD] text-white' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'سجل النشاط' : 'Activity Logs'}</span>}
          </button>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 px-4 space-y-2">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'الرئيسية' : 'Home'}</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? (isRtl ? 'mr-64' : 'ml-64') : (isRtl ? 'mr-20' : 'ml-20')}`}>
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'dashboard' && (language === 'ar' ? 'لوحة التحكم' : 'Dashboard')}
              {activeTab === 'users' && (language === 'ar' ? 'المستخدمين' : 'Users')}
              {activeTab === 'plans' && (language === 'ar' ? 'الخطط' : 'Plans')}
              {activeTab === 'subscriptions' && (language === 'ar' ? 'الاشتراكات' : 'Subscriptions')}
              {activeTab === 'payments' && (language === 'ar' ? 'المدفوعات' : 'Payments')}
              {activeTab === 'reviews' && (language === 'ar' ? 'التقييمات' : 'Reviews')}
              {activeTab === 'logs' && (language === 'ar' ? 'سجل النشاط' : 'Activity Logs')}
            </h1>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowNotificationsDialog(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={refreshAnalytics}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={language === 'ar' ? 'تحديث' : 'Refresh'}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                          {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalUsers}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                          {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalPayments)}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                          {language === 'ar' ? 'الخطط النشطة' : 'Active Plans'}
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activePlans}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                          {language === 'ar' ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeSubscriptions}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {language === 'ar' ? 'التحليلات' : 'Analytics'}
                  </CardTitle>
                  <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                    {language === 'ar' ? 'آخر تحديث: الآن' : 'Live'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalVisits}</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.visitIncrease}% from last month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'الزوار الفريدين' : 'Unique Visitors'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.uniqueVisitors}</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.uniqueIncrease}% from last month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'متوسط مدة الزيارة' : 'Avg Visit Duration'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgVisitDuration}</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.durationIncrease}% from last month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'معدل التحويل' : 'Conversion Rate'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.conversionRate}%</p>
                      <p className="text-sm text-green-600 mt-1">+{stats.conversionIncrease}% from last month</p>
                    </div>
                  </div>

                  {/* Top Countries */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      {language === 'ar' ? 'أفضل الدول' : 'Top Countries'}
                    </h3>
                    <div className="space-y-3">
                      {stats.topCountries.map((country) => (
                        <div key={country.country} className="flex items-center gap-4">
                          <span className="w-24 text-slate-600 dark:text-slate-400">
                            {country.country}
                          </span>
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#1995AD] rounded-full" 
                              style={{ width: `${country.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {country.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Devices & OS */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        {language === 'ar' ? 'الأجهزة' : 'Devices'}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.devices).map(([device, percentage]) => (
                          <div key={device} className="flex items-center gap-4">
                            {getDeviceIcon(device)}
                            <span className="flex-1 text-slate-600 dark:text-slate-400">
                              {device}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        {language === 'ar' ? 'نظام التشغيل' : 'OS'}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.osStats).map(([os, percentage]) => (
                          <div key={os} className="flex items-center gap-4">
                            <span className="w-5 h-5">{getOsIcon(os)}</span>
                            <span className="flex-1 text-slate-600 dark:text-slate-400">{os}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Page Views */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      {language === 'ar' ? 'مشاهدات الصفحات' : 'Page Views'}
                    </h3>
                    <div className="space-y-3">
                      {stats.pageViews.map((page) => (
                        <div key={page.page} className="flex items-center gap-4">
                          <span className="w-24 text-slate-600 dark:text-slate-400">{page.page}</span>
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#1995AD] rounded-full" 
                              style={{ width: `${page.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {page.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                  <Button 
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({
                        email: '',
                        password: '',
                        full_name: '',
                        phone: '',
                        gender: '',
                        role: 'user',
                        business_name: '',
                        country: '',
                        city: ''
                      });
                      setShowUserModal(true);
                    }} 
                    className="bg-[#1995AD] hover:bg-[#1995AD]/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الدولة' : 'Country'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ التسجيل' : 'Joined'}</TableHead>
                      <TableHead>{language === 'ar' ? 'آخر دخول' : 'Last Login'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            {user.full_name}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role || 'user'}
                            onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{user.country || '-'}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600"
                              onClick={() => confirmDelete(user, 'user')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Plans Tab - بدون خلفية صفراء ✅ */}
          {activeTab === 'plans' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'الخطط' : 'Plans'}</span>
                  <Button onClick={() => openPlanModal()} className="bg-[#1995AD] hover:bg-[#1995AD]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة خطة' : 'Add Plan'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (EN)'}</TableHead>
                      <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الدورة' : 'Billing'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الرصيد' : 'Credits'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name_ar || plan.name_en}</TableCell>
                        <TableCell>{plan.name_en}</TableCell>
                        <TableCell>{formatCurrency(plan.price)}</TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                            {plan.billing_cycle === 'monthly' 
                              ? (language === 'ar' ? 'شهري' : 'Monthly')
                              : (language === 'ar' ? 'سنوي' : 'Yearly')}
                          </Badge>
                        </TableCell>
                        <TableCell>{plan.credits}</TableCell>
                        <TableCell>
                          <Badge className={plan.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }>
                            {plan.is_active 
                              ? (language === 'ar' ? 'نشط' : 'Active')
                              : (language === 'ar' ? 'غير نشط' : 'Inactive')
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openPlanModal(plan)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600"
                              onClick={() => confirmDelete(plan, 'plan')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Subscriptions Tab - مع جميع التفاصيل ✅ */}
          {activeTab === 'subscriptions' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الخطة' : 'Plan'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الرصيد' : 'Credits'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'Used'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المتبقي' : 'Left'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => {
                      const creditsLeft = (sub.credits_total || 0) - (sub.credits_used || 0);
                      const usagePercentage = sub.credits_total > 0 
                        ? Math.round((sub.credits_used / sub.credits_total) * 100) 
                        : 0;
                      
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              {sub.user_email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-[#1995AD]" />
                              {sub.plan_name || sub.plan_id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {sub.credits_total || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{sub.credits_used || 0}</span>
                              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#1995AD] rounded-full" 
                                  style={{ width: `${usagePercentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{creditsLeft}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(sub.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-slate-400" />
                              {formatDate(sub.start_date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.end_date ? (
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-slate-400" />
                                {formatDate(sub.end_date)}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.amount_paid ? formatCurrency(sub.amount_paid) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'التقييمات' : 'Reviews'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الوظيفة' : 'Job Title'}</TableHead>
                      <TableHead>{language === 'ar' ? 'التقييم' : 'Rating'}</TableHead>
                      <TableHead>{language === 'ar' ? 'التعليق' : 'Review'}</TableHead>
                      <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(review.user_name)}</AvatarFallback>
                            </Avatar>
                            {review.user_name}
                          </div>
                        </TableCell>
                        <TableCell>{review.job_title}</TableCell>
                        <TableCell>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < review.rating 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-slate-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{review.review_text}</TableCell>
                        <TableCell>{formatDate(review.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={review.is_approved 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }>
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!review.is_approved && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handleUpdateReviewApproval(review.id, true)}
                                title={language === 'ar' ? 'موافقة' : 'Approve'}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {review.is_approved && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => handleUpdateReviewApproval(review.id, false)}
                                title={language === 'ar' ? 'إلغاء الموافقة' : 'Unapprove'}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteReview(review.id)}
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Activity Logs Tab */}
          {activeTab === 'logs' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'سجل النشاط' : 'Activity Logs'}</span>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="w-8 h-8 bg-[#1995AD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-[#1995AD]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900 dark:text-white">{log.user_email}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">{formatDate(log.timestamp)}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{log.action}</p>
                          {log.details && (
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">{log.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Notifications Dialog - بدون خلفية صفراء ✅ */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 ml-2">
                  {unreadCount} {language === 'ar' ? 'جديد' : 'new'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${
                      notif.is_read 
                        ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {notif.title_en && (language === 'ar' ? notif.title_ar || notif.title_en : notif.title_en)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {notif.message_en && (language === 'ar' ? notif.message_ar || notif.message_en : notif.message_en)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteNotification(notif.id)}
                        >
                          <XSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>
              {editingUser 
                ? (language === 'ar' ? 'تعديل المستخدم' : 'Edit User')
                : (language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *</Label>
              <Input
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'} *</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="******"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
              <Input
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الدور' : 'Role'}</Label>
              <Select 
                value={userForm.role} 
                onValueChange={(v) => setUserForm({ ...userForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الدولة' : 'Country'}</Label>
              <Input
                value={userForm.country}
                onChange={(e) => setUserForm({ ...userForm, country: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المدينة' : 'City'}</Label>
              <Input
                value={userForm.city}
                onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم الشركة' : 'Business Name'}</Label>
              <Input
                value={userForm.business_name}
                onChange={(e) => setUserForm({ ...userForm, business_name: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddUser}
              className="bg-[#1995AD] hover:bg-[#1995AD]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>
              {selectedItem 
                ? (language === 'ar' ? 'تعديل الخطة' : 'Edit Plan')
                : (language === 'ar' ? 'إضافة خطة جديدة' : 'Add New Plan')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم الخطة (عربي)' : 'Plan Name (Arabic)'} *</Label>
              <Input
                value={planForm.name_ar}
                onChange={(e) => setPlanForm({ ...planForm, name_ar: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: الخطة الأساسية' : 'e.g. Basic Plan'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم الخطة (إنجليزي)' : 'Plan Name (English)'} *</Label>
              <Input
                value={planForm.name_en}
                onChange={(e) => setPlanForm({ ...planForm, name_en: e.target.value })}
                placeholder="e.g. Basic Plan"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'السعر (USD)' : 'Price (USD)'} *</Label>
                <Input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'دورة الفوترة' : 'Billing Cycle'}</Label>
                <Select 
                  value={planForm.billing_cycle} 
                  onValueChange={(v) => setPlanForm({ ...planForm, billing_cycle: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">
                      {language === 'ar' ? 'شهري' : 'Monthly'}
                    </SelectItem>
                    <SelectItem value="yearly">
                      {language === 'ar' ? 'سنوي' : 'Yearly'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الرصيد' : 'Credits'} *</Label>
                <Input
                  type="number"
                  value={planForm.credits}
                  onChange={(e) => setPlanForm({ ...planForm, credits: e.target.value })}
                  placeholder="100"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الرموز لكل سؤال' : 'Tokens/Question'}</Label>
                <Input
                  type="number"
                  value={planForm.tokens_per_question}
                  onChange={(e) => setPlanForm({ ...planForm, tokens_per_question: e.target.value })}
                  placeholder="500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المميزات (عربي)' : 'Features (Arabic)'}</Label>
              <Textarea
                value={planForm.features_ar}
                onChange={(e) => setPlanForm({ ...planForm, features_ar: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل المميزات (مفصولة بفواصل)' : 'Enter features (comma separated)'}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المميزات (إنجليزي)' : 'Features (English)'}</Label>
              <Textarea
                value={planForm.features_en}
                onChange={(e) => setPlanForm({ ...planForm, features_en: e.target.value })}
                placeholder="Enter features (comma separated)"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={planForm.is_active}
                  onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium leading-none"
                >
                  {language === 'ar' ? 'الخطة نشطة' : 'Plan is active'}
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label>{language === 'ar' ? 'الترتيب' : 'Order'}</Label>
                <Input
                  type="number"
                  value={planForm.order}
                  onChange={(e) => setPlanForm({ ...planForm, order: e.target.value })}
                  className="w-20"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={selectedItem ? handleUpdatePlan : handleCreatePlan}
              className="bg-[#1995AD] hover:bg-[#1995AD]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {selectedItem 
                ? (language === 'ar' ? 'تحديث' : 'Update')
                : (language === 'ar' ? 'حفظ' : 'Save')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف ${deleteType === 'plan' ? 'الخطة' : deleteType === 'user' ? 'المستخدم' : 'التقييم'} "${selectedItem?.name || selectedItem?.name_en || selectedItem?.full_name || ''}"؟`
                : `Are you sure you want to delete this ${deleteType}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={
                deleteType === 'plan' ? handleDeletePlan : 
                deleteType === 'user' ? handleDeleteUser : 
                confirmDeleteReview
              } 
              className="bg-red-600 hover:bg-red-700"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
