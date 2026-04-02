import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginComponent } from './features/auth/login-component/login-component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductsListComponent } from './features/products/products-list/products-list.component';
import { ProductCreateComponent } from './features/products/product-create/product-create.component';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';
import { NavbarComponent } from './shared/components/navbar-component/navbar-component';
import { OrderList } from './features/orders/order-list/order-list';
import { OrderCreate } from './features/orders/order-create/order-create';
import { OrderEdit } from './features/orders/order-edit/order-edit';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    ProductsListComponent,
    ProductCreateComponent,
    ProductEditComponent,
    NavbarComponent,
    OrderList,
    OrderCreate,
    OrderEdit
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
  bootstrap: [App]
})
export class AppModule { }
