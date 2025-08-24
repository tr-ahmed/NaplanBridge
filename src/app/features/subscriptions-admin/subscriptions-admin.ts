import { Component } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';


type Interval = 'month' | 'year';
type PlanStatus = 'Active' | 'Archived';
type SubStatus = 'Active' | 'Past Due' | 'Canceled' | 'Trialing';
type PaymentStatus = 'Paid' | 'Refunded' | 'Failed' | 'Pending';
type CouponStatus = 'Active' | 'Expired' | 'Scheduled';

interface Plan {
  id: number;
  name: string;
  price: number;
  interval: Interval;
  trialDays?: number;
  status: PlanStatus;
  features?: string[]; // stored array
}

interface Subscription {
  id: number;
  userId: number;
  planId: number;
      userName?: string;

  startDate: string | Date;
  renewalDate: string | Date;
  status: SubStatus;
  notes?: string;

  
}

interface Payment {
  id: number;
  invoiceNo: string;
  userId: number;
  userName?: string;
  amount: number;
  method: 'Card' | 'Bank Transfer' | 'Cash';
  date: string | Date;
  status: PaymentStatus;
  txnId?: string;
}

interface Coupon {
  id: number;
  code: string;
  type: 'Percent' | 'Fixed';
  value: number;
  maxUses?: number;
  validFrom: string | Date;
  validTo: string | Date;
  status: CouponStatus;
}

interface UserMini {
  id: number;
  name: string;
}

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe, // <-- Add this line
RouterModule  ],
  templateUrl: './subscriptions-admin.html',
  styleUrls: ['./subscriptions-admin.scss']
})
export class SubscriptionManagementComponent {
  currencyCode = 'USD';
userName: string = 'Admin';
  sidebarCollapsed = false;
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  // Tabs
  activeTab: 'plans'|'subs'|'payments'|'coupons' = 'plans';
  setActiveTab(t: any){ this.activeTab = t; this.onFilterChange(); }

  // Data (replace with API calls)
  plans: Plan[] = [
    { id:1, name:'Basic', price:9.99, interval:'month', trialDays:7, status:'Active', features:['Videos','Quizzes'] },
    { id:2, name:'Pro', price:99, interval:'year', status:'Active', features:['Everything in Basic','Downloadables'] },
    { id:3, name:'Legacy', price:5, interval:'month', status:'Archived', features:['Videos'] },
  ];
  users: UserMini[] = [
    {id:1,name:'Sara Ali'},{id:2,name:'Omar Khan'},{id:3,name:'John Smith'}
  ];
  subs: Subscription[] = [
    { id:11, userId:1,userName:'Sara Ali', planId:2, startDate:new Date('2024-08-01'), renewalDate:new Date('2025-08-01'), status:'Active' },
    { id:12, userId:2,userName:'Omar Khan', planId:1, startDate:new Date('2025-05-10'), renewalDate:new Date('2025-06-10'), status:'Past Due', notes:'Payment failed last cycle' },
  ];
  payments: Payment[] = [
    { id:101, invoiceNo:'INV-1001', userId:1, userName:'Sara Ali', amount:99, method:'Card', date:new Date(), status:'Paid', txnId:'ch_abc123' },
    { id:102, invoiceNo:'INV-1002', userId:2, userName:'Omar Khan', amount:9.99, method:'Card', date:new Date(), status:'Failed', txnId:'ch_def456' },
  ];
  coupons: Coupon[] = [
    { id:201, code:'SPRING25', type:'Percent', value:25, validFrom:new Date('2025-03-01'), validTo:new Date('2025-03-31'), status:'Expired' },
    { id:202, code:'ANNUAL50', type:'Fixed', value:50, validFrom:new Date('2025-01-01'), validTo:new Date('2025-12-31'), status:'Active', maxUses:200 },
  ];

  // Stats
  stats = {
    plans: this.plans.length,
    activeSubs: this.subs.filter(s => s.status==='Active' || s.status==='Trialing').length,
    invoices30d: this.payments.length,
    revenue30d: this.payments.filter(p=>p.status==='Paid').reduce((a,b)=>a+b.amount,0)
  };

  // Filters / search
  filters = {
    planStatus: '' as ''|PlanStatus,
    interval: '' as ''|Interval,
    subStatus: '' as ''|SubStatus,
    planId: null as number|null,
    paymentStatus: '' as ''|PaymentStatus,
    method: '' as ''|'Card'|'Bank Transfer'|'Cash',
    couponStatus: '' as ''|CouponStatus,
  };
  search = { plans:'', subs:'', payments:'', coupons:'' };

  // Paging
  pageSize = 10;
  planPage=1; subPage=1; paymentPage=1; couponPage=1;

  // Derived (filtered + paged)
  filtered = { plans: [] as Plan[], subs: [] as Subscription[], payments: [] as Payment[], coupons: [] as Coupon[] };
  paged    = { plans: [] as Plan[], subs: [] as Subscription[], payments: [] as Payment[], coupons: [] as Coupon[] };

