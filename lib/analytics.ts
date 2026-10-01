import type { AppData } from './types';
type Interval = [number, number];
function union(intervals: Interval[]): Interval[] { const sorted = intervals.filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]); const result: Interval[] = []; for (const interval of sorted) { const last = result[result.length - 1]; if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]); else result.push([...interval]); } return result; }
function subtract(base: Interval, blocked: Interval[]): Interval[] { let segments = [base]; for (const [start, end] of blocked) segments = segments.flatMap(([a, b]) => end <= a || start >= b ? [[a, b] as Interval] : [...(start > a ? [[a, Math.min(start, b)] as Interval] : []), ...(end < b ? [[Math.max(end, a), b] as Interval] : [])]); return segments; }
const hoursOf = (intervals: Interval[]) => intervals.reduce((sum, [start, end]) => sum + (end - start) / 3600000, 0);
export function calculateAnalytics(data: AppData, windowDays = 60) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const windowEnd = +new Date(`${day}T00:00:00+05:00`), windowStart = windowEnd - windowDays * 86400000;
  const departmentScoped = data.profile?.role === 'Coordinator';
  const labs = data.labs.filter(lab => !departmentScoped || lab.department_id === data.profile?.department_id);
  const equipment = data.equipment.filter(item => !departmentScoped || labs.some(lab => lab.id === item.lab_id));
  const bookingDepartment = (booking: AppData['bookings'][number]) => data.labs.find(lab => lab.id === booking.lab_id)?.department_id || data.labs.find(lab => lab.id === data.equipment.find(item => booking.booking_items.some(i => i.equipment_id === item.id))?.lab_id)?.department_id || booking.profiles?.department_id;
  const bookings = data.bookings.filter(booking => +new Date(booking.start_at) >= windowStart && +new Date(booking.start_at) < windowEnd && (!departmentScoped || bookingDepartment(booking) === data.profile?.department_id));
  const ids = new Set(bookings.map(b => b.id));
  const issues = data.issues.filter(issue => ids.has(issue.booking_id));
  bookings.sort((a,b)=>+new Date(a.start_at)-+new Date(b.start_at));
  const monthly = new Map<string, number>(), peak = new Map<string, number>(), departments = new Map<string, number>(), rejectionReasons = new Map<string, number>();
  for (const booking of bookings) {
    const month = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', month: 'short', year: '2-digit' }).format(new Date(booking.start_at)); monthly.set(month, (monthly.get(month) || 0) + 1);
    const hour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', hourCycle: 'h23' }).format(new Date(booking.start_at)); peak.set(hour, (peak.get(hour) || 0) + 1);
    const department = data.departments.find(d => d.id === bookingDepartment(booking))?.name || 'Unassigned'; departments.set(department, (departments.get(department) || 0) + 1);
    if (booking.booking_status === 'Rejected') { const reason = booking.decision_reason?.trim() || 'No reason recorded'; rejectionReasons.set(reason, (rejectionReasons.get(reason) || 0) + 1); }
  }
  const utilization = labs.map(lab => {
    const blocks = union(data.blocks.filter(block => block.lab_id === lab.id).map(block => [+new Date(block.start_at), +new Date(block.end_at)]));
    const open: Interval[] = [];
    // Reporting hours define the denominator, not a new booking restriction.
    if (!lab.archived && lab.status === 'Available') for (let dayStart = windowStart; dayStart < windowEnd; dayStart += 86400000) open.push(...subtract([dayStart + 9 * 3600000, dayStart + 18 * 3600000], blocks));
    const bookedIntervals = union(data.bookings.filter(b => b.lab_id === lab.id && b.approval_status === 'Approved' && !['Cancelled', 'Rejected'].includes(b.booking_status)).flatMap(b => open.map(([start, end]) => [Math.max(start, +new Date(b.start_at)), Math.min(end, +new Date(b.end_at))] as Interval)));
    const availableHours = hoursOf(open), bookedHours = hoursOf(bookedIntervals);
    return { id: lab.id, name: lab.name, availableHours: Math.round(availableHours * 10) / 10, bookedHours: Math.round(bookedHours * 10) / 10, utilization: availableHours ? Math.round(bookedHours / availableHours * 1000) / 10 : 0, bookings: bookings.filter(b => b.lab_id === lab.id).length };
  });
  return {
    windowDays, windowStart: new Date(windowStart).toISOString(), windowEnd: new Date(windowEnd).toISOString(),
    utilizationDefinition: `Last ${windowDays} completed days, 09:00–18:00 Asia/Karachi daily; recorded overlapping lab blocks are excluded once. Only currently operational, unarchived labs form the denominator. Historical closure intervals cannot be inferred from a current status.`,
    total: bookings.length, approved: bookings.filter(b => b.approval_status === 'Approved').length, pending: bookings.filter(b => b.booking_status === 'Pending Approval').length, cancelled: bookings.filter(b => b.booking_status === 'Cancelled').length,
    issued: issues.reduce((sum, issue) => sum + issue.quantity, 0), overdue: data.issues.filter(issue => !issue.returned_at && +new Date(issue.due_at) < Date.now() && (!departmentScoped || equipment.some(e => e.id === issue.equipment_id))).reduce((sum, issue) => sum + issue.quantity - (issue.returned_quantity || 0), 0), damaged: issues.filter(i => i.return_condition === 'Damaged').length,
    monthly: [...monthly].map(([name, bookings]) => ({ name, bookings })), peakHours: [...peak].sort(([a], [b]) => a.localeCompare(b)).map(([name, bookings]) => ({ name: `${name}:00`, bookings })), departments: [...departments].map(([name, bookings]) => ({ name, bookings })),
    labUsage: utilization.map(lab => ({ name: lab.name, bookings: lab.bookings })).sort((a, b) => b.bookings - a.bookings), utilization, underusedLabs: utilization.filter(lab => lab.availableHours > 0).sort((a, b) => a.utilization - b.utilization), rejectionReasons: [...rejectionReasons].map(([name, bookings]) => ({ name, bookings })).sort((a, b) => b.bookings - a.bookings),
    equipmentUsage: equipment.map(e => ({ name: e.name, quantity: issues.filter(i => i.equipment_id === e.id).reduce((sum, i) => sum + i.quantity, 0) })).sort((a, b) => b.quantity - a.quantity),
    demandForecast: utilization.filter(lab => lab.bookings > 0).sort((a, b) => b.bookings - a.bookings).slice(0, 3).map(lab => ({ name: lab.name, bookings: lab.bookings, signal: lab.utilization >= 60 ? 'High utilization' : 'Highest recent demand' })),
    maintenanceRecommendations: equipment.filter(item => item.maintenance_status || item.condition === 'Damaged' || issues.some(issue => issue.equipment_id === item.id && issue.return_condition === 'Damaged')).map(item => ({ name: item.name, reason: item.maintenance_status ? 'Marked in maintenance' : item.condition === 'Damaged' ? 'Current condition is damaged' : 'Damage recorded in this reporting window' })),
  };
}

