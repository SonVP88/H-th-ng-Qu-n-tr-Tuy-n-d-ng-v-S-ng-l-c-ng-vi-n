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

export const routes: Routes = [

  { path: 'login', component: Login },
  { path: 'register', component: Register },

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

      // Mặc định vào dashboard nếu chỉ gõ /hr
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },


  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // Route chặn lỗi 404 (Nếu nhập sai link bất kỳ sẽ về login)
  { path: '**', redirectTo: 'login' }
];
