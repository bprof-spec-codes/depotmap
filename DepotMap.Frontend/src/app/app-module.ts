import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginComponent } from './features/auth/login-component/login-component';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthInterceptor } from './core/interceptors/auth-interceptor';
import { ProductsListComponent } from './features/products/products-list/products-list.component';
import { ProductCreateComponent } from './features/products/product-create/product-create.component';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';
import { NavbarComponent } from './shared/components/navbar-component/navbar-component';
import { WarehouseListComponent } from './features/warehouse/warehouse-list/warehouse-list.component';
import { WarehouseGridComponent } from './features/warehouse/warehouse-grid/warehouse-grid.component';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    ProductsListComponent,
    ProductCreateComponent,
    ProductEditComponent,
    NavbarComponent,
    WarehouseListComponent,
    WarehouseGridComponent
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
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
