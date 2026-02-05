import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home } from './pages/candidate/home/home';
import { JobDetail } from './pages/candidate/job-detail/job-detail';
import { MyApplications } from './pages/candidate/my-applications/my-applications';
import { Dashboard } from './pages/hr/dashboard/dashboard';
import { HrLayout } from './layouts/hr-layout/hr-layout';
import { PostJob } from './pages/hr/post-job/post-job';
import { ManageApplications } from './pages/hr/manage-applications/manage-applications';
import { EmployeeManagement } from './pages/admin/employee-management/employee-management';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { roleGuard } from './guards/role.guard';
import { CandidateDetail } from './components/admin/candidate-detail/candidate-detail';

export const routes: Routes = [

  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '403', component: ForbiddenComponent },

  {
    path: 'candidate',
    children: [
      { path: 'home', component: Home },
      { path: 'job-detail/:id', component: JobDetail },
      { path: 'my-applications', component: MyApplications },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  {
    path: 'hr', // Đường dẫn gốc là /hr
    component: HrLayout, // Sử dụng Layout chung (Sidebar + Header)
    children: [
      // Link: /hr/dashboard
      { path: 'dashboard', component: Dashboard },

      // Link: /hr/post-job (Khớp với logic chuyển trang khi Login)
      { path: 'post-job', component: PostJob },

      // Quản lý hồ sơ
      { path: 'manage-applications/:jobId', component: ManageApplications },
      { path: 'manage-applications', component: ManageApplications },

      // Chi tiết ứng viên
      { path: 'candidate-detail', component: CandidateDetail },

      // Báo cáo Analytics
      {
        path: 'reports',
        loadComponent: () => import('./components/admin/reports/reports').then(m => m.Reports),
        data: { ssr: false }
      },

      // Lịch phỏng vấn cá nhân (INTERVIEWER, HR, ADMIN)
      {
        path: 'my-interviews',
        loadComponent: () => import('./components/my-interviews/my-interviews').then(m => m.MyInterviews),
        canActivate: [roleGuard],
        data: { roles: ['INTERVIEWER', 'HR', 'ADMIN'] }
      },

      // Quản lý nhân viên (Chỉ ADMIN)
      {
        path: 'employees',
        component: EmployeeManagement,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },

      // Mặc định vào dashboard nếu chỉ gõ /hr
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },


  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // Route chặn lỗi 404 (Nếu nhập sai link bất kỳ sẽ về login)
  { path: '**', redirectTo: 'login' }
];
