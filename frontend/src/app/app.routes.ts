import { Routes } from '@angular/router';
import {AppHomeComponent, landingRedirectGuard} from './app-home/app-home.component';
import { SearchComponent } from './shared/search/search.component';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { UserAccountComponent } from './user/user-account/user-account.component';
import { AccountEditComponent } from './user/user-account/account-edit/account-edit.component';
import { UserBillsComponent } from './user/user-account/user-bills/user-bills.component';
import { RateInputComponent } from './crowdsource/rate-input/rate-input.component';
import { AdminHomeComponent } from './admin/admin-home/admin-home.component';
import { AdminApprovalComponent } from './admin/admin-approval/admin-approval.component';

import {AddBillComponent} from './user/user-account/add-bill/add-bill.component';
import {CompareComponent} from './user/user-account/compare/compare.component';
import {AboutComponent} from './shared/about/about.component';
import { LogoutComponent } from './user/user-account/logout/logout.component';
import {LandingRedirectGuard} from './shared/guards/landing-redirect.guard';

export const routes: Routes = [
  { path: '', component: AppHomeComponent },
  { path: 'compare', component: SearchComponent },



  { path: 'login', component: LoginComponent },

  { path: 'register', component: RegisterComponent },

  {
    path: 'user-account',
    component: UserAccountComponent,
    children: [

      { path: '', pathMatch: 'full', component: AccountEditComponent },

      { path: 'bills',
        component: UserBillsComponent, children: [{path:'add-bill', component: AddBillComponent}]},


      { path: 'compare', component: CompareComponent },
      { path: 'crowdsource', component: RateInputComponent },
      { path: 'about', component: AboutComponent},
      { path: 'logout', component: LogoutComponent }

    ]
  },


   { path: 'crowdsource_form', component: RateInputComponent },
  {path: 'about', component: AboutComponent},

  {
    path: 'admin',
    component: AdminHomeComponent,
    children: [
      { path: 'approval', component: AdminApprovalComponent },
    ]
  },


];
