import { NgModule, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
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
import { ProcurementPageComponent } from './features/procurement/procurement-page/procurement-page.component';
import { OrderList } from './features/orders/order-list/order-list';
import { OrderCreate } from './features/orders/order-create/order-create';
import { OrderEdit } from './features/orders/order-edit/order-edit';
import { WarehouseListComponent } from './features/warehouse/warehouse-list/warehouse-list.component';
import { WarehouseGridComponent } from './features/warehouse/warehouse-grid/warehouse-grid.component';
import { CellDetailComponent } from './features/warehouse/cell-detail/cell-detail.component';
import { ShelfDetailComponent } from './features/warehouse/shelf-detail/shelf-detail.component';
import { AdminView } from './features/admin/admin-view/admin-view';
import { OwnProfile } from './features/profile/own-profile/own-profile';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { ProductStockListComponent } from './features/stock/stock-list/stock-list';
import { StockMovementListComponent } from './features/stock/stockmovement/stockmovement';
import { MovementsComponent } from './features/stock/movements/movements';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    ProductsListComponent,
    NavbarComponent,
    OwnProfile,
    ProductCreateComponent,
    ProductEditComponent,
    ProcurementPageComponent,
    OrderList,
    OrderCreate,
    OrderEdit,
    WarehouseListComponent,
    WarehouseGridComponent,
    CellDetailComponent,
    ShelfDetailComponent,
    AdminView,
    ProductStockListComponent,
    StockMovementListComponent,
    MovementsComponent
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
    provideZoneChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ],
  bootstrap: [App]
})
export class AppModule { }