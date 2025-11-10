import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f97316', '#6366f1', '#ec4899', '#f59e0b'];

const SubgroupLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/subgroups/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading leaderboard...</div>;
  }

  if (leaderboard.length === 0) {
    return (
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Subgroup Leaderboard</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No subgroup contributions yet. Record payments to see statistics here.
        </div>
      </div>
    );
  }

  const totalCollected = leaderboard.reduce((sum, entry) => sum + entry.totalCollected, 0);
  const totalMembers = leaderboard.reduce((sum, entry) => sum + entry.totalMembers, 0);
  const overallAverage = totalMembers > 0 ? totalCollected / totalMembers : 0;
  const topSubgroup = leaderboard[0];

  const chartData = leaderboard.map((entry) => ({
    name: entry.name,
    total: Number(entry.totalCollected.toFixed(2)),
    average: Number(entry.averagePerMember.toFixed(2))
  }));

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subgroup Leaderboard</h1>
          <p className="text-gray-600 mt-1">
            Track subgroup performance based on total dues collected and average contribution per member.
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="self-start md:self-auto mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">🏆 Top Subgroup</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{topSubgroup.name}</p>
          <p className="text-gray-600 mt-2">
            Total Contributions:{' '}
            <span className="font-semibold">GHS {topSubgroup.totalCollected.toFixed(2)}</span>
          </p>
          <p className="text-gray-600">
            Average per Member:{' '}
            <span className="font-semibold">GHS {topSubgroup.averagePerMember.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">💰 Total Dues Collected</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">GHS {totalCollected.toFixed(2)}</p>
          <p className="text-gray-500 mt-1">{leaderboard.length} subgroups contributing</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">📊 Average Contribution</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            GHS {overallAverage.toFixed(2)}
          </p>
          <p className="text-gray-500 mt-1">
            Across {totalMembers} member{totalMembers === 1 ? '' : 's'} in active subgroups
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contributions by Subgroup</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total Contributions (GHS)" fill="#2563eb" />
              <Bar dataKey="average" name="Average per Member (GHS)" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contribution Share</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={leaderboard}
                dataKey="totalCollected"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {leaderboard.map((entry, index) => (
                  <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`GHS ${Number(value).toFixed(2)}`, 'Contributions']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Leaderboard Table</h2>
          <p className="text-gray-500 text-sm">Ranking ordered by total dues collected.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subgroup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Dues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average per Member
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.totalMembers}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    GHS {entry.totalCollected.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    GHS {entry.averagePerMember.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubgroupLeaderboard;


