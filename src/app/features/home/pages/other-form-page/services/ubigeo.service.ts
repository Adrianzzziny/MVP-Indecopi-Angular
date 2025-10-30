import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { UbigeoDepartamento, normalize } from '../models/ubigeo';

@Injectable({ providedIn: 'root' })
export class UbigeoService {
  private http = inject(HttpClient);
  private cache$?: Observable<UbigeoDepartamento[]>;

  private load(): Observable<UbigeoDepartamento[]> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<UbigeoDepartamento[]>('/assets/data/ubigeo-pe.json')
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }

  departamentos$(): Observable<string[]> {
    return this.load().pipe(
      map(list => list.map(d => d.departamento).sort((a, b) => a.localeCompare(b)))
    );
  }

  provincias$(departamento: string): Observable<string[]> {
    return this.load().pipe(
      map(list => {
        const dep = list.find(d => normalize(d.departamento) === normalize(departamento));
        return (dep?.provincias ?? [])
          .map(p => p.provincia)
          .sort((a, b) => a.localeCompare(b));
      })
    );
  }

  distritos$(departamento: string, provincia: string): Observable<string[]> {
    return this.load().pipe(
      map(list => {
        const dep = list.find(d => normalize(d.departamento) === normalize(departamento));
        const prov = dep?.provincias.find(p => normalize(p.provincia) === normalize(provincia));
        return (prov?.distritos ?? []).slice().sort((a, b) => a.localeCompare(b));
      })
    );
  }
}