  // Ranges for footer
  get pStart(){ return this.rangeStart(this.planPage, this.filtered.plans.length); }
  get pEnd(){   return this.rangeEnd(this.planPage, this.filtered.plans.length); }
  get sStart(){ return this.rangeStart(this.subPage, this.filtered.subs.length); }
  get sEnd(){   return this.rangeEnd(this.subPage, this.filtered.subs.length); }
  get payStart(){ return this.rangeStart(this.paymentPage, this.filtered.payments.length); }
  get payEnd(){   return this.rangeEnd(this.paymentPage, this.filtered.payments.length); }
  get cStart(){ return this.rangeStart(this.couponPage, this.filtered.coupons.length); }
  get cEnd(){   return this.rangeEnd(this.couponPage, this.filtered.coupons.length); }

  get planTotalPages(){ return Math.max(1, Math.ceil(this.filtered.plans.length/this.pageSize)); }
  get subTotalPages(){ return Math.max(1, Math.ceil(this.filtered.subs.length/this.pageSize)); }
  get paymentTotalPages(){ return Math.max(1, Math.ceil(this.filtered.payments.length/this.pageSize)); }
  get couponTotalPages(){ return Math.max(1, Math.ceil(this.filtered.coupons.length/this.pageSize)); }

  constructor(public authService: AuthService){ 
    this.onFilterChange();
  }

  // Helpers
  rangeStart(page:number,total:number){ return total? (page-1)*this.pageSize+1 : 0; }
  rangeEnd(page:number,total:number){ return Math.min(page*this.pageSize, total); }
  goPlanPage(p:number){ this.planPage = Math.min(Math.max(1,p), this.planTotalPages); this.sliceData(); }
  goSubPage(p:number){ this.subPage = Math.min(Math.max(1,p), this.subTotalPages); this.sliceData(); }
  goPaymentPage(p:number){ this.paymentPage = Math.min(Math.max(1,p), this.paymentTotalPages); this.sliceData(); }
  goCouponPage(p:number){ this.couponPage = Math.min(Math.max(1,p), this.couponTotalPages); this.sliceData(); }

  getPlanName(id:number){ return this.plans.find(x=>x.id===id)?.name || '-'; }
  getUserName(id:number){ return this.users.find(x=>x.id===id)?.name || '-'; }

  // Filter + pagination recompute
  onFilterChange(){
    // Plans
    this.filtered.plans = this.plans.filter(p=>{
      const s = this.search.plans.toLowerCase();
      const okText = !s || p.name.toLowerCase().includes(s);
      const okStatus = !this.filters.planStatus || p.status===this.filters.planStatus;
      const okInterval = !this.filters.interval || p.interval===this.filters.interval;
      return okText && okStatus && okInterval;
    });

    // Subs
    this.filtered.subs = this.subs.filter(s=>{
      const q = this.search.subs.toLowerCase();
      const planName = this.getPlanName(s.planId).toLowerCase();
      const userName = this.getUserName(s.userId).toLowerCase();
      const okText = !q || planName.includes(q) || userName.includes(q);
      const okStatus = !this.filters.subStatus || s.status===this.filters.subStatus;
      const okPlan = !this.filters.planId || s.planId===this.filters.planId;
      return okText && okStatus && okPlan;
    });

    // Payments
    this.filtered.payments = this.payments.filter(p=>{
      const q = this.search.payments.toLowerCase();
      const okText = !q || p.invoiceNo.toLowerCase().includes(q) || (p.userName||'').toLowerCase().includes(q) || (p.txnId||'').toLowerCase().includes(q);
      const okStatus = !this.filters.paymentStatus || p.status===this.filters.paymentStatus;
      const okMethod = !this.filters.method || p.method===this.filters.method;
      return okText && okStatus && okMethod;
    });

    // Coupons
    this.filtered.coupons = this.coupons.filter(c=>{
      const q = this.search.coupons.toLowerCase();
      const okText = !q || c.code.toLowerCase().includes(q);
      const okStatus = !this.filters.couponStatus || c.status===this.filters.couponStatus;
      return okText && okStatus;
    });

    // reset pages if current page overflowed (happens after filtering)
    this.planPage = Math.min(this.planPage, this.planTotalPages);
    this.subPage = Math.min(this.subPage, this.subTotalPages);
    this.paymentPage = Math.min(this.paymentPage, this.paymentTotalPages);
    this.couponPage = Math.min(this.couponPage, this.couponTotalPages);

    this.sliceData();
  }

  sliceData(){
    const slice = (arr:any[], page:number)=> arr.slice((page-1)*this.pageSize, page*this.pageSize);
    this.paged.plans = slice(this.filtered.plans, this.planPage);
    this.paged.subs = slice(this.filtered.subs, this.subPage);
    this.paged.payments = slice(this.filtered.payments, this.paymentPage);
    this.paged.coupons = slice(this.filtered.coupons, this.couponPage);
  }

  // Modal state
  isFormOpen=false;
  formMode:'add'|'edit'='add';
  entityType: 'plan'|'subscription'|'payment'|'coupon' | null = null;
  entityTitle = '';
  form:any = {};

