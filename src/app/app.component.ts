import { Component, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Point = { x: number; y: number };

export interface GameResult {
  id: string;
  playedAt: string;
  ideology: number; // 0 = izquierda, 50 = centro, 100 = derecha
  positionScore: number;
  sizeScore: number;
  totalScore: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  @ViewChild('flagBoard') flagBoard!: ElementRef<HTMLElement>;

  // Autoubicación ideológica: 0 = izquierda, 50 = centro, 100 = derecha.
  ideologyValue = 50;
  ideologyConfirmed = false;

  // Resultados locales: no se envían a ningún servidor.
  private readonly resultsStorageKey = 'centra-el-escudo-results';
  private readonly isBrowser: boolean;

  // Coordenadas normalizadas respecto a la bandera (0..1).
  readonly target: Point = { x: 1 / 3, y: 0.5 };
  readonly targetHeight = 0.4;
  readonly targetWidth = 0.1;

  position: Point = { x: 0.51, y: 0.47 };
  shieldHeight = 0.31;
  checked = false;
  score = 0;
  positionScore = 0;
  sizeScore = 0;
  isDragging = false;
  private dragOffset: Point = { x: 0, y: 0 };

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get shieldHeightPercent(): number {
    return this.shieldHeight * 100;
  }

  get scoreMessage(): string {
    if (this.score >= 98) return '¡Precisión impecable!';
    if (this.score >= 90) return 'Casi perfecto.';
    if (this.score >= 75) return 'Vas por buen camino.';
    if (this.score >= 50) return 'No está mal. Prueba otra vez.';
    return 'Todavía puedes afinar mucho más.';
  }

  confirmIdeology(): void {
    this.ideologyConfirmed = true;
  }

  onPointerDown(event: PointerEvent): void {
    if (this.checked || !this.ideologyConfirmed) return;
    event.preventDefault();
    const rect = this.flagBoard.nativeElement.getBoundingClientRect();
    const pointer = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    this.dragOffset = { x: pointer.x - this.position.x, y: pointer.y - this.position.y };
    this.isDragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging || this.checked || !this.ideologyConfirmed) return;
    const rect = this.flagBoard.nativeElement.getBoundingClientRect();
    this.position = {
      x: this.clamp((event.clientX - rect.left) / rect.width - this.dragOffset.x, 0.04, 0.96),
      y: this.clamp((event.clientY - rect.top) / rect.height - this.dragOffset.y, 0.04, 0.96),
    };
  }

  onPointerUp(): void {
    this.isDragging = false;
  }

  onSizeChange(event: Event): void {
    if (!this.ideologyConfirmed || this.checked) return;
    this.shieldHeight = Number((event.target as HTMLInputElement).value) / 100;
  }

  checkAnswer(): void {
    if (!this.ideologyConfirmed || this.checked) return;

    const rect = this.flagBoard.nativeElement.getBoundingClientRect();
    // Escala la distancia horizontal por la proporción real de la bandera,
    // para que un error horizontal y uno vertical se midan en unidades comparables.
    const dx = ((this.position.x - this.target.x) * rect.width) / rect.height;
    const dy = this.position.y - this.target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.sqrt((rect.width / rect.height) ** 2 + 1);
    this.positionScore = Math.round(100 * this.clamp(1 - distance / (maxDistance * 0.22), 0, 1));

    const relativeSizeError = Math.abs(this.shieldHeight - this.targetHeight) / this.targetHeight;
    this.sizeScore = Math.round(100 * this.clamp(1 - relativeSizeError / 0.5, 0, 1));

    this.score = Math.round(this.positionScore * 0.7 + this.sizeScore * 0.3);
    this.checked = true;
    this.saveGameResult();
  }

  private saveGameResult(): void {
    // En SSR no hay localStorage. En navegador, se guarda solo en este dispositivo.
    if (!this.isBrowser) return;

    try {
      const existing = localStorage.getItem(this.resultsStorageKey);
      const results: GameResult[] = existing ? JSON.parse(existing) : [];

      const result: GameResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        playedAt: new Date().toISOString(),
        ideology: this.ideologyValue,
        positionScore: this.positionScore,
        sizeScore: this.sizeScore,
        totalScore: this.score,
      };

      results.push(result);
      localStorage.setItem(this.resultsStorageKey, JSON.stringify(results));
    } catch {
      // El juego sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
  }

  calculateScore(positionError: number, currentHeight: number, targetHeight: number): number {
    // Los errores deben estar normalizados entre 0 y 1.
    const positionAccuracy = this.accuracyFromError(positionError);
    const sizeError = Math.min(1, Math.abs(currentHeight - targetHeight) / targetHeight);
    const sizeAccuracy = this.accuracyFromError(sizeError);
    return Math.round(100 * (positionAccuracy * 0.6 + sizeAccuracy * 0.4));
  }

  accuracyFromError(error: number): number {
    const normalizedError = Math.min(1, Math.max(0, error));
    return Math.pow(1 - normalizedError, 3);
  }

  retry(): void {
    this.position = {
      x: 0.12 + Math.random() * 0.76,
      y: 0.16 + Math.random() * 0.68,
    };
    this.shieldHeight = 0.24 + Math.random() * 0.25;
    this.checked = false;
    this.score = 0;
    this.positionScore = 0;
    this.sizeScore = 0;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
