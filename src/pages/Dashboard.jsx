import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      const data = response.data;
      
      // Merge monthly income and expenditure data
      const mergedMonthlyData = data.monthlyIncome.map((incomeItem, index) => {
        const expenditureItem = data.monthlyExpenditure[index] || { amount: 0 };
        return {
          month: incomeItem.month,
          income: incomeItem.amount,
          expenditure: expenditureItem.amount
        };
      });
      
      setStats({ ...data, mergedMonthlyData });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">No data available</div>;
  }

  const subgroupStats = stats.subgroupStats || [];
  const rankedSubgroups = subgroupStats.filter((sg) => sg.id !== 'unassigned');
  const unassignedStat = subgroupStats.find((sg) => sg.id === 'unassigned');
  const topCompetitiveSubgroup = rankedSubgroups.length > 0 ? rankedSubgroups[0] : null;
  const totalSubgroupCollected = rankedSubgroups.reduce((sum, sg) => sum + sg.totalCollected, 0);
  const leaderboardPreview = rankedSubgroups.slice(0, 3);
  const maxSubgroupTotal = rankedSubgroups.length > 0 ? Math.max(...rankedSubgroups.map((sg) => sg.totalCollected)) : 0;

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <span className="text-white text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <span className="text-white text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <p className="text-2xl font-semibold text-gray-900">GHS {stats.totalCollected?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
              <span className="text-white text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">GHS {stats.totalSpent?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <span className="text-white text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Balance</p>
              <p className={`text-2xl font-semibold ${(stats.balanceRemaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                GHS {stats.balanceRemaining?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
              <span className="text-white text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Members in Arrears</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.membersInArrears}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <span className="text-white text-2xl">👤</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Admins</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAdmins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <span className="text-white text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Top Subgroup</p>
              {topCompetitiveSubgroup ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{topCompetitiveSubgroup.name}</p>
                  <p className="text-sm text-gray-500">
                    GHS {topCompetitiveSubgroup.totalCollected.toFixed(2)} collected
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg per member: GHS {topCompetitiveSubgroup.averagePerMember.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Assign members to subgroups to start tracking.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-teal-500 rounded-md p-3">
              <span className="text-white text-2xl">💼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Subgroup Contributions</p>
              <p className="text-2xl font-semibold text-gray-900">
                GHS {totalSubgroupCollected.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {rankedSubgroups.length} active subgroup{rankedSubgroups.length === 1 ? '' : 's'}
                {unassignedStat?.totalMembers
                  ? ` • ${unassignedStat.totalMembers} unassigned member${unassignedStat.totalMembers === 1 ? '' : 's'}`
                  : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Collections vs Expenditures</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.mergedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenditure" fill="#f97316" name="Expenditure" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.mergedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
              <Line type="monotone" dataKey="expenditure" stroke="#f97316" name="Expenditure" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subgroup Performance */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Subgroup Performance</h2>
            <p className="text-sm text-gray-500">
              Ranked by total dues collected across all members.
            </p>
          </div>
          <Link
            to="/leaderboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Leaderboard →
          </Link>
        </div>
        {rankedSubgroups.length === 0 ? (
          <p className="text-gray-500">No subgroup contributions yet.</p>
        ) : (
          <div className="space-y-4">
            {leaderboardPreview.map((subgroup, index) => {
              const percentage = maxSubgroupTotal > 0 ? (subgroup.totalCollected / maxSubgroupTotal) * 100 : 0;
              return (
                <div key={subgroup.id}>
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>
                      #{index + 1} {subgroup.name}
                    </span>
                    <span>GHS {subgroup.totalCollected.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full bg-gray-200 rounded-full">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Members: {subgroup.totalMembers} • Avg: GHS {subgroup.averagePerMember.toFixed(2)}
                  </p>
                </div>
              );
            })}
            {rankedSubgroups.length > leaderboardPreview.length && (
              <p className="text-xs text-gray-500">
                + {rankedSubgroups.length - leaderboardPreview.length} more subgroup
                {rankedSubgroups.length - leaderboardPreview.length === 1 ? '' : 's'} contributing
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/members"
            className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Member
          </Link>
          <Link
            to="/payments"
            className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Record Payment
          </Link>
          <Link
            to="/reports"
            className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

