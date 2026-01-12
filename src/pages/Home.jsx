import React from 'react';
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
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your Organization's
              <span className="text-blue-600"> Dues Management</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Powerful analytics, automated reminders, and comprehensive reporting 
              to help you manage member dues efficiently and transparently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                to="/login"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-blue-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Dues
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                Multi-tenant architecture ensures your data is isolated and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Showcase Section */}
      <section id="analytics" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Analytics at Your Fingertips
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Make data-driven decisions with comprehensive visualizations and insights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RevenueChart />
            <PaymentStatusChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MemberDistributionChart />
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8">
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Total Members</span>
                    <Users className="text-blue-600" size={20} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">250+</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-md">
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
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Dues Accountant.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I register my organization?
              </h3>
              <p className="text-gray-600">
                Click the "Get Started" button and fill out the organization registration form. 
                Your registration will be reviewed and approved by our team.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Yes! We use a multi-tenant architecture where each organization's data is 
                completely isolated in its own database. Your data is private and secure.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I export my data?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can export reports in PDF and Excel formats, and all your 
                data can be accessed through our API.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods are supported?
              </h3>
              <p className="text-gray-600">
                Currently, we track payments manually. You can record cash, bank transfers, 
                and other payment methods. Integration with payment gateways is coming soon.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join organizations already using Dues Accountant to streamline their dues management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Register Your Organization
            </Link>
            <Link
              to="/login"
              className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default Home;

