import React from "react";
import ReactApexChart from "react-apexcharts";

const HabitHeatmap = ({ habitLogs = {} }) => {
  const series = [
    { name: "Sun", data: [] }, { name: "Mon", data: [] }, { name: "Tue", data: [] },
    { name: "Wed", data: [] }, { name: "Thu", data: [] }, { name: "Fri", data: [] }, { name: "Sat", data: [] },
  ];

  // Ensure absolute local dates without timezone shifting
  const getLocalDateStr = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Anchor the grid to the Sunday of the current week
  const currentDayOfWeek = now.getDay();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - currentDayOfWeek);

  // Go back 11 more weeks to get a perfect 12-week grid
  const startOfGrid = new Date(startOfThisWeek);
  startOfGrid.setDate(startOfGrid.getDate() - (11 * 7));

  // Loop through exactly 84 perfectly aligned days
  for (let i = 0; i < 84; i++) {
    const d = new Date(startOfGrid);
    d.setDate(d.getDate() + i);

    const dateStr = getLocalDateStr(d);
    const dayOfWeek = d.getDay();
    const weekIndex = Math.floor(i / 7);

    const logs = habitLogs[dateStr] || {};
    const count = Object.values(logs).filter(Boolean).length;

    // If the date is later this week (hasn't happened yet), set to 0
    const yVal = d > now ? 0 : count;

    series[dayOfWeek].data.push({ x: `W${weekIndex + 1}`, y: yVal });
  }

  const options = {
    chart: { height: 250, type: "heatmap", toolbar: { show: false }, background: 'transparent' },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5, radius: 4, useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 2, color: "#1A1A1A", name: "0-2" },
            { from: 3, to: 5, color: "#004d00", name: "3-5" },
            { from: 6, to: 7, color: "#008000", name: "6-7" },
            { from: 8, to: 100, color: "#00ff00", name: "8+" }
          ]
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#121212"] },
    theme: { mode: 'dark' },
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: "#888888", fontSize: "12px", fontFamily: "Inter, sans-serif" } } }
  };

  return (
    <div className="bg-[#121212] rounded-xl p-6 shadow-lg border border-gray-800 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-200 font-semibold text-lg">Habit Completion Heatmap (Habit Tracker)</h3>
        <span className="text-xs text-gray-500">Last 12 Weeks</span>
      </div>
      <ReactApexChart options={options} series={series} type="heatmap" height={250} />
      <div className="flex items-center text-xs text-gray-500 mt-2 space-x-2">
        <span>Less</span>
        <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-[#1A1A1A] rounded-sm"></div><span>0-2</span></div>
        <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-[#004d00] rounded-sm"></div><span>3-5</span></div>
        <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-[#008000] rounded-sm"></div><span>6-7</span></div>
        <div className="flex items-center space-x-1"><div className="w-3 h-3 bg-[#00ff00] rounded-sm"></div><span>8+</span></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HabitHeatmap;