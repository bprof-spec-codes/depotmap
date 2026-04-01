import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginComponent } from './features/auth/login-component/login-component';
import { ProductsListComponent } from './features/products/products-list/products-list.component';
import { ProductCreateComponent } from './features/products/product-create/product-create.component';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';
import { NavbarComponent } from './shared/components/navbar-component/navbar-component';
import { AdminView } from './features/admin/admin-view/admin-view';
import { OwnProfile } from './features/profile/own-profile/own-profile';
import { authInterceptor } from './core/interceptors/auth-interceptor';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    ProductsListComponent,
    NavbarComponent,
    OwnProfile,
    ProductCreateComponent,
    ProductEditComponent,
    AdminView
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
  bootstrap: [App]
})
export class AppModule { }