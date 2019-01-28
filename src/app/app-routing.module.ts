import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { ControlComponent } from './control/control.component';

const routes: Routes = [{
  path: 'about', component: AboutComponent
}, {
  path: 'control', component: ControlComponent
}, {
  path: '**', pathMatch : 'full', redirectTo : '/control'
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
