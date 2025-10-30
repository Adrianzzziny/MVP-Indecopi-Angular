import { Routes } from "@angular/router";
import { Error404PageComponent } from "../../shared/pages";
import { LoginPageComponent } from "./pages";

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        component: LoginPageComponent,
    },
    // {
    //     path: 'register',
    //     component: RegisterPageComponent,
    // },
    { path: '404', component: Error404PageComponent },
    { path: '**', redirectTo: '404' }

]