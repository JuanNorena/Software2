import { Routes } from '@angular/router';
import {LoginComponent} from './componentes/login/login.component';
import path from 'path';

export const routes: Routes = [

{path: 'login', component: LoginComponent},
{path: '**', redirectTo: '/login', pathMatch: 'full'},

];
