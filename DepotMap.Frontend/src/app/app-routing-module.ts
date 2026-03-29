import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login-component/login-component';
import { ProductsListComponent } from './features/products/products-list/products-list.component';

//AuthGuard létrehozva, használható!
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsListComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