  openAdd(type:any){
    this.formMode='add';
    this.entityType=type;
    this.entityTitle=this.entityTypeTitle(type);
    this.form={}; // defaults per type can be set here
    if(type==='plan'){ this.form = { status:'Active', interval:'month', price:0, trialDays:0 }; }
    if(type==='subscription'){ this.form = { status:'Active', startDate:this.today(), renewalDate:this.today() }; }
    if(type==='payment'){ this.form = { status:'Paid', amount:0, date:this.nowLocal(), method:'Card' }; }
    if(type==='coupon'){ this.form = { type:'Percent', value:10, status:'Active', validFrom:this.today(), validTo:this.today() }; }
    this.isFormOpen=true;
  }
  openEdit(type:any, row:any){
    this.formMode='edit';
    this.entityType=type;
    this.entityTitle=this.entityTypeTitle(type);
    this.form={...row};
    if(type==='plan' && Array.isArray(row.features)){ this.form.features = row.features.join(', '); }
    this.isFormOpen=true;
  }
  closeForm(){ this.isFormOpen=false; }

  entityTypeTitle(type:any){
    if(type==='plan') return 'Plan';
    if(type==='subscription') return 'Subscription';
    if(type==='payment') return 'Payment';
    if(type==='coupon') return 'Coupon';
    return '';
  }

  submitForm(){
    if(!this.entityType) return;
    if(this.entityType==='plan'){
      const payload:Plan = {
        id: this.form.id ?? this.newId(this.plans),
        name: this.form.name,
        price: +this.form.price,
        interval: this.form.interval,
        trialDays: +this.form.trialDays || 0,
        status: this.form.status,
        features: (this.form.features||'').split(',').map((s:string)=>s.trim()).filter(Boolean)
      };
      this.upsert(this.plans, payload);
    }
    if(this.entityType==='subscription'){
      const payload:Subscription = {
        id: this.form.id ?? this.newId(this.subs),
        userId: +this.form.userId,
        planId: +this.form.planId,
        startDate: this.form.startDate,
        renewalDate: this.form.renewalDate,
        status: this.form.status,
        notes: this.form.notes
      };
      this.upsert(this.subs, payload);
    }
    if(this.entityType==='payment'){
      const payload:Payment = {
        id: this.form.id ?? this.newId(this.payments),
        invoiceNo: this.form.invoiceNo,
        userId: +this.form.userId,
        userName: this.getUserName(+this.form.userId),
        amount: +this.form.amount,
        method: this.form.method,
        date: this.form.date,
        status: this.form.status,
        txnId: this.form.txnId
      };
      this.upsert(this.payments, payload);
    }
    if(this.entityType==='coupon'){
      const payload:Coupon = {
        id: this.form.id ?? this.newId(this.coupons),
        code: this.form.code,
        type: this.form.type,
        value: +this.form.value,
        maxUses: this.form.maxUses? +this.form.maxUses : undefined,
        validFrom: this.form.validFrom,
        validTo: this.form.validTo,
        status: this.form.status
      };
      this.upsert(this.coupons, payload);
    }

    // refresh
    this.isFormOpen=false;
    this.onFilterChange();
  }

  confirmDelete(type:any, row:any){
    if(!confirm('Delete?')) return;
    if(type==='plan') this.plans = this.plans.filter(x=>x.id!==row.id);
    if(type==='subscription') this.subs = this.subs.filter(x=>x.id!==row.id);
    if(type==='payment') this.payments = this.payments.filter(x=>x.id!==row.id);
    if(type==='coupon') this.coupons = this.coupons.filter(x=>x.id!==row.id);
    this.onFilterChange();
  }

  // Preview
  previewOpen=false;
  preview:any={};
  openPlanPreview(p:Plan){
    this.previewOpen=true;
    this.preview = { type:'plan', title:p.name, price:p.price, interval:p.interval, trialDays:p.trialDays, features:p.features||[] };
  }
  openPaymentPreview(p:Payment){
    this.previewOpen=true;
    this.preview = { type:'payment', title:`Invoice ${p.invoiceNo}`, ...p };
  }
  openSubPreview(s:Subscription){
    this.previewOpen=true;
    this.preview = {
      type:'subscription',
      title:`Subscription #${s.id}`,
      userName: this.getUserName(s.userId),
      planName: this.getPlanName(s.planId),
      ...s
    };
  }
  closePreview(){ this.previewOpen=false; }

  // Utils
  newId<T extends {id:number}>(arr:T[]){ return (arr.reduce((m,x)=>Math.max(m,x.id),0) || 0) + 1; }
  upsert<T extends {id:number}>(arr:T[], item:T){
    const i = arr.findIndex(x=>x.id===item.id);
    if(i>-1) arr[i]=item; else arr.unshift(item);
  }
  today(){ return new Date().toISOString().substring(0,10); }
  nowLocal(){
    const d = new Date();
    const pad=(n:number)=> String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }


  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

    handleLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
