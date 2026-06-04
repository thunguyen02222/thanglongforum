import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  BarChart3, HelpCircle, MessageCircle,
  Users, CheckSquare, TrendingUp,
  Trophy, Medal, Loader2, Flame, ChevronDown
} from 'lucide-react';
import { statsService } from '@services/stats.service';

type PeriodType = '7' | '30' | 'all';

export default function AdminStatsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [questionStats, setQuestionStats] = useState<any[]>([]);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('7');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, hotRes]: any[] = await Promise.all([
        statsService.getDashboard(),
        statsService.getHotTopics(7)
      ]);
      if (dashRes?.data) setDashboard(dashRes.data);
      if (hotRes?.data) setHotTopics(hotRes.data);
    } catch { /* silent */ }

    // Load chart data theo period
    try {
      let qStatsRes: any;
      if (period === 'all') {
        qStatsRes = await statsService.getQuestionStatsMonthly();
      } else {
        qStatsRes = await statsService.getQuestionStats(Number(period));
      }
      if (qStatsRes?.data) setQuestionStats(qStatsRes.data);
    } catch { /* silent */ }

    setLoading(false);
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const maxQ = Math.max(...questionStats.map((s: any) => s.count), 1);
  const topContributors = dashboard?.topContributors || [];

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    if (period === 'all') {
      // dateStr = "2026-04" → "04/2026"
      const parts = dateStr.split('-');
      return `${parts[1]}/${parts[0]}`;
    }
    // dateStr = "2026-04-12" → "12/04"
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const chartTitle = period === 'all'
    ? 'Câu hỏi theo tháng'
    : `Câu hỏi theo ngày (${period} ngày gần nhất)`;

  const periodLabels: Record<PeriodType, string> = {
    7: '7 ngày',
    30: '30 ngày',
    all: 'Tất cả'
  };

  return (
    <>
      <Head>
        <title>Thống kê & Báo cáo | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12 w-full max-w-[1400px]">

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <BarChart3 className="w-7 h-7 text-indigo-500" strokeWidth={2.5} />
            {' '}
            Thống kê & Báo cáo
          </h1>

          {/* Period Dropdown */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="appearance-none bg-white border border-gray-200 rounded-full pl-5 pr-10 py-2.5 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm cursor-pointer"
            >
              <option value="7">7 ngày</option>
              <option value="30">30 ngày</option>
              <option value="all">Tất cả</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4 Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4 text-red-500">
              <HelpCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-[28px] font-extrabold text-slate-900 leading-none mb-2">{dashboard?.totalQuestions || 0}</h2>
            <p className="text-[13px] font-medium text-slate-400">Tổng câu hỏi</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <MessageCircle className="w-6 h-6 fill-slate-200" />
            </div>
            <h2 className="text-[28px] font-extrabold text-slate-900 leading-none mb-2">{dashboard?.totalAnswers || 0}</h2>
            <p className="text-[13px] font-medium text-slate-400">Tổng câu trả lời</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4 text-blue-400">
              <Users className="w-6 h-6 fill-blue-100 stroke-blue-500 stroke-[2]" />
            </div>
            <h2 className="text-[28px] font-extrabold text-slate-900 leading-none mb-2">{dashboard?.totalUsers || 0}</h2>
            <p className="text-[13px] font-medium text-slate-400">Thành viên</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4 text-emerald-500">
              <CheckSquare className="w-6 h-6 fill-emerald-100 stroke-[2]" />
            </div>
            <h2 className="text-[28px] font-extrabold text-slate-900 leading-none mb-2">
              {dashboard?.resolveRate || 0}
              %
            </h2>
            <p className="text-[13px] font-medium text-slate-400">Tỷ lệ được trả lời</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[320px]">
          <div className="flex items-center gap-2 mb-6 shrink-0">
            <TrendingUp className="w-4 h-4 text-red-500" strokeWidth={3} />
            <h2 className="text-[15px] font-bold text-slate-800">{chartTitle}</h2>
          </div>
          {questionStats.length > 0 ? (
            <div className="flex-1 w-full bg-[#f4f7fe] rounded-xl p-4 flex items-end justify-between gap-2 relative">
              {questionStats.map((d: any, i: number) => {
                const pct = Math.max(Math.round((d.count / maxQ) * 100), 2);
                return (
                  <div key={i} className="flex flex-col items-center justify-end w-full h-full relative group">
                    <span className="text-[11px] font-bold text-blue-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">
                      {d.count}
                    </span>
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full max-w-[48px] bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                    />
                    <span className="text-[10px] font-bold text-slate-400 mt-3 absolute -bottom-2 truncate max-w-[56px] whitespace-nowrap">
                      {formatDateLabel(d.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Hot Topics + Top Users Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Hot Topics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-[16px] font-bold text-slate-800">Chủ đề hot nhất tuần</h2>
            </div>
            <div className="p-4">
              {hotTopics.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {hotTopics.map((topic: any, idx: number) => {
                    const maxCount = hotTopics[0]?.count || 1;
                    const widthPct = Math.max(Math.round((topic.count / maxCount) * 100), 8);
                    const colors = [
                      'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'
                    ];
                    return (
                      <div key={topic._id} className="flex items-center gap-3">
                        <span className="text-[13px] font-bold text-slate-500 w-5 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-bold text-slate-700 truncate">{topic.name}</span>
                            <span className="text-[12px] font-bold text-slate-400 shrink-0 ml-2">
                              {topic.count}
                              {' '}
                              câu hỏi
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${colors[idx % colors.length]} transition-all`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 font-medium">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Top Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-100" />
              <h2 className="text-[16px] font-bold text-slate-800">Top người dùng hoạt động</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[80px]">#</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Người dùng</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap text-left">Câu trả lời</th>
                    <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap text-left">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {topContributors.map((user: any, idx: number) => {
                    const medals = [
                      <Medal key="g" className="w-4 h-4 text-yellow-500 fill-yellow-100" />,
                      <Medal key="s" className="w-4 h-4 text-slate-400 fill-slate-100" />,
                      <Medal key="b" className="w-4 h-4 text-amber-700 fill-amber-100" />
                    ];
                    const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];

                    return (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[14px]">
                            {idx < 3 ? medals[idx] : null}
                            {' '}
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${colors[idx % colors.length]}`}>
                              {(user.name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[14px] font-extrabold text-slate-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] font-bold text-slate-600 text-left">
                          {user.answerCount}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                            user.role === 'teacher' ? 'bg-amber-100 text-amber-700'
                              : user.role === 'admin' ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                          >
                            {user.role === 'teacher' ? 'Giảng viên' : user.role === 'admin' ? 'Admin' : 'Sinh viên'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {topContributors.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">Chưa có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
