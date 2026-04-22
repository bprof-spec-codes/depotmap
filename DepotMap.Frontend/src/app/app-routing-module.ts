import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login-component/login-component';
import { ProductsListComponent } from './features/products/products-list/products-list.component';
import { ProductCreateComponent } from './features/products/product-create/product-create.component';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';
import { ProcurementPageComponent } from './features/procurement/procurement-page/procurement-page.component';
import { OrderList } from './features/orders/order-list/order-list';
import { OrderCreate } from './features/orders/order-create/order-create';
import { OrderEdit, orderEditGuard } from './features/orders/order-edit/order-edit';
import { WarehouseListComponent } from './features/warehouse/warehouse-list/warehouse-list.component';
import { WarehouseGridComponent } from './features/warehouse/warehouse-grid/warehouse-grid.component';
import { CellDetailComponent } from './features/warehouse/cell-detail/cell-detail.component';
import { CellShelfResolverComponent } from './features/warehouse/cell-shelf-resolver/cell-shelf-resolver.component';
import { ShelfDetailComponent } from './features/warehouse/shelf-detail/shelf-detail.component';
import { AdminView } from './features/admin/admin-view/admin-view';
import { OwnProfile } from './features/profile/own-profile/own-profile';
import { authGuard } from './core/guards/auth-guard';
import { managerGuard } from './core/guards/manager-guard';
import { ProductStockListComponent } from './features/stock/stock-list/stock-list';
import { StockMovementListComponent } from './features/stock/stockmovement/stockmovement';
import { MovementsComponent } from './features/stock/movements/movements';
import { guestGuard } from './core/guards/guest-guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },

  { path: 'products/create', component: ProductCreateComponent, canActivate: [authGuard] },
  { path: 'products/edit/:id', component: ProductEditComponent, canActivate: [authGuard] },
  { path: 'products', component: ProductsListComponent, canActivate: [authGuard] },

  { path: 'procurement', component: ProcurementPageComponent, canActivate: [authGuard] },

  { path: 'warehouses', component: WarehouseListComponent, canActivate: [authGuard] },
  { path: 'warehouses/:id', component: WarehouseGridComponent, canActivate: [authGuard] },
  { path: 'warehouses/:warehouseId/cells/:cellId/shelf', component: CellShelfResolverComponent, canActivate: [authGuard] },
  { path: 'warehouses/:warehouseId/cells/:cellId/shelves/:shelfId', component: ShelfDetailComponent, canActivate: [authGuard] },
  { path: 'warehouses/:warehouseId/cells/:cellId', component: CellDetailComponent, canActivate: [authGuard] },

  { path: 'users', component: AdminView, canActivate: [authGuard, managerGuard] },
  { path: 'settings', component: OwnProfile, canActivate: [authGuard] },

  { path: 'inventory', component: ProductStockListComponent, canActivate: [authGuard] },
  { path: 'movements', component: MovementsComponent, canActivate: [authGuard] },
  { path: 'stock-movements', component: StockMovementListComponent, canActivate: [authGuard] },
  { path: 'stock-movements/:productId', component: StockMovementListComponent, canActivate: [authGuard] },

  { path: 'orders/create', component: OrderCreate, canActivate: [authGuard] },
  { path: 'orders/edit/:id', component: OrderEdit, canActivate: [authGuard], canDeactivate: [orderEditGuard] },
  { path: 'orders', component: OrderList, canActivate: [authGuard] },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }