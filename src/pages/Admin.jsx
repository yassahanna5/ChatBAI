import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Users, 
  CreditCard, 
  Activity, 
  Star, 
  LogOut, 
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Settings,
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
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  BarChart3,
  Download
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';
import { 
  getAllProfiles, 
  getAllPlans, 
  createPlan, 
  updatePlan, 
  deletePlan,
  getAllSubscriptions,
  updateSubscription,
  deleteSubscription,
  getAllPayments,
  fetchApprovedReviews,
  getAdminStats,
  logActivity,
  getActivityLogs
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
    totalVisits: 135,
    uniqueVisitors: 0,
    avgVisitDuration: '4m 32s'
  });
  
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  
  // Form states
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    features: '',
    is_active: true
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

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
        getAllProfiles(),
        getAllPlans(),
        getAllSubscriptions(),
        getAllPayments(),
        fetchApprovedReviews(100),
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
      await logActivity({
        action: 'admin_view_dashboard',
        user_email: currentUser?.email || 'unknown',
        details: 'Admin viewed dashboard'
      });
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    navigate(createPageUrl('Home'));
  };

  // Plan CRUD handlers
  const handleCreatePlan = async () => {
    if (!planForm.name || !planForm.price || !planForm.features) {
      alert(language === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required');
      return;
    }
    
    try {
      await createPlan({
        ...planForm,
        price: parseFloat(planForm.price)
      });
      
      await logActivity({
        action: 'create_plan',
        user_email: currentUser.email,
        details: `Created plan: ${planForm.name}`
      });
      
      setShowPlanModal(false);
      setPlanForm({ name: '', price: '', features: '', is_active: true });
      loadData();
      
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedItem) return;
    
    try {
      await updatePlan(selectedItem.id, {
        ...planForm,
        price: parseFloat(planForm.price)
      });
      
      await logActivity({
        action: 'update_plan',
        user_email: currentUser.email,
        details: `Updated plan: ${planForm.name}`
      });
      
      setShowPlanModal(false);
      setSelectedItem(null);
      setPlanForm({ name: '', price: '', features: '', is_active: true });
      loadData();
      
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedItem) return;
    
    try {
      await deletePlan(selectedItem.id);
      
      await logActivity({
        action: 'delete_plan',
        user_email: currentUser.email,
        details: `Deleted plan: ${selectedItem.name}`
      });
      
      setShowDeleteDialog(false);
      setSelectedItem(null);
      loadData();
      
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setSelectedItem(plan);
      setPlanForm({
        name: plan.name || '',
        price: plan.price?.toString() || '',
        features: plan.features || '',
        is_active: plan.is_active !== false
      });
    } else {
      setSelectedItem(null);
      setPlanForm({ name: '', price: '', features: '', is_active: true });
    }
    setShowPlanModal(true);
  };

  const confirmDelete = (item, type) => {
    setSelectedItem(item);
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(
      language === 'ar' ? 'ar-EG' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
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
            <Activity className="w-5 h-5 flex-shrink-0" />
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
            <CreditCard className="w-5 h-5 flex-shrink-0" />
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
              
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {language === 'ar' ? 'التحليلات' : 'Analytics'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalVisits}</p>
                      <p className="text-sm text-green-600 mt-1">+12% from last month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'الزوار الفريدين' : 'Unique Visitors'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.uniqueVisitors}</p>
                      <p className="text-sm text-green-600 mt-1">+8% from last month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'متوسط مدة الزيارة' : 'Avg Visit Duration'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgVisitDuration}</p>
                      <p className="text-sm text-green-600 mt-1">+5% from last month</p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {language === 'ar' ? 'معدل التحويل' : 'Conversion Rate'}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">3.2%</p>
                      <p className="text-sm text-green-600 mt-1">+2% from last month</p>
                    </div>
                  </div>

                  {/* Top Countries */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      {language === 'ar' ? 'أفضل الدول' : 'Top Countries'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'مصر' : 'Egypt'}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1995AD] rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">100%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'السعودية' : 'Saudi Arabia'}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1995AD] rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">85%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'الإمارات' : 'UAE'}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1995AD] rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">70%</span>
                      </div>
                    </div>
                  </div>

                  {/* Devices & OS */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        {language === 'ar' ? 'الأجهزة' : 'Devices'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Smartphone className="w-5 h-5 text-slate-500" />
                          <span className="flex-1 text-slate-600 dark:text-slate-400">
                            {language === 'ar' ? 'جوال' : 'Mobile'}
                          </span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">65%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Monitor className="w-5 h-5 text-slate-500" />
                          <span className="flex-1 text-slate-600 dark:text-slate-400">
                            {language === 'ar' ? 'كمبيوتر' : 'Desktop'}
                          </span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">35%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        {language === 'ar' ? 'نظام التشغيل' : 'OS'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <span className="w-5 h-5">📱</span>
                          <span className="flex-1 text-slate-600 dark:text-slate-400">Android</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">45%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="w-5 h-5">🍎</span>
                          <span className="flex-1 text-slate-600 dark:text-slate-400">iOS</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">30%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="w-5 h-5">💻</span>
                          <span className="flex-1 text-slate-600 dark:text-slate-400">Windows</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">25%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page Views */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      {language === 'ar' ? 'مشاهدات الصفحات' : 'Page Views'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-slate-600 dark:text-slate-400">/chat</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1995AD] rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">1,250</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-slate-600 dark:text-slate-400">/plans</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1995AD] rounded-full" style={{ width: '68%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">850</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="w-24 text-slate-600 dark:text-slate-400">/</span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1995AD] rounded-full" style={{ width: '57.6%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">720</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                  <Button className="bg-[#1995AD] hover:bg-[#1995AD]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ التسجيل' : 'Joined'}</TableHead>
                      <TableHead>{language === 'ar' ? 'آخر دخول' : 'Last Login'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
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
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المميزات' : 'Features'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{formatCurrency(plan.price)}</TableCell>
                        <TableCell className="max-w-xs truncate">{plan.features}</TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active 
                              ? (language === 'ar' ? 'نشط' : 'Active')
                              : (language === 'ar' ? 'غير نشط' : 'Inactive')
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(plan.createdAt)}</TableCell>
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

          {activeTab === 'subscriptions' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الخطة' : 'Plan'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</TableHead>
                      <TableHead>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.user_email}</TableCell>
                        <TableCell>{sub.plan_id}</TableCell>
                        <TableCell>
                          <Badge variant={
                            sub.status === 'active' ? 'default' : 
                            sub.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(sub.start_date)}</TableCell>
                        <TableCell>{formatDate(sub.end_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
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

          {activeTab === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'المدفوعات' : 'Payments'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead>{language === 'ar' ? 'العملة' : 'Currency'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'طريقة الدفع' : 'Method'}</TableHead>
                      <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.user_email}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.currency}</TableCell>
                        <TableCell>
                          <Badge variant={
                            payment.status === 'completed' ? 'default' : 
                            payment.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.payment_method || '-'}</TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

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
                      <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.user_name}</TableCell>
                        <TableCell>{review.job_title}</TableCell>
                        <TableCell>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{review.review_text}</TableCell>
                        <TableCell>{formatDate(review.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedItem 
                ? (language === 'ar' ? 'تعديل الخطة' : 'Edit Plan')
                : (language === 'ar' ? 'إضافة خطة جديدة' : 'Add New Plan')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم الخطة' : 'Plan Name'} *</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: الخطة الأساسية' : 'e.g. Basic Plan'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'السعر' : 'Price'} *</Label>
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
              <Label>{language === 'ar' ? 'المميزات' : 'Features'} *</Label>
              <Textarea
                value={planForm.features}
                onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل المميزات (مفصولة بفواصل)' : 'Enter features (comma separated)'}
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={planForm.is_active}
                onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {language === 'ar' ? 'الخطة نشطة' : 'Plan is active'}
              </label>
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
                ? `هل أنت متأكد من حذف ${deleteType === 'plan' ? 'الخطة' : 'العنصر'} "${selectedItem?.name || selectedItem?.full_name || ''}"؟`
                : `Are you sure you want to delete this ${deleteType}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteType === 'plan' ? handleDeletePlan : null} className="bg-red-600 hover:bg-red-700">
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
