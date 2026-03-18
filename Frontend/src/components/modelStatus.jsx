import React from "react";
import { FiSearch } from "react-icons/fi";
import { User } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export default function ModelStatus() {
  // Top cards
  const metrics = [
    {
      title: "Overall Accuracy",
      value: "97.8%",
      note: "+0.6% this week",
      noteColor: "text-emerald-600",
      valueColor: "text-blue-600",
      icon: "wave",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Response Time",
      value: "28ms",
      note: "Excellent",
      noteColor: "text-emerald-600",
      valueColor: "text-slate-900",
      icon: "speed",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "FPS",
      value: "30",
      note: "Stable",
      noteColor: "text-slate-500",
      valueColor: "text-slate-900",
      icon: "chip",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "System Health",
      value: "Good",
      note: "All systems operational",
      noteColor: "text-slate-500",
      valueColor: "text-emerald-500",
      icon: "check",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  // Charts data
  const accuracyData = [
    { day: "Mon", acc: 95.2 },
    { day: "Tue", acc: 96.1 },
    { day: "Wed", acc: 94.8 },
    { day: "Thu", acc: 97.2 },
    { day: "Fri", acc: 98.0 },
    { day: "Sat", acc: 97.7 },
    { day: "Sun", acc: 98.4 },
  ];

  const charData = [
    { ch: "A", val: 98, tone: "good" },
    { ch: "B", val: 96, tone: "mid" },
    { ch: "C", val: 94, tone: "bad" },
    { ch: "D", val: 97, tone: "good" },
    { ch: "E", val: 99, tone: "good" },
    { ch: "F", val: 95, tone: "mid" },
    { ch: "G", val: 93, tone: "bad" },
    { ch: "H", val: 97, tone: "good" },
  ];

  const barFill = (tone) => {
    if (tone === "good") return "#34d399"; // green
    if (tone === "bad") return "#ef4444"; // red
    return "#4f7cff"; // blue
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between ' >
                    <div className='flex flex-col text-left' >
                        <span className='text-2xl font-medium'>Model Status</span>
                        <h4 className='text-gray-700 text-sm w-full'>AI model performance and system health</h4>
                    </div>
                    {/* search */}
                    <div className='flex justify-between items-center'>
                        <div className='relative flex  items-center'>
                        <FiSearch className='absolute left-1' size={16} />
                        <input type="text" placeholder='search...' className='text-sm border h-8 pl-8 w-23 rounded-md md:w-auto'/>
                    </div>
                    <User onClick={()=>{navigate('/dashboard/settings')}} size={20} className='text-gray-800 ml-4 cursor-pointer' />
                    
                    </div>
                  </nav>
            

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* TOP CARDS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {m.title}
                  </p>

                  <p
                    className={`mt-2 text-4xl font-extrabold ${m.valueColor}`}
                  >
                    {m.value}
                  </p>

                  <p className={`mt-2 text-sm font-semibold ${m.noteColor}`}>
                    {m.title === "Overall Accuracy" ? "↗ " : ""}
                    {m.note}
                  </p>
                </div>

                <div
                  className={`h-12 w-12 rounded-2xl ${m.iconBg} flex items-center justify-center`}
                >
                  {m.icon === "wave" && (
                    <WaveIcon className={`h-6 w-6 ${m.iconColor}`} />
                  )}
                  {m.icon === "speed" && (
                    <SpeedIcon className={`h-6 w-6 ${m.iconColor}`} />
                  )}
                  {m.icon === "chip" && (
                    <ChipIcon className={`h-6 w-6 ${m.iconColor}`} />
                  )}
                  {m.icon === "check" && (
                    <CheckIcon className={`h-6 w-6 ${m.iconColor}`} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS ROW */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Accuracy Trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Accuracy Trend
            </h2>
            <p className="mt-1 text-slate-500">
              Weekly model accuracy performance
            </p>

            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="acc"
                    stroke="#4f7cff"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Character Recognition */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Character Recognition
            </h2>
            <p className="mt-1 text-slate-500">
              Per-character accuracy breakdown
            </p>

            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" />
                  <XAxis dataKey="ch" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip />
                  <Bar dataKey="val" radius={[8, 8, 0, 0]}>
                    {charData.map((d, i) => (
                      <Cell key={i} fill={barFill(d.tone)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Icons ---------------- */

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WaveIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 12h4l2-6 4 12 2-6h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpeedIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M20 13a8 8 0 10-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 13l4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 17.5h11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChipIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M9 9h6v6H9V9z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 9h2M4 12h2M4 15h2M18 9h2M18 12h2M18 15h2M9 4v2M12 4v2M15 4v2M9 18v2M12 18v2M15 18v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 12.5l2.2 2.2L15.8 9.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
