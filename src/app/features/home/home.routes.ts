import { Routes } from "@angular/router";
import { HomePageComponent, LayoutPageComponent, OtherFormPageComponent } from "./pages";



export const HOME_ROUTES: Routes = [
    {
        path: '',
        component: LayoutPageComponent,
        children: [
            { path: '', component: HomePageComponent },
            { path: 'other-form', component: OtherFormPageComponent },
            { path: '**', redirectTo: '' }
        ]
    },
]
