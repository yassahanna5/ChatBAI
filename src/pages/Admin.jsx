import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Users, CreditCard, Activity, Package, Plus, Edit, Trash2, 
  Loader2, DollarSign, ArrowLeft, Shield, Star, CheckCircle,
  TrendingUp, Globe, Monitor, Smartphone, Clock, Eye, BarChart3, PieChart
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function Admin() {
  const navigate = useNavigate();
  const { language, isRtl } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ users: 0, payments: 0 });
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  const [editingPlan, setEditingPlan] = useState(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    name_en: '',
    name_ar: '',
    price: 0,
    billing_cycle: 'monthly',
    credits: 0,
    tokens_per_question: 0,
    features_en: [],
    features_ar: [],
    is_active: true,
    order: 0
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check admin from role in database
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl('Chat'));
        return;
      }

      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [allPlans, allUsers, allLogs, allSubs, allReviews] = await Promise.all([
      base44.entities.Plan.list(),
      base44.entities.User.list(),
      base44.entities.ActivityLog.list('-created_date', 100),
      base44.entities.Subscription.list(),
      base44.entities.Review.list('-created_date')
    ]);

    setPlans(allPlans.sort((a, b) => (a.order || 0) - (b.order || 0)));
    setUsers(allUsers);
    setLogs(allLogs);
    setSubscriptions(allSubs);
    setReviews(allReviews);

    const totalPayments = allSubs.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
    setStats({
      users: allUsers.length,
      payments: totalPayments
    });
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        await base44.entities.Plan.update(editingPlan.id, planForm);
      } else {
        await base44.entities.Plan.create(planForm);
      }
      await loadData();
      setPlanDialogOpen(false);
      resetPlanForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name_en: plan.name_en || '',
      name_ar: plan.name_ar || '',
      price: plan.price || 0,
      billing_cycle: plan.billing_cycle || 'monthly',
      credits: plan.credits || 0,
      tokens_per_question: plan.tokens_per_question || 0,
      features_en: plan.features_en || [],
      features_ar: plan.features_ar || [],
      is_active: plan.is_active !== false,
      order: plan.order || 0
    });
    setPlanDialogOpen(true);
  };

  const handleDeletePlan = async (plan) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await base44.entities.Plan.delete(plan.id);
      await loadData();
    }
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setPlanForm({
      name_en: '',
      name_ar: '',
      price: 0,
      billing_cycle: 'monthly',
      credits: 0,
      tokens_per_question: 0,
      features_en: [],
      features_ar: [],
      is_active: true,
      order: 0
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1995AD]" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className={`min-h-screen bg-[#F1F1F2] dark:bg-slate-950 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl('Chat'))}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#1995AD]" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Admin Panel
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Payments</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.payments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Active Plans</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{plans.filter(p => p.is_active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{subscriptions.filter(s => s.status === 'active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Total Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.users * 15}</p>
                  <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Unique Visitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.users}</p>
                  <p className="text-xs text-slate-500 mt-1">+8% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Avg Visit Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">4m 32s</p>
                  <p className="text-xs text-slate-500 mt-1">+5% from last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Top Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Egypt', 'Saudi Arabia', 'UAE', 'Jordan', 'Kuwait'].map((country, i) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm">{country}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${100 - i * 15}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{100 - i * 15}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Devices & OS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile
                      </span>
                      <span className="text-sm font-semibold">65%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Desktop
                      </span>
                      <span className="text-sm font-semibold">35%</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Android</span>
                        <span className="font-semibold">45%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>iOS</span>
                        <span className="font-semibold">30%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Windows</span>
                        <span className="font-semibold">25%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Direct', value: 45 },
                      { name: 'Social Media', value: 30 },
                      { name: 'Search Engines', value: 15 },
                      { name: 'Referral', value: 10 }
                    ].map(source => (
                      <div key={source.name} className="flex items-center justify-between">
                        <span className="text-sm">{source.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-600 rounded-full"
                              style={{ width: `${source.value}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-10 text-right">{source.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Page Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { page: '/chat', views: 1250 },
                      { page: '/plans', views: 850 },
                      { page: '/', views: 720 },
                      { page: '/profile', views: 420 },
                      { page: '/support', views: 180 }
                    ].map(page => (
                      <div key={page.page} className="flex items-center justify-between">
                        <span className="text-sm font-mono">{page.page}</span>
                        <span className="text-sm font-semibold">{page.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Plans</CardTitle>
                <Dialog open={planDialogOpen} onOpenChange={(open) => {
                  setPlanDialogOpen(open);
                  if (!open) resetPlanForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1995AD] hover:bg-[#1995AD]/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
                    <DialogHeader>
                      <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name (English)</Label>
                          <Input
                            value={planForm.name_en}
                            onChange={(e) => setPlanForm({ ...planForm, name_en: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name (Arabic)</Label>
                          <Input
                            value={planForm.name_ar}
                            onChange={(e) => setPlanForm({ ...planForm, name_ar: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            value={planForm.price}
                            onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Billing Cycle</Label>
                          <Select value={planForm.billing_cycle} onValueChange={(v) => setPlanForm({ ...planForm, billing_cycle: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Credits</Label>
                          <Input
                            type="number"
                            value={planForm.credits}
                            onChange={(e) => setPlanForm({ ...planForm, credits: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tokens per Question</Label>
                          <Input
                            type="number"
                            value={planForm.tokens_per_question}
                            onChange={(e) => setPlanForm({ ...planForm, tokens_per_question: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Features (English) - One per line</Label>
                        <Textarea
                          value={planForm.features_en?.join('\n') || ''}
                          onChange={(e) => setPlanForm({ ...planForm, features_en: e.target.value.split('\n').filter(f => f.trim()) })}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Features (Arabic) - One per line</Label>
                        <Textarea
                          value={planForm.features_ar?.join('\n') || ''}
                          onChange={(e) => setPlanForm({ ...planForm, features_ar: e.target.value.split('\n').filter(f => f.trim()) })}
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Display Order</Label>
                          <Input
                            type="number"
                            value={planForm.order}
                            onChange={(e) => setPlanForm({ ...planForm, order: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Switch
                            checked={planForm.is_active}
                            onCheckedChange={(v) => setPlanForm({ ...planForm, is_active: v })}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <Button onClick={handleSavePlan} className="w-full bg-[#1995AD] hover:bg-[#1995AD]/90">
                        Save Plan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name_en}</TableCell>
                        <TableCell>${plan.price}</TableCell>
                        <TableCell>{plan.credits}</TableCell>
                        <TableCell>{plan.tokens_per_question}</TableCell>
                        <TableCell className="capitalize">{plan.billing_cycle}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            plan.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditPlan(plan)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeletePlan(plan)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(u.created_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.user_name}</TableCell>
                        <TableCell>{review.job_title}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{review.review_text}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            review.is_approved ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(review.created_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={async () => {
                                await base44.entities.Review.update(review.id, { is_approved: !review.is_approved });
                                await loadData();
                              }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={async () => {
                                if (confirm('Delete this review?')) {
                                  await base44.entities.Review.delete(review.id);
                                  await loadData();
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions & Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.user_email}</TableCell>
                        <TableCell className="font-medium">{sub.plan_name}</TableCell>
                        <TableCell>${sub.amount_paid || 0}</TableCell>
                        <TableCell>{sub.credits_used || 0}/{sub.credits_total}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(sub.created_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.user_email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            log.action === 'purchase' ? 'bg-green-100 text-green-700' :
                            log.action === 'login' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'chat' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                        <TableCell>{new Date(log.created_date).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}