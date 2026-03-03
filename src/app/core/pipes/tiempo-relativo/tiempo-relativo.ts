import { Component, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tiempoRelativo', pure: false, standalone: true })
export class TiempoRelativoPipe implements PipeTransform {
  transform(d: Date | string): string {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60)    return 'Hace un momento';
    if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  }
}
@Component({
  selector: 'app-tiempo-relativo',
  imports: [],
  templateUrl: './tiempo-relativo.html',
  styleUrl: './tiempo-relativo.css',
})
export class TiempoRelativo {

}
