import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  BarChart3,
  Users,
  Shield,
  Zap,
  FileText,
  Bell,
  TrendingUp,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';
import { RevenueChart, PaymentStatusChart, MemberDistributionChart } from '../components/ChartWidget';

const Home = () => {
  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    window.requestAnimationFrame(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#e8eef3]">

      {/* ── Ambient background — same as auth pages ────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-50/80 via-white/20 to-blue-50/50" aria-hidden />
      {/* top-left cyan glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[min(140%,72rem)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.20),transparent_65%)]" aria-hidden />
      {/* right-side blue blob */}
      <div className="pointer-events-none absolute right-[-8%] top-[8%] h-[38rem] w-[38rem] rounded-full bg-blue-500/10 blur-3xl" aria-hidden />
      {/* mid-page left cyan blob */}
      <div className="pointer-events-none absolute left-[-6%] top-[38%] h-[32rem] w-[32rem] rounded-full bg-cyan-400/12 blur-3xl" aria-hidden />
      {/* bottom-right blue blob */}
      <div className="pointer-events-none absolute bottom-[10%] right-[-5%] h-[30rem] w-[30rem] rounded-full bg-indigo-400/10 blur-3xl" aria-hidden />
      {/* bottom-left teal blob */}
      <div className="pointer-events-none absolute bottom-[-4%] left-[-4%] h-[24rem] w-[24rem] rounded-full bg-cyan-300/15 blur-3xl" aria-hidden />
      {/* + grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cg%20stroke%3D%22%23a8b0c4%22%20stroke-width%3D%220.65%22%20opacity%3D%220.5%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M16%208v16M8%2016h16%22/%3E%3C/g%3E%3C/svg%3E')]"
        style={{ backgroundSize: '32px 32px' }}
        aria-hidden
      />

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="relative z-10">
      <MarketingNav />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your Organization's
              <span className="text-blue-600"> Dues Management</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Powerful analytics, automated reminders, and comprehensive reporting 
              to help you manage member dues efficiently and transparently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="min-h-[44px] flex items-center justify-center bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 flex-shrink-0" size={20} />
              </Link>
              <Link
                to="/login"
                className="min-h-[44px] flex items-center justify-center bg-white text-blue-600 px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-blue-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Dues
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed to simplify dues collection, tracking, and reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Member Management</h3>
              <p className="text-gray-600">
                Easily add, update, and organize members with custom subgroups and roles.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Tracking</h3>
              <p className="text-gray-600">
                Record and track all payments with detailed history and status updates.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expenditure Management</h3>
              <p className="text-gray-600">
                Track all expenses with receipt uploads and detailed categorization.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">
                Visualize your financial data with interactive charts and comprehensive reports.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Bell className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Automated Reminders</h3>
              <p className="text-gray-600">
                Set up automatic payment reminders to reduce overdue accounts.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-indigo-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your organization’s information is protected with strong security practices and kept separate from everyone else’s.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Showcase Section */}
      <section id="analytics" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Analytics at Your Fingertips
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Make data-driven decisions with comprehensive visualizations and insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RevenueChart />
            <PaymentStatusChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MemberDistributionChart />
            <div className="bg-white/85 backdrop-blur-sm rounded-xl shadow-md p-6 flex flex-col justify-center border border-white/60">
              <div className="text-center">
                <TrendingUp className="text-blue-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Real-time Insights</h3>
                <p className="text-gray-600">
                  Get instant updates on your organization's financial health with 
                  real-time dashboards and customizable reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Dues Accountant?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Save Time</h3>
                    <p className="text-gray-600">
                      Automate repetitive tasks and focus on what matters most.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Increase Transparency</h3>
                    <p className="text-gray-600">
                      Provide clear visibility into finances for all stakeholders.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Reduce Errors</h3>
                    <p className="text-gray-600">
                      Eliminate manual calculations and human errors.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Scale Easily</h3>
                    <p className="text-gray-600">
                      Grow your organization without worrying about system limitations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-50/90 to-blue-100/80 backdrop-blur-sm rounded-xl p-8 border border-white/50">
              <div className="space-y-6">
                <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Total Members</span>
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">250+</p>
                </div>
                <div className="bg-white/85 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Payment Collection Rate</span>
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">95%</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Time Saved</span>
                    <Zap className="text-yellow-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">20+ hrs/week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-xl text-gray-600">
              Everything you need to know about Dues Accountant.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I register my organization?
              </h3>
              <p className="text-gray-600">
                Click the "Get Started" button and fill out the organization registration form. 
                Your registration will be reviewed and approved by our team.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Yes. Your organization’s data is stored separately and protected with industry-standard security. It stays yours—private and secure.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I export my data?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can export reports in PDF and Excel formats, and all your 
                data can be accessed through our API.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods are supported?
              </h3>
              <p className="text-gray-600">
                Currently, we track payments manually. You can record cash, bank transfers, 
                and other payment methods. Integration with payment gateways is coming soon.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do automated reminders work?
              </h3>
              <p className="text-gray-600">
                You can set up reminder schedules that automatically send email notifications 
                to members with pending or overdue payments. Reminders are fully customizable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        {/* Local blob layers — same language as the auth background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-50/80 via-blue-50/60 to-indigo-100/70" aria-hidden />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-[-4rem] h-[32rem] w-[32rem] rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/15 blur-3xl" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cg%20stroke%3D%22%23a8b0c4%22%20stroke-width%3D%220.65%22%20opacity%3D%220.5%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M16%208v16M8%2016h16%22/%3E%3C/g%3E%3C/svg%3E')]"
          style={{ backgroundSize: '32px 32px' }}
          aria-hidden
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-5">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join organizations already using Dues Accountant to streamline their dues management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="min-h-[44px] flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-700 hover:to-blue-800 sm:px-10 sm:py-4"
            >
              Register Your Organization
            </Link>
            <Link
              to="/login"
              className="min-h-[44px] flex items-center justify-center rounded-xl border-2 border-blue-700 bg-white/70 px-8 py-3.5 text-base font-bold text-blue-700 backdrop-blur-sm transition hover:bg-white sm:px-10 sm:py-4"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
      </div> {/* end z-10 content wrapper */}
    </div>
  );
};

export default Home;

