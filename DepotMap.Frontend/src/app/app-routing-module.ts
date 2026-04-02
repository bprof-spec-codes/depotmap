import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login-component/login-component';
import { ProductsListComponent } from './features/products/products-list/products-list.component';
import { ProductCreateComponent } from './features/products/product-create/product-create.component';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';
import { WarehouseListComponent } from './features/warehouse/warehouse-list/warehouse-list.component';
import { WarehouseGridComponent } from './features/warehouse/warehouse-grid/warehouse-grid.component';
import { AdminView } from './features/admin/admin-view/admin-view';
import { OwnProfile } from './features/profile/own-profile/own-profile';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'products/create', component: ProductCreateComponent, canActivate: [authGuard] },
  { path: 'products/edit/:id', component: ProductEditComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductsListComponent, canActivate: [authGuard] },
  { path: 'warehouses', component: WarehouseListComponent, canActivate: [authGuard] },
  { path: 'warehouses/:id', component: WarehouseGridComponent, canActivate: [authGuard] },
  { path: 'users', component: AdminView, canActivate: [authGuard, adminGuard] },
  { path: 'settings', component: OwnProfile, canActivate: [authGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }