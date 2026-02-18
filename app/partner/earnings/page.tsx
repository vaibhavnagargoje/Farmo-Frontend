"use client"

import { PartnerLayout } from "@/components/partner-layout"

const earningsData = { today: 5400, thisWeek: 24500, thisMonth: 87200, totalJobs: 156 }
const transactions = [
  { id: "1", type: "credit", job: "Ploughing - 4 Acres", farmer: "Ramesh Kumar", amount: 3200, date: "Today, 4:30 PM" },
  { id: "2", type: "credit", job: "Rotavator Work - 2 Acres", farmer: "Amit Singh", amount: 1800, date: "Today, 11:00 AM" },
  { id: "3", type: "withdrawal", job: "Bank Transfer", farmer: "To HDFC ****4521", amount: -5000, date: "Yesterday" },
  { id: "4", type: "credit", job: "Harvesting - 5 Acres", farmer: "Suresh Sharma", amount: 4500, date: "Yesterday" },
  { id: "5", type: "credit", job: "Spraying - 3 Acres", farmer: "Rajesh Verma", amount: 1200, date: "2 days ago" },
  { id: "6", type: "credit", job: "Ploughing - 2 Acres", farmer: "Vijay Kumar", amount: 1600, date: "3 days ago" },
]
const weeklyEarnings = [
  { day: "Mon", amount: 3200 }, { day: "Tue", amount: 4500 }, { day: "Wed", amount: 2800 },
  { day: "Thu", amount: 5100 }, { day: "Fri", amount: 3800 }, { day: "Sat", amount: 5100 }, { day: "Sun", amount: 0 },
]
const maxEarning = Math.max(...weeklyEarnings.map((d) => d.amount))

export default function EarningsPage() {
  return (
    <PartnerLayout pageTitle="Earnings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">today</span>
                <span className="text-xs font-semibold text-muted uppercase">Today</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">₹{earningsData.today.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-500 text-[20px]">date_range</span>
                <span className="text-xs font-semibold text-muted uppercase">This Week</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">₹{earningsData.thisWeek.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-green-500 text-[20px]">calendar_month</span>
                <span className="text-xs font-semibold text-muted uppercase">This Month</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">₹{earningsData.thisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl p-4 lg:p-5 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-orange-500 text-[20px]">work</span>
                <span className="text-xs font-semibold text-muted uppercase">Total Jobs</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{earningsData.totalJobs}</p>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-foreground">Weekly Earnings</h3>
              <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm">
                <option>This Week</option><option>Last Week</option><option>Last Month</option>
              </select>
            </div>
            <div className="flex items-end justify-between gap-2 lg:gap-3 h-32 lg:h-48">
              {weeklyEarnings.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1 lg:gap-2">
                  <div className="w-full bg-muted/20 rounded-t-lg relative" style={{ height: "100%" }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all" style={{ height: `${(day.amount / maxEarning) * 100}%` }}></div>
                  </div>
                  <span className="text-[10px] lg:text-xs font-medium text-muted">{day.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between px-5 lg:px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Recent Transactions</h3>
              <button className="text-primary text-sm font-semibold">View All</button>
            </div>
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 lg:px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                      <span className="material-symbols-outlined text-[20px]">{tx.type === "credit" ? "arrow_downward" : "arrow_upward"}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{tx.job}</p>
                      <p className="text-xs text-muted">{tx.farmer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`}>{tx.type === "credit" ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Balance Card */}
          <div className="bg-navy rounded-2xl p-6 text-white">
            <p className="text-blue-200 text-sm font-medium">Available Balance</p>
            <p className="text-3xl font-black mt-2">₹{earningsData.thisMonth.toLocaleString()}</p>
            <button className="w-full mt-6 py-3 bg-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors">Withdraw to Bank</button>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-blue-200">Bank Account</p>
              <p className="text-sm font-medium mt-1">HDFC Bank ****4521</p>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-foreground mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between"><span className="text-muted text-sm">Completion Rate</span><span className="font-bold text-foreground">98%</span></div>
                <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden mt-1"><div className="h-full bg-success rounded-full" style={{ width: "98%" }}></div></div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted text-sm">Average Rating</span>
                <div className="flex items-center gap-1"><span className="material-symbols-outlined text-yellow-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span><span className="font-bold text-foreground">4.9</span></div>
              </div>
              <div className="flex items-center justify-between pt-2"><span className="text-muted text-sm">Jobs This Month</span><span className="font-bold text-foreground">24</span></div>
            </div>
          </div>

          {/* Export */}
          <button className="flex items-center justify-center gap-2 w-full py-3 bg-card border border-border rounded-2xl font-medium text-sm hover:bg-muted/50 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>Export Report
          </button>
        </div>
      </div>
    </PartnerLayout>
  )
}
