export type Role = 'Student' | 'Faculty' | 'Lab Staff' | 'Coordinator' | 'Admin';
export type BookingStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Reserved' | 'In Use' | 'Completed' | 'Rejected' | 'Cancelled' | 'Returned Late' | 'Damaged';
export interface Department { id: string; name: string; archived?: boolean }
export interface Profile { id: string; name: string; email?: string; role: Role; department_id: string | null; late_count: number; restricted_until: string | null; active?: boolean }
export interface Lab { id: string; name: string; department_id: string; capacity: number; location: string; facilities: string[]; status: string; description?: string; image_url?: string; archived?: boolean }
export interface Equipment { id: string; name: string; category: string; total_quantity: number; lab_id: string | null; condition: string; maintenance_status: boolean; unit_value_high: boolean; description?: string; image_url?: string; archived?: boolean }
export interface BookingItem { equipment_id: string; quantity: number; equipment?: Equipment }
export interface Booking { id: string; user_id: string; lab_id: string | null; start_at: string; end_at: string; purpose: string; attendees: number; booking_status: BookingStatus; approval_status: string; approved_by?: string; priority: number; decision_reason?: string; notes?: string; created_at: string; booking_items: BookingItem[]; labs?: Lab; profiles?: Profile }
export interface IssueReturn { id: string; booking_id: string; equipment_id: string; quantity: number; issued_at: string; due_at: string; returned_at: string | null; returned_quantity?: number; return_condition?: string; remarks?: string; damage_note?: string }
export interface ResourceBlock { id: string; lab_id: string | null; equipment_id: string | null; start_at: string; end_at: string; reason: string }
export interface Notification { id: string; user_id: string; message: string; read: boolean; created_at: string; category?: string }
export interface Rule { key: string; value: unknown }
export interface AuditEntry { id: string; actor: string; action: string; entity: string; created_at: string; before_data?: unknown; after_data?: unknown }
export interface AppData { profile: Profile | null; labs: Lab[]; equipment: Equipment[]; departments: Department[]; categories?: Department[]; bookings: Booking[]; availability: Pick<Booking, 'id' | 'lab_id' | 'start_at' | 'end_at' | 'booking_status' | 'booking_items'>[]; issues: IssueReturn[]; inventoryCustody?: Pick<IssueReturn, 'booking_id' | 'equipment_id' | 'quantity' | 'returned_quantity' | 'due_at' | 'returned_at'>[]; blocks: ResourceBlock[]; notifications: Notification[]; rules: Rule[]; users: Profile[]; audit: AuditEntry[]; configurationError?: string }
export interface BookingInput { lab_id: string | null; start_at: string; end_at: string; purpose: string; attendees: number; items: BookingItem[]; notes: string }
export interface Alternative { lab: Lab | null; start_at: string; end_at: string; items: BookingItem[]; score: number; reduced: boolean; explanation: string; contributions: { capacity: number; department: number; equipment: number; time: number } }
export interface ActionResult { success: boolean; message: string; error?: string; bookingId?: string; alternatives?: Alternative[] }
