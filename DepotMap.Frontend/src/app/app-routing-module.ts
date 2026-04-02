import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login-component/login-component';
import { ProductsListComponent } from './features/products/products-list/products-list.component';
import { ProductCreateComponent } from './features/products/product-create/product-create.component';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';
import { OrderList } from './features/orders/order-list/order-list';
import { OrderCreate } from './features/orders/order-create/order-create';
import { OrderEdit, orderEditGuard } from './features/orders/order-edit/order-edit';


const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'products/create', component: ProductCreateComponent },
  { path: 'products/edit/:id', component: ProductEditComponent },
  { path: 'products', component: ProductsListComponent },
  { path: 'orders/create', component: OrderCreate },
  { path: 'orders/edit/:id', component: OrderEdit, canDeactivate: [orderEditGuard] },
  { path: 'orders', component: OrderList }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
