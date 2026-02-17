import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ChevronLeft, ChevronRight, LogOut, LucideAngularModule } from 'lucide-angular';
import { NAV_ITEMS, UserRole, ROL_CONFIG, NavItem} from './nav-items.config';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Input() isOpen = true;
  @Output() close = new EventEmitter<void>();
  
  @Input({ required: true }) rol!: UserRole;
  @Input() nombreUsuario: string = 'Usuario';
  @Output() logout = new EventEmitter<void>();

  collapsed = signal(false);
  expandedItems = signal<Set<string>>(new Set());

  constructor(private router: Router) {
    // Auto-expandir el item activo al cargar
    this.autoExpandActiveItem();
  }

  // Items filtrados según el rol
  navItems = computed(() => {
    return NAV_ITEMS.filter(item => item.roles.includes(this.rol))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => child.roles.includes(this.rol))
      }));
  });

  // Inicial del nombre
  nombreInicial = computed(() =>
    this.nombreUsuario?.charAt(0).toUpperCase() || 'U'
  );

  // Config visual del rol
  rolConfig = computed(() => ROL_CONFIG[this.rol]);

  hasChildren(item: NavItem): boolean {
    return !!(item.children && item.children.length > 0);
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  toggleExpand(itemId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.expandedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }

  isItemActive(item: NavItem): boolean {
    const currentUrl = this.router.url;
    
    // Si el item tiene route, verificar si está activo
    if (item.route && currentUrl.startsWith(item.route)) {
      return true;
    }

    // Si tiene children, verificar si algún child está activo
    if (item.children) {
      return item.children.some(child => 
        child.route && currentUrl.startsWith(child.route)
      );
    }

    return false;
  }

   private autoExpandActiveItem(): void {
    const currentUrl = this.router.url;
    const activeParent = NAV_ITEMS.find(item => 
      item.children?.some(child => 
        child.route && currentUrl.startsWith(child.route)
      )
    );

    if (activeParent) {
      this.expandedItems.update(set => {
        const newSet = new Set(set);
        newSet.add(activeParent.id);
        return newSet;
      });
    }
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
    // Cerrar todos los submenús
    if (this.collapsed()) {
      this.expandedItems.set(new Set());
    }
  }

  onLogout(): void {
    this.logout.emit();
  }

  // Icons
  readonly ChevronRight = ChevronRight;
  readonly LogOut = LogOut;
  readonly ChevronLeft = ChevronLeft;
}
