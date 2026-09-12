import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, BarChart2 } from 'lucide-react';

export default function DashboardAnalytics({ attendees, eventCheckpoints }) {
  // Generate time-series data from attendee scan times
  const timeSeriesData = useMemo(() => {
    if (!attendees || attendees.length === 0) return [];
    
    // Flatten all scans
    const allScans = [];
    attendees.forEach(a => {
      a.checkpointStatuses?.forEach(cs => {
        if (cs.status && cs.scannedAt) {
          allScans.push({ time: new Date(cs.scannedAt).getTime() });
        }
      });
    });

    if (allScans.length === 0) return [];

    allScans.sort((a, b) => a.time - b.time);
    const startTime = allScans[0].time;
    const endTime = allScans[allScans.length - 1].time;
    
    // Group into 10 intervals
    const interval = Math.max((endTime - startTime) / 10, 60000); // min 1 minute
    
    const buckets = [];
    let currentTime = startTime;
    for (let i = 0; i <= 10; i++) {
      buckets.push({
        timeLabel: new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scans: 0,
        endTime: currentTime + interval
      });
      currentTime += interval;
    }

    allScans.forEach(scan => {
      const bucket = buckets.find(b => scan.time < b.endTime) || buckets[buckets.length - 1];
      bucket.scans += 1;
    });

    return buckets;
  }, [attendees]);

  // Generate Checkpoint Drop-off data
  const dropoffData = useMemo(() => {
    if (!eventCheckpoints || eventCheckpoints.length === 0) return [];
    return eventCheckpoints.map(cp => {
      const count = attendees.filter(a => a.checkpointStatuses?.find(cs => cs.checkpointId === cp.id)?.status).length;
      return {
        name: cp.name,
        count
      };
    });
  }, [attendees, eventCheckpoints]);

  if (timeSeriesData.length === 0) {
    return null; // Don't show charts if no data
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Attendance Velocity Chart */}
      <div className="lg:col-span-2 card p-5 bg-white border border-slate-300 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#8B151B]" />
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Activity size={16} className="text-[#8B151B]" />
              Gate Scan Velocity (Scans / Minute)
            </h3>
            <p className="text-[0.72rem] text-slate-500 font-medium">Real-time attendance throughput across campus gates</p>
          </div>
          <div className="px-2 py-0.5 bg-red-50 border border-red-200 rounded text-[0.68rem] font-bold text-[#8B151B] uppercase">
            Live Stream
          </div>
        </div>
        
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B151B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#8B151B" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '4px', color: '#0F172A', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                itemStyle={{ color: '#8B151B', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="scans" stroke="#8B151B" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Checkpoint Funnel Stats */}
      <div className="card p-5 bg-white border border-slate-300 shadow-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C59B27]" />

        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
            <BarChart2 size={16} className="text-[#C59B27]" />
            Checkpoint Distribution
          </h3>
          <p className="text-[0.72rem] text-slate-500 font-medium">Headcount admitted at each designated gate</p>
        </div>
        
        <div className="flex-1 space-y-3.5">
          {dropoffData.map((d) => {
            const max = Math.max(...dropoffData.map(x => x.count), 1);
            const pct = (d.count / max) * 100;
            return (
              <div key={d.name} className="relative">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">{d.name}</span>
                  <span className="text-slate-900 font-bold">{d.count} checked in</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded overflow-hidden border border-slate-200">
                  <div 
                    className="h-full rounded bg-[#8B151B] transition-all duration-700" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
