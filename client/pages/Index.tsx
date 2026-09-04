import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BatteryCharging,
  Bell,
  CarFront,
  ChevronDown,
  CircleGauge,
  Cpu,
  Gauge,
  Info,
  Leaf,
  MapPin,
  Menu,
  Navigation,
  Play,
  Power,
  Radio,
  Route,
  ShieldCheck,
  Thermometer,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Traffic = "Low" | "Medium" | "High";
type Road = "Highway" | "City" | "Rough";
type Load = "Light" | "Medium" | "Heavy";
type Mode = "Eco" | "Normal" | "Sport";

type Metrics = { soc: number; temp: number; power: number; range: number; efficiency: number; risk: string };

const baseHistory = [
  { time: "10:42", soc: 82, power: 14.2, temp: 29, efficiency: 128, range: 301 },
  { time: "10:47", soc: 81, power: 15.1, temp: 29.5, efficiency: 133, range: 297 },
  { time: "10:52", soc: 80, power: 16.2, temp: 30, efficiency: 137, range: 293 },
  { time: "10:57", soc: 79, power: 15.7, temp: 30.5, efficiency: 139, range: 289 },
  { time: "11:02", soc: 78, power: 16.2, temp: 32, efficiency: 142, range: 286 },
];

const navItems = ["Dashboard", "Digital Twin", "Battery", "Range prediction", "Simulation", "Alerts"];

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="control-field">
      <span>{label}</span>
      <span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></span>
    </label>
  );
}

function MetricCard({ icon: Icon, label, value, unit, trend, tone = "blue" }: { icon: typeof BatteryCharging; label: string; value: string; unit?: string; trend?: string; tone?: string }) {
  return <div className="metric-card">
    <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}<small>{unit}</small></div>
    {trend && <div className={trend.startsWith("+") ? "trend up" : "trend down"}>{trend.startsWith("+") ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{trend}</div>}
  </div>;
}

function VehicleTwin({ running }: { running: boolean }) {
  return <div className={`vehicle-stage ${running ? "is-running" : ""}`}>
    <div className="stage-grid" />
    <div className="stage-label top-label"><Radio size={12} /> LIVE SENSOR MESH</div>
    <div className="sensor sensor-a"><span />BATTERY PACK</div>
    <div className="sensor sensor-b"><span />MOTOR TEMP</div>
    <div className="sensor sensor-c"><span />GPS / 37.77° N</div>
    <svg className="vehicle-svg" viewBox="0 0 620 260" role="img" aria-label="Digital twin EV visualization">
      <defs><linearGradient id="carBody" x1="0" x2="1"><stop stopColor="#21364c" /><stop offset=".5" stopColor="#527894" /><stop offset="1" stopColor="#172939" /></linearGradient><linearGradient id="glass" x1="0" x2="1"><stop stopColor="#8dd5ea" stopOpacity=".65" /><stop offset="1" stopColor="#1d4159" stopOpacity=".8" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <ellipse cx="310" cy="215" rx="230" ry="18" fill="#51d9ff" opacity=".1" />
      <path d="M85 184c13-39 56-49 101-56l47-48c12-12 32-19 53-19h72c24 0 44 7 61 24l40 42c35 7 69 21 85 54l-2 25H88z" fill="url(#carBody)" stroke="#68d8f5" strokeWidth="2" />
      <path d="M250 72l-48 50h181l-42-50z" fill="url(#glass)" stroke="#89e4f6" strokeWidth="1.5" /><path d="M285 73v49M347 73l26 49" stroke="#9ceafa" opacity=".5" />
      <path d="M92 170h444" stroke="#8ceaff" strokeWidth="2" opacity=".7" /><path d="M160 153h78M382 153h77" stroke="#b7f6ff" strokeWidth="3" opacity=".55" />
      <circle cx="180" cy="199" r="32" fill="#08131f" stroke="#6ddcf5" strokeWidth="3" /><circle cx="180" cy="199" r="14" fill="#2b5067" /><circle cx="452" cy="199" r="32" fill="#08131f" stroke="#6ddcf5" strokeWidth="3" /><circle cx="452" cy="199" r="14" fill="#2b5067" />
      <circle className="scan-dot" cx="180" cy="125" r="5" fill="#8cffbe" filter="url(#glow)" /><circle className="scan-dot delay" cx="426" cy="147" r="5" fill="#ffe08c" filter="url(#glow)" />
    </svg>
    <div className="twin-status"><span className="pulse-dot" /> DIGITAL TWIN ONLINE <strong>·</strong> SYNCED 2s AGO</div>
  </div>;
}

