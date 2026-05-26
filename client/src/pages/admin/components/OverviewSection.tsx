import React from 'react';
import {
  DollarSign, Users, Gavel, TrendingUp, ShoppingCart
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';

interface OverviewSectionProps {
  stats: any;
}

// --- Garde ton KPICard existant ici ---
const KPICard = ({ title, value, trend, isPositive, icon: Icon, color }: any) => (
  <div className="bg-[#080B12] p-4 rounded-2xl border border-white/5">
    <div className="flex items-center justify-between mb-2">
      <Icon size={16} className={`text-${color}-500`} />
      <span className={`text- font-bold ${isPositive? 'text-green-400' : 'text-red-400'}`}>{trend}</span>
    </div>
    <p className="text- text-slate-500 uppercase">{title}</p>
    <p className="text-white font-bold text-lg">{value}</p>
  </div>
);

export default function OverviewSection({ stats }: OverviewSectionProps) {
  const salesData = stats.salesData || [
    { name: 'Lun', revenue: 2400 },
    { name: 'Mar', revenue: 1398 },
    { name: 'Mer', revenue: 9800 },
    { name: 'Jeu', revenue: 3908 },
    { name: 'Ven', revenue: 4800 },
  ];

  const inventoryData = stats.inventoryData || [
    { name: 'En stock', stock: 400, color: '#22c55e' },
    { name: 'Faible', stock: 150, color: '#f59e0b' },
    { name: 'Rupture', stock: 80, color: '#ef4444' },
  ];

  const totalOrders = stats.totalOrders || 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-6 min-w-0">

      {/* 1. KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-amber-500" size={16} />
          <h3 className="text-white font-black uppercase text- tracking-widest">Marketplace</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <KPICard title="GMV Jour" value={`${(stats.dailyRevenue || 0).toLocaleString()} FCFA`} trend="+12%" isPositive={true} icon={DollarSign} color="amber" />
          <KPICard title="Commandes" value={totalOrders} trend="+8" isPositive={true} icon={ShoppingCart} color="blue" />
          <KPICard title="Vendeurs" value={stats.vendors || stats.users || 0} trend="+3" isPositive={true} icon={Users} color="purple" />
          <KPICard title="Litiges" value={stats.openDisputes || 0} trend="-2" isPositive={false} icon={Gavel} color="red" />
        </div>
      </section>

      {/* 2. REVENUS + STOCK */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">

        {/* GMV - AreaChart */}
        <div className="xl:col-span-2 bg-[#080B12] p-4 md:p-6 rounded-3xl border border-white/5 min-w-0">
          <h3 className="text-white font-bold text-sm mb-4">GMV Marketplace</h3>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1219',
                    borderRadius: '12px',
                    border: '1px solid #ffffff10',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#colorRev)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STOCK - PieChart CORRIGÉ */}
        <div className="bg-[#080B12] p-4 md:p-6 rounded-3xl border border-white/5 min-w-0">
          <h3 className="text-white font-bold text-sm mb-4">Stock</h3>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="stock"
                  stroke="none"
                >
                  {inventoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1219',
                    borderRadius: '12px',
                    border: '1px solid #ffffff10',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>
    </div>
  );
}