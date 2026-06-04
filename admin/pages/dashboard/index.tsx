import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  HelpCircle, MessageCircle, Users, ShieldAlert,
  TrendingUp, Trophy, Medal, Loader2, ArrowUpRight,
  CheckCircle2, Clock, Eye, FileText, Flame, Percent
} from 'lucide-react';
import { statsService } from '@services/stats.service';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [questionStats, setQuestionStats] = useState<any[]>([]);
  const [hotTopics, setHotTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, qStatsRes, hotRes]: any[] = await Promise.all([
          statsService.getDashboard(),
          statsService.getQuestionStats(14),
          statsService.getHotTopics(7)
        ]);
        if (dashRes?.data) setDashboard(dashRes.data);
        if (qStatsRes?.data) setQuestionStats(qStatsRes.data);
        if (hotRes?.data) setHotTopics(hotRes.data);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const maxQ = Math.max(...questionStats.map((s: any) => s.count), 1);
  const topContributors = dashboard?.topContributors || [];
  const recentQuestions = dashboard?.recentQuestions || [];

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  const getTimeDiff = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}p trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h trước`;
    const days = Math.floor(hours / 24);
    return `${days}d trước`;
  };

  const statCards = [
    {
      label: 'Tổng câu hỏi',
      value: dashboard?.totalQuestions || 0,
      icon: <HelpCircle className="w-5 h-5" />,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/posts'
    },
    {
      label: 'Tổng câu trả lời',
      value: dashboard?.totalAnswers || 0,
      icon: <MessageCircle className="w-5 h-5" />,
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      link: null
    },
    {
      label: 'Thành viên',
      value: dashboard?.totalUsers || 0,
      icon: <Users className="w-5 h-5" />,
      gradient: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
      link: '/users'
    },
    {
      label: 'Tỷ lệ được trả lời',
      value: `${dashboard?.resolveRate || 0}%`,
      icon: <Percent className="w-5 h-5" />,
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      link: null
    },
    {
      label: 'Báo cáo chờ xử lý',
      value: dashboard?.pendingReports || 0,
      icon: <ShieldAlert className="w-5 h-5" />,
      gradient: 'from-red-500 to-rose-500',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600',
      link: '/moderate'
    }
  ];

  return (
    <>
      <Head>
        <title>Dashboard | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12 w-full max-w-[1400px]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-[13px] font-medium text-slate-400 mt-1">Tổng quan hệ thống Thăng Long Forum</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-white border border-gray-200 rounded-full px-4 py-2">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
            })}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow relative overflow-hidden group">
              {/* Accent top bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />

              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl ${card.bgLight} flex items-center justify-center ${card.textColor}`}>
                  {card.icon}
                </div>
                {card.link && (
                  <Link href={card.link} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-slate-400 hover:text-blue-500" />
                  </Link>
                )}
              </div>
              <div>
                <h2 className="text-[26px] font-extrabold text-slate-900 leading-none tracking-tight">{card.value}</h2>
                <p className="text-[12px] font-semibold text-slate-400 mt-1.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Activity Chart - 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" strokeWidth={3} />
                <h2 className="text-[15px] font-bold text-slate-800">Hoạt động 14 ngày gần nhất</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                Câu hỏi mới / ngày
              </span>
            </div>

            {questionStats.length > 0 ? (
              <div className="flex-1 min-h-[200px] flex items-end gap-1.5 px-1">
                {questionStats.map((d: any, i: number) => {
                  const pct = Math.max(Math.round((d.count / maxQ) * 100), 4);
                  const isToday = i === questionStats.length - 1;
                  return (
                    <div key={i} className="flex flex-col items-center justify-end w-full h-[200px] relative group">
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                        {d.count}
                        {' '}
                        câu hỏi
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                      </div>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          isToday
                            ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm'
                            : 'bg-blue-200 group-hover:bg-blue-400'
                        }`}
                      />
                      <span className={`text-[9px] font-bold mt-2 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {formatDate(d.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-medium min-h-[200px]">
                Chưa có dữ liệu
              </div>
            )}
          </div>

          {/* Hot Topics - 1 col */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="w-4 h-4 text-orange-500" strokeWidth={3} />
              <h2 className="text-[15px] font-bold text-slate-800">Chủ đề hot tuần này</h2>
            </div>

            {hotTopics.length > 0 ? (
              <div className="flex flex-col gap-4 flex-1">
                {hotTopics.map((topic: any, idx: number) => {
                  const maxCount = hotTopics[0]?.count || 1;
                  const widthPct = Math.max(Math.round((topic.count / maxCount) * 100), 10);
                  const colors = [
                    { bar: 'bg-gradient-to-r from-orange-500 to-amber-400', text: 'text-orange-600', bg: 'bg-orange-50' },
                    { bar: 'bg-gradient-to-r from-blue-500 to-cyan-400', text: 'text-blue-600', bg: 'bg-blue-50' },
                    { bar: 'bg-gradient-to-r from-emerald-500 to-teal-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { bar: 'bg-gradient-to-r from-violet-500 to-purple-400', text: 'text-violet-600', bg: 'bg-violet-50' },
                    { bar: 'bg-gradient-to-r from-pink-500 to-rose-400', text: 'text-pink-600', bg: 'bg-pink-50' }
                  ];
                  const c = colors[idx % colors.length];

                  return (
                    <div key={topic._id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg ${c.bg} ${c.text} flex items-center justify-center text-[10px] font-extrabold`}>
                            {idx + 1}
                          </span>
                          <span className="text-[13px] font-bold text-slate-700 truncate max-w-[140px]">{topic.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">{topic.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${c.bar} transition-all`} style={{ width: `${widthPct}%` }} />
                      </div>
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
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Questions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-[15px] font-bold text-slate-800">Câu hỏi mới nhất</h2>
              </div>
              <Link href="/posts" className="text-[12px] font-bold text-blue-500 hover:text-blue-600 transition flex items-center gap-1">
                Xem tất cả
                {' '}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100/80">
              {recentQuestions.length > 0 ? recentQuestions.map((q: any) => (
                <div key={q._id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{q.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {q.userId?.name || 'Ẩn danh'}
                        </span>
                        {q.topicId && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                            {q.topicId.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {' '}
                        {q.answerCount || 0}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{getTimeDiff(q.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-sm text-slate-400">Chưa có câu hỏi nào</div>
              )}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-100" />
                <h2 className="text-[15px] font-bold text-slate-800">Top đóng góp</h2>
              </div>
              <Link href="/stats" className="text-[12px] font-bold text-blue-500 hover:text-blue-600 transition flex items-center gap-1">
                Xem chi tiết
                {' '}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100/80">
              {topContributors.length > 0 ? topContributors.map((user: any, idx: number) => {
                const medals = [
                  <div key="g" className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                    <Medal className="w-4 h-4 text-white" />
                  </div>,
                  <div key="s" className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-sm">
                    <Medal className="w-4 h-4 text-white" />
                  </div>,
                  <div key="b" className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-sm">
                    <Medal className="w-4 h-4 text-white" />
                  </div>
                ];
                const avatarColors = ['bg-teal-500', 'bg-indigo-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];

                return (
                  <div key={user._id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-center gap-4">
                    <div className="shrink-0">
                      {idx < 3 ? medals[idx] : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-extrabold text-slate-500">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                      {(user.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {user.role === 'teacher' ? 'Giảng viên' : user.role === 'admin' ? 'Admin' : 'Sinh viên'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-extrabold text-slate-800">{user.answerCount}</p>
                      <p className="text-[10px] font-semibold text-slate-400">câu trả lời</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-6 py-8 text-center text-sm text-slate-400">Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