export default function Index() {
  const [speed, setSpeed] = useState(60);
  const [traffic, setTraffic] = useState<Traffic>("Medium");
  const [road, setRoad] = useState<Road>("City");
  const [temperature, setTemperature] = useState(30);
  const [load, setLoad] = useState<Load>("Medium");
  const [mode, setMode] = useState<Mode>("Normal");
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState(baseHistory);

  const metrics = useMemo<Metrics>(() => {
    const factors = { traffic: { Low: .88, Medium: 1, High: 1.22 }, road: { Highway: .94, City: 1, Rough: 1.2 }, load: { Light: .94, Medium: 1, Heavy: 1.13 }, mode: { Eco: .82, Normal: 1, Sport: 1.18 } };
    const efficiency = Math.round(112 + speed * .42) * factors.traffic[traffic] * factors.road[road] * factors.load[load] * factors.mode[mode] * (temperature < 18 || temperature > 34 ? 1.08 : 1);
    const power = efficiency * speed / 1000;
    const temp = 27 + power * .28 + Math.max(0, temperature - 28) * .2;
    const soc = 78 - (running ? Math.min(4, Math.round(power / 4)) : 0);
    const range = Math.round((soc / 78) * (286 * 142 / efficiency));
    return { soc, temp, power, range, efficiency, risk: temp > 39 || power > 24 ? "Elevated" : "Low" };
  }, [speed, traffic, road, temperature, load, mode, running]);

  const runSimulation = () => {
    setRunning(true);
    setHistory((current) => [...current.slice(-4), { time: "11:07", soc: metrics.soc - 1, power: Number(metrics.power.toFixed(1)), temp: Number(metrics.temp.toFixed(1)), efficiency: metrics.efficiency, range: metrics.range }]);
  };
  const optimize = () => { setMode("Eco"); setTraffic("Low"); setSpeed(52); };

  return <div className="app-shell">
    <header className="topbar"><Link to="/" className="brand"><span className="brand-mark"><ShieldCheck size={21} /></span><span>Twin<span>Shield</span><small>EV DIGITAL TWIN</small></span></Link><nav>{navItems.map((item, index) => <a key={item} className={index === 0 ? "active" : ""} href={index === 0 ? "#dashboard" : `#${item.toLowerCase().replace(/ /g, "-")}`}>{item}</a>)}</nav><div className="top-actions"><span className="online"><i /> DIGITAL TWIN ONLINE</span><button className="icon-button mobile-menu" aria-label="Open menu"><Menu size={20} /></button><div className="avatar">AM</div></div></header>
    <main id="dashboard" className="content-wrap">
      <section className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> SIMULATED EV DATA <span className="eyebrow-separator">/</span> FLEET ALPHA-01</div><h1>Vehicle command center</h1><p>Monitor, simulate, and optimize your EV's digital twin in real time.</p></div><div className="heading-meta"><div><span>VEHICLE ID</span><strong>TS-EV-0427</strong></div><div><span>LAST SYNC</span><strong>Today, 11:02:48 AM</strong></div></div></section>
      <section className="metrics-grid"><MetricCard icon={BatteryCharging} label="Battery SOC" value={`${metrics.soc}`} unit="%" trend="-1.2%" /><MetricCard icon={ShieldCheck} label="Battery SOH" value="94" unit="%" trend="+0.4%" tone="green" /><MetricCard icon={Thermometer} label="Temperature" value={metrics.temp.toFixed(1)} unit="°C" trend="+1.8°" tone="amber" /><MetricCard icon={Zap} label="Power consumption" value={metrics.power.toFixed(1)} unit=" kW" trend="+2.1%" /><MetricCard icon={Gauge} label="Vehicle speed" value={`${speed}`} unit=" km/h" tone="purple" /><MetricCard icon={Navigation} label="Estimated range" value={`${metrics.range}`} unit=" km" trend="-5 km" tone="blue" /><MetricCard icon={Activity} label="Energy efficiency" value={`${Math.round(metrics.efficiency)}`} unit=" Wh/km" trend="+3.4%" tone="amber" /><MetricCard icon={AlertTriangle} label="Risk level" value={metrics.risk} tone={metrics.risk === "Low" ? "green" : "amber"} /></section>
      <div className="primary-grid">
        <section className="panel twin-panel" id="digital-twin"><div className="panel-heading"><div><div className="eyebrow">DIGITAL TWIN / 01</div><h2>Virtual vehicle</h2></div><span className="sync-badge"><span className="pulse-dot" /> LIVE</span></div><VehicleTwin running={running} /><div className="twin-footer"><div><Cpu size={15} /><span>MODEL STATUS <strong>HEALTHY</strong></span></div><div><MapPin size={15} /><span>LOCATION <strong>San Francisco, CA</strong></span></div><div><Timer size={15} /><span>TRIP TIME <strong>00:24:18</strong></span></div></div></section>
        <section className="panel simulation-panel" id="simulation"><div className="panel-heading"><div><div className="eyebrow">SIMULATION CONTROL</div><h2>Drive conditions</h2></div><span className="tiny-label">30–60 SEC RUN</span></div><div className="speed-control"><div><span>VEHICLE SPEED</span><strong>{speed}<small> km/h</small></strong></div><input type="range" min="20" max="120" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><div className="range-labels"><span>20</span><span>120 km/h</span></div></div><div className="control-grid"><SelectField label="TRAFFIC LEVEL" value={traffic} options={["Low", "Medium", "High"]} onChange={(v) => setTraffic(v as Traffic)} /><SelectField label="ROAD TYPE" value={road} options={["Highway", "City", "Rough"]} onChange={(v) => setRoad(v as Road)} /><SelectField label="AMBIENT TEMP" value={`${temperature}°C`} options={["10°C", "20°C", "30°C", "40°C", "45°C"]} onChange={(v) => setTemperature(Number.parseInt(v))} /><SelectField label="VEHICLE LOAD" value={load} options={["Light", "Medium", "Heavy"]} onChange={(v) => setLoad(v as Load)} /></div><div className="mode-row"><span>DRIVING MODE</span><div className="mode-switch">{(["Eco", "Normal", "Sport"] as Mode[]).map((option) => <button key={option} className={mode === option ? "selected" : ""} onClick={() => setMode(option)}>{option}</button>)}</div></div><div className="simulation-actions"><button className="primary-button" onClick={runSimulation}><Play size={16} fill="currentColor" /> RUN SIMULATION</button><button className="secondary-button" onClick={optimize}><Leaf size={16} /> OPTIMIZE ENERGY</button></div></section>
      </div>
      <section className="charts-grid" id="battery"><div className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">PERFORMANCE TELEMETRY</div><h2>Live vehicle analytics</h2></div><div className="chart-legend"><span className="legend-blue" /> SOC <span className="legend-cyan" /> POWER</div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><defs><linearGradient id="socFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4edaff" stopOpacity=".3" /><stop offset="1" stopColor="#4edaff" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="#233646" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="time" stroke="#6e8294" tickLine={false} axisLine={false} fontSize={11} /><YAxis yAxisId="left" stroke="#6e8294" tickLine={false} axisLine={false} fontSize={11} domain={[70, 85]} /><YAxis yAxisId="right" orientation="right" stroke="#6e8294" tickLine={false} axisLine={false} fontSize={11} domain={[0, 25]} /><Tooltip contentStyle={{ background: "#101d29", border: "1px solid #2d465b", borderRadius: 8, fontSize: 12 }} /><Area yAxisId="left" type="monotone" dataKey="soc" stroke="#58d9ff" strokeWidth={2} fill="url(#socFill)" /><Line yAxisId="right" type="monotone" dataKey="power" stroke="#b5c9ff" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div><div className="chart-caption"><span><strong>{metrics.soc}%</strong> current SOC</span><span><strong>{metrics.power.toFixed(1)} kW</strong> current power draw</span><span className="positive"><TrendingUp size={13} /> Within expected range</span></div></div><div className="side-stack"><div className="panel battery-health"><div className="panel-heading"><div><div className="eyebrow">BATTERY HEALTH</div><h2>Pack overview</h2></div><BatteryCharging size={19} className="muted-icon" /></div><div className="health-row"><div className="circular-progress"><div><strong>78</strong><span>% SOC</span></div></div><div className="health-details"><div><span>STATE OF HEALTH</span><strong>94.0%</strong></div><div><span>STATE OF POWER</span><strong>+82.4 kW</strong></div><div><span>CYCLE COUNT</span><strong>318 <em>/ 1,500</em></strong></div></div></div><div className="degradation"><div><span>DEGRADATION TREND</span><strong>−0.08% <small>this month</small></strong></div><div className="mini-bars">{[30, 38, 34, 47, 42, 55, 52, 61, 58, 67, 64, 72].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div></div><div className="panel range-panel" id="range-prediction"><div className="eyebrow">RANGE PREDICTION</div><div className="range-top"><div><h2>{metrics.range}<small> km</small></h2><span>AI ESTIMATE · <b>92% CONFIDENCE</b></span></div><Route size={28} /></div><div className="confidence-bar"><i style={{ width: `${Math.min(100, metrics.range / 3)}%` }} /></div><div className="range-compare"><span>Current conditions<strong>{metrics.range} km</strong></span><span>Eco potential<strong>{metrics.range + 32} km <em>+11%</em></strong></span></div></div></div></section>
      <section className="bottom-grid"><div className="panel alerts-panel" id="alerts"><div className="panel-heading"><div><div className="eyebrow">SMART MONITORING</div><h2>Active alerts</h2></div><button className="view-all">VIEW ALL <ArrowUpRight size={13} /></button></div><div className="alert-item warning"><span className="alert-icon"><Thermometer size={16} /></span><div><strong>Battery temperature rising</strong><span>Pack temperature is 2°C above baseline · Just now</span></div><b>WARNING</b></div><div className="alert-item normal"><span className="alert-icon"><ShieldCheck size={16} /></span><div><strong>Battery systems nominal</strong><span>All 96 cell groups responding within tolerance · 2m ago</span></div><b>NORMAL</b></div><div className="alert-item info-alert"><span className="alert-icon"><Info size={16} /></span><div><strong>Efficiency opportunity detected</strong><span>Switch to Eco mode to gain ~32 km range · 5m ago</span></div><b>INSIGHT</b></div></div><div className="panel recommendation"><div className="eyebrow">TWINSHIELD INSIGHT</div><div className="recommendation-icon"><Leaf size={22} /></div><h2>Protect your next<br />100 kilometers.</h2><p>Lowering speed by 8 km/h and switching to Eco mode could reduce pack load by <strong>14%</strong>.</p><button onClick={optimize} className="secondary-button">APPLY RECOMMENDATION <ArrowUpRight size={15} /></button></div></section>
      <section className="credibility"><div className="credibility-icon"><ShieldCheck size={20} /></div><div><strong>SIMULATED EV DATA</strong><p>This prototype demonstrates the Digital Twin architecture using simulated sensor data. The same architecture can later connect to real EV telemetry / CAN data.</p></div><span>v0.9.4 · ALPHA</span></section>
    </main><footer><span>© 2024 TwinShield Systems</span><span>Built for intelligent mobility <span className="footer-dot" /> <Link to="/">TwinShield platform</Link></span></footer>
  </div>;
}
